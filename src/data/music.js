import { musicCatalog } from "../../shared/music-catalog.mjs";

export const musicTracks = musicCatalog.map(({ file, ...track }) => ({
  ...track,
  src: `/api/music/${track.id}`,
}));
