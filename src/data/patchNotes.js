// Registro de cambios (Patch.log). Vive aparte de site.js porque es casi todo
// el peso de ese archivo y solo lo necesita la seccion Patch.log, que ahora se
// carga cuando el visitante se acerca a ella.
// Tipos de cambio: new (verde), buff (cian), fix (dorado), nerf (rosa).
// El primer elemento del array se muestra como LATEST.
export const patchNotes = [
  {
    version: "v2.63.0",
    codename: "WARM UP",
    date: "2026-10-05",
    summary: "Nothing pops in anymore. Every window eases open and settles back out, the arcade TVs switch on and off like real sets, and the terminal and Dai's desk were rebuilt to belong to the cabinet.",
    entries: [
      ["new", "The terminal is a proper cabinet console now. Each command and its reply read as one shell entry in that command's colour, the log sits in a curved CRT screen with a slow refresh line, the header has marquee lights and live uptime and command counters, and a powerline status bar runs along the bottom."],
      ["new", "The terminal writes the best completion in grey after what you type, and Tab accepts it."],
      ["buff", "The terminal's quick commands are colour-keyed buttons with their own icons, and all six fit without scrolling."],
      ["buff", "Dai's desk belongs to the cabinet: the green frame, a dark desk lit by neon, a gaming mat with a grid and an LED edge, and the room's labels in phosphor. A GAME ON sign glows on the desk, with a few arcade tokens by the coffee."],
      ["new", "Dai's three most played games, from the Discord stats, lie next to the Game Boy as cartridges with their art and hours. When a new game climbs into the top three, its cartridge drops onto the desk by itself."],
      ["fix", "The edge of the notebook's cover no longer drifts off the side of the book while it opens or closes."],
      ["new", "The game TVs start switched off. A dot of light stretches into a line, the line opens into a flash that fills the glass, and the game fades in under it. The power light and the channel display come on with it."],
      ["new", "Closing a game switches the TV off first: the picture squashes into a bright line, the line shrinks to a dot, the dot fades and the power light goes out, and only then does the cabinet go away."],
      ["buff", "Every window eases in and out instead of appearing and vanishing: the terminal, the player passport, Buddy's windows, the game library, the games, Patch.log, the vault, the GIF windows, the delete prompt and the chest reveal."],
      ["fix", "The game cabinets had an opening animation that never played unless Madrace had been opened first in the same visit."],
      ["buff", "The notebook on the desk catches the same light as the one you pick up."]
    ]
  },
  {
    version: "v2.62.1",
    codename: "FRESH COAT",
    date: "2026-10-05",
    summary: "A full repaint of the Carts section and of this desk. The projects folder sits on a holo-pad, every lanyard hangs in its own showcase, the project stories read like proper pages, and the Patch.log desk finally feels lived in.",
    entries: [
      ["new", "The Patch.log desk has a night-shift atmosphere: string lights, a window with the aurora moving outside, a neon sign, a desk lamp lighting the first save, and a mug that is still steaming."],
      ["buff", "Pointing at something on the desk dims everything else and shows its hint right next to it. The labels carry each object's colour and number, numbered in the order the desk reads, and get a check once discovered."],
      ["buff", "Desk discoveries open with the object you picked up, in its own colour, and a strip of its related builds you can jump between."],
      ["buff", "The guestbook's GIF picker and GIF preview got the same treatment: Search and Favorites as one switch, a single search bar, quick searches to start from, a shimmer while results load, and a preview framed like a display case."],
      ["fix", "The close button and the pink and gold accents inside the GIF windows had lost their colour, because those windows open outside the guestbook panel where the colours are set."],
      ["new", "Each game on the favourites shelf glows in the colours of its own cover, and its label carries its number, its colour and its genre."],
      ["buff", "The shelf's header reads at a glance: cartridges, hours and where the hours come from as proper counters, and the most played game with its cover and its share of all the hours."],
      ["new", "The projects folder floats over a glowing holo-pad, with a filing label, a barcode and an OPEN SOURCE stamp on the front. The papers sticking out of it are the real files, each in its project's colour with its name, what it is and its logo, and opened they keep that look, with an open strip that stays lit while the project is open."],
      ["buff", "Next to the folder, an index lists what is inside. Pointing at a project lifts its file out of the folder; opening it is still the folder's job."],
      ["fix", "The PRJ label on the folder tab no longer hides behind the papers sticking out of it."],
      ["new", "Lanyards hang in a showcase: a spotlight from the clip, a perspective floor, viewfinder corners and the project's name in giant outline behind the badge."],
      ["buff", "The lanyard's details are spec tiles, the main button is filled in the project's colour, and the VirusTotal report link sits inside the scan verdict it belongs to."],
      ["buff", "Project stories open with a big title next to the preview, then the problem and the build side by side, a connected 1-2-3 for how it works, and a result banner. Each one uses its project's colour: pink for TradeDex, green for Palwatch."]
    ]
  },
  {
    version: "v2.62.0",
    codename: "NIGHT SHIFT",
    date: "2026-10-04",
    summary: "Night falls on the footer. Buddy waves to other players, sits by the campfire to grill the day's catch, and the sky puts on a show: shooting stars to wish on, real meteor showers, full moons and rainbows. And for the first time, you can hear the footer.",
    entries: [
      ["new", "Wave at visiting Buddies: clicking a visitor sends a real wave to its player. Their Buddy tells them who waved, and clicking their Buddy right after waves back. If the player who waved has their Buddy visiting you, it waves too."],
      ["new", "Campfire nights: after dark, Buddy walks to the campfire by the Woodland Goods stand, sits down and grills a fish it has caught for 2 coins (up to three a night), or toasts a marshmallow that sometimes catches fire. Visitors have opinions about both. Type campfire in the terminal to send it over any time."],
      ["new", "Shooting stars cross the night sky. Click one to make a wish: Buddy grants a coin, up to five a night."],
      ["new", "Real meteor showers on their peak nights (Quadrantids, Lyrids, Eta Aquariids, Perseids, Orionids, Leonids and Geminids) fill the sky with shooting stars, and Buddy tells you which one it is."],
      ["new", "On full moon nights the moon glows brighter, and rare fish bite more often."],
      ["new", "When Buddy's shower clears in daylight, a pixel rainbow opens over it."],
      ["new", "Footer ambience, off by default: crickets at night, rain, a crackling campfire, the hum of the lamps and a little wind, all generated in your browser to match the sky. Turn it on with the ambience switch in the footer, or type sound."],
      ["buff", "Coins from the campfire and from wishes count in the market, alongside chest coins."],
      ["new", "Guestbook replies can answer a specific reply: each reply has its own reply button. A reply to the message right above it nests under it, with its line coming from that message, and every reply shows who it is answering."],
      ["buff", "The guestbook is tidier. There is one invitation to connect Discord instead of two, message numbers sit in each card's header, and card buttons stay quiet until you look at the card. Threads hang from a single line with curved branches into each reply, replies are only as wide as what they say, and GIFs are a little smaller."],
      ["fix", "Spoilers in the guestbook look like spoilers: a striped SPOILER tag that reveals the text while you hover it, or for good with a tap."],
      ["buff", "The sidebar is lighter and fits a laptop screen again. The player card only shows boxes when there is something in them, and always shows what time it is for Dai. Directory rows only get a frame when selected or hovered. The Buddy panel now shows your Buddy, in the gear it is wearing, next to its progress, with its four actions in one row."],
      ["buff", "Now.log's status panel shows Dai's real local time in Alaska, how far ahead or behind you that is, and a 24-hour strip of Dai's day with the current hour lit. The runtime line follows that clock, and the random bar chart is gone."],
      ["buff", "Each Now.log card ends with real tags from what it describes (the bots, the games, the topics) instead of an identical fake meter, and shows its own state."],
      ["buff", "LINKS.SH got a cleaner look that matches Now.log: dark route cards with a numbered rail, each in its own brand colour, and the real profile address on every card. Hovering lights the port and the launch button in that colour."],
      ["buff", "The intro is more useful. The three status chips under it (queue offline, nodes asleep, canvas idle) repeated the workstation beside them; in their place, On the bench lists the real builds, TradeDex and Palwatch, and each one opens its card in Carts. The paragraph highlights what I build, and the Terminal button shows its / shortcut."],
      ["buff", "The Toolbelt says what each module is made of. Every card lists the actual tools behind it (React, Discord.NET, SysBot.NET, Three.js, Vite and more) and where to see it working, with links to TradeDex, Palwatch, the game shelf and Patch.log. The identical READY lights, the decorative capability meter and the big background numbers are gone, the header shows what this cabinet runs on, and the cards line up row by row."],
      ["buff", "The workstation panel says each thing once: one status light in its title bar instead of two, and the build output no longer repeats it. The six runtime modules have readable names and a light in their node's colour, the boot script ticks off each line as it runs, and the footer counts how long Dai.exe has been online."],
      ["buff", "The workstation's node map names its six nodes and shows their links even while offline, with a clear Click to boot button under the core. The corner card that repeated the core now tells you what clicking does: burst a node, or overclock the core."],
      ["buff", "The boot sequence was redesigned. It shows one percentage instead of three, the same six nodes as the workstation map in the same colours, one list of processes, and a progress bar marked per node. The boot log types faster, so the running line can be read before the next one arrives."],
      ["fix", "The six boot nodes had three different sets of names (one on the canvas, one in the build log, one in the boot sequence). They now share one list, and each node enters the build log when it finishes rather than when it starts."],
      ["buff", "The vault behind the workstation: the dial fills an arc as you type, the code slots look like a display with a cursor on the next digit, the door's label is readable, and the sector sweep sits in an even grid that lines up with the vault."],
      ["buff", "Under the hood, Buddy is now split into smaller pieces (fishing, weather, encounters, blackout, chat, grabbing, campfire and sky), so new tricks are safer to add."],
      ["new", "The sky command can preview a meteor shower or a full moon: sky 23:00 meteors, or sky fullmoon."]
    ]
  },
  {
    version: "v2.61.0",
    codename: "SKYLIGHT",
    date: "2026-10-02",
    summary: "The footer gets a sky. The sun and moon follow your clock, pixel clouds drift past with the wind, the weather where you are shows up overhead, and when Buddy opens its umbrella the rain finally comes from a cloud.",
    entries: [
      ["new", "The sun rises, crosses and sets with your local time, and lights the sky gold at dawn and dusk. At night the moon comes out in its real phase, with stars."],
      ["new", "Pixel-art clouds fill the sky in four layers, from high thin wisps to big puffy cumulus, towering clouds and long low banks. Each puff is shaded on its own, and the lit side faces the sun or the moon."],
      ["new", "When the real weather is available, the sky follows it: clear, scattered clouds, overcast, fog, rain curtains, snow or distant lightning, with sunrise and sunset for where you are."],
      ["new", "When Buddy opens its umbrella, a rain cloud condenses right above it before the first drop, and the rain falls from that cloud. As the shower eases, the cloud stretches, lightens and drifts off with the wind. Showers also last a little longer."],
      ["new", "More trees and bushes in the forest, some with berries, plus a faint row of distant trees. Gusts of wind roll across from right to left, bending the grass, bushes and treetops in a wave, harder when it is windy or raining where you are, and a few leaves blow past."],
      ["new", "Three taller lamps now line the trail, one right beside the Woodland Goods stand. They light up at dusk: a flickering flame, a warm glow on the trees and the path, and fireflies circling them all night."],
      ["new", "A small campfire crackles next to the market stand, with flickering flames, rising sparks and a wisp of smoke. After dark its light spills across the clearing."],
      ["buff", "The forest follows the time of day: trees catch the daylight, the far hills turn hazy, and fireflies only come out after dark."],
      ["buff", "On the gate, Buddy no longer pops into view: it peeks over the edge for a moment, then hops up and lands with a little puff of dust."],
      ["buff", "Visiting Buddies give yours some room. They spread out across the footer instead of crowding in front of it, keep a friendly distance when they come back or follow it on a walk, and always turn to look at your Buddy wherever it goes."],
      ["fix", "The hills and trees are solid now, so the sun and moon set behind them instead of showing through."],
      ["fix", "Patch.log is ready by the time you scroll down to it. Its desk loads quietly in the background a moment after you enter, instead of showing a loading box for a few seconds."]
    ]
  },
  {
    version: "v2.60.0",
    codename: "HOT SWAP",
    date: "2026-10-02",
    summary: "Long fishing sessions no longer leave you on yesterday's cabinet. When a new version goes live while your tab is open, the cabinet lets you know, tells you what's new, and waits for you to reload when it suits you.",
    entries: [
      ["new", "A notice appears when a newer version of the site is live, with the patch name and a Reload button. It checks every few minutes, when you come back to the tab, and right after an update goes out."],
      ["new", "Buddy mentions the update too, as soon as it isn't busy."],
      ["new", "If Buddy is fishing, choose Reload after the catch and the page waits for the line to come in first."],
      ["new", "Later tucks the notice into a small Update ready chip, which opens again after half an hour."],
      ["new", "After reloading, the gate tells you what changed and you land back where you were, footer included."],
      ["new", "The version command in the console shows which build you're on and checks for a newer one."]
    ]
  },
  {
    version: "v2.59.0",
    codename: "OPEN HOUSE",
    date: "2026-10-02",
    summary: "Visiting Buddies make themselves at home. They wander the whole footer instead of waiting by the door, tag along when your Buddy goes for a walk, and everyone talks to everyone: your Buddy, its guests, and the guests with each other, each commenting on what the others get up to.",
    entries: [
      ["new", "Visitors explore the footer: they stroll from end to end, stop to look around, dance, flip, hop, and wander back to your Buddy now and then."],
      ["new", "When your Buddy sets off on a walk, a visitor may follow it and stop at its side. Sometimes your Buddy goes after a wandering guest to show it around."],
      ["new", "Your Buddy answers what its guests say, asks them about their own footer, their player, and the daily, and compliments the gear they're wearing."],
      ["new", "Two visitors chat with each other: first meetings, dares, compliments on each other's gear, and rumours about what lives under the floor."],
      ["new", "Every Buddy comments on what the others do: a dance, a flip, a walk, a glitch, a nap. Praise gets a thank-you; most chats run a line or two and wind down on their own."],
      ["new", "If your Buddy falls asleep, guests tiptoe or doze off too, and wake up when it does."],
      ["buff", "Guests hold still and watch while your Buddy fishes or hunts a bug, and their replies now wait for a pause instead of getting lost mid-catch."]
    ]
  },
  {
    version: "v2.58.0",
    codename: "SMALL TALK",
    date: "2026-10-02",
    summary: "Buddy pays more attention to your world. It talks about the real weather where you are, notices the day and the hour, remembers when you last came by, and reacts when you wander off and come back. Visiting Buddies chime in on all of it.",
    entries: [
      ["new", "Buddy comments on the real weather outside: sun, rain, snow, storms, heat, cold, and wind, with the temperature in your units. If it rains in the footer while it's raining where you are, it notices."],
      ["new", "The weather command in the console reports what it's like outside, and Buddy adds its own opinion. Without a location, it shares the cabinet forecast instead."],
      ["new", "Buddy knows the day and the hour: Monday sympathy, Friday cheer, weekend browsing, lunch breaks, evening shifts, and very late nights."],
      ["new", "Buddy greets first-time players with a tip, and returning players with how long it's been. It also marks how long you've been in the arcade: 5, 15, 30, and 60 minutes."],
      ["new", "Buddy notices when you come back to the tab, scroll back down to the footer, or lose your connection. It also mentions how many players are around, today's daily challenge, and your passport level."],
      ["buff", "New tips that point to things worth finding, and a few stories about Buddy's past. Visiting Buddies have replies for all of the new topics."],
      ["fix", "Visitors no longer answer a moment that has already passed, like mentioning rain right after it stopped."]
    ]
  },
  {
    version: "v2.57.0",
    codename: "HOUSE CALL",
    date: "2026-10-02",
    summary: "Buddy gets company. When other players have the cabinet open, their Buddies drop by your footer as little holograms: they say hi, hang out for a while, chat about whatever your Buddy is up to, and say goodbye before heading home.",
    entries: [
      ["new", "Other players' Buddies can visit your footer, wearing the gear their players picked. One or two at a time (one on phones), and each stays for at least a minute."],
      ["new", "Visitors walk in and greet your Buddy, and your Buddy greets them back. When it's time to go they say goodbye, your Buddy waves them off, and they fade out."],
      ["new", "Visitors react to what your Buddy is doing: a rare catch, a rain shower, a bug hunt, a song on Spotify, a pet, a dance. A second visitor says hi to the first."],
      ["new", "Click a visiting Buddy to say hi. Signed-in players show their Discord name on their Buddy; guests show up as guest."],
      ["new", "The console's visits command shows who could drop by, and visits off keeps your Buddy home and the door closed to visitors."]
    ]
  },
  {
    version: "v2.56.0",
    codename: "TRAVEL LIGHT",
    date: "2026-10-02",
    summary: "The cabinet packs lighter. The entry gate shows up right away, guestbook GIFs wait for a tap before they play, and the bigger features download the first time you use them. On a throttled phone test the first visit now moves about a third of the data it used to.",
    entries: [
      ["buff", "The entry gate appears as soon as the page arrives. It used to wait for the whole cabinet to download first; now the cabinet loads behind it, and the enter button lights up once it's ready."],
      ["buff", "Guestbook GIFs show a still of their first frame with a GIF tag and play right there when you hover over them (or tap to open them on a phone). The guestbook used to download every animation in full when the page opened, about 15 MB; the stills come to around 200 KB, and a GIF only downloads once someone wants to watch it."],
      ["buff", "Buddy's window, the command console, the Konami games, and seasonal events now download the first time you open them, each with its own styles, instead of on every visit. Patch.log arrives as you scroll toward it, with a placeholder holding its spot."],
      ["fix", "If the site updates while you have it open, opening one of those features reloads the page once to pick up the new version instead of failing."],
      ["buff", "The project archive background is a 35 KB image instead of 1.3 MB, with no visible difference."]
    ]
  },
  {
    version: "v2.55.0",
    codename: "WHO'S HERE",
    date: "2026-10-02",
    summary: "The top bar stops making up numbers. It shows your real passport level and how many people are in the arcade right now, the command console learns to open things for you, and a shared daivr.dev link finally gets a proper preview card.",
    entries: [
      ["new", "The XP readout in the top bar shows your passport level and lifetime XP when you're signed in, with a thin bar for progress to the next level. It used to be a counter that started at 87 and reset on every reload. Signed-out visitors see a dash instead of a made-up number."],
      ["new", "A live IN ARCADE count sits beside it, showing how many people have the cabinet open right now. It disappears if the live connection drops instead of showing a stale number."],
      ["new", "New console commands: open <project> opens a project file, play <game> (or play daily) inserts a cartridge, passport opens your player passport, and rank prints the level, streak, and daily-win boards or a game's top five."],
      ["buff", "Tab completion now fills in arguments too: goto sections, projects, games, themes, and ranking boards. help <command> explains any command, and a mistyped command suggests the one you probably meant."],
      ["buff", "Console history is kept between visits, and the prompt shows your Discord name when you're signed in."],
      ["fix", "scan lists the projects that are actually in the cabinet. Admin-only commands no longer appear in everyone's autocomplete; signed-in admins still get them."],
      ["fix", "The footer counter that said players_online was the all-time visit count. It's now labelled total_visits."],
      ["new", "Sharing daivr.dev in Discord or on social sites shows a preview card with the cabinet's title, headline, and a booting terminal."],
      ["buff", "Behind the scenes, every console command is defined in one place, and the four game leaderboards share one implementation with the same request checks."]
    ]
  },
  {
    version: "v2.54.1",
    codename: "TAMPER SEAL",
    date: "2026-10-02",
    summary: "A security pass on the parts of the cabinet that count things. Scores, the hero XP core, the visit counter, and guestbook GIFs now check what they're told before saving it, and the site sends the browser a stricter set of rules about what it may load.",
    entries: [
      ["fix", "Leaderboard runs carry a signed run token issued when the game opens. Tower Block, Cross Road, and Space Cadet reject runs that claim more time than has actually passed, and Madrace levels can no longer arrive faster than the server's clock allows."],
      ["fix", "The hero XP core only accepts the XP earned since the last save, capped at the rate the core can actually produce it. A single request can no longer rewrite the shared total."],
      ["fix", "Reloading the page no longer counts as a new visit. The same visitor is counted once per 30 minutes of activity."],
      ["fix", "Guestbook GIFs must come from the GIF providers the picker uses. GIFs from other websites are no longer shown, so a posted image cannot be used to track who reads the guestbook."],
      ["fix", "Game artwork lookups for the Discord panel only search for games that actually appear in Dai's activity, with a bounded cache."],
      ["buff", "The site now sends security headers, including a content security policy, nosniff, a referrer policy, and protection against being framed by other websites. The game cartridges keep a policy of their own so they still load."],
      ["fix", "The development and production servers share one list of API routes, so the hero XP core and Discord game artwork also work while developing. Unknown API paths answer with a JSON error instead of the page."]
    ]
  },
  // 8137cda — sea encounters and passport follow-ups.
  {
    version: "v2.54.0",
    codename: "SOMETHING BELOW",
    date: "2026-10-01",
    summary: "Something is holding onto the edge of the cabinet. The Abyss Kraken joins Buddy's fishing encounters, the water gets a deeper world of its own, and a few everyday passport and guestbook details fall into place.",
    entries: [
      ["new", "The Abyss Kraken can appear during a fishing trip. Textured tentacles grip the footer before pulling its shaded body out of the deep, with suction cups, glowing eyes, a friendly wave, and an ink-filled retreat."],
      ["buff", "Sea creatures face Buddy, with clearer encounter messages and ways to react together. Sighting counts are saved in the journal, and more secret passport rewards wait to be discovered."],
      ["buff", "The fishing opening sits fully inside the footer, clear of the music ticker. Dark broken edges surround layered water, swimming fish with moving tails, bubbles, reeds, and drifting light."],
      ["buff", "Customize passport now shows the badge collection in one scrollable list. The extra Daily tab is gone; today's challenge stays on the main passport."],
      ["fix", "Featured-badge tooltips stay inside the screen instead of being cut off by the passport. Their position adapts when the view scrolls or resizes."],
      ["fix", "Guestbook reply headers keep the share-link and admin delete buttons together."]
    ]
  },
  // 2c7163b — rankings, completion notices, and aquarium selection.
  {
    version: "v2.53.0",
    codename: "MAKE YOUR MARK",
    date: "2026-10-01",
    summary: "Your passport has a place on the leaderboard, Buddy's aquarium has room for your choices, and daily runs let you know when the challenge is complete.",
    entries: [
      ["new", "Open rankings beside the passport's close button to see the top five players by level, best daily streak, and total daily completions. A Back button returns to your passport."],
      ["buff", "The passport uses dedicated views for records, customization, and conversations. Textured ranking panels and styled badge tooltips match the rest of the cabinet."],
      ["new", "A daily-challenge notification appears when an accepted result completes the goal, including while a game is open. It stays above the game so you can see when the challenge is saved."],
      ["new", "Choose all three fish in Buddy's aquarium: one large featured fish and two smaller companions. Only caught species can be displayed, and your choices save with the room."],
      ["buff", "Buddy approaches a fishing spot at a calmer pace. Leviathan sightings get richer animation, reactions, and additional hidden progression rewards."]
    ]
  },
  // a5eb603 — player progression and game keyboard focus.
  {
    version: "v2.52.0",
    codename: "EVERY RUN COUNTS",
    date: "2026-10-01",
    summary: "The player passport grows with you. Daily challenges and earned badges now build lifetime XP, with a textured level display and extra rewards for keeping a daily streak alive.",
    entries: [
      ["new", "Player levels track lifetime XP separately from Buddy's level. The passport shows your current level, progress to the next one, and the XP still needed."],
      ["new", "Daily challenges award 100 base XP, with 10 more bonus XP for each consecutive day after the first. Missing a day resets the streak bonus."],
      ["new", "Unlocking badges awards XP based on the achievement. Secret badges stay out of the collection until you discover them, and each badge's XP is awarded only once."],
      ["buff", "The level panel gains an inset display, surface texture, and a segmented progress bar to fit the passport's arcade finish."],
      ["fix", "Madrace, Tower Block, and Cross Road receive keyboard focus when opened, so you can use the game controls without first clicking inside the screen."]
    ]
  },
  {
    version: "v2.51.0",
    codename: "SMALL DETAILS, MORE LIFE",
    date: "2026-10-01",
    summary: "More texture, more little moments, and a sturdier cabinet. The Discord desk, game shelves, passport, and console get a tactile arcade finish, while Buddy's home and footer adventures feel more alive.",
    entries: [
      ["buff", "The Discord presence panel becomes a textured desk: an open notebook holds the profile, a daiPod shows Spotify, and a handheld console shows game activity. Darker materials, a gently tilted notebook, a cassette, a note, and a top-view coffee cup complete the scene."],
      ["fix", "Music and game artwork fit inside their screens without cropping. Game stats sit beside the session timer and stay compact when opened. Notebook device labels are easier to read, profile badges have darker shadows, and the photo tape no longer covers the avatar decorations."],
      ["buff", "The favorite-game shelf and secret game library get richer arcade cases, cartridge details, and textured shelving. Clicking a favorite now turns the whole cartridge, including its frame and spine, to reveal the review on the back while the shelf stays still."],
      ["fix", "Cartridge flips finish smoothly without bouncing or a slow landing. The artwork no longer disappears behind the case during a turn, and characters can extend beyond the top edge without being cropped."],
      ["buff", "Game characters shrink and fade away when turning to a review, then zoom and fade back in when returning to the cover. Keyboard controls remain available, and reduced motion switches sides without the turn."],
      ["buff", "The notebook has a more detailed center fold, wider avatar-frame decorations, and a colored, textured controller sticker. Hovering the sticker lifts a deeper corner that follows the pointer's direction."],
      ["buff", "The handheld's player-record scrollbar is slimmer and rounded, with no arrow buttons, smoother keyboard scrolling, and colors that match its screen in both themes."],
      ["buff", "Arcade game dialogs now resemble old televisions, with textured cases, inset screens, speaker grilles, tuner details, and physical-looking controls that fit the secret game library."],
      ["fix", "Glitch mode now recolors the Discord desk, favorite-game shelf, and patch-notes workspace with matching plum, pink, and lavender materials while preserving the original artwork."],
      ["buff", "The patch-notes desk gets wood grain, a stitched mat, shaded objects, metal hardware, and an arcade finish. Its visiting bird lands on the desk frame instead of perching in midair."],
      ["buff", "The player passport gains a woven cover, laminated card details, and textured challenge panels. Collectible badges have brushed-metal edges, enamel centers, stitched ribbons, and a brief hover shine; locked badges remain muted."],
      ["buff", "The command console matches Buddy's header, cyan labels, dark screen, and illuminated controls. Command history, autocomplete, dragging, and mobile controls keep their familiar behavior."],
      ["buff", "The guestbook keeps its existing layout with matte surface texture and shaded trim. The admin marker is now a smaller crown that sparkles and glows on hover, with a tooltip that stays above surrounding page elements."],
      ["buff", "Buddy's room gets richer furniture and aquarium details, more natural trees outside the window, and shooting stars. The decorating panel uses illustrated choices, and the aquarium cabinet now sits correctly in front of the rug."],
      ["new", "A sleeping husky keeps Buddy company beside the bed, with breathing, occasional head lifts and looks around, and a softer tail wag anchored at the back."],
      ["buff", "Room display labels appear on hover or keyboard focus. Buddy speaks when clicked, and the speech bubble clears after a few seconds."],
      ["fix", "Living fish belong in the aquarium. Shelves still accept patrol finds, fishing junk such as the Old Boot, and treasure from the catch journal."],
      ["fix", "Opening Buddy's room no longer requests a separate script that an update could have replaced. A room rendering failure now shows recovery controls inside the dialog instead of blanking the whole website."],
      ["buff", "Fishing begins with a void portal opening at a random safe spot in the footer. Buddy notices it, runs over, and then casts; the stationary portal closes with an animation after fishing or an interruption."],
      ["buff", "The fishing portal has a darker center, a layered glowing rim, flowing currents, and small drifting lights. The underwater hook disappears when Buddy lifts a catch out of the water."],
      ["buff", "Rain-potion frogs get clearer eyes, jointed legs, breathing, and blinking. Their hops now include a crouch, a back-leg push, a smoother airborne arc, a grounded shadow, and a softer landing."],
      ["fix", "Footer fish have improved jumping artwork and more natural collision reactions with Buddy. PACKET_REX's obstacle timing is corrected so it no longer jumps far ahead of an approaching obstacle."],
      ["new", "Admin-only terminal commands can trigger the Leviathan sighting and power-outage encounters: leviathan and blackout, with powerout and power-out aliases. Manual requests verify admin access with the server; ordinary visitors cannot activate them."],
      ["known", "Mobile loading was measured in Lighthouse and follow-up work was documented for startup rendering and large media downloads. These visual updates are not presented as a measured performance improvement."]
    ]
  },
  {
    version: "v2.50.0",
    codename: "BEHIND THE CABINET",
    date: "2026-10-01",
    summary: "A few things left on a developer's desk, each with a story to tell. Pick up an object to discover the ideas, experiments, and little updates behind this cabinet.",
    entries: [
      ["new", "Explore six objects on Dai's desk: the live build, dev notebook, game stack, Buddy's corner, open channel, and first save. Each reveals personal context and a short selection of related releases."],
      ["new", "Selected releases include Behind the build commentary, feature snapshots, and artwork. Open an image for a closer look or browse the release gallery."],
      ["buff", "Read one release at a time, switch between patch notes, developer comments, and galleries, or search the complete archive for a specific build. Direct release links still work."],
      ["buff", "Discoveries are remembered on this device. Surprise me picks an unexplored object when possible, and the desk adapts to touch, keyboard, and reduced-motion preferences."]
    ]
  },
  {
    version: "v2.49.0",
    codename: "A ROOM OF YOUR OWN",
    date: "2026-10-01",
    summary: "Buddy has a place to call home. Decorate a little pixel room, put your discoveries on the shelves, and watch your catches swim while the world moves outside the window.",
    entries: [
      ["new", "Open Room from the Buddy panel to choose colors, beds, rugs, and little comforts. Guest rooms save on this device; signed-in rooms save to your Discord account."],
      ["new", "Two shelves display your patrol finds. Fish live in the aquarium: choose a featured fish, with up to two other caught species swimming alongside it. Your collection stays intact."],
      ["buff", "Patterned walls, paneled trim, wood grain, quilted blankets, woven rugs, and shaded furniture give Buddy's home a little more warmth."],
      ["new", "The window looks onto layered mountains and trees, with drifting clouds, birds, and seasonal leaves, snow, or fireflies. The aquarium has planted gravel, bubbles, glass reflections, and swimming fish."],
      ["buff", "Room controls work on phones and keyboards. Reduced motion stills the scenery, and the room loads only when you open it."]
    ]
  },
  // Historical backfill: dates follow the commits; small follow-ups share a release.
  // 22fb8df
  {
    version: "v2.48.0",
    codename: "KEEP THE GIF",
    date: "2026-09-30",
    summary: "The guestbook has a GIF viewer and a little collection of your own. Open a GIF in place, download it, or save it for the next conversation. Buddy's headset and Miku wig also get a better fit.",
    entries: [
      ["new", "Attached GIFs and direct GIF links in comment text open an in-page viewer with a large preview, Download, and Favorite controls."],
      ["new", "Favorites save to your signed-in Discord account. The GIF picker has Search and Favorites views, so saved reactions can be attached to comments or replies without searching again."],
      ["new", "Download saves the original supported image through the site's download endpoint. Failed downloads and unavailable previews show a readable status inside the viewer."],
      ["buff", "The viewer supports Escape, keyboard focus containment, and returning focus to the GIF that opened it. Favorites can also be removed directly from the picker."],
      ["buff", "Buddy's headset now has visible padded cyan ear cups, pink indicators, and a boom microphone. Its band sits above the Miku wig when both are equipped."],
      ["buff", "The Miku wig has swept bangs, a broader crown, shaded twin-tails, and pink clips. The locker icons match the fitted accessories."]
    ]
  },
  // 2a898dc
  {
    version: "v2.47.0",
    codename: "HELLO, PLAYER",
    date: "2026-09-30",
    summary: "Mentions belong in the sentence now. The same update gives the admin badge a tiny crowned cat and redraws Buddy's full Miku costume with clearer details and expressions.",
    entries: [
      ["new", "Selecting a mention inserts @username at the typing cursor, so a message can read hi @Vasquez instead of leaving the name in a separate row below the text."],
      ["buff", "Posted comments and replies highlight mentions inline while keeping Markdown, links, and code readable. Older detached mentions are appended inline, including when restoring an old draft."],
      ["fix", "Deleting a mention from the text removes its recipient selection too. Repeated mentions of one player work within the existing five-person limit, and inserting a name respects the message length limit."],
      ["buff", "Admin labels on messages, replies, and the signed-in account use a shared pink badge with a crowned pixel cat and a gold sparkle."],
      ["buff", "The Miku costume gets outlined twin-tails, swept bangs, teal eyes, a fitted headset, and more defined blouse, tie, skirt, gloves, and boots. Idle, happy, sleeping, surprised, and focused expressions remain distinct."],
      ["buff", "The costume's locker icon follows the new artwork, and its glow is softer so the small pixel details stay readable."]
    ]
  },
  // a68535a, 2c876dd
  {
    version: "v2.46.0",
    codename: "NIGHT WATCH",
    date: "2026-09-30",
    summary: "Buddy's power repair and bird visits read as little scenes now: a flashlight that follows its beam, a breaker that comes back to life, and a bird that actually lands before settling in.",
    entries: [
      ["buff", "The outage kit has a shaded flashlight and breaker cabinet, with a soft pool of light on the ground during the search and repair."],
      ["fix", "The flashlight and its light cone share a pivot, keeping the beam attached while Buddy scans the clearing."],
      ["buff", "Repair phases coordinate the torch, breaker indicators, and restoration animation. Buddy smiles when the power returns, then puts the light away."],
      ["buff", "The signal bird has layered feathers, a pale chest, a separate tail, folded wings, and more expressive head and feet movement."],
      ["fix", "Bird visits separate approach, landing, perching, and departure. Buddy pauses for the landing, and the perch position accounts for the Miku costume."]
    ]
  },
  // a00f18d, 5722f8b, 4f5dffe
  {
    version: "v2.45.0",
    codename: "RAIN IN THE CLEARING",
    date: "2026-09-30",
    summary: "The footer becomes a small woodland, with richer patrol finds, unfolding rain gear, and more readable bug encounters. The fishing follow-ups are collected here too, including the line staying attached throughout a cast and catch.",
    entries: [
      ["buff", "The clearing gains layered pixel trees, moss, rocks, mushrooms, a lantern, low mist, and fireflies. Rain darkens the scene and hides the fireflies; scenery animation pauses outside the viewport."],
      ["buff", "Buddy raises a folded umbrella, opens its canopy, and shelters under dripping edges before folding it away as the rain clears. The handle stays behind the face."],
      ["buff", "Bug hunts coordinate three blaster shots with recoil, muzzle flashes, moving bolts, and evasive bug movement. Swatter and net swings meet the hit phase, followed by a pixel breakup and completion label."],
      ["buff", "Patrol finds use shaded artwork shared with the journal, while the phosphor moth gets articulated wings, a glowing abdomen, and a continuous arrival and departure flight."],
      ["buff", "Fishing adds a two-part bite, reel pumping, a catch arc, water drips, and a wriggle for fish. Junk and treasure keep their own still silhouettes."],
      ["fix", "The rod, foreground Miku rod, line, and float now share their motion across fishing phases. The line follows the rod tip while the water stays still, and lifting the catch no longer stretches the lure."],
      ["buff", "Rocket-boot nozzles get layered exhaust with a brighter core and a pulse anchored to each sole. Airborne flames extend without drifting away from the boots."],
      ["buff", "Reduced-motion settings suppress the new scenery, encounter, and fishing effects."]
    ]
  },
  // 9b56064, 6b2b160
  {
    version: "v2.44.0",
    codename: "SOLID LITTLE STEPS",
    date: "2026-09-30",
    summary: "Buddy gets a more solid CRT body and a walk with planted feet. Beneath the fishing line, the school is made from miniature journal species, and the things pulled out of the water have more character.",
    entries: [
      ["buff", "The normal CRT shell has filled, shaded casing and solid shoes, making the body easier to distinguish from its equipped gear."],
      ["buff", "Walking moves the upper body separately from alternating foot lifts, with a toe roll and scarf follow-through. Rocket boots fit each leg at its native pixel scale, and their exhaust follows the moving feet."],
      ["buff", "The underwater school uses miniature journal fish with separate depths, turns, tail beats, and an approach to the hook. A dark pixel pool keeps them legible above the footer ticker."],
      ["buff", "Junk and treasure get individual details: boot laces, disk labels, damaged controller buttons, rusty metal, cable plugs, keyboard keys, and chest hardware."],
      ["fix", "The body changes preserve the separate movement used by rocket boots and the Miku costume, and reduced motion stops the new scarf animation."]
    ]
  },
  // 0e02f07, 46dba5c
  {
    version: "v2.43.0",
    codename: "BUDDY'S WORKSHOP",
    date: "2026-09-30",
    summary: "The companion panel becomes a workshop with activities, a clearer locker, quest rewards, and a more useful journal. Buddy's equipment, wildlife, and rare leviathan sighting get a coordinated art and motion pass.",
    entries: [
      ["new", "An Activities view lets you request fishing, patrol, rain, or a dance. Accepted requests close the panel and take you to Buddy; active events and cooldowns explain when an activity must wait."],
      ["new", "The locker can show owned, equipped, locked, or all equipment. Locked items show their actual unlock requirement and progress, and pose buttons preview Idle, Happy, or Nap."],
      ["buff", "Quest cards show the gear they award. The journal adds rarity filters and alphabetical or catch-count sorting, while undiscovered entries keep their identity hidden."],
      ["buff", "Locker icons and worn gear share their artwork, with fitted visor, scarf, and headset geometry. Rods, lures, boots, hats, and carried items have more consistent silhouettes."],
      ["buff", "Fishing, walking, petting, dancing, carrying, sleeping, and combat get coordinated movement. Frogs blink and hop within the footer, and jumping fish use the journal's species artwork."],
      ["buff", "The leviathan has a longer approach, surface visit, and retreat, plus an alert that can jump to the footer or dismiss the dimming. Its existing rarity and once-per-sighting reward remain in place."],
      ["fix", "Fishing owns the encounter timers, so cancelling a session cannot leave the screen dimmed. Activity controls also honor reduced motion and existing reward rules."],
      ["buff", "The Discord sidebar card separates status, activity, connection state, and device indicators, with a fallback for failed avatars. More compact spacing keeps navigation usable on short desktop windows."]
    ]
  },
  // 76ffc07
  {
    version: "v2.42.0",
    codename: "STREAK KEEPER",
    date: "2026-09-30",
    summary: "Daily challenges have more to work toward: completion milestones, streak rewards, and a collection that shows the next unlock. The targets also move up to match the scores people are actually posting.",
    entries: [
      ["new", "Completion badges unlock at 1, 7, 25, 50, 100, 250, and 365 daily wins, with separate streak badges for 3, 7, 14, 30, 60, and 100 consecutive UTC days."],
      ["new", "The passport shows current and best streaks, a badge collection, locked milestones, and progress toward each reward. Up to three earned badges can be featured."],
      ["buff", "Daily targets are now 20 blocks in Tower Block, 75 points in Cross Road, and 500,000 points in Space Cadet. Previously completed challenges stay credited."],
      ["fix", "Streaks use UTC calendar days and remain active through the day after the latest completion. Earned streak badges remain yours after a break, and saved completion dates backfill the history that is available."],
      ["buff", "Mention suggestions and the Mentions of you filter get clearer icons, keyboard hints, counts, and selected states."]
    ]
  },
  // 9be4bdf, 1b86df6
  {
    version: "v2.41.0",
    codename: "PLAYER FILES",
    date: "2026-09-26",
    summary: "The new community tools settle into the cabinet: notifications live behind a bell, the passport puts your records and daily goal first, and project stories look like files you can browse.",
    entries: [
      ["new", "A notification bell beside your guestbook account shows the unread count and opens the inbox in a compact panel. Escape closes it and returns focus to the bell."],
      ["buff", "The passport separates identity, personal bests, and today's challenge. Progress, reward, reset time, and the Play challenge button sit together, while customization and conversations use expandable sections."],
      ["buff", "Mention suggestions show player initials, a result count, and keyboard instructions. Moving through the list keeps the active suggestion in view."],
      ["buff", "Project stories gain a file title bar, numbered sections, labelled visual previews, workflow steps, and clearer source, documentation, and copy-link controls."],
      ["fix", "The passport dialog follows CRT and Glitch themes, including its overlay, frame, and player card. The follow-up styling is included here rather than becoming a separate release."]
    ]
  },
  // b8a718e
  {
    version: "v2.40.0",
    codename: "YOUR SAVE SLOT",
    date: "2026-09-26",
    summary: "The cabinet gains a player passport and daily challenges, while the guestbook becomes easier to return to with mentions, notifications, saved drafts, and direct links. Project stories and mobile navigation join the same update.",
    entries: [
      ["new", "The Player button opens your Discord-linked passport with Buddy progress, personal bests, favorite game, earned title, accent, and featured badges."],
      ["new", "A shared daily challenge rotates between Tower Block, Cross Road, and Space Cadet. An accepted run meeting that day's goal awards a completion and cosmetic passport rewards, with a reset at 00:00 UTC."],
      ["new", "Guestbook mentions invite selected players into a thread. An on-site inbox reports mentions and replies, with read markers saved per account and synced to connected guestbook tabs."],
      ["new", "Direct links open the right comment page or expanded reply thread. Missing or deleted messages show an unavailable state."],
      ["new", "Comment and reply drafts, including GIFs and mention selections, are kept on the current device per account for up to 30 days. Sending or cancelling clears the relevant draft."],
      ["new", "TradeDex and Palwatch gain project stories explaining their problem, implementation, workflow, and result, with shareable project links."],
      ["buff", "Mobile navigation collapses behind Menu while keeping Buddy directly accessible. Desktop retains its expanded directory."],
      ["fix", "Community saves use atomic writes and recovery backups. Posting limits survive deletions and restarts, and duplicate submissions, oversized requests, and cross-origin mutations are checked."],
      ["fix", "Only fingerprinted build outputs listed in the build manifest receive immutable caching. Other assets revalidate, avoiding stale files that keep the same name."]
    ]
  },
  // 81658aa
  {
    version: "v2.39.0",
    codename: "VAULT CLOSED",
    date: "2026-09-24",
    summary: "The Fallout field station is retired from this site. Its earlier releases remain in the archive as history; the vault, guides, map, and reports described there are no longer available in the cabinet.",
    entries: [
      ["nerf", "Removed the Fallout entry control from the top bar and the dedicated field station, guide, and activity routes."],
      ["nerf", "Removed the Fallout report and item-reference endpoints, along with their source adapters and page-generation scripts."],
      ["nerf", "Removed the bundled map tiles, mask photographs, game artwork, Fallout styles, and Leaflet dependency used by the retired section."],
      ["buff", "The application entry returns to a single cabinet page, and the greeting no longer offers the Fallout-specific return sequence."]
    ]
  },
  // 1b9f34d
  {
    version: "v2.38.0",
    codename: "DAILY DISPATCH",
    date: "2026-09-22",
    summary: "The historical Fallout station expands with separate activity reports and an item reference viewer. These features were later retired with the station in v2.39.0.",
    entries: [
      ["new", "Daily Ops, daily challenges, and weekly challenges receive their own report pages, with navigation between reports and back to the operations desk."],
      ["buff", "The main desk uses compact activity links, keeping the full assignments on their own pages. Direct visits and reloads receive the corresponding page metadata."],
      ["fix", "Published report dates and estimated challenge resets are distinguished. Expired reports remain visibly stale instead of being presented as current assignments."],
      ["new", "Minerva's plan and recipe items open a reference modal with a short attributed wiki extract, an image when available, and a link to the full source."],
      ["buff", "Missing item images and failed lookups have explicit fallback states. The reference viewer supports Escape, backdrop dismissal, and returning focus to the selected item."]
    ]
  },
  // e4145d0
  {
    version: "v2.37.0",
    codename: "FOLLOW THE MASKS",
    date: "2026-09-20",
    summary: "The historical Slasher guide gets a dedicated introduction and a chapter-based layout. Its route, map, rewards, and field questions become easier to browse; the section was later retired in v2.39.0.",
    entries: [
      ["new", "The Slasher guide opens with its own introduction before handing focus to the guide, including when returning through the browser's page cache."],
      ["new", "A chapter rail links Overview, Before you go, Find the masks, The rewards, and Field questions, with an active section indicator and a back-to-top control."],
      ["buff", "The guide reorganizes its field notes, survey, and rewards into a clearer reading layout. Each reward stage shows its own required pickups and cumulative total."],
      ["buff", "The field station remembers its introductory splash, and the cabinet preloads its entrance artwork to make returning visits smoother."],
      ["fix", "Chapter tracking follows the Fallout page's own scroll container, and finishing the introduction respects a linked section in the URL."]
    ]
  },
  // c38c5b3
  {
    version: "v2.36.0",
    codename: "FIELD ATLAS",
    date: "2026-09-19",
    summary: "The historical Fallout station gains a guide directory and a Slasher mask atlas with an interactive game map and location photographs. This guide was later retired with the station in v2.39.0.",
    entries: [
      ["new", "A dedicated Slasher field guide brings together preparation notes, 108 mask positions grouped into search areas, reward stages, and common pickup questions."],
      ["new", "An interactive Appalachia map supports dragging, zooming, area selection, individual mask pins, and returning to the overview."],
      ["new", "The map includes a separately toggled world-location layer with 458 landmarks and their game icons, beneath the mask markers."],
      ["new", "Mask pins include matched location photographs. Opening a photograph shows a larger modal view with keyboard dismissal and focus restoration."],
      ["buff", "The map loads tiled artwork on demand and limits attached landmark markers to the visible area. Touch, keyboard navigation, and viewport resizing are supported."]
    ]
  },
  // 64ccf3a
  {
    version: "v2.35.0",
    codename: "OPERATIONS DESK",
    date: "2026-09-15",
    summary: "The historical field station becomes an operations desk with a channel selector and clearer diagnostics. The cabinet's avatar greeting also gets a smoother warmup. The Fallout interface was later retired in v2.39.0.",
    entries: [
      ["buff", "The station gains a side directory, tuning dial, daily dispatch masthead, and report summaries that make its different channels easier to scan."],
      ["buff", "Connection status distinguishes complete, partial, and unavailable reports. Refresh, CRT controls, and the latest successful transmission are easier to find."],
      ["new", "A station diagnostics panel collects transmission notes, source references, and the meaning of report freshness."],
      ["buff", "Entering from the cabinet animates the small vault control into the full entrance, with preloading and revised door geometry for a more continuous transition."],
      ["fix", "The avatar greeting warms textures, shaders, and mesh resources before revealing the model, yielding between uploads so the entry screen can keep painting."]
    ]
  },
  // 1e9c00e
  {
    version: "v2.34.0",
    codename: "OPEN THE VAULT",
    date: "2026-09-14",
    summary: "The historical Fallout entrance changes from a terminal boot panel into a mechanical Vault 76 door. The station and its entrance were later retired in v2.39.0.",
    entries: [
      ["new", "A miniature vault door replaces the Fallout logo in the cabinet's entry control, matching the full entrance that opens after a click."],
      ["new", "The entrance sequences lock release, seal opening, door roll, and camera entry, surrounded by warning lamps, pipework, rail hardware, and steam."],
      ["buff", "An analog readiness gauge and individual check indicators report interface, report, artwork, and display readiness before opening."],
      ["fix", "Door travel and the final camera zoom adapt to the viewport, so the opening clears the screen at different sizes. Escape can skip the introduction, and reduced motion shortens the sequence."]
    ]
  },
  // c729cfa, f35025a, bc9e514
  {
    version: "v2.33.0",
    codename: "APPALACHIA ONLINE",
    date: "2026-09-13",
    summary: "A separate Fallout 76 field station joins the cabinet, with dated reports and its own terminal presentation. This is a historical release: the station was later retired in v2.39.0. The small Discord badge update ships alongside it.",
    entries: [
      ["new", "The /fallout page opens from the top bar as a separate interface, with a worn field-station shell, CRT presentation, and a return to the main cabinet."],
      ["new", "The station brings together nuclear launch codes, Minerva's schedule and matching inventory, the monthly axolotl rotation, and event information."],
      ["fix", "Reports retain their source dates and distinguish current, stale, and unavailable data. Expired launch codes cannot be copied, and a failed source does not discard healthy report sections."],
      ["buff", "The boot screen tracks actual interface, report, image, and font readiness, with bounded waits and readable offline states."],
      ["buff", "Game imagery and a small Fallout icon set give merchant, research, and nuclear reports their own visual identity."],
      ["buff", "The Discord profile's Nitro badge changes to Opal, with a compact badge image and a separately sized detail card in its tooltip."]
    ]
  },
  // 157f6ca, eb3235c; terminal styling follow-up e0f6a9b
  {
    version: "v2.32.0",
    codename: "CABINET DIRECTORY",
    date: "2026-09-07",
    summary: "The cabinet tells you where you are and makes its controls easier to find. The top bar follows the current section, the project directory introduces its contents, and the terminal and secret library use clearer actions.",
    entries: [
      ["new", "The top bar displays the active section, its directory number, a section track, and a visible Terminal button beside XP, FPS, and local time."],
      ["buff", "The sidebar gains clearer directory and display-mode labels, a more compact player card, and revised spacing. Section tracking considers the actual navigation destinations."],
      ["buff", "The project folder previews the projects inside before opening, uses an explicit open/close label, and counts the actual projects. Toolbelt cards gain concise capability tags."],
      ["fix", "Patch-note details scroll independently while the full-log action stays accessible. Changing releases resets the correct scrolling region."],
      ["buff", "The terminal has clearer quick-command labels, a last-command readout, a clear-output control, a drag hint, and refined frame styling. Running a command returns focus to the input."],
      ["buff", "Secret-library cartridges say Play game and have explicit accessible play labels, making the way into each game easier to recognize."]
    ]
  },
  // 3c68c64
  {
    version: "v2.31.0",
    codename: "LEAVE A SIGNAL",
    date: "2026-09-06",
    summary: "The guestbook becomes a clearer invitation to join in, and the release archive becomes easier to read at your own pace.",
    entries: [
      ["buff", "The guestbook introduces itself as a place for build ideas, game recommendations, and a hello, with a clearer message-board heading and account area."],
      ["fix", "Signed-out visitors see a readable Discord invitation instead of a disabled composer. When sign-in is unavailable, the board explains that messages are still open for reading."],
      ["fix", "The guestbook's connection label reflects the event stream's state, and action feedback uses an accessible status region."],
      ["new", "The release archive gains a Latest release shortcut, change counts by type, a visual release manifest, and a persistent pause/resume control for automatic cycling."],
      ["buff", "Opening a full log moves focus into the reading view; returning restores it to the read-more button. Highlights and complete logs show how many entries are visible."]
    ]
  },
  {
    version: "v2.30.0",
    codename: "COLD CATHODE",
    date: "2026-09-06",
    summary: "A long pass over the parts of the cabinet you actually spend time in. The hero introduces itself instead of opening on a slogan, the shelf lets you read a review without hunting for the way in, the buddy inventory and the catch journal are rebuilt around a single screen you browse rather than a wall you scroll, and the backdrop behind all of it stopped being graph paper. The inventory and the command console are lit like the rest of the cabinet now — and a bug underneath every dialog on the site meant none of them had ever turned pink with the theme anyway.",
    entries: [
      ["new", "The hero says hello. It used to open on the headline alone; there is a line above it now that introduces me by name, the headline breaks on its own sentences instead of wrapping wherever the box ran out, and the paragraph under it says what I actually build. The console beside it is labelled — 01 / THE WORKSTATION, interactive, draggable — because it is a thing you can pick up and nothing was telling you that."],
      ["new", "A way down out of the hero. An Explore my builds link sits under the buttons, so the first screen ends by pointing somewhere instead of stopping."],
      ["new", "The game shelf has a button that says Read my review. Flipping a cartridge used to mean guessing that the cover was clickable. The card front is now a labelled control that says what it does and what state it is in, Escape closes the review, and focus goes to the review text on the way in and back to the button on the way out rather than being dropped at the top of the page."],
      ["new", "The shelf reads as an archive: a title bar over the grid, the count of cartridges and hours logged, and per-card playtime rewritten as a headline number with the share of the shelf it represents underneath."],
      ["new", "The buddy inventory is one screen instead of a scroll. Buddy and the current loadout hold the left column, the locker fills the right, and each column scrolls on its own — the sprite used to slide out of view exactly while you were editing what it was wearing."],
      ["new", "Pointing at a piece of gear shows you where it goes. The matching slot lights up on the left and scrolls itself into view; start dragging and every slot that will not take the item drops back so only the valid targets are left. The preview card is isolated from that highlight, so the sprite is not repainted every time the pointer crosses a different item."],
      ["new", "The catch journal is a catalogue now. One big specimen file on the left for whatever is selected, a browsable grid on the right, a switch between the fish and the patrol finds, a search box and found/missing filters. Every unscanned species used to spend a full card repeating the same sentence, which buried the actual discoveries about twenty rows down."],
      ["new", "Panels that scroll say so. A row cut in half at the edge of a box reads as broken rather than as more-below, so any panel still hiding content fades on that edge — and only that edge. It watches the children too, not just the box: filtering the locker changes the height of the content without touching the container."],
      ["new", "The links panel connects before you click. Each route carries its number as a watermark, and a prompt line under the grid types out open <host> for whichever route is under the pointer or focus ring."],
      ["new", "The Discord panel knows the difference between quiet and broken. The idle state used to say the same thing whether Discord was silent, still connecting, or unreachable; each of those now has its own heading, its own copy and its own readout, and the scanners report no signal or syncing instead of claiming to be listening while the socket is down. There is a link straight to the profile at the end of the sidebar."],
      ["new", "Equipped gear lights the cell it sits in, in its own colour. Every piece already carried a rarity colour — cyan for the sunglasses, gold for the pixel crown, pink for the rocket boots — but only on the label, while the box around it was the same flat outline for all fifteen. The lit rim inside an equipped cell is drawn in currentColor, so it takes the colour of the thing in it instead of washing the whole locker green. Hovering an unequipped one turns it cyan and lifts it a pixel."],
      ["new", "The inventory frame is a tube rather than an outline. A border cannot follow the cut corners the rest of the site uses, so the frame is six strips of gradient — four edges and the two diagonals — with a drop-shadow pass over the lot to light the whole outline, chamfers included. Everything inside it that is clipped to a cut corner glows inward instead: clipping happens after the shadow is drawn, so an outer halo on those would be sliced off at the corner and never seen."],
      ["new", "The command console matches the inventory: cut corners, the same six-strip frame, lit rims on the command index, and a gutter rail down the line you typed. The corners belong to the three bands inside the window rather than to the window itself — the title bar carries the top-left cut, the input row the bottom-right — because clipping the window would have taken its outer glow with it."],
      ["new", "The backdrop is deep space. Colour clouds drift across each other, a starfield sits behind them in three depths, and faint lines are strung between pairs of stars. The clouds begin as plain round blobs; what makes them read as cloud is a mask of fractal noise eating them at the edges. They are the backdrop's two pseudo-elements rather than an element and its child, because a mask on a parent clips its child too — done the other way you would only ever see the part where the two noise fields happened to agree."],
      ["new", "The starfield gets its parallax from one layer, not three. Three tile sizes travel one, two and three tiles per cycle, so the near stars move three times faster than the far ones and all of them still land back on themselves at the same moment — no seam to hide, and one surface to paint instead of three oversized ones sliding over each other."],
      ["nerf", "The 28-pixel grid behind the page is gone. It was never part of the backdrop: it lived on the scrolling container itself, which is why the first pass at a nebula came out looking like graph paper laid over a sunset. What it was quietly doing — a grid anchored to the content while the backdrop stayed still, so scrolling had something to move against — is the job the star parallax does now."],
      ["nerf", "The playtime bar on a cartridge is its share of the whole shelf rather than its share of the biggest game on it, and it says which. It also lost its eight percent floor, which had been drawing a visible bar for games with almost no hours on them."],
      ["fix", "No dialog on the site had ever changed colour with the theme. Each one renders into the page body, outside the element carrying the glitch class, so the phosphor green it asked for resolved to the default and the panel stayed green while the site behind it went pink. The inventory and the console are fixed. The console had also been carrying two glitch rules that never once fired in their lives, written for a parent that was never going to be above them."],
      ["fix", "The rail that lights up beside a matching slot in the loadout was sitting on the first letter of the label. The rows carry an eight-pixel gutter for it now, and the column next to them lost the same eight, so the rail moved out of the text without anything else shifting."],
      ["fix", "Flipping a cartridge fired its quest progress from inside React's state updater, along with the timer that runs the closing animation. React is free to call that function more than once for a single update, so the cartridge quest could count one flip twice and a stray timer could be left running. Both belong to the click, and that is where they happen now."],
      ["fix", "The hero canvas could throw mid-animation. Its rings are drawn at a radius that contracts as they pulse, and a responsive breakpoint can collapse the canvas to nothing for a frame — if that landed while a ring was contracting the radius went negative, which is not a number an arc will accept."],
      ["buff", "The backdrop stops completely for anyone who has asked for reduced motion. It is decoration end to end and it reads the same standing still."]
    ]
  },
  {
    version: "v2.29.1",
    codename: "WARM DISKS",
    date: "2026-09-05",
    summary: "Two small things about the secret library: the cartridge art used to arrive a beat after the library did, and Space Cadet opened loud.",
    entries: [
      ["fix", "The five cartridge covers are the only images on the site that appear nowhere except inside that dialog, so nothing had ever asked for them and they were requested at the exact moment it opened — which is why the first look at the shelf was five empty labels. They are fetched now once you are four keys into the code, which is far enough in to be sure and still leaves six keystrokes to pull them down. Type anything else and nothing is downloaded: it is an easter egg, and it should not cost the rest of the site any bandwidth."],
      ["fix", "The unlock toast had been claiming 2 disks found since back when there were two. It counts them."],
      ["nerf", "Space Cadet starts at volume 10 instead of 70. It is a loud cartridge that opens without warning, and the slider is right there for anyone who wants it back. Whatever you set is still remembered."]
    ]
  },
  {
    version: "v2.29.0",
    codename: "LAST BALL",
    date: "2026-09-05",
    summary: "The last thing Space Cadet showed you was a grey Windows dialog with an Ok button. It now ends the way the rest of the cabinet looks: the final score, whether it beat your own, and a way straight back onto the table.",
    entries: [
      ["new", "A game-over panel in the cabinet’s own skin — final score, time on the table, your Discord rank and whether the run is a new personal best, over the table it just closed. New Game puts you straight back in, Ranking opens the leaderboard, Exit closes the cabinet."],
      ["new", "The Windows High Scores dialog no longer appears. It could not simply be switched off: it is an ImGui popup drawn inside the canvas, and once open its state lives in ImGui’s own stack rather than in any flag the game keeps — nothing to reach for after the fact. What does work is upstream of it. The game only raises the dialog when your score finds a free slot in its five-entry table, so the table is filled at boot with scores nothing can beat and the slot is never found. The real record is the Discord ranking either way."],
      ["fix", "The score announced at the end was the one from the previous poll, roughly half a second stale, and it also missed the end-of-game bonus, which the table adds after the game is already over. The panel waits for the table to finish counting before it reads the number, so what it announces is what gets sent to the ranking."]
    ]
  },
  {
    version: "v2.28.0",
    codename: "TILT SENSOR",
    date: "2026-09-05",
    summary: "Space Cadet lost its Windows menu bar, gained a volume slider, and now knows who is playing it. The Discord name sits in the box the table used to fill with “Player 1”, and the score the table is keeping goes to a leaderboard next to Cross Road’s. None of that was in the build — the port exports nothing but main, malloc and free — so all three read and write the game’s own memory from JavaScript.",
    entries: [
      ["new", "The Game/Options/Help bar is gone. The build predates the port’s ShowMenu option, and that bar is drawn by ImGui inside the canvas, so there is no flag to turn it off: the canvas is pushed up by its exact height inside a box that clips, which hides it and hands the nineteen pixels back to the table. The clipped strip stops taking clicks too, so there is no invisible menu left to open by accident."],
      ["new", "A volume slider in the cabinet’s bottom bar. This build also predates the port’s Sound Volume option, so the slider does not talk to the game at all — every AudioContext SDL opens is handed a gain node wearing its speakers’ name, and the slider moves that. It remembers where you left it."],
      ["new", "Your Discord name replaces “Player 1” on the table. The text box caches the pixels it drew and only repaints when the game itself calls Display, so swapping the message text does nothing visible; what works is rewriting the game’s translation table — the Msg-to-string map — and asking for a new game so the box paints again. It only does that when no ball is in play, so it cannot eat a run in progress."],
      ["new", "A Discord leaderboard, ranked on the best table score. Finding the score meant walking the wasm heap: pb::MainTable is a static pointer at a fixed address, the table’s live score sits eighty-four bytes into it, and the player count and current-player fields next to it are checked on every read so a bad pointer reports nothing instead of nonsense. Confirmed identical across reloads before it was trusted."],
      ["nerf", "Scores are sent when a scoring burst settles rather than on every bumper, and never more than once every eight seconds. The endpoint takes eight a minute, and a ball loose in the bumpers changes the score about twice a second."],
      ["fix", "The cartridge chip in the top-right corner of the frame is gone. With the menu bar cropped away, the table grew into that corner and the chip landed on top of the ball counter — and the cabinet header says SPACE.CADET two centimetres above it anyway."]
    ]
  },
  {
    version: "v2.27.0",
    codename: "FULL TILT",
    date: "2026-09-05",
    summary: "The Konami library has a fifth disk in it, and this one is a whole pinball table. 3D Pinball for Windows — Space Cadet, the one that shipped with every copy of Windows from 95 to XP, decompiled from the original binary by k4zmu2a and cross-compiled to WebAssembly by alula. It runs the real physics and the real table, in the cabinet, at whatever resolution the cabinet happens to be.",
    entries: [
      ["new", "DISK 05 // SPACE.CADET. Z and / work the flippers, space pulls the plunger, X and . nudge the table and F2 starts a fresh game. The in-game menu bar is real — Game, Options, Help, all of it, including the player count and the table resolution."],
      ["new", "The table renders at the size of the cabinet screen rather than at a fixed resolution scaled up to fit. The port syncs its SDL window to the canvas's CSS size on every resize, so the canvas is stretched with a stylesheet rule and the game adopts that as its native resolution — no blur from upscaling a 600-pixel-wide table, and no offset on the menu clicks, which is what object-fit would have cost: the letterboxed bars sit inside the element's box but the pointer maths divides by the whole box."],
      ["new", "A violet accent joined the four the library already had, so the new disk is not a second cyan card sitting next to Madrace."],
      ["fix", "The production server had no MIME type for .wasm, which meant the 4.5 MB module came back as application/octet-stream and the streaming compiler refused it — the loader falls back to buffering the whole thing before it starts compiling, so the table booted a beat later than it needed to. It also had no cache policy for it: the module and its 2.3 MB of table data keep their names between builds, so they now revalidate by ETag like the avatar's VRM instead of being re-downloaded in full on every visit."]
    ]
  },
  {
    version: "v2.26.0",
    codename: "TARGET LOCK",
    date: "2026-09-03",
    summary: "The cursor stopped being an arrow with a tail behind it. It frames whatever it is pointing at, it keeps that frame on the thing rather than on the spot the thing used to be, and in the two places it used to leave you with no cursor at all it now hands the pointer back to the system. Also, ten of the reaction emoji got the pieces of themselves that last night's compression pass had been erasing.",
    entries: [
      ["new", "Pointing at anything you can actually use draws a reticle around it — four corner brackets that bloom out of the cursor tip, land on the element's box with six pixels of clearance, and fly to the next target instead of blinking there. Buttons, links, text fields, disabled controls and anything draggable all get it, each in the colour that mode already used."],
      ["new", "The reticle tracks what it locked onto. Scroll the page, let a panel resize, move the target under a cursor that never moved, and the brackets stay on the element instead of hanging in the air where it was."],
      ["nerf", "Nothing wider than 560 pixels or taller than 320 gets brackets. Framing an entire section is not aiming at anything."],
      ["fix", "The readout went stale the moment you stopped moving. Modes were only recalculated on pointermove, so scrolling a link out from under a still cursor left SELECT glowing over empty background. Scrolling and resizing now re-read whatever is genuinely under the pointer."],
      ["fix", "The trail was seeded on a 24-millisecond timer, so a fast flick — the whole gesture landing inside one of those windows — left a single dot behind it. It is seeded by distance now, one mote every seven pixels of the path actually travelled, from the sub-frame samples the mouse reports rather than the one sample the browser hands the page. A 320-pixel sweep leaves about 45 motes where it used to leave one."],
      ["fix", "Cursor smoothing was measured per frame instead of per millisecond, so the tag chasing the arrow sat twice as far behind on a 60 Hz screen as on a 144 Hz one. It runs on a 21-millisecond half-life now and lands in the same place on both."],
      ["fix", "Over a cabinet's iframe the page stopped receiving pointer events while still hiding the system cursor, so the drawn arrow froze at the frame's edge and the real pointer reappeared inside it — two cursors, one of them stuck. The page gives the pointer back on the way in and takes it again on the way out."],
      ["fix", "Right-clicking left you with no cursor whatsoever. The system menu draws outside the page and cuts off its pointer events, so the arrow parked wherever it stood while the real pointer moved invisibly across a page that had been told to hide it. The menu gets the system cursor back now."],
      ["buff", "The trail takes the colour of whatever is under the cursor — cyan over links and fields, gold over anything draggable, red over what is locked out — instead of running phosphor green over all of it."],
      ["buff", "Mode detection stopped walking six selector chains on every pointer sample. It re-reads only when the element under the cursor changes, and the reticle only writes its box when the box has actually moved."],
      ["new", "The host is gone before the gate moves. She used to fade out where she stood while scaling up and drifting upward, which read as dissolving rather than leaving — and the doors started parting twenty milliseconds after that, so the two happened on top of each other. She simply goes now, in 240ms flat, and the frame is empty before anything else begins."],
      ["new", "The gate is hinged. It used to slide its two halves off the sides of the screen, which is a curtain — the giveaway was that every version of it, however dressed up, was still a horizontal translation. There is no translation left in it at all: each leaf pivots on its outer edge and swings a hundred and three degrees, past flat, and that rotation is the whole animation. Pernios are drawn on both pivots even with the gate shut, so it reads as something with hinges before it ever moves."],
      ["new", "Two details do most of the convincing. The leaves are 60ms out of step — a pair that opens in perfect sync is a curtain again — so the left one is at 86 degrees while the right is still at 66. And each face dims as it turns, from full brightness down to a quarter, because a surface rotating away from the light stops catching it; without that falloff the leaves read as paper cutouts sliding around. Both start with a two-degree push the wrong way, which is a latch shoving the leaf against its frame before letting go. The backdrop behind the gate pulls back as they open, so what widens in the gap is the cabinet and not another wall."],
      ["nerf", "The host talks at a readable pace on a reload. Coming back within the same tab took the accelerated script — 26ms a letter, about 38 characters a second, with three quarters of a second to sit before the next line — so the sentence finished and moved on before you were through it. It runs at 44ms a letter with a 1.3 second pause now, which lands around thirteen characters a second once the pause is counted, and it is still a good deal quicker than a first visit."],
      ["fix", "The entry gate froze mid-animation on every load. The whole cabinet — about two thousand nodes — mounts behind the splash, and on top of that the buddy's friendship and adventure hooks were seeding themselves from saved progress inside a mount effect rather than in their initial state. Storage is readable before the first render, so that was a second and third full pass over the tree, landing exactly while the gate was typing. Reading it up front turned the worst single block from 273ms to 97ms in a production build, and total blocking time from 638ms to 155ms."],
      ["buff", "The image warm-up no longer runs during the gate. It marked twenty-odd game and project images as high priority the instant the app mounted, so they outranked the thing actually on screen — and every one of them is already in the mounted markup and would have loaded anyway. It waits for the visitor to come in, then goes when the main thread is idle."],
      ["fix", "The frame counter and the clock hung off the root component. The counter resamples every 750ms, which meant a number in the corner of the header could invalidate the entire cabinet. Both live in the badge that draws them now."],
      ["fix", "The folder drew a V across its own front when you hovered it. The front was two panels the size of the whole face, skewed fifteen degrees in opposite directions — and everything painted inside them, the diagonal hatching and the hairline grid and the inner shading, skews with them. So the two surfaces are mirror images and they cannot meet cleanly anywhere. With the top panel covering the rest, that mismatch showed up as a wedge down the left side: the V. The front is drawn by a single panel now. It widens fifty pixels either side when it opens — exactly what the skew used to throw outside the folder — and a clipped base brings it back to the width of the body. Same silhouette, one surface, nothing left to line up."],
      ["fix", "The reticle stopped following things that move while the pointer is still. It re-measures on a loop that allowed itself twelve unchanged frames before shutting down — and a hover transition with a soft start does not move a whole pixel in its first two hundred milliseconds, so the loop had already quit by the time the thing it was gripping began to move. The frame then sat at the old position until you nudged the mouse. It now asks whether a transition is genuinely running on the target and, while one is, gives itself ninety frames instead of twelve. Endless decorative animations are excluded from that, or the loop would never stop at all."],
      ["fix", "The reticle drew an upright box around tilted things. getBoundingClientRect reports the straight box that contains a rotated element, so on the project files — which sit at eleven degrees in the fan — the brackets floated about twenty pixels off the corners they were supposed to be gripping. It reads the transform accumulated down the element's ancestors now, so the frame tilts onto whatever it locks, and keeps following while a file straightens up under the pointer."],
      ["buff", "Opening the project folder used to blank the front panel completely — the largest object on the stage with nothing written on it. It keeps a stencilled edge label now, the way a real folder's edge stays readable once it is open, and the blank tab on the back finally says what is filed in it."],
      ["buff", "Hovering a project file pulls it out of the folder instead of just making it bigger: it rises and swings toward upright, undoing the tilt that was holding it in the fan. Whichever file the lanyard is showing stays half-drawn and marked while it is open, instead of announcing itself with one line of eight-pixel text."],
      ["nerf", "The reserved SOON slot weighed as much as the two real projects and sat dead centre of the fan. It is smaller, dimmer and further back now, so the eye lands on the two files that actually open."],
      ["fix", "Ten of the reaction emoji were missing pieces of themselves while they animated. Shrinking them from 512 pixels to 96 rewrote every frame as a full replacement of its own rectangle instead of something painted over what was already on screen, so the transparent parts of each frame erased the drawing underneath rather than leaving it alone — and the cabinet's near-black background showed through the gap. The sparkling heart lost a quarter of itself for five frames out of every thirty; heart eyes, hug, skull, blank stare, surprised, thinking, monocle, angry and sparkles all had holes of their own. Re-encoded from the untouched originals at the same 96 pixels with the same per-frame timings, which costs 219 KB across all twenty-three and keeps three quarters of what the compression pass saved."]
    ]
  },
  {
    version: "v2.25.0",
    codename: "WALL SAFE",
    date: "2026-09-03",
    summary: "The workstation panel can be hung off a thumbtack in the wall, and what it was covering is no longer a poster that says DEV ROOM — it is a vault with a keypad. The two system pages stopped being the same page in two colours, and the splash gate stopped saying it was ready before the host was.",
    entries: [
      ["new", "There is a thumbtack in the wall above the hero. Drag the workstation panel onto it and it stays there, tilted, instead of springing back the moment you let go — which is the only way to actually look at what sits behind it. Drag it back off the tack to take it down."],
      ["new", "Landing on the tack is a whole beat now, not a stop: the tack punches in and flashes, a shockwave ring bursts out of it, and the panel swings past the pin and settles — 2.6 degrees, then -1.9, then 1.15, dying at rest. Everything the hung panel does is rotation about the pin and nothing else, so it swings like something hanging rather than bobbing like something floating."],
      ["fix", "The hung panel pivoted 77 pixels below the tack, which peeled its top edge off the pin on every swing. The pivot is the tack now — the exact point the hang is measured from — so the pinned corner stays put and the rest of the panel moves around it."],
      ["fix", "Clicking the hung panel dropped it 11.5 pixels, every time, compounding. The hook was measured with getBoundingClientRect, which on a rotated element returns the bounding box rather than the element — and the panel hangs at -2.4 degrees, so the measurement came out that far above the real top edge and re-hanging pushed the panel down to meet it. The measurement now neutralises the transform first."],
      ["fix", "The tack caught the panel from 104 pixels away while drawing a 44-pixel ring, so it grabbed from well outside anything it had promised. The catch radius is 54 pixels, the ring is that radius at full size, and the locked-on state stopped scaling the ring up past the zone that actually catches."],
      ["new", "DEV ROOM // 1997 is a vault. Six digits on a keypad or the number row, and each one you enter retracts one of the six bolts on the dial, so the door reports the same progress the code slots do. A wrong code shakes it red and clears itself; the right one pulls every bolt and unseals."],
      ["new", "Opening the vault opens the archive behind it — cartridge dumps, unreleased source, sprite sheets and a folder from 1997. The shelves are there and empty for now, which says more than a blank panel does, and the vault keeps a button to walk back in once it is open."],
      ["fix", "The vault was drawing its keypad straight through its own bottom border. Stacked in one column it needed 490 pixels of a 525-pixel box it shares with the telemetry strip, so the grid row squashed the frame to 373 while the keys kept rendering to 678. The dial and the keypad sit side by side now — there was width to spare, never height — and the vault came down to 303."],
      ["fix", "Nothing in that bay lands on the frame's corner brackets any more. The panel had no padding at all, so the vault sat on the top-left bracket and the trace log sat on the bottom-right one; the bay pads itself clear of them now, and the vault stopped drawing a second set of brackets on top of the first."],
      ["fix", "The command console stopped reading as four unrelated cards. Header, buffer, command deck and input each carried their own border, cut corner and edge glow — the code even said it was breaking the single-window silhouette on purpose, and that is what cost it. One frame, one cut corner, hairline dividers inside."],
      ["buff", "The console runs one accent system instead of five competing at the same weight. Phosphor leads, cyan is structure, and amber is reserved for live state — the prompt and the command line — rather than owning the whole right-hand deck."],
      ["fix", "The command matrix stopped wasting the top half of every chip. Six cards were 84 pixels tall with their contents pinned to the bottom edge and a lone index number floating above, so the deck ate 350 pixels of width to show six words; dense 46-pixel rows now, in 237, and the buffer took the 120 pixels back."],
      ["fix", "The terminal buffer fills its frame. It was locked to a fixed height inside a taller container, so a short session left a permanent hole under the last line — it flexes now, and still scrolls once the log outgrows it."],
      ["nerf", "The oversized 01 watermark is off the buffer. It sat behind the log at 13rem in the one region of the terminal that is meant to be read."],
      ["fix", "404 and 403 stopped being the same page twice. Both rendered one shared skeleton — marquee, monitor hood, giant number, control deck, cartridge rack — and differed only in colour and a swapped ornament, which is exactly what they looked like."],
      ["new", "404 is a navigation chart: wide and asymmetric, with the site's live sections plotted as reachable nodes on a sweeping radar and your dead route marked as a red blip outside the ring. The map is the navigation, so the exits are its nodes rather than a list below the fold, and the number is a tag instead of a slab — a 404's job is to move you somewhere."],
      ["new", "403 is a sealed door: narrow, centred and deliberately still, with a hazard-striped blast door and a handshake ladder that halts on the step that failed. Session token passes, access tier does not, and the last two steps stay grey because they never ran — which is what actually backs up the claim that nothing was exposed. No map and no rack; a locked door does not hand you a map."],
      ["fix", "The AVATAR LINK meter stopped lying about being finished. It reported download bytes, but three phases ran after it hit 100% — shader compilation, mounting the scene, and 1.82 seconds of greeting played behind a hidden canvas — so the bar filled and then nothing happened for seconds. It tracks the work to the host actually appearing now, and only the reveal writes 100."],
      ["fix", "OPEN THE GATE is no longer pressable while the host is still streaming in. The button ignored loading entirely; it waits for the signal bar to fill, and says so, while still opening on its own if the avatar never arrives."],
      ["new", "Come back from a dead route and the host mentions it instead of greeting you like you just walked up. She names the route that did not exist, or the tier that turned you away, and moves on — once, then the normal welcome returns."],
      ["buff", "The splash has something to look at while the host loads. The AVATAR LINK meter floated in the dead centre of a 764-pixel empty box with a speech bubble pointing at nobody beside it; the meter sits on a materialisation pad at the base of the light column now, and the bubble waits until there is someone to belong to."],
      ["fix", "That bubble needed its entry animation cancelled, not just its opacity dropped — it is declared with a fill that outranks a plain rule, so it would have faded itself back in after 420ms regardless. It now plays its arrival in full at the moment the host appears."]
    ]
  },
  {
    version: "v2.24.0",
    codename: "PANEL BEAT",
    date: "2026-09-02",
    summary: "The workstation's build log stopped resizing the panel around it, and three panels that were reading as flat rectangles — the NOW slots, the route selector, and the release archive — got their dead space put to work.",
    entries: [
      ["fix", "RUNTIME // BUILD OUTPUT holds a fixed four-line window. The log grew a line at a time during a boot and shoved everything below it down the page; it now scrolls inside a box that stays exactly the same height from idle to online, with the oldest line fading off the top."],
      ["buff", "NOW cards read as one unit instead of two: the slot number and its icon are joined by a lit trace down the rail, and the module code moved up beside the label instead of taking a line of its own between the header and the title."],
      ["buff", "The save-slot footer is a real eight-segment meter rather than four loose dashes, and the room profile's graph scales with its card — the bars were measured in fixed units while the panel stretched, which is what left a hole in the middle of it."],
      ["buff", "LINKS.SH looks like the route selector it claims to be: each card runs a patch cable from its edge into a bevelled port with connector pins, addresses are monospaced, and hovering lights the cable and nudges the launch arrow."],
      ["fix", "The release archive stopped being a mostly empty box. The card stack fills two thirds of its frame instead of two fifths, shelf slots and a backlight fill the space around it, and READ FULL LOG anchors to the bottom of the column rather than floating in the middle."],
      ["fix", "The sidebar no longer runs off the bottom of the screen. On a 900px-tall display its contents came to 932px with nothing to scroll, so the theme switch was simply unreachable — the nav is denser now and the rail scrolls if it ever needs to."],
      ["buff", "Every nav row carries its own icon and a proper selected state: an accent rail down the left edge, a gold slot number, and an arrow on the active row, instead of eight identical text boxes distinguished only by a slightly brighter border."],
      ["new", "The buddy dock shows friendship progress. Pets were already counted toward the next level and never displayed, so the panel repeated the level twice; there is a real bar and a pets-to-next-level readout now, plus a pets counter alongside gear and quests."],
      ["buff", "CRT and GLITCH became one segmented switch rather than two separate buttons that happened to sit next to each other."],
      ["buff", "The device readout on the Discord card matches the rest of it. It was the one block stacking three rows inside a box on a card where every other value gets its own row, with labels small enough to be unreadable — desktop, mobile and web are named tiles now, the online count sits in the header, and Alaska time moved to its own row in the same shape as the status line."],
      ["fix", "Hovering a device no longer pops the browser's own grey tooltip. Those icons were the last thing on the card still using a plain title attribute; they now use the same arcade tooltip as the server tag badge, with the client name and its connection state on separate lines."],
      ["fix", "The window path stopped hiding behind the profile frame. Whenever the panel drops to one column the profile card goes full width, which puts the frame's top ornament dead centre — exactly where the title bar prints ~/daivr/discord.presence, and the ornament crosses that whole band so there was nowhere to move it to. The path drops down to the label row underneath instead, and the generic DISCORD.PRESENCE tag it replaces there was saying the same thing anyway."],
      ["nerf", "The Alaska clock is off the presence card. It was the only thing on the panel that needed the clock ticking while nothing was playing, so taking it out also retires a thirty-second timer that was repainting the whole panel forever on an idle page — the seconds hand now runs only when Spotify or a timed game session is actually using it."],
      ["nerf", "Phones no longer carry the device tiles either. The card is tall enough on a narrow screen without them, and who is holding which client is a detail worth having at a desk, not on the way somewhere."],
      ["fix", "The buddy modals stopped reserving a window they were not filling. Inventory and the journal were pinned to 780 pixels tall no matter what was in them, so a half-empty loadout left a quarter of the panel blank under the loot grid — 249 empty pixels measured. They size to their contents now and only scroll once there is genuinely more."],
      ["fix", "The loot grid was falling out of its own panel on phones. Both the panel and its scroller carry a zero minimum height for the desktop layout, and once the modal switched to stacked rows on a narrow screen that let them collapse — 909 pixels of items rendering inside a 4-pixel box, spilling past the panel border."],
      ["buff", "Quests read at a glance. Each one has a progress bar in the dead strip between its description and its counter, completed ones fill solid, and a summary above the list says how many of the six are done instead of leaving you to count."],
      ["buff", "Empty equipment slots are drawn as hatched sockets rather than the word EMPTY in grey, and a filled slot is marked on its edge so the column can be read without going label by label."],
      ["buff", "The catch journal stopped printing the same sentence twenty-eight times. Every unscanned silhouette carried an identical line of instructions; it now sits once in the section header, the blank entries are quieter and shorter, and the two counters that track progress have bars."],
      ["fix", "The whole page stopped growing wider than the screen on tablets. Below the desktop breakpoint the layout's single column was implicit, which means auto, which means it sized itself to the sidebar's widest content — so the nav's horizontal rail dragged the entire page out past the viewport instead of scrolling inside itself. At 820px the layout measured 1130px against an 810px window; it measures 810 now and the rail scrolls the way it always meant to."],
      ["fix", "Game cards stopped saying the same number twice. Every card printed steam_app 524220 and then SN//0524220 directly underneath — the serial is the app id with a zero in front. The serial stays and the line it freed up now shows something no card knew before: whether those hours came from Steam or the local cache."],
      ["buff", "The shelf header lost a chip and gained a row. Four stats in a 2x2 block had two of them describing the same sync state from different angles; there are three across one line now, and the cover art sits tight against its label plate with the game's colour running along the seam instead of the two floating apart."],
      ["buff", "TOP CARTRIDGE says how many hours earned it the spot, and FAVORITE STACK lists its three ranks as separate chips rather than gluing them into one long slash-separated string."],
      ["buff", "The projects folder stopped reserving a room it was not using. Closed, it was a small folder marooned in a frame five times its width with 124 pixels of empty air overhead, held open for files that had not been dealt yet. The scene is short while it is sealed and grows when you open it, the folder is bigger, and it casts a contact shadow so it sits on the desk instead of hovering over the photo of one."],
      ["fix", "The fanned project files no longer poke out through the top of their own panel. The reserved SOON slot was drawn fourteen pixels above the console's border; every card now lands inside the frame, and the fan spreads more than twice as wide instead of bunching into the middle third of the stage."],
      ["buff", "The closed folder admits it can be clicked. The only invitation was a line of text in the far corner, so the file-count plate now breathes slowly on its own."],
      ["fix", "The command console stopped looking like a tool borrowed from another website. Every panel in the cabinet cuts its corners on a diagonal and not one of them is rounded — the console was the exception, carrying ten rounded corners and no cuts at all, which is why it read as foreign no matter how well the colours matched. Title bar, buffer, command matrix, chips, input and close button are all bevelled now."],
      ["buff", "The console picked up the rest of the cabinet's tells: the accent rail down the left edge that every card here has, scanlines across the title bar and buffer, and the pixel typeface on its small labels instead of the body font."],
      ["buff", "Toolbelt modules are built out of parts instead of being one flat sheet. The header is its own banded strip running edge to edge, each card carries its slot number as a large ghosted watermark behind the copy, and the icon plate turned its accent up rather than sitting there at a tenth of its own colour — so the four modules stop reading as one grey rectangle repeated four times."],
      ["buff", "Toolbelt cards also stopped saying READY at the top and CAPABILITY ONLINE at the bottom. The module code moved up beside its slot number the way the NOW cards do, so the title leads its own block, and the footer keeps one status line with the site's eight-segment meter."],
      ["fix", "Guestbook messages no longer all wear the same nameplate. Every card in the thread had INCOMING TRANSMISSION stamped on its top edge — identical on all of them, so it labelled nothing. The tab is still there, numbered, so it identifies its message instead of repeating itself."],
      ["fix", "The guestbook's counters stopped impersonating a button. Comments, pinned and the session mode were sharing their entire look with CONNECT DISCORD, so three read-only numbers were dressed as something you could press. They are data tiles now, number first, and the session chip carries a status light of its own."],
      ["buff", "The comment box reads as a terminal field rather than a black rectangle: faint grid, cut corner, and a focus glow that stays inside the frame."],
      ["fix", "The markdown cheat sheet stopped falling off the side of the screen on phones. It centres itself on the MARKDOWN button, and that button sits hard against the left edge of the composer, so half the panel hung off the display — the mobile rule that was supposed to handle this just repeated the desktop values and fixed nothing. It opens rightward from the button's edge now, narrow enough to stay on screen down to a 320px display, and it still scrolls with the page instead of hanging over the comments."],
      ["fix", "The Spotify card stopped printing the song title twice. Discord sends the album in the same field the card uses for its third line, and on a single that album is the track name — so a long title wrapped over two lines and then did it again underneath the artist, which is what stretched the activity column past the profile beside it and opened that gap against the frame. A matching album is dropped now, and the title is capped at two lines so it cannot stretch the card on its own either."],
      ["nerf", "Phones drop the countdown from the Spotify card. The progress bar and the two timestamps under it already say how much of the track is left, and on a narrow card that big -0:00 LEFT block was the single largest thing on it. The session timer on game cards stays, since those have no bar to read instead."],
      ["fix", "The version stepper stopped breaking apart on phones. Its layout reserved six rem for the two arrow buttons, but the arrows and the gaps between them come to six and a half, so the forward arrow was pushed onto a line of its own with a stretch of empty space beside it. Prev, the dropdown and next now share a row properly, with the cycling status underneath."],
      ["buff", "The cheat sheet also says what each thing does. It listed ten pieces of raw syntax and left you to infer the rest; every row now pairs the syntax with its name, under a header, in a bevelled panel like the rest of the cabinet."],
      ["fix", "The frame rate no longer collapses when the reaction picker is open. Every one of the twenty-three emoji was a 512x512 animated WebP — monocle alone ran 98 frames at 1.1 MB — and the picker mounts all of them at once to draw them 38 pixels wide. That is six million animated pixels being decoded and resampled every frame for a grid the size of a postage stamp. They are 96x96 now, every frame of every animation intact: the whole set went from 9.2 MB to 2.3 MB and the per-frame pixel work dropped by a factor of twenty-eight."],
      ["new", "Patch entries are cards instead of loose paragraphs. Each line in the changelog was a label followed by naked text on the panel background — five of them in a row with nothing telling them apart. Every entry now sits in its own box tinted with the colour of its type: gold for a hotfix, green for a new drop, cyan for a buff, pink for a nerf, with a rail down its left edge and its number in the margin."],
      ["fix", "The reader stopped hiding what did not fit. The preview stays at three entries on purpose — the full log is one button away — but when a build's three run long the column scrolls instead of clipping that button out of existence, which is what used to happen."],
      ["buff", "The release archive card grew again to fill its frame: the stack now covers three quarters of the deck with even margins above and below, instead of floating in the middle of it."],
      ["new", "The projects folder has paper in it. Closed, it was a smooth slab that gave no hint there was anything inside — three sheets now stick out above its top edge, fanned and staggered, each printed with a header block and ruled lines instead of being a blank rectangle. They lift further when you hover it."],
      ["buff", "The folder reads as a pocket rather than a plank: a lit lip along its front edge with the shadow of the opening falling behind it, ribbing down the face, and an engraved label line under its name. The room dims toward the corners so the eye lands on the folder rather than the filing cabinets."],
      ["buff", "Opening it is choreographed instead of instant. The three files used to appear together in one move; they now come out one after another — left, then the reserved slot, then right — riding a curve that overshoots slightly and settles, while the loose sheets sink back into the folder behind them. Closing skips the stagger so the folder swallows them in one go."]
    ]
  },
  {
    version: "v2.23.0",
    codename: "DOORMAN",
    date: "2026-09-02",
    summary: "The welcome screen stopped being a dashboard you had to read. It is one host standing in front of a shut gate: she greets you by name, says her piece, and the gate opens when you say so.",
    entries: [
      ["new", "The host talks. A speech bubble types out a short greeting one line at a time — different lines depending on whether your Discord pass is recognised — and the visitor can tap the bubble to rush a line or move to the next, the way a visual novel does."],
      ["new", "The gate is an actual gate: two shutter halves with a lit seam down the middle. The seam brightens when she finishes her last line, and pressing OPEN THE GATE flares it and drives the halves apart, instead of the whole screen dissolving at once."],
      ["nerf", "The boot log, the progress meter with its six nodes, the identity card, the session tags and the channel readout are gone. What is left is the host, one line of signal status, and the button."],
      ["fix", "She is no longer standing in a box. The CRT overlay was painting the exact rectangle of the canvas, and the camera cut her off at mid-thigh in open space — the overlay is masked to an ellipse now and the framing reaches below the knee, so her legs run into the bottom rail instead of ending in mid-air."],
      ["buff", "The avatar is roughly twice the size it was: the stage hands the host every pixel between the top of the screen and the rail."],
      ["buff", "Phones get the same ceremony rather than the old fallback screen. Buddy greets in the avatar's place, with the same bubble and the same gate, and the 13 MB avatar download is still never fetched down there."],
      ["fix", "The gate can always be opened, even if the avatar never arrives. If the model is still streaming after nine seconds the host starts talking anyway, and the button is live as soon as the session check returns."],
      ["fix", "Reloading no longer flashes the site before the splash appears. The backdrop was animating in from fully transparent, so for the first few hundred milliseconds of every load you were looking straight through it at the page behind."],
      ["buff", "The room behind her is an actual room: a light cone falling from overhead, a pool of light on the floor where it lands, a lit floor edge, drifting dust in the beam, and corner falloff holding the eye in the middle of the frame."],
      ["fix", "The speech bubble sits by her head instead of out in the dark. It was measuring from the edge of her canvas, which is wider than she is, so it parked itself a long way off her shoulder."],
      ["fix", "Removed about 2,300 lines of stylesheet belonging to three earlier versions of this screen that were still being shipped to every visitor."]
    ]
  },
  {
    version: "v2.22.0",
    codename: "COLD START",
    date: "2026-09-02",
    summary: "The workstation's build panel stopped ending in a blank rectangle and the dev-room easter egg stopped showing its whole hand at once. Both of them now play out as a sequence instead of sitting there finished.",
    entries: [
      ["fix", "The vector canvas is no longer squashed. It forced its drawing surface to a minimum of 320px wide and then let the browser squeeze that back into the 281px it actually gets, so every ring came out as an oval and every node glyph was drawn about 12% too narrow — most visible once the modules were fully loaded."],
      ["fix", "The canvas also watches its own box now. It only listened for window resizes, so when the build log filled up and pushed the panel taller, the scene kept the old proportions until something else happened to resize the window."],
      ["new", "RUNTIME // BUILD OUTPUT carries a boot checklist of the same six nodes the vector canvas lights up, in the same order, so the gap under a four-line log is now the part that shows what is actually coming online."],
      ["buff", "The build log ends in a blinking cursor instead of stopping mid-sentence, and no longer stretches itself to fill space it has nothing to put in."],
      ["buff", "SOURCE // BOOT SCRIPT is coloured like real code: the call, its parentheses and the string inside are all separate now, instead of the whole line after the first word sharing one colour."],
      ["new", "The hidden dev room runs a sector sweep between the core and the status lines, locking 0xDA1 through DAI-CORE one at a time and turning them red the moment access is denied."],
      ["buff", "The four status lines reveal one by one as the sweep runs rather than being there from the first frame, so the scan reads as something happening rather than a poster."],
      ["fix", "That reveal is composed with the drag glitch the lines already had, so both effects run instead of the newer one silently cancelling the older."]
    ]
  },
  {
    version: "v2.21.0",
    codename: "NIGHT SHIFT",
    date: "2026-09-02",
    summary: "The profile column stopped being a portrait with dead space under it. Lanyard was already reporting which clients Dai is connected from, and the profile already claimed Alaska — both of those are on the card now.",
    entries: [
      ["new", "A device readout shows which Discord clients are live: desktop, mobile and web, with the connected ones lit. Lanyard has been sending that the whole time and the card threw it away."],
      ["new", "The card carries Dai's local Alaska time, ticking, so the night-shift line in the profile finally has something backing it up."],
      ["buff", "The status row leads with a pulsing dot in the status colour, so DO NOT DISTURB reads at a glance instead of only as text."],
      ["buff", "With the new readout the profile column fills its side of the panel evenly instead of stopping halfway and leaving a gap under the badges."]
    ]
  },
  {
    version: "v2.20.0",
    codename: "PLAY COUNTER",
    date: "2026-09-02",
    summary: "The activity stream stopped wasting half its width: games and Spotify both get a proper telemetry rail, games get a stats drawer with hours and streaks, and the streak itself finally survives a deploy.",
    entries: [
      ["fix", "The play streak no longer resets on every deploy. The streak was the one server module that resolved its own storage path instead of using the shared helper, and its lookup skipped RENDER_DATA_DIR — so while everything else wrote to the persistent disk, the streak landed in the repo's own data folder, which Render rebuilds from scratch each time."],
      ["new", "Playtime is tracked per game. Each poll only banks the part of the session it had not counted yet, so the total is right no matter how often the page is open or refreshed."],
      ["new", "A stats button sits in the top-right corner of a game card on desktop. It opens a drawer with hours played, current streak, best streak, days seen, and a ranking of the most-played titles."],
      ["new", "Playtime keeps accruing through a background poll instead of only advancing while somebody happens to be looking at the site."],
      ["buff", "Game and Spotify cards now use the empty right-hand side as a telemetry rail: a large session clock for games, a live countdown to the end of the track for Spotify."],
      ["fix", "Game cards no longer print PLAYING twice. The right-hand label repeated the activity type whenever Discord gave no asset text of its own, and now it only shows when it has something different to say."],
      ["buff", "Cover art is larger and framed in the cabinet's corner-cut style, and the Spotify progress bar is taller with monospaced timings that stop shifting as the seconds tick."],
      ["buff", "Best streak is remembered per game, so a broken run leaves a record behind instead of vanishing."]
    ]
  },
  {
    version: "v2.19.0",
    codename: "SIGNAL HUNT",
    date: "2026-09-02",
    summary: "PACKET_REX finally has somewhere to run. The empty-activity channel is a full parallax scene now, with a skyline to cross, signals to collect, and a runner that stops clipping through the tall cacti.",
    entries: [
      ["buff", "The idle channel is built in layers instead of one runner on a black rectangle: a drifting signal field, pixel clouds, a cabinet skyline with blinking masts, and grit scrolling along the floor. The upper half of the panel used to be entirely empty."],
      ["new", "Signal markers drift down the track and PACKET_REX collects them on the way past, with a spark burst and a SIG counter in the corner, so the scene reads as an actual hunt rather than a loop."],
      ["new", "Packet drones pass through the channel. High ones sail over the runner's head; low ones come in at jumping height and have to be cleared."],
      ["buff", "Obstacles arrive as a spaced queue with a slow speed ramp and a distance readout that flashes every hundred, instead of one lonely cactus crossing an empty floor."],
      ["fix", "The runner's jump is now measured against each obstacle it meets. The old fixed hop only cleared the leading edge, so the tall cacti clipped straight through its tail on the way down."],
      ["fix", "A single track slot can hold one threat at a time, so a drone can no longer land on top of a cactus and leave nowhere to touch down between them."],
      ["fix", "The jump is capped to the panel's own height, so a tall channel can never launch the runner out of frame."],
      ["buff", "The scanner readout carries live pulsing indicators, so GAME.SCAN and SPOTIFY.PORT look like they are actually listening rather than three lines of static text."]
    ]
  },
  {
    version: "v2.18.0",
    codename: "COLD BOOT",
    date: "2026-09-02",
    summary: "The entry gate now paints long before the 3D host is anywhere near ready: the avatar's WebGL stack loads on its own, the host model is cached between visits instead of re-downloaded whole, and the AVATAR LINK meter finally reports the real transfer.",
    entries: [
      ["buff", "The VRM host and its WebGL stack now load as their own chunk, so the gate paints from a main bundle 1.1 MB lighter instead of waiting for three.js to arrive and parse first."],
      ["buff", "Phones no longer download the 3D host at all. The compact mobile splash never mounted the avatar scene, but it was still paying for the entire WebGL runtime on every visit."],
      ["fix", "The cabinet host is cached between visits. Model, motion, and font files were being served with no-store, which meant re-downloading 13 MB of avatar on every single page load; they now revalidate against an ETag and come back as an empty 304."],
      ["fix", "Static responses carry a Content-Length again instead of streaming as chunked, so the browser can size and track what it is downloading."],
      ["new", "The AVATAR LINK panel reports the real transfer with a live percentage and a fill meter driven by the host download, instead of holding on ACQUIRING HOST SIGNAL through a 13 MB wait."],
      ["fix", "The gate's identity check now asks the session endpoint instead of the full guestbook, which used to rehydrate every comment author against Discord before the splash could finish its handshake."],
      ["buff", "The arcade backdrop pauses while the gate covers it. Its grid, code rain, circuit traces, and packets were animating at full cost behind an opaque overlay, competing with the host for frames."],
      ["fix", "The handshake log animates every line again. The sliding desktop window was reusing the previous line's element, so entries quietly swapped text in place instead of typing themselves in."],
      ["buff", "Returning to the cabinet in the same tab runs a shortened startup instead of replaying the full ceremony from the top."],
      ["new", "SPACE opens the gate alongside ENTER."],
      ["fix", "The gate and its handshake log now respect reduced-motion preferences instead of animating regardless of the setting."],
      ["fix", "Cleared the dead access-card stylesheet left behind by the pre-gate splash, plus a full-screen backdrop blur on exit that nothing could see through the splash's own opaque background."]
    ]
  },
  {
    version: "v2.17.0",
    codename: "AVATAR LINK",
    date: "2026-08-31",
    summary: "The cabinet now opens with a live VRM host on desktop, a rebuilt command console, cleaner seasonal telemetry, and development controls that make the new greeting experience easier to test without disturbing the original mobile entrance.",
    entries: [
      ["new", "The desktop entry gate now features Dai's optimized VRM avatar as a full live cabinet host, driven by the supplied VRMA greeting motion and rendered inside the existing phosphor, cyan, gold, and glitch-pink visual system."],
      ["buff", "The greeting begins concealed during the seated setup, reveals the avatar on the surprise rise, completes the authored welcome, and then moves into a continuous hand-wave signal instead of dropping into a static finish."],
      ["fix", "The endless wave now alternates between two trimmed motion actions with a short crossfade, hiding the hard pose jump that previously exposed every animation restart."],
      ["buff", "The desktop splash has been recomposed as a cinematic host scene: visitor identity remains readable on the left while the avatar, live-host caption, signal status, handshake output, and arcade entry control occupy one cohesive full-bleed stage."],
      ["fix", "Avatar and greeting assets now load together, embedded avatar textures are optimized, and shader variants compile while the canvas is hidden to reduce the brief main-thread hitch when the host first appears."],
      ["fix", "The splash reserves its avatar stage before WebGL is ready, so loading the host cannot enlarge the gate or shift the surrounding identity, status, and launch controls."],
      ["buff", "The old circular 01 loading mark has been replaced by an AVATAR LINK signal meter that uses the site palette and now sits directly on the avatar's desktop staging position instead of floating in the center of the entire splash."],
      ["fix", "Desktop greeting typography now gives HI, and the visitor name separate stable lines, preventing the comma from overlapping long identities such as LOCAL.ADMIN."],
      ["fix", "Phones keep the original compact splash instead of loading the desktop VRM scene, while Buddy is restored on both layouts and hands off into the familiar page-entry drop when the gate opens."],
      ["buff", "Seasonal event telemetry is now integrated into the desktop splash title bar as a centered, icon-led signal instead of appearing as another floating rectangle; its larger label stays stable as the splash finishes loading."],
      ["fix", "When no seasonal event is active, the empty center slot collapses cleanly and the channel indicator returns to its intended header position without leaving an orphaned status element."],
      ["buff", "The Halloween CORRUPTED CABINET signal now inherits the redesigned splash treatment while retaining the event's orange, violet, and acid-green cabinet palette."],
      ["fix", "Desktop PASS and INSIDE session cards now keep a clear visual gap above the system-handshake panel instead of touching its upper frame."],
      ["buff", "The command console has been rebuilt as an operator workspace with a compact branded title bar, command matrix, live buffer header, numbered output stream, session telemetry, and a dedicated command-input rail."],
      ["fix", "Terminal framing, header seams, background lettering, panel lines, spacing, and contrast have been polished so the console feels distinct from the old full-width shell while still matching the website's established color tokens."],
      ["fix", "The temporary localhost LOCAL.ADMIN bypass used during development has been removed; local and deployed visitors now share the normal Discord-authenticated permission path."],
      ["fix", "The draggable ~/daivr/homebase.jsx workstation may cross above the sticky top bar again, but only the dragged panel receives the elevated layer—its dock, secret room, hero copy, and neighboring interface remain beneath the header."]
    ]
  },
  {
    version: "v2.16.0",
    codename: "PROJECT ARCHIVE",
    date: "2026-08-28",
    summary: "The project shelf is now a physical archive: a ReactBits-inspired folder reveals live project files, and each active build drops into a draggable lanyard with its own identity, links, and release information.",
    entries: [
      ["new", "The two flat project cartridges have been consolidated into an interactive PROJECTS.DIR folder that opens to reveal the available builds while preserving the existing two-active-slot telemetry."],
      ["buff", "The folder now mirrors the ReactBits reference motion: the full object rises by eight pixels, three stacked sheets lift together, and the front flap folds open with opposing skews from one stable hover hitbox."],
      ["new", "TradeDex and Palwatch fan out as selectable project files, with a centered FILE_03 card behind them reserving the next project slot as SOON... without pretending it is active."],
      ["new", "Selecting an active project now deploys a physics-driven lanyard instead of the old detail modal, carrying the project logo, summary, technology stack, source links, release metadata, and security status."],
      ["buff", "Project badges are larger and sharper, hang lower from a wider top-anchored strap and grip clip, and use separate faces: project identity on the front, with the daivr.dev logo and Daivr signature on the back."],
      ["fix", "Lanyard startup now initializes the strap and badge in place before releasing the staged drop, preventing both the full-screen stretched-string flash and the later instant-drop regression."],
      ["fix", "Selected projects no longer inherit hover scaling, and closing the folder no longer leaves its fold animation stuck through pointer focus; keyboard focus keeps its accessible visual state."],
      ["fix", "Project files now render on fully opaque cabinet surfaces, and their hover scale can extend past the folder frame without clipping at the container edge."],
      ["buff", "The supplied cyan-and-magenta archive-room artwork now fills the project-folder container beneath a restrained readability wash and the cabinet's fine grid texture."],
      ["fix", "Discord activity streaks now appear only after an activity has been played more than once, avoiding a misleading one-play streak badge."],
      ["fix", "The hero's Dai.exe control now becomes a truly disabled button while the boot sequence is running and after the runtime is online, preventing duplicate launch requests and removing misleading hover motion."],
      ["buff", "The guestbook's Connect Discord control now uses a cabinet-adapted creepy-eye interaction: tracking pupils watch from beneath a hinged cyan cover, the pending OAuth state switches to gold, and keyboard focus and reduced-motion behavior remain intact."],
      ["new", "PATCH.LOG now runs as a ReactBits-inspired 3D card-swap archive: wheel, swipe, arrows, stacked-card clicks, and a full version selector can load any build, while an idle auto-cycle drops the front card and promotes the next release before pausing for active readers."],
      ["fix", "The PATCH.LOG release workspace now keeps one stable height across short and long builds, moves overflow into the selected release panel, and fully captures wheel input over the card deck so browsing versions never drags the surrounding page."],
      ["buff", "PATCH.LOG previews now stop at three changes to keep the standard release panel scrollbar-free; Read Full Log opens a focused full-width archive view, removes the card stack while reading, pauses auto-cycling, and provides a persistent route back to version browsing."]
    ]
  },
  {
    version: "v2.15.0",
    codename: "PACKET REX",
    date: "2026-08-16",
    summary: "The cabinet rebuilt its front door, workstation, cold-start sequence, and Discord room signal into one coherent system—from the first DAI.EXE handshake to the autonomous pixel runner waiting between live broadcasts.",
    entries: [
      ["new", "The welcome splash has been rebuilt as a full visitor-access gate with a DAI.EXE title bar, live channel state, responsive identity pass, system-handshake console, six-node startup meter, and a clear ENTER ARCADE control."],
      ["buff", "DAI.EXE is visible again behind the splash as a deliberately positioned boot wordmark with a short cyan-and-magenta signal echo, arcade-access caption, orbit rings, horizon grid, and a no-motion fallback instead of being hidden behind the gate."],
      ["buff", "The draggable homebase.jsx panel is now a complete WS-01 workstation: compact source lines, active-line tracking, runtime output, offline/booting/online state chips, vector-canvas telemetry, primary-node status, and a persistent bottom system readout all share the same signal state."],
      ["new", "Running Dai.exe now opens a full BOOT SEQUENCE instead of the old oversized console: six radar nodes link around the core while the active-process briefing, route checklist, compact terminal history, progress bar, and circular sync dial advance together."],
      ["fix", "The boot overlay's terminal output is capped to the latest useful lines, and the circular percentage readout now stays centered and legible through 100% without colliding with its ring or footer telemetry."],
      ["fix", "homebase.jsx source commands keep a compact single-line rhythm at their intended workstation width, preventing the boot script from wrapping into awkward two-column fragments."],
      ["fix", "Vector-canvas packets no longer chase the website cursor or draw a payload reticle; the homebase routing animation follows its own node paths again."],
      ["new", "When Discord has no visible game or music activity on desktop, PACKET_REX takes over the empty channel with a cabinet-styled runner scene, moving signal markers, scanner telemetry, and automatically generated cactus obstacles."],
      ["buff", "The idle T-Rex now uses the original Chromium runner frames for a proper two-step walk cycle, while collision-aware launch timing makes every jump line up with the approaching obstacle instead of firing early."],
      ["fix", "PACKET_REX's phosphor tint now preserves the sprite's eye, mouth, arms, and negative-space body details, and its tighter glow keeps the silhouette crisp at the cabinet's scaled pixel size."],
      ["buff", "Discord activities now enter and leave with short staggered opacity-and-transform transitions instead of popping into the stream; reduced-motion visitors still receive immediate, stable state changes."],
      ["new", "Discord collectible nameplates now sync through the profile customization endpoint and animate behind the badge collection, with a static artwork fallback whenever reduced motion is requested."],
      ["fix", "The nameplate backdrop now fills the full badge tray at every supported desktop width without stretching, changing proportions, or leaving an empty strip at the right edge."],
      ["new", "The equipped primary-server identity badge now appears directly beside Dai's display name, including its server tag and a cabinet-styled tooltip that is available by hover, keyboard focus, and screen-reader label."],
      ["fix", "Discord display-name, server-tag, and username alignment has been rebalanced so the identity block stays vertically centered instead of making the tag ride above the name."],
      ["fix", "The sidebar's animated Discord avatar decoration now uses the exact same 84px canvas, centered offset, and clipping boundary on desktop and mobile, preventing its frames from shifting or escaping the 76px portrait slot at narrow widths."],
      ["fix", "The Discord presence grid, profile card, decorative frame, and activity surface now preserve their intended proportions across full desktop, constrained desktop, and developer-tools view widths."],
      ["fix", "Profile controls and status blocks now keep a deliberate inner gutter from Discord's decorative frame, preventing buttons and card edges from visually colliding with the artwork."],
      ["buff", "Desktop's empty signal view now carries the full runner scene and listening readout, while smaller view modes retain the compact no-activity message to avoid turning the live room into another nested scrolling surface."]
    ]
  },
  {
    version: "v2.14.0",
    codename: "FRAME CONTROL",
    date: "2026-08-11",
    summary: "Discord profile-frame boundaries are now under authenticated cabinet control, allowing the live presence decoration to switch cleanly between full overflow and contained presentation.",
    entries: [
      ["new", "Discord admins now get a persistent profile-frame boundary toggle in the presence card: it can either preserve Discord's full decorative overflow or clip the frame cleanly at the card edge for every visitor."],
      ["fix", "On mobile, the upper profile card now owns the higher stacking layer so its overflowing frame rails remain visible over the Activity Stream card instead of being painted underneath it."],
      ["fix", "The admin frame-boundary control now has a solid cabinet surface and a clear containment state instead of appearing as an easy-to-miss decorative arrow icon."],
      ["buff", "The admin frame control is now a proper arcade-styled switch with clearly marked IN and OUT positions, a responsive sliding thumb, accessible switch semantics, and reduced-motion support."],
      ["buff", "Mobile Discord presence now shows one focused activity at a time, prioritizing an active game over Spotify and using Spotify only when no game is running; desktop keeps the full activity stream."],
      ["fix", "The mobile Activity Stream now collapses around its single focused card instead of reserving desktop-height empty space, and its active-count badge sits beside the activity heading."],
      ["fix", "The mobile Discord cabinet now gives its decorative bottom frame a cleaner buffer by extending the outer shell border below it without moving the approved frame alignment."],
      ["fix", "Mobile frame alignment now leaves Discord's curly rail ornament at its native position and applies a measured micro-adjustment only to the straight border bars so they meet the lower frame corners cleanly."],
      ["fix", "Mobile Spotify and game source labels now sit in the activity card's top-right corner, with reserved title space and no extra label row beneath the activity details."],
      ["fix", "At full desktop width, Discord's straight side bars remain visible across the profile card and are clipped only where they extend below the bottom decorative panel."],
      ["fix", "The heart-accented side ornaments now sit slightly higher on both sides of the full-desktop Discord profile frame without shifting the straight bars or other frame panels."],
      ["buff", "The Discord custom-status row is now centered, and its Loading state uses three independently pulsing dots with an accessible reduced-motion fallback."],
      ["buff", "PATCH.LOG versions now open as four-entry release previews, with an accessible read-full-log control that reveals the remaining notes and collapses them again on demand."],
      ["fix", "The frame-boundary toggle now sits at the far-right end of the discord.presence title bar instead of floating inside the profile card."],
      ["fix", "The discord.presence path is now mathematically centered in the title bar between grouped status lights and the admin frame control, keeping it clear of overflowing profile decorations."]
    ]
  },
  {
    version: "v2.13.0",
    codename: "POCKET CABINET",
    date: "2026-08-10",
    summary: "The mobile cabinet got a full fit-and-finish pass: the entry gate, home hero, link console, live activity card, and Discord avatar now behave cleanly on small screens.",
    entries: [
      ["fix", "Entry splash now respects dynamic mobile viewport and safe-area sizing, keeps the full gate and ENTER WEB control visible, and switches to a compact landscape layout."],
      ["buff", "Mobile home view is leaner: the Run Dai.exe and Terminal controls plus the large hero console are hidden while the full desktop station remains unchanged."],
      ["fix", "LINKS.SH title-bar lights and route count now keep equal gutters instead of touching the frame on narrow screens."],
      ["fix", "Spotify activity labels now flow beneath the live activity details on mobile instead of crowding the song title."],
      ["fix", "Discord avatar decorations are no longer clamped to the avatar image on mobile, restoring the intended animated frame overhang."],
      ["new", "Discord's new Profile Frames now sync to the presence card; standard desktop and mobile preserve their separately tuned alignment, while only full-width desktop viewports receive the lower top panel and higher bottom panel adjustment and rear flowers remain obscured."],
      ["new", "Palwatch Live Server Map joins the project shelf: the card uses its supplied mascot logo while the detail modal preserves the full desktop map preview, stack, systems, repository, and documentation links."],
      ["fix", "TradeDex security telemetry now reads the SHA-256 digest published by GitHub and caches a hash-only VirusTotal lookup; opening the project no longer downloads, buffers, or uploads the 98 MB release on Render."],
      ["fix", "TradeDex no longer holds a stale VirusTotal 'hash not indexed' result for six hours: negative lookups refresh after one minute and the open security gate retries automatically, while completed reports retain a long cache."],
      ["buff", "TradeDex's VirusTotal panel now uses plain-language results, threat counts, descriptive file labels, and a dedicated report button that opens the exact VirusTotal hash report in a new tab."],
      ["buff", "TradeDex's modal now replaces the cramped metric tiles with one responsive security summary, a compact release-details strip, a full wrapping SHA-256 value with copy feedback, and a simpler report meter with no clipped labels."],
      ["fix", "TradeDex's modal action buttons now use a shorter desktop profile so the status footer fits inside common viewport heights without unnecessary scrolling, while mobile retains touch-friendly targets."],
      ["fix", "Game rankings now refresh current Discord profile images through the shared server cache when a bot token is configured, and Tower Block, Cross Road, and Madrace always replace unavailable avatars with a stable initials badge instead of a broken image icon."],
      ["fix", "Published comment GIFs now begin loading eagerly with a visible signal placeholder, while newly attached Klipy GIFs prefer the lighter small rendition for faster repeat visits."],
      ["fix", "Cached comment GIFs no longer get trapped behind the loading signal: media state now follows the active URL and confirms already-complete browser images without resetting a successful load event."],
      ["fix", "The example environment file no longer includes a Discord user ID or profile-frame SKU; both values are now deployment-specific placeholders."]
    ]
  },
  {
    version: "v2.12.0",
    codename: "THREAD FOLD",
    date: "2026-07-20",
    summary: "Long reply threads in the guestbook now fold up — only the first reply shows, the rest hide behind a show more / show less toggle.",
    entries: [
      ["new", "Comment threads collapse after the first reply: any extra replies tuck behind a \"show more\" button (with a count of what's hidden), and \"show less\" folds them back. Keeps busy threads from flooding the stream."],
      ["fix", "Expanded a thread and flipped to another comment page? It snaps shut on the way — every page starts clean, showing just the first reply of each thread."]
    ]
  },
  {
    version: "v2.11.0",
    codename: "TWIN TAILS",
    date: "2026-07-20",
    summary: "Scan every last species in the fishing journal and buddy earns a set of long teal twin-tails — the Miku wig, now with hair that actually swings when buddy moves.",
    entries: [
      ["new", "Miku wig: fill the catch journal to 100% — every fish, every piece of junk, the treasure chest, all of it — and buddy unlocks a proper pixel Miku wig: center-parted bangs, face-framing side locks, and long twin-tails tied high with little hair ties."],
      ["new", "The twin-tails have physics. They hang from where they're tied and sway on their own, then whip and bounce in time with buddy — faster when it walks, wider when it dances, a hard swing on a happy hop, a slow drift under the parachute. The tip lags the base for a real pendulum feel."],
      ["buff", "The wig moved into the head slot (it's hair, it goes where hats go), so it swaps in and out cleanly with the party hat, star cap, and pixel crown."],
      ["fix", "The buddy waiting at the welcome gate now wears your actual loadout — the wig, hats, visor, boots, and whatever you're carrying all show up on the splash exactly like they do down in the footer, instead of the gate buddy turning up half-dressed."],
      ["known", "The wig does not improve buddy's singing. Nothing improves buddy's singing."]
    ]
  },
  {
    version: "v2.10.0",
    codename: "SEASON PASS",
    date: "2026-07-19",
    summary: "Seasonal events now greet you at the door, April Fools breaks the cabinet like it means it, the birthday party finally has enough cake, and the anniversary show writes its own number in the sky.",
    entries: [
      ["new", "The seasonal event notice moved to the entry splash: the active event announces itself before you even step inside, with a live-signal chip stamped onto your access pass. No more toast ambushing you after the door."],
      ["buff", "April Fools shattered glass got an actual physics-of-sadness pass: tapered radial cracks with kinks and branches, glass facets catching the light, a fallen-out shard leaving a dark hole into the cabinet's void, shards resting on the ledge, and a specular glint that sweeps the damage."],
      ["new", "April Fools panels now suffer proper corruption: RGB tear bands that rip across at random, corrupt pixel blocks, exposed wires dangling from jagged holes in the trim — sparking, obviously — and a three-act glitch cycle (power dip, chromatic tear, spasm) per panel."],
      ["buff", "Birthday cakes everywhere: tiered cakes on plates with frosting drips, sugar sprinkles, and glowing candles now show up on medium panels too — plus cake slices with a cherry on little plates and frosted cupcakes for the narrow ledges. A neon cake joined the backdrop."],
      ["new", "Anniversary special: every so often a golden rocket climbs up and bursts into a \"02\" drawn in twinkling sparks that hold formation, then rain out. Star-shaped bursts joined the regular show."],
      ["new", "Champagne bottles on the anniversary ledges pop their own corks — real cork ballistics, foam spray, bubbles — then quietly re-foil themselves for the next round. Plus a rotating gold halo behind the V2 plaque, spotlight beams, and a giant \"02\" watermark in the sky."],
      ["known", "The cancel button on the April update screen remains undefeated."]
    ]
  },
  {
    version: "v2.9.0",
    codename: "ENCORE",
    date: "2026-07-14",
    summary: "The anniversary event graduated from looping CSS sparkles to a real fireworks show — with rocket physics, three burst types, and a crowd (you) that can call the shots.",
    entries: [
      ["new", "Fireworks with actual physics: rockets climb from below the fold on sparkling trails and detonate into peonies (full spheres), rings, or golden willows with long heavy trails — shockwave ring, sky glow, gravity, and twinkling embers included."],
      ["new", "Conduct the show: swipe your cursor fast anywhere and a rocket launches toward that exact spot and bursts on arrival. The pyrotechnics crew trusts you completely."],
      ["new", "Pennant bunting strung across the wide panels — triangle flags in the full arcade palette, swaying on sagging lines, double swags on the really wide ones."],
      ["new", "Ledge trophies: little golden cups with handles and an engraved plaque, because two years of cabinet uptime deserves hardware. Curly streamers dangle off a few corners too."],
      ["buff", "Celebration vignette: gold and cyan light creeps in from the screen corners while the fireworks paint the middle."],
      ["known", "The fireworks are silent out of respect for the neighbors. The neighbors are a Discord bot."]
    ]
  },
  {
    version: "v2.8.0",
    codename: "PARTY FOUL",
    date: "2026-07-14",
    summary: "April Fools breaks the cabinet properly — cracked glass, hazard tape, crooked panels — and the birthday event finally throws a real party: gifts, cake, balloons, and confetti physics.",
    entries: [
      ["new", "April Fools: the cabinet is now visibly held together with hope. Panels hang slightly crooked like badly hung picture frames, flinch with a glitch spasm every so often, and some sport spider-cracked glass with a bright impact point."],
      ["new", "Hazard tape slapped diagonally over random panel corners, plus tilted mini error dialogs perched on the ledges that periodically lose their grip, slip a few pixels, and pretend nothing happened."],
      ["new", "Birthday: wrapped gifts on the ledges — bows, ribbons, shading, the occasional gift stacked on a bigger gift — next to striped party candles and, on the widest panels, a two-tier frosted cake with three lit candles."],
      ["new", "Birthday confetti physics: an ambient drizzle of tumbling rects, dots, and wavy streamers, plus party-popper bursts with expanding shockwave rings every few seconds. Balloons launch from below and float off with wobbly strings."],
      ["new", "Swipe your cursor fast on the birthday page and it pops a burst of confetti. This serves no purpose. Happy birthday."],
      ["known", "The cracked glass cannot be repaired. The cake cannot be eaten. The tape is load-bearing."]
    ]
  },
  {
    version: "v2.7.1",
    codename: "SERVICE PACK",
    date: "2026-07-14",
    summary: "The ghosts learned cloth physics, the witch hats got a size up, and the April Fools fake update is now a fully avoidable inconvenience with an unavoidable Cancel button.",
    entries: [
      ["buff", "Ghost overhaul: the sheet now behaves like a sheet. Ghosts lean into their movement, the cloth drags behind them and ripples faster the quicker they float, they leave a faint wake when they accelerate, they blink, and their eyes track where they're going."],
      ["buff", "Witch hats grew about 40% — apparently the old ones were kids' sizes."],
      ["nerf", "Snowmen recalled from the winter event. They stood on the snow, they rose with the snow, and they have now returned to the snow. The drifts remain."],
      ["new", "April Fools takeover, deluxe edition: a Cancel update button that dodges your cursor forever, a wandering hourglass, a shine on the progress bar, and a proper shake of shame when the progress loops back from 99%."],
      ["new", "DaiOS ambience: the pixel rain is now a drizzle of tiny tumbling windows, ghost error dialogs pop up around the page (Success failed successfully), and the corner DaiOS window runs an eternal marquee progress bar under a spinning hourglass."],
      ["buff", "More fake update messages, including the reticulation of splines and the un-deletion of System32 after it got weird."],
      ["known", "The Cancel update button has logged 0 successful clicks. It considers this a perfect record."]
    ]
  },
  {
    version: "v2.7.0",
    codename: "SEASON PASS",
    date: "2026-07-14",
    summary: "Both seasonal events got a content drop: ghosts and witch hats for October, snowmen and true dendrite snowflakes for December, and the welcome gate now dresses for the occasion.",
    entries: [
      ["new", "Little ghosts drift around the Halloween page on slow, wandering orbits — fading in, bobbing about, and fading back out. The big ones have a mouth. It is always open."],
      ["new", "Witch hats: some 90-degree corners now wear a crooked-tip hat with a purple band and a gold buckle instead of a web. The spiders respect the dress code."],
      ["new", "Trick-or-treat upgrade: more pumpkins on the ledges, now often accompanied by a candy bucket with sweets peeking over the rim (and one dropped beside it, tragically out of reach)."],
      ["buff", "The candle shrines multiplied: more clusters per ledge, tall thin tapers next to short chunky pillars, each flame on its own flicker rhythm."],
      ["new", "Winter: snowmen now stand on some snowpacks — coal faces, carrot noses, branch arms, scarves that flap in the wind, and the occasional top hat. They rise with the snow they stand on."],
      ["buff", "Falling snow upgraded from dots to actual six-armed dendrite snowflakes that spin as they drift. The far layer stays soft-focus, like real depth of field."],
      ["new", "The welcome gate now joins the party: snowfall and a frosted card top in December, cobwebs, a dangling spider, and bat silhouettes in October — all visible before you even enter."],
      ["known", "The ghosts have no collision box. They are going through a lot."]
    ]
  },
  {
    version: "v2.6.0",
    codename: "SPINNERET",
    date: "2026-07-14",
    summary: "The Halloween event hired a decorating crew: cobwebs in the cabinet corners, spiders on silk threads, bat flocks in the airspace, and jack-o-lanterns on the ledges.",
    entries: [
      ["new", "Corner cobwebs: panels grow hand-spun webs — sagging silk rings, uneven spokes, torn segments, and glints of moonlight caught in the threads. Spiders are picky architects: webs only go on true 90-degree corners, never on the chamfered cuts."],
      ["new", "Hanging spiders: some webs come with a resident dangling on a thread, swinging gently and reeling themselves up and down. A few more dangle straight off the top status bar. Get your cursor close and they bolt up the silk in a panic."],
      ["new", "Bat flocks: squadrons of 3-7 bats flap across the screen in front of the cabinet every so often, with proper wing membranes, wobbly flight paths, and tiny glowing eyes on the big ones."],
      ["new", "Ledge shrines: carved jack-o-lanterns flicker on a few panel tops, now joined by clusters of dripless wax candles with swaying flames. Fire safety compliance: unverified."],
      ["new", "A big cobweb drapes over the top-left corner of the screen on desktop. Yes, it probably has a spider. No, it will not move in with you."],
      ["buff", "Deeper Halloween ambience: purple gloom creeps in from the screen corners while the orange moonlight holds the middle."],
      ["known", "The spiders only do webs. They have declined all debugging assignments."]
    ]
  },
  {
    version: "v2.5.1",
    codename: "WHITEOUT",
    date: "2026-07-12",
    summary: "The winter event got a real snow engine: drifts pile up grain by grain, and overloaded corners calve off in chunks instead of building little white cliffs.",
    entries: [
      ["new", "Snow accumulation physics: flakes now settle into per-panel snowpacks that obey an angle of repose, so drifts slump into soft dunes instead of stacking straight up."],
      ["new", "Corner calving: snow that creeps past a panel's edge loses its grip and tumbles off as a proper clump — it can even land on the panel below and trigger a second slide."],
      ["new", "Blizzard details: wind gusts drift the snowpack downwind, kick spindrift off the crests, and every landing leaves a tiny glint. The drifts sparkle. Obviously."],
      ["new", "Swipe your cursor through a drift fast enough and you'll carve it — the loose snow comes off as a chunk thrown in the direction you swiped."],
      ["buff", "Snow caps now ride their panels perfectly during scrolling and hover lifts instead of floating off into space."],
      ["fix", "Snow no longer tries to accumulate on things that move: the draggable homebase console and the tilting game cartridges stay clean."],
      ["known", "The snow is not cold. Engineering has been notified."]
    ]
  },
  {
    version: "v2.5.0",
    codename: "STATION-86",
    date: "2026-07-11",
    summary: "A very old code now opens a very real console: four secret disks and a full cartridge ritual to load them.",
    entries: [
      ["new", "Secret game library: the cabinet finally honors the oldest code in gaming. Ten inputs, four disks — Madrace, Tower Block, Cross Road, and The Cube — each on its own labeled cartridge."],
      ["new", "DAIVR STATION-86: mounting a disk now summons a whole console. Bus doors slide open, the cartridge drops in, hovers to align, and seats with a proper clunk — dust puff, shock ring and all."],
      ["new", "Power-on ritual: the PWR switch flips itself, the LED blinks amber then locks to your game's color, the slot glows from inside, and the program boots on a screen flash."],
      ["buff", "Mount audio re-scored to match the choreography: door tick, contact thud, two-stage clunk, latch click, and a rising power blip."],
      ["buff", "The whole ritual scales down for phones and steps aside politely if your system asks for reduced motion."],
      ["known", "The STATION-86 shipped without an eject button. Games check in whenever they like; the only way out is the back arrow. This is considered canon."]
    ]
  },
  {
    version: "v2.4.0",
    codename: "VOID ANGLER",
    date: "2026-07-10",
    summary: "The buddy took up fishing, the cabinet swaps sections like cartridges, and sometimes it rains indoors.",
    entries: [
      ["new", "Cartridge-swap navigation: jumping to a section ejects the current panel, drops the next one in, and seats it with a proper clunk. The slot under the header flashes on contact."],
      ["new", "Buddy fishing trips: every couple of minutes buddy wanders to the footer edge, casts a line into the void, and reels something back up. Sometimes it's kelp.txt."],
      ["new", "Rare hooks fight back: the rod strains, the line whips, buddy gets dragged around the rail — and some get away."],
      ["new", "Void angler quest: land 3 rare catches and buddy earns a lucky lure for its pack."],
      ["new", "Tackle unlocks: keep fishing to earn cosmetic rods (driftwood, bamboo, neon, golden) and ability lures — swift bites, anchor grip, junk-repelling magnet. The buddy pack grew rod + lure slots."],
      ["new", "Indoor weather: every so often it rains over the footer. Buddy deploys a pixel umbrella cut from the same cloth as his parachute — drops plink off the canopy and bounce on the rail."],
      ["new", "Rare blackout: the cabinet can lose power. Buddy sweeps a flashlight, finds the breaker cabinet — gauge, fault LEDs, hazard stripes, main lever — and hauls it back to life. Terminal fans: try `blackout`."],
      ["buff", "Lucky lure equipped = double odds on rare bites and fewer escapes. Buddy insists it's skill."],
      ["buff", "The void got water physics around the bobber. Ripples confirmed."],
      ["buff", "Buddy pack reorganized: loot is grouped by slot with filter chips and its own scroll — hoard as much as you want, the card stays the same size."],
      ["buff", "Inventory preview now shows the full loadout: equipped chute floats overhead and the current rod (with its lure) leans beside the buddy."],
      ["known", "The void has never been stocked with fish. Catches keep happening anyway. Do not question it."]
    ]
  },
  {
    version: "v2.3.0",
    codename: "LOOT RUN",
    date: "2026-07-10",
    summary: "Buddy quests, inventory loot, live music ambience, and cartridge-flavored project cards rolled into the cabinet.",
    entries: [
      ["new", "Buddy quests: find cartridges, tap the terminal, catch the music signal, open the guestbook stream, and wake buddy on the late shift."],
      ["new", "Buddy inventory: quest rewards now show as tiny accessories — cartridge, pixel blaster, coffee, headset, and an upgraded chute."],
      ["buff", "Project cards now read more like arcade cartridges, with slot teeth, serial labels, and collectible-card framing."],
      ["buff", "Spotify live mode adds a subtle room pulse and gives buddy a reason to dance."],
      ["fix", "Guestbook comments now enter like terminal transmissions instead of plain message cards."],
      ["known", "Buddy still refuses to explain where the inventory backpack is stored. Investigation pending."]
    ]
  },
  {
    version: "v2.2.0",
    codename: "AIRDROP",
    date: "2026-07-09",
    summary: "The buddy got a life upgrade and the cabinet learned to daydream.",
    entries: [
      ["new", "Attract mode: leave the cabinet alone for a minute and it starts its own demo reel — drifting DAI.EXE, top players, and a working coin slot. Yes, you need to insert a coin to get back in."],
      ["new", "Buddy airlines: grab the little guy, carry him anywhere, and he parachutes back down to the rail. Style points guaranteed."],
      ["new", "Buddy friendship levels, synced to your Discord login: pets unlock a party hat, sunglasses, a scarf, and a spark antenna."],
      ["new", "Now-playing ticker: whatever Dai is spinning on Spotify scrolls above the footer. The buddy has opinions about it."],
      ["buff", "Buddy bedtime: on desktop it now shuffles to a quiet corner of the footer before falling asleep."],
      ["buff", "Grand entrance: the buddy waits on the welcome gate, jumps when you enter, and parachutes all the way down the page — scroll along with it and watch it land on the footer rail."]
    ]
  },
  {
    version: "v2.1.0",
    codename: "HOLO",
    date: "2026-07-09",
    summary: "Quality-of-life pass: the cabinet learned a few arcade tricks and adopted a pet.",
    entries: [
      ["new", "Screen buddy deployed. A tiny CRT critter patrols the footer rail — it walks, chatters, dances, naps, and accepts pets."],
      ["buff", "Buddy brain v2: cursor-tracking eyes, confetti celebrations, dizzy pet-overload, theme reactions, and a CRT power-on entrance."],
      ["new", "PATCH.LOG panel installed. You are reading it right now. Very meta."],
      ["buff", "Game carts got a holo-foil coating. Tilt one under the light and watch it shimmer."],
      ["buff", "Section headings now decode like intercepted transmissions when they enter the screen."],
      ["fix", "The FPS counter used to say 60 no matter what. It now measures real frames and tells the truth."]
    ]
  },
  {
    version: "v2.0.0",
    codename: "REACT CABINET",
    date: "2026-07-02",
    summary: "Full rebuild of daivr.dev as a React arcade station. Everything glows now.",
    entries: [
      ["new", "Comments console with Discord login, GIF drops, replies, and pixel reactions."],
      ["new", "VirusTotal download gate — TradeDex releases get scanned before the door opens."],
      ["new", "Live Discord presence via Lanyard: status, activity, Spotify, badges, streak."],
      ["new", "Steam playtime sync on the game shelf. The hours are real. Unfortunately."],
      ["new", "Entry splash, launch sequence, XP core, and achievement toasts."],
      ["buff", "Custom CRT pixel cursors with RGB split. Glitch theme got its own set."],
      ["buff", "A secret bay hidden under the hero console. Drag things. That's the hint."]
    ]
  },
  {
    version: "v1.x",
    codename: "LEGACY BOARD",
    date: null,
    summary: "The old static site. Served with honor, retired with dignity.",
    entries: [
      ["nerf", "Decommissioned and archived. Its phosphor lives on in this cabinet."]
    ]
  }
];
