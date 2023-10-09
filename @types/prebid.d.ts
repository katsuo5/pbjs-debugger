declare namespace Prebid {
  /** TODO */
  type BidResponse = {};
  type Bid = {
    bidder: string;
    cpm: number;
    adId: string;
    status?: string;
  };
  type AdUnit = {};
  type TargetingObj = {};

  type TargetingKeyName =
    | "hb_bidder"
    | "hb_adid"
    | "hb_pb"
    | "hb_size"
    | "hb_source"
    | "hb_format";

  type Config = {
    auctionOptions: {};
    bidderSequence: "random" | "strict";
    bidderTimeout: number;
    currency: {
      adServerCurrency: string;
      conversionRateFile: string;
    };
    customPriceBucket: {
      precision: number;
      min: number;
      max: number;
      increment: number;
    }[];
    debug: boolean;
    deviceAccess: boolean;
    disableAjaxTimeout: boolean;
    enableSendAllBids: boolean;
    enableTIDs: boolean;
    maxNestedIframes: number;
    priceGranularity: "custom";
    realTimeData: {
      auctionDelay: number;
      dataProviders: {
        name: string;
        params: object;
      }[];
    };
    timeoutBuffer: number;
    useBidCache: boolean;
    userSync: {
      syncEnabled: boolean;
      filterSettings: {
        iframe: {
          bidders: string | string[];
          filter: "exclude" | "include";
        };
      };
      syncsPerBidder: number;
      syncDelay: number;
      auctionDelay: number;
      userIds: {
        name: string;
        params?: object;
        storage?: object;
      }[];
    };
  };

  type EventLog =
    | ErrorEventLog
    | BidderErrorEventLog
    | AuctionInitEventLog
    | AuctionEndEventLog
    | WonEventLog
    | SetKVEventLog;

  type ErrorEventLog = {
    eventType: "auctionDebug";
    elapsedTime: number;
    args: {
      type: "ERROR";
      arguments: {
        [key: number]: string;
      };
    };
  };

  type BidderErrorEventLog = {
    eventType: "bidderError";
    elapsedTime: number;
    args: {
      bidderRequest: {
        bidderCode: string;
      };
    };
  };

  type AuctionInitEventLog = {
    eventType: "auctionInit";
    elapsedTime: number;
    args: {
      adUnits: {
        code: string;
        bids: {
          bidder: string;
          params: object;
        }[];
      }[];
    };
  };

  type AuctionEndEventLog = {
    eventType: "auctionEnd";
    elapsedTime: number;
    args: {
      adUnits: {
        code: string;
        bids: {
          bidder: string;
          params: object;
        }[];
      }[];
    };
  };

  type WonEventLog = {
    eventType: "bidWon";
    elapsedTime: number;
    args: {
      adId: string;
      adUnitCode: string;
      auctionId: string;
      bidder: string;
      bidderCode: string;
      cpm: number;
    };
  };

  type SetKVEventLog = {
    eventType: "setTargeting";
    elapsedTime: number;
    args: {
      [divId: string]: {
        [key: string]: string;
      };
    };
  };

  /**
   * https://docs.prebid.org/dev-docs/publisher-api-reference/bidderSettings.html
   */
  type BidderSetting = {
    [key: string]: {
      adserverTargeting?: {
        key: TargetingKeyName;
        val: (bidResponse: BidResponse) => string;
      };
      bidCpmAdjustment?: (bidCpm: number, bid: Bid) => number;
      sendStandardTargeting?: boolean;
      suppressEmptyKeys?: boolean;
      allowZeroCpmBids?: boolean;
      storageAllowed?: boolean;
      allowAlternateBidderCodes?: boolean;
      allowedAlternateBidderCodes?: string[];
    };
  };

  export interface PrebidJS {
    bidderSetting: BidderSetting;
    /**
     * Flag indicating that Prebid is loaded and ready to be called.
     */
    libLoaded: boolean;
    /**
     * Version
     */
    version: string;
    /**
     * The list of modules
     *
     * https://docs.prebid.org/dev-docs/publisher-api-reference/installedModules.html
     */
    installedModules: string[];
    /**
     * Ad Unit List
     *
     * https://docs.prebid.org/dev-docs/adunit-reference.html#adunit
     */
    adUnits: AdUnit[];
    /**
     * Instructs Prebid to sync the user.
     *
     * https://docs.prebid.org/dev-docs/publisher-api-reference/setConfig.html
     */
    triggerUserSyncs: () => void;
    /**
     * This function returns the query string targeting parameters available at this moment for a given ad unit. Note that some bidder's response may not have been received if you call this function too quickly after the requests are sent.
     * @param  {string} [adunitCode] adUnitCode to get the bid responses for
     * @alias module:pbjs.getAdserverTargetingForAdUnitCodeStr
     * @return {Array}  returnObj return bids array
     */
    getAdserverTargetingForAdUnitCodeStr: (
      adUnitCode: string
    ) => TargetingObj | undefined;
    /**
     * This function returns the query string targeting parameters available at this moment for a given ad unit. Note that some bidder's response may not have been received if you call this function too quickly after the requests are sent.
     * @param adUnitCode {string} adUnitCode to get the bid responses for
     * @alias module:pbjs.getHighestUnusedBidResponseForAdUnitCode
     * @returns {Object}  returnObj return bid
     *
     * https://docs.prebid.org/dev-docs/publisher-api-reference/getHighestUnusedBidResponseForAdUnitCode.html
     */
    getHighestUnusedBidResponseForAdUnitCode: (adUnitCode: string) => {};

    getBidResponsesForAdUnitCode: (adUnitCode: string) => { bids: Bid };

    getConfig: () => Config;

    getEvents: () => EventLog[];
  }
}
