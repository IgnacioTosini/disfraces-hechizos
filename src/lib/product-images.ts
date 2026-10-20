export function isDisplayableImage(url: unknown): url is string {
  return (
    typeof url === "string" &&
    (/^\/(?!\/)/.test(url) || url.startsWith("https://res.cloudinary.com/"))
  );
}

export function sortProductImages<
  T extends { id: string; sortOrder?: string | number | boolean | null },
>(images: T[]): T[] {
  return [...images].sort(
    (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0),
  );
}
