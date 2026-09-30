import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";

export function PixelLeapFish({ color = "#45d8ff", species = "byte-minnow" }) {
  return <BuddyCollectibleIcon className="pixel-leap-fish-svg" id={species} color={color} width={42} height={28} />;
}
