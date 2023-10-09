import { EVENT_NAME } from "./constant";
import { SlotEventLog, SlotTable, WonEventLog } from "./type";
import { getGooglePublisherTag, getPbjs } from "./utils";

const LOG_PREFIX_STYLE =
  "color:white; background-color:rgb(99,44,166); padding:2px; border-radius:4px;";
const LOG_PREFIX = "%cPbjsDebugger";

function getErrorMessages(logs: SlotEventLog[]) {
  const errorMessages: string[] = [];

  const auctionInit =
    logs.filter((log) => log.name === EVENT_NAME.PBJS_AUCTION_INIT)[0]
      ?.timestamp || 0;
  const auctionEnd =
    logs.filter((log) => log.name === EVENT_NAME.PBJS_AUCTION_END)[0]
      ?.timestamp || 0;
  const setTargeting =
    logs.filter((log) => log.name === EVENT_NAME.PBJS_SET_TARGETING)[0]
      ?.timestamp || 0;
  const requested =
    logs.filter((log) => log.name === EVENT_NAME.GOOGLE_REQUEST)[0]
      ?.timestamp || 0;

  if (auctionInit > auctionEnd) {
    errorMessages.push("auctionInit.time > auctionEnd.time");
  }

  if (auctionEnd > setTargeting) {
    errorMessages.push("auctionEnd.time > setTargetingtime");
  }

  if (setTargeting > requested) {
    errorMessages.push("setTargeting.time > request.time");
  }
  return errorMessages;
}

function getSlotTable() {
  const googletag = getGooglePublisherTag();

  googletag.openConsole();

  const pbjs = getPbjs();
  const loadTimeAt = new Date(Date.now() - performance.now());
  const slotTable: SlotTable = {};
  const unitMap: {
    [divId: string]: string;
  } = {};

  const pbjsEvents = pbjs.getEvents();
  googletag
    .pubads()
    .getSlots()
    .forEach(function (slot) {
      const divId = slot.getSlotElementId();
      unitMap[divId] = slot.getAdUnitPath();
    });

  googletag
    .pubads()
    .getSlots()
    .forEach(function (slot) {
      const divId = slot.getSlotElementId();
      const unitPath = slot.getAdUnitPath();
      const sizes: string[] = slot.getSizes().map(function (size) {
        return "string" == typeof size ? size : size.width + "×" + size.height;
      });
      slotTable[divId] = slotTable[divId] || {
        divId,
        unitPath,
        sizes,
        bids: pbjs.getBidResponsesForAdUnitCode(divId).bids || [],
        fetchCount: 0,
        auctionCount: 0,
        wonCount: 0,
        status: false,
        messages: [],
        errorMessages: [],
        logs: [],
      };

      // google request event
      googletag
        .getEventLog()
        .getEventsByLevel(1)
        .filter(({ message }) => message.messageId === 3)
        .filter((log) => {
          return log.j.getSlotElementId() === divId;
        })
        .forEach(({ timestamp }) => {
          slotTable[divId].logs.push({
            name: "REQUEST",
            timestamp: Math.floor(
              timestamp.getTime() - loadTimeAt.getTime()
            ) as number,
          });
        });

      // prebid auction init
      pbjsEvents
        .filter(
          (event): event is Prebid.AuctionInitEventLog =>
            event.eventType === "auctionInit"
        )
        .filter((event) => {
          return event.args.adUnits.find((unit) => {
            return unit.code === divId;
          });
        })
        .forEach(({ elapsedTime, args }) => {
          const bidders = args.adUnits
            .filter((unit) => {
              return unit.code === divId;
            })
            .flatMap((unit) => unit.bids.map((bid) => bid.bidder))
            .sort();
          slotTable[divId].logs.push({
            name: "AUCTION_INIT",
            timestamp: Math.floor(elapsedTime),
            args: {
              bidders,
            },
          });
        });

      // prebid auction end
      pbjsEvents
        .filter(
          (event): event is Prebid.AuctionEndEventLog =>
            event.eventType === "auctionEnd"
        )
        .filter((event) => {
          return event.args.adUnits.find((unit) => {
            return unit.code === divId;
          });
        })
        .forEach(({ elapsedTime }) => {
          slotTable[divId].logs.push({
            name: "AUCTION_END",
            timestamp: Math.floor(elapsedTime),
          });
        });

      // prebid bid won
      pbjsEvents
        .filter(
          (event): event is Prebid.WonEventLog => event.eventType === "bidWon"
        )
        .filter((event) => {
          return event.args.adUnitCode === divId;
        })
        .forEach(({ elapsedTime, args }) => {
          slotTable[divId].logs.push({
            name: "WON",
            timestamp: Math.floor(elapsedTime),
            args: {
              bidder: args.bidder,
              cpm: args.cpm,
              adId: args.adId,
            },
          });
        });

      // prebid setTargeting
      pbjsEvents
        .filter(
          (event): event is Prebid.SetKVEventLog =>
            event.eventType === "setTargeting"
        )
        .filter((event) => {
          return Object.keys(event.args).includes(divId);
        })
        .forEach(({ elapsedTime, args }) => {
          slotTable[divId].logs.push({
            name: "SET_KV",
            timestamp: Math.floor(elapsedTime),
            args: {
              keyValues: {
                [divId]: args[divId],
              },
            },
          });
        });
    });

  Object.keys(slotTable).forEach((divId) => {
    slotTable[divId].logs = slotTable[divId].logs.sort((a, b) => {
      return a.timestamp - b.timestamp > 0 ? 1 : -1;
    });
    const logs = slotTable[divId].logs;
    const fetchCount: number = logs.filter(
      ({ name }) => name === EVENT_NAME.GOOGLE_REQUEST
    ).length;

    const auctionCount = logs.filter(
      ({ name }) => name === EVENT_NAME.PBJS_AUCTION_INIT
    ).length;

    const wonLogs = logs.filter(
      (log): log is WonEventLog => log.name === EVENT_NAME.PBJS_WON
    );
    const wonCount = wonLogs.length;
    const messages = wonLogs.map(
      (log) => `bidWon bidder=${log.args.bidder} cpm=${log.args.cpm}`
    );
    const errorMessages = getErrorMessages(logs);
    const status = errorMessages.length === 0;
    slotTable[divId] = {
      ...slotTable[divId],
      fetchCount,
      auctionCount,
      wonCount,
      status,
      messages,
      errorMessages,
    };
  });

  return slotTable;
}

