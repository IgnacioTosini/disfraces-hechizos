import type { Metadata } from "next";

const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
export const siteUrl = process.env.SITE_URL
  ? new URL(process.env.SITE_URL).origin
  : vercelHost
    ? `https://${vercelHost}`
    : undefined;
export const siteName = "El Arcángel";

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  image = "/brand/arcangel-social.jpg",
): Metadata {
  const url = siteUrl ? new URL(path, siteUrl).href : undefined;
  const imageUrl = image.startsWith("https://")
    ? image
    : siteUrl
      ? new URL(image, siteUrl).href
      : image;
  return {
    title,
    description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      title,
      description,
      siteName,
      locale: "es_AR",
      type: "website",
      url,
      images: [
        {
          url: imageUrl,
          alt: title,
          ...(image === "/brand/arcangel-social.jpg"
            ? { width: 1200, height: 630, type: "image/jpeg" }
            : {}),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
