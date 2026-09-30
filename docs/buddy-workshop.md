# Buddy workshop

The Buddy modal has four views: Activities, Inventory, Quests, and Journal. Progress and loadouts keep their existing storage keys, IDs, and server sync. No save migration is required.

## Activities

Activities request the existing ScreenBuddy routines through `daivr-buddy-activity-request`. The handler acknowledges requests synchronously; the modal closes and scrolls to the footer only after acceptance. Active events, carrying, parachuting, combat, and outages prevent interruptions. Fishing, patrol, and rain use their existing cooldowns, including the swift lure's shorter fishing cooldown. Dance has a 12-second cooldown. The activity buttons do not grant rewards directly: fishing still rolls the existing catch table, and patrol finds still need to be collected in the footer.

Reduced motion prevents requested fishing, dance, and rain. Patrol remains available; the existing reduced-motion styles suppress movement. Aquarium, fish, and preview animations also honor reduced motion. Existing autonomous routines and terminal commands remain available.

## Inventory and journal

The locker shows owned, equipped, locked, or all gear, with search and slot filters. Locked equipment shows its real unlock requirement and progress; it cannot be equipped. Existing slot exclusivity and costume restrictions still apply. Pose buttons change only the wardrobe preview. Quest cards display the equipment they award.

The journal supports discovered/missing filters, rarity filtering, alphabetical and catch-count sorting, and catalogue order. Only discovered entries reveal names, rarity, and lore. Changing filters selects an entry in the visible results. Fish use the same SVG artwork in the journal, fishing haul, and ambient jumping-fish scenes.

Patrol finds share their shaded SVG art with the journal, including a clean floppy distinct from the soggy fishing find. The collect button retains its label and keyboard focus, with a gentle bob and glint. The phosphor insect has articulated wings, a glowing abdomen, and a single arrival/hover/departure flight. The signal bird has shaded plumage. Fishing separates line winding from lure movement so the lure keeps its proportions, with a two-part bite, reel pumping, catch arc, drips, and fish-only wriggling. Catch odds, encounter rewards, and phase timers are unchanged.

Run `npm test` and `npm run build`. Use isolated test data for browser checks; never seed a real player's save to preview unlocks.

## Footer wildlife and sightings

The woodland keeps its existing 96px footprint. SVG trees use shaded pixel foliage over two distant forest layers, with a mossy rail, rocks, mushrooms, a small lantern, low mist, and drifting fireflies. CRT and Glitch modes use separate muted palettes. Rain dims the clearing and hides fireflies; leviathan dimming still applies. Scenery animation and grass tracking pause outside the viewport, and reduced motion leaves a static scene.

Buddy retains a crisp SVG pixel silhouette with shaded casing, expressive eyes, and CRT breathing. Frogs have a spotted body, eye blinks, throat motion, and hops bounded by the footer width. Jumping fish use multiple journal species, tail paddles, eased arcs, and pixel splashes.

A naturally rolled leviathan sighting keeps the original 2.5% chance. It now has a 5.5-second approach, 13.5 seconds at the surface, and a 3.5-second retreat. The existing sighting reward is recorded once at surfacing. The active fishing session owns every timer, so cancellation or unmount cannot leave the screen dimmed. The alert offers an instant footer shortcut with keyboard focus and a dismiss control that removes dimming without ending the encounter. Reduced-motion styles stop the scene animation.

The sidebar uses a compact player card and height-responsive desktop spacing. Below 650px tall, the eight navigation links use two columns. Scroll remains available as an accessibility fallback for unusually small windows or increased text sizing; controls are never clipped to fake a fit.

## Equipment art and animation pass

Inventory art lives in `BuddyGearArt`; `BuddyGearIcon` frames it for the locker and `BuddyWornGear` places the same drawing on the sprite. Hats, glasses, carried objects, rocket boots, and fishing lures share their silhouettes and palette. Headset, visor, and scarf use fitted geometry. The scarf wraps the lower casing, with short shaded tails painted in front of the legs. Rod art is shared by the normal fishing rig and Miku's foreground grip. Gear IDs, unlock rules, slot restrictions, and saved loadouts are unchanged.

Fishing animates the rod, line, bobber, reel, splashes, and caught specimen separately. The outer SVG stays stationary so the shoreline does not rotate with the rod. The existing phase timers still control the action. Walking uses alternating planted/lifted feet; petting and dancing use anticipation, a hop, and a landing; scarf, carry, rain, sleep, held, and combat motions accompany the same existing moods. Reduced motion disables the new effects.

Browser validation covered a live cast → wait → bite → catch, equipment switching including Miku, desktop and 375px inventory layout, and reduced-motion animation styles.

The CRT body uses a filled, shaded shell and solid shoes so equipment stays distinct. Normal walking moves the upper body separately from alternating planted feet, with a toe roll and scarf follow-through. Rocket boots and the Miku costume retain their own movement. The underwater school uses miniature journal species with independent swimming depths, turns, tail beats, and an approach to the hook. A dark pixel pool keeps fish legible over the footer ticker. Junk and treasure have individual shaded artwork, including boot laces, disk labels, controller damage, rust, cable plugs, keyboard keys, and chest hardware.

The body/water pass was checked in the desktop and 375px wardrobe, junk and treasure journal views, and a live fishing cycle. Computed walking frames confirmed alternating foot lifts with a stationary outer sprite; reduced motion stopped the scarf animation.

## Rain and bug encounters

`BuddyUmbrella` separates the handle and canopy: Buddy lifts the folded umbrella, the canopy unfolds, runoff drips from its edges, and it folds away as rain fades. Its CSS duration comes from the existing rain timer. The shaft sits behind Buddy so it cannot cross the face.

Bug encounters keep the existing phases and reward timing. Both pistol variants (including the historical `wrench` ID) share a shaded blaster with a charge cell. Three timed shots coordinate recoil, muzzle flashes, bolts, and evasive bug movement before the hit phase. Swatter and net windups also finish at the hit transition. The bug breaks into pixels and shows a brief completion label; the blaster lowers before the encounter ends. Reduced motion suppresses these effects.