function getConfig() {
  const pbjs = getPbjs();
  const config = pbjs.getConfig();
  return {
    version: pbjs.version,
    bidderTimeout: config.bidderTimeout,
    bidderSequence: config.bidderSequence,
    "currency.adServerCurrency": config.currency?.adServerCurrency || "",
    enableSendAllBids: config.enableSendAllBids,
    priceGranularity: config.priceGranularity,
    "realTimeData.auctionDelay": config.realTimeData?.auctionDelay || 0,
    "realTimeData.dataProviders": (config.realTimeData?.dataProviders || [])
      .map((e) => e.name)
      .join(","),
    "userSync.auctionDelay": config.userSync?.auctionDelay || 0,
    "userSync.syncDelay": config.userSync?.syncDelay || 0,
    "userSync.syncEnabled": config.userSync?.syncEnabled || false,
    "userSync.userIds": (config.userSync?.userIds || [])
      .map((e) => e.name)
      .join(","),
  };
}

function printErrorEvent() {
  const pbjs = getPbjs();
  const googletag = getGooglePublisherTag();

  const logs = pbjs.getEvents();
  const pbjsErrors = logs
    .filter(
      (event): event is Prebid.ErrorEventLog =>
        event.eventType === "auctionDebug" && event.args.type === "ERROR"
    )
    .map(({ args, elapsedTime }) => {
      return {
        type: "ERROR",
        "timestamp[ms]": Math.floor(elapsedTime),
        message: Object.values(args.arguments).join(" "),
      };
    });
  const bidderErrors = logs
    .filter(
      (event): event is Prebid.BidderErrorEventLog =>
        event.eventType === "bidderError"
    )
    .map(({ args, elapsedTime }) => {
      return {
        type: "BIDDER ERROR",
        "timestamp[ms]": Math.floor(elapsedTime),
        message: `${args.bidderRequest.bidderCode}`,
      };
    });
  const gptErrors = googletag.getEventLog().getEventsByLevel(3);
  const gptWarnings = googletag.getEventLog().getEventsByLevel(2);

  const table = [...pbjsErrors, ...bidderErrors];
  console.group(LOG_PREFIX, LOG_PREFIX_STYLE, "ErrorEvent");
  console.group("%cGooglePublisherTag", "font-weight:bold;");
  console.log(
    `%cErrors: ${gptErrors.length}`,
    `font-weight:bold; color:${gptErrors.length ? "red" : "green"};`
  );
  console.log(
    `%cWarnings: ${gptWarnings.length}`,
    `font-weight:bold; color:${gptWarnings.length ? "red" : "green"};`
  );
  console.groupEnd();
  console.group("%cPrebidTag", "font-weight:bold;");
  console.log(
    `%cErrors: ${table.length}`,
    `font-weight:bold; color:${table.length ? "red" : "green"};`
  );
  if (Object.keys(table).length > 0) {
    console.table(table);
  }
  console.groupEnd();
  console.groupEnd();
}

