import { CHARACTER_PREFIX, R2_PREFIX } from "./constants";

export const MAX_REFERENCE_IMAGES = 8;

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function isAllowedReferenceKey(key: string): boolean {
  return key.startsWith(R2_PREFIX) || key.startsWith(CHARACTER_PREFIX);
}

export function normalizeReferenceKeys(keys: unknown): string[] {
  const unique: string[] = [];
  for (const key of asStringArray(keys)) {
    if (!isAllowedReferenceKey(key)) continue;
    if (!unique.includes(key)) unique.push(key);
    if (unique.length >= MAX_REFERENCE_IMAGES) break;
  }
  return unique;
}

export function mergeReferenceKeys(...groups: Array<unknown>): string[] {
  return normalizeReferenceKeys(groups.flatMap((group) => asStringArray(group)));
}

export function referenceImageUrls(req: {
  firstFrameUrl?: string | null;
  referenceUrls?: string[] | null;
}): string[] {
  const urls: string[] = [];
  const push = (url?: string | null) => {
    if (url && !urls.includes(url)) urls.push(url);
  };
  if (Array.isArray(req.referenceUrls)) {
    for (const url of req.referenceUrls) push(url);
  }
  if (req.firstFrameUrl) {
    const index = urls.indexOf(req.firstFrameUrl);
    if (index === -1) urls.unshift(req.firstFrameUrl);
    else if (index > 0) {
      urls.splice(index, 1);
      urls.unshift(req.firstFrameUrl);
    }
  }
  return urls;
}
