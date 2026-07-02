export function preloadImages(urls) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const seen = new Set();

  urls
    .filter(Boolean)
    .map((url) => String(url).trim())
    .filter((url) => url && !seen.has(url))
    .forEach((url) => {
      seen.add(url);

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = url;
      link.fetchPriority = "high";
      document.head.appendChild(link);

      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = "high";
      image.src = url;
    });
}