function printSummary() {
  const slotTable = getSlotTable();
  printErrorEvent();
  printInfo();
  printAllBidsByUnit(slotTable);
  printSlotTable(slotTable);
  printSlotEventLogs(slotTable);
}

function printInfo() {
  const config = getConfig();
  console.group(LOG_PREFIX, LOG_PREFIX_STYLE, "Config");
  console.table(config);
  console.groupEnd();
}

function printSlotTable(slotTable: SlotTable) {
  const table: {
    [divId: string]: {
      [key: string]: string | number;
    };
  } = {};

  Object.keys(slotTable).forEach((divId) => {
    const {
      unitPath,
      fetchCount,
      auctionCount,
      wonCount,
      status,
      messages,
      errorMessages,
    } = slotTable[divId];

    table[divId] = {
      unitPath,
      status: status ? "OK" : "NG",
      fetchCount,
      auctionCount,
      wonCount,
      messages: messages.join(", "),
      errMessages: errorMessages.join(", "),
    };
  });

  console.groupCollapsed(LOG_PREFIX, LOG_PREFIX_STYLE, "AdUnitTable");
  console.table(table);
  console.groupEnd();
}

function printSlotEventLogs(slotTable: SlotTable) {
  console.groupCollapsed(LOG_PREFIX, LOG_PREFIX_STYLE, "AdUnitEventLogs");
  Object.keys(slotTable).forEach((divId) => {
    const { unitPath, logs, status } = slotTable[divId];
    const statusStr = status ? "OK" : "NG";
    const statusColor = status ? "green" : "red";
    console.groupCollapsed(
      `%c${statusStr}%c ${unitPath} (${divId})`,
      `font-weight:bold;color:white;padding:2px;background-color:${statusColor};`,
      ""
    );
    const table = logs.map((log, index) => {
      let message = "";
      let eventName = `${log.name}`;
      let tag = "PREBID";

      switch (log.name) {
        case "AUCTION_INIT": {
          eventName = "AUCTION_START";
          message = `bidder = ${log.args.bidders.join(", ")}`;
          break;
        }
        case "AUCTION_END": {
          eventName = "AUCTION_END";
          break;
        }
        case "SET_KV": {
          eventName = "SET_KeyValue";
          message = JSON.stringify(log.args.keyValues[divId]);
          break;
        }
        case "WON": {
          eventName = "WON";
          message = `bidder = ${log.args.bidder} cpm = ${log.args.cpm} adId = ${log.args.adId}`;
          break;
        }
        case "REQUEST": {
          tag = "GOOGLE";
          eventName = "REQUEST";
          break;
        }
        default:
          break;
      }

      const tagStyle =
        tag === "PREBID"
          ? "color:white; background-color:rgb(245, 151, 148); padding:2px; border-radius:4px;"
          : "color:white; background-color:rgb(66, 133, 244); padding:2px; border-radius:4px;";
      console.log(
        `%c[${log.timestamp} ms] %c${tag}%c %c${eventName} %c${
          message.length ? ":" : ""
        } %c${message}`,
        "color:purple;font-weight:bold;background-color:white;padding:2px;border-radius:4px;",
        tagStyle,
        "",
        "font-weight:bold;",
        "",
        ""
      );
      if (index !== logs.length - 1) {
        console.log("%c |", "font-weight:bold;");
        // console.log("%c V", "font-weight:bold;");
      }
      return {
        timestamp: log.timestamp,
        tag,
        eventName,
        message,
      };
    });
    console.table(table);
    console.groupEnd();
  });
  console.groupEnd();
}

function printAllBidsByUnit(slotTable: SlotTable) {
  console.group(LOG_PREFIX, LOG_PREFIX_STYLE, "AllBidsByUnit");
  Object.keys(slotTable).forEach((divId) => {
    const slot = slotTable[divId];
    const status =
      slot.wonCount > 0 ? `Win-Bids(${slot.wonCount})` : "No-Win-Bids(0)";
    const style = `font-weight:bold;color:${
      slot.wonCount > 0 ? "green" : "red"
    };`;
    console.group(`%c ${status} %c${slot.unitPath} (${slot.divId})`, style, "");
    console.log(`sizes: ${slot.sizes.join(", ")}`);
    const bids = slot.bids.map((bid) => {
      return {
        bidder: bid.bidder,
        cpm: bid.cpm,
        status: bid.status === "rendered" ? "rendered" : "",
        adId: bid.adId,
      };
    });
    console.table(bids);
    console.groupEnd();
  });
  console.groupEnd();
}

// @ts-ignore
window.pbjsDebugger = {
  printSummary,
};
printSummary();
