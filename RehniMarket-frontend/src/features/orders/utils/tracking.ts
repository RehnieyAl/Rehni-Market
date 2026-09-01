const PLACEHOLDER = /\{tracking\}|\{guia\}|\{guía\}|\{\}/gi;

export function buildTrackingUrl(trackingUrl: string, trackingNumber: string): string {
  if (PLACEHOLDER.test(trackingUrl)) {
    return trackingUrl.replace(PLACEHOLDER, encodeURIComponent(trackingNumber.trim()));
  }

  return trackingUrl;
}
