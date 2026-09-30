# Buddy workshop

The Buddy modal has four views: Activities, Inventory, Quests, and Journal. Progress and loadouts keep their existing storage keys, IDs, and server sync. No save migration is required.

## Activities

Activities request the existing ScreenBuddy routines through `daivr-buddy-activity-request`. The handler acknowledges requests synchronously; the modal closes and scrolls to the footer only after acceptance. Active events, carrying, parachuting, combat, and outages prevent interruptions. Fishing, patrol, and rain use their existing cooldowns, including the swift lure's shorter fishing cooldown. Dance has a 12-second cooldown. The activity buttons do not grant rewards directly: fishing still rolls the existing catch table, and patrol finds still need to be collected in the footer.

Reduced motion prevents requested fishing, dance, and rain. Patrol remains available; the existing reduced-motion styles suppress movement. Aquarium, fish, and preview animations also honor reduced motion. Existing autonomous routines and terminal commands remain available.

## Inventory and journal

The locker shows owned, equipped, locked, or all gear, with search and slot filters. Locked equipment shows its real unlock requirement and progress; it cannot be equipped. Existing slot exclusivity and costume restrictions still apply. Pose buttons change only the wardrobe preview. Quest cards display the equipment they award.

The journal supports discovered/missing filters, rarity filtering, alphabetical and catch-count sorting, and catalogue order. Only discovered entries reveal names, rarity, and lore. Changing filters selects an entry in the visible results. Fish use the same SVG artwork in the journal, fishing haul, and ambient jumping-fish scenes.

Run `npm test` and `npm run build`. Use isolated test data for browser checks; never seed a real player's save to preview unlocks.

## Footer wildlife and sightings

Buddy retains a crisp SVG pixel silhouette with shaded casing, expressive eyes, and CRT breathing. Frogs have a spotted body, eye blinks, throat motion, and hops bounded by the footer width. Jumping fish use multiple journal species, tail paddles, eased arcs, and pixel splashes.

A naturally rolled leviathan sighting keeps the original 2.5% chance. It now has a 5.5-second approach, 13.5 seconds at the surface, and a 3.5-second retreat. The existing sighting reward is recorded once at surfacing. The active fishing session owns every timer, so cancellation or unmount cannot leave the screen dimmed. The alert offers an instant footer shortcut with keyboard focus and a dismiss control that removes dimming without ending the encounter. Reduced-motion styles stop the scene animation.

The sidebar uses a compact player card and height-responsive desktop spacing. Below 650px tall, the eight navigation links use two columns. Scroll remains available as an accessibility fallback for unusually small windows or increased text sizing; controls are never clipped to fake a fit.

## Equipment art and animation pass

Inventory art lives in `BuddyGearArt`; `BuddyGearIcon` frames it for the locker and `BuddyWornGear` places the same drawing on the sprite. Hats, glasses, scarf, carried objects, rocket boots, and fishing lures share their silhouettes and palette. Fitted headset and visor overlays retain their face-aligned geometry. Rod art is shared by the normal fishing rig and Miku's foreground grip. Gear IDs, unlock rules, slot restrictions, and saved loadouts are unchanged.

Fishing animates the rod, line, bobber, reel, splashes, and caught specimen separately. The outer SVG stays stationary so the shoreline does not rotate with the rod. The existing phase timers still control the action. Walking uses alternating planted/lifted feet; petting and dancing use anticipation, a hop, and a landing; scarf, carry, rain, sleep, held, and combat motions accompany the same existing moods. Reduced motion disables the new effects.

Browser validation covered a live cast → wait → bite → catch, equipment switching including Miku, desktop and 375px inventory layout, and reduced-motion animation styles.
