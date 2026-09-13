export const SOURCES = {
  codes: { name: "Nuka Knights", url: "https://nukaknights.com/nuke-codes.html" },
  minerva: { name: "Nuka Knights", url: "https://nukaknights.com/minerva-dates-inventory.html" },
  axolotl: { name: "Nuka Knights", url: "https://nukaknights.com/articles/catch-axolotl-all-regions-and-months-incl-map.html" },
  events: { name: "Nuka Knights", url: "https://nukaknights.com/en/" },
  bethesda: { name: "Bethesda", url: "https://fallout.bethesda.net/en-US/news" }
};

// Editorial facts are explicitly dated and expire; these are not a live feed.
export const REWARDS = [{
  species: "Shadow Axolotl",
  startsAt: "2026-09-01T16:00:00.000Z",
  endsAt: "2026-10-06T16:00:00.000Z",
  title: "Shadow Axolotl plushie",
  description: "Claim the free monthly plushie in the Atomic Shop.",
  source: {
    name: "Bethesda · September shop bulletin",
    url: "https://fallout.bethesda.net/en-US/news/atomic-shop-monthly-update-september-2026"
  },
  reviewedAt: "2026-09-13"
}];

export const SILOS = [
  { id: "alpha", name: "Alpha", letter: "A", file: "01" },
  { id: "bravo", name: "Bravo", letter: "B", file: "02" },
  { id: "charlie", name: "Charlie", letter: "C", file: "03" }
];
