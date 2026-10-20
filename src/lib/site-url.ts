const DEFAULT_SITE_URL = "https://www.disfraceshechizos.com.ar";

export function getSiteUrl() {
  const configuredUrl = process.env.SITE_URL || DEFAULT_SITE_URL;
  return new URL(configuredUrl.endsWith("/") ? configuredUrl : `${configuredUrl}/`);
}
