export type SlotTable = {
  [divId: string]: {
    divId: string;
    unitPath: string;
    sizes: string[];
    bids: Prebid.Bid[];
    fetchCount: number;
    auctionCount: number;
    wonCount: number;
    status: boolean;
    messages: string[];
    errorMessages: string[];
    logs: SlotEventLog[];
  };
};

export type SlotEventLog =
  | AuctionInitEventLog
  | AuctionEndEventLog
  | SetKVEventLog
  | WonEventLog
  | RequestEventLog;

export type AuctionInitEventLog = {
  name: "AUCTION_INIT";
  timestamp: number;
  args: {
    bidders: string[];
  };
};

export type AuctionEndEventLog = {
  name: "AUCTION_END";
  timestamp: number;
};

export type SetKVEventLog = {
  name: "SET_KV";
  timestamp: number;
  args: {
    keyValues: {
      [divId: string]: {
        [key: string]: string;
      };
    };
  };
};

export type WonEventLog = {
  name: "WON";
  timestamp: number;
  args: {
    bidder: string;
    cpm: number;
    adId: string;
  };
};

export type RequestEventLog = {
  name: "REQUEST";
  timestamp: number;
};

export type GptGetEventLog = () => {
  getEventsByLevel: (lev: number) => {
    timestamp: Date;
    message: {
      messageId: number;
    };
    j: {
      getSlotElementId: () => string;
    };
  };
};

export type GoogleTagLog = {
  timestamp: Date;
  message: {
    messageId: number;
  };
  g: {
    getSlotElementId: () => string;
  };
};

export type GooglePublisherTag = {
  openConsole: () => void;
  pubads: () => googletag.PubAdsService;
  getEventLog: () => {
    getEventsByLevel: (lev: number) => GoogleTagLog[];
  };
};
