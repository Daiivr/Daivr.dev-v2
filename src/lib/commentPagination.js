export function commentPageNumbers(current, total) {
  const pages = new Set([1, total]);
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const start = Math.max(2, Math.min(current - 1, total - 4));
  const end = Math.min(total - 1, Math.max(current + 1, 5));
  for (let page = start; page <= end; page += 1) pages.add(page);
  const result = [];
  for (const page of [...pages].sort((a, b) => a - b)) {
    const previous = result.at(-1);
    if (previous && page - previous > 1) result.push(`gap-${page}`);
    result.push(page);
  }
  return result;
}
