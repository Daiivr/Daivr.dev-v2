import { musicCatalog } from "../../shared/music-catalog.mjs";

// Label colour per track: the record, the spectrum tips and the tracklist use it.
const trackColors = {
  volt: "#ffd166",
  atlas: "#3fff97",
  "night-supply": "#a97bff",
  escape: "#45d8ff",
  anemone: "#ff3d9d",
};

export const musicTracks = musicCatalog.map(({ file, ...track }) => ({
  ...track,
  color: trackColors[track.id] || "#3fff97",
  src: `/api/music/${track.id}`,
}));
