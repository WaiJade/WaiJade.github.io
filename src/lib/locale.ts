export type Locale = "zh" | "en";

const ZH_REGIONS = new Set(["CN", "HK", "MO", "SG", "TW"]);
const ZH_TIMEZONES = ["asia/shanghai", "asia/hong_kong", "asia/macau", "asia/taipei", "asia/singapore"];

function isZhLocaleTag(localeTag: string) {
  const normalizedTag = localeTag.toLowerCase();
  if (normalizedTag.startsWith("zh")) {
    return true;
  }

  try {
    const region = new Intl.Locale(localeTag).region;
    return Boolean(region && ZH_REGIONS.has(region.toUpperCase()));
  } catch {
    return false;
  }
}

export function detectPreferredLocale(): Locale {
  if (typeof navigator !== "undefined") {
    const localeCandidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
    if (localeCandidates.some(isZhLocaleTag)) {
      return "zh";
    }
  }

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase();
    if (timeZone && ZH_TIMEZONES.includes(timeZone)) {
      return "zh";
    }
  } catch {
    // ignore and fall back to English
  }

  return "en";
}
