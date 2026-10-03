import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";

// The jumping fish, caught specimen, journal, and aquarium share one sprite.
export function PixelLeapFish({ color, species = "byte-minnow" }) {
  return <BuddyCollectibleIcon id={species} color={color} className="pixel-leap-fish-svg" width={42} height={28} />;
}
