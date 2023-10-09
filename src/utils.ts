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
