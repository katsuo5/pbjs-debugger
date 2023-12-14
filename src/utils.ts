import { GooglePublisherTag } from "./type";

export function isGptTagEnable() {
  return window?.googletag && window?.googletag?.pubads;
}

export function getPbjs(): Prebid.PrebidJS {
  return window.pbjs;
}

export function getGooglePublisherTag(): GooglePublisherTag {
  // @ts-ignore
  const gpt: GooglePublisherTag = window.googletag;
  return gpt;
}

function gptLogRepogitory() {
  let propKey: string | null = null;

  function getPropKey(log: unknown) {
    return Object.getOwnPropertyNames(log).filter(
      (name) =>
        !["timestamp", "message", "level"].includes(name) &&
        // @ts-ignore
        Object.prototype.hasOwnProperty.call(log[name], "getSlotElementId")
    )[0];
  }

  return {
    getSlotFromLog(log: unknown) {
      if (!propKey) {
        propKey = getPropKey(log);
      }
      // @ts-ignore
      return log[propKey];
    },
  };
}

export const { getSlotFromLog } = gptLogRepogitory();
