export const profile = {
  name: "Dai",
  handle: "daivr.dev",
  location: "Alaska // night-shift build mode",
  timezone: "America/Anchorage",
  email: "hello@daivr.dev",
  avatar: "/assets/reference/dai-peach-card.png",
  eyebrow: "DAIVR://ARCADE-CODING-STATION",
  headline: "Code bots. Game tools. Weird panels.",
  lede:
    "This is my personal cabinet: part terminal, part arcade board, part messy dev room. I build Discord bots, SysBot tools, small web panels, and playful interfaces that feel like they belong on a glowing machine.",
  tags: ["EN/ES", "bots", "sysbot", "web panels", "game nights"],
  stats: [
    ["save slot", "Dai"],
    ["biome", "Alaska"],
    ["mood", "aurora arcade"]
  ]
};

export const discord = {
  userId: "271701484922601472",
  profileUrl: "https://discordapp.com/users/271701484922601472",
  fallbackAvatar: "/assets/reference/dai-peach-card.png"
};

export const navItems = [
  ["Dai.exe", "#home"],
  ["Now.log", "#now"],
  ["Carts", "#builds"],
  ["Room.sys", "#room"],
  ["Games", "#games"],
  ["Toolbelt", "#toolbelt"],
  ["Patch.log", "#patchlog"],
  ["Comments", "#contact"]
];

// state: estado corto de la tarjeta (arriba a la derecha); tags: lo que
// sale en el pie, sacado del propio texto.
export const now = [
  {
    label: "currently building",
    title: "Discord tools with personality",
    body: "Queue flows, bot commands, embeds, web panels, and small systems that make community servers easier to run.",
    state: "in progress",
    tags: ["bot commands", "embeds", "web panels", "queue flows"]
  },
  {
    label: "currently playing",
    title: "Fallout, Minecraft, VRChat, DBD",
    body: "The site borrows from the stuff that lives in the background while I code: launchers, inventories, lobbies, and late-night voice chat.",
    state: "in rotation",
    tags: ["Fallout", "Minecraft", "VRChat", "Dead by Daylight"]
  },
  {
    label: "currently learning",
    title: "Cleaner interfaces, stronger systems",
    body: "Less random glow, more deliberate hierarchy. More arcade station, more terminal personality, more Dai.",
    state: "ongoing",
    tags: ["hierarchy", "systems", "terminal UX"]
  }
];

// status.ini en Now.log. El valor de "runtime" lo pone la hora de verdad de
// Dai (lib/daiTime: night mode, morning boot, day shift, evening build).
export const roomStats = [
  ["coffee", "cold but loyal"],
  ["playlist", "lo-fi / anime OPs"],
  ["editor", "Visual Studio"],
  ["runtime", "night mode"]
];

export const socialLinks = [
  {
    label: "Discord",
    href: "https://discordapp.com/users/271701484922601472",
    host: "discordapp.com",
    route: "COMMS.CHANNEL",
    summary: "Primary line for messages, community chatter, and project talk.",
    icon: "discord",
    tone: "violet"
  },
  {
    label: "GitHub",
    href: "https://github.com/Daiivr",
    host: "github.com",
    route: "SOURCE.REPOS",
    summary: "Code, experiments, releases, and the projects currently in motion.",
    icon: "github",
    tone: "white"
  },
  {
    label: "Steam",
    href: "https://steamcommunity.com/id/Daivr",
    host: "steamcommunity.com",
    route: "GAME.PROFILE",
    summary: "Library, play history, and the multiplayer side of the cabinet.",
    icon: "steam",
    tone: "cyan"
  },
  {
    label: "Twitch",
    href: "https://www.twitch.tv/daiivr",
    host: "twitch.tv",
    route: "LIVE.SIGNAL",
    summary: "Occasional live sessions, games, builds, and late-night detours.",
    icon: "twitch",
    tone: "purple"
  }
];

export const favorites = [
  {
    title: "Game worlds",
    body: "NieR:Automata, Fallout 76, Red Dead Redemption II, Minecraft, VRChat, and the kind of spaces that make a UI feel like a place."
  },
  {
    title: "Build flavor",
    body: "Terminal chrome, card inventories, safe-download dialogs, status lights, pixel labels, and clean web panels."
  },
  {
    title: "Comfort stack",
    body: "Discord communities, SysBot tooling, ShareX-style workflows, anime in another tab, and a quiet room with a glowing monitor."
  }
];

export const games = [
  {
    title: "NieR:Automata",
    appId: "524220",
    kicker: "FAVORITE.01",
    bay: "A.01",
    meta: "YoRHa signal",
    genre: "action RPG",
    hours: "988h played",
    favoriteRank: "S-rank favorite",
    badges: ["story-heavy", "soundtrack", "completionist"],
    serial: "SN//0524220",
    image: "/games/nier-automata-cover-card.webp",
    logo: "/games/nier-automata-logo.webp",
    character: "/games/nier-2b-card.webp",
    review: `After more than 500 hours of play AND having finished the 4 or 5 main endings (A, B, C and D, E) I can directly say that it is a great game, both in gameplay and in history, both factors are connected in a very exquisite way fitting into the universe of Nier AND Drakengard.

The topics it deals with and the way it presents them to you are beautiful, this factor being very well conjectured throughout history, delivering extremely epic and sentimental moments. This installment finally manages to capture what was overshadowed in the previous installments of Yoko Taro, being a renewed and fresh experience for today's standards. The story from its synopsis feels captivating and the mechanics of both combat and main missions throughout the beginning of the story gradually immerse you without considering the unique atmosphere that each location on the map gives you, accompanied by a soundtrack exquisite in composition for each moment, delivering a feeling to each one, which fragments each episode of the game into unique gaming experiences.

A game worth spending your whole life exploring every corner of the map and completing all the missions that it delivers.`,
    accent: "yorha"
  },
  {
    title: "Fallout 76",
    appId: "1151340",
    kicker: "FAVORITE.02",
    bay: "A.02",
    meta: "Appalachia signal",
    genre: "online RPG",
    hours: "3,863h played",
    favoriteRank: "main save",
    badges: ["live-service", "base-builder", "community"],
    serial: "SN//1151340",
    image: "/games/fallout-76-poster-card.webp",
    logo: "/games/fallout-76-logo.png",
    character: "/games/fallout-76-power-armor-card.webp",
    review: `As someone who has spent more than 1,800 hours in Fallout 76, I can confidently say that it is a game that has improved significantly since its initial launch.

At first, there were many bugs and performance issues that made the game difficult to enjoy. But as Bethesda has released updates and patches, the game has become much more stable and has added exciting new features and content.

What I like most about Fallout 76 is the open world. The game lets you explore a vast and detailed post-apocalyptic world full of quests, random encounters, and danger around every corner. You can also build and customize your own base, which adds an extra layer of gameplay and strategy.

I also enjoy the multiplayer mechanics in Fallout 76. You can join groups with other players to complete missions together, trade items, and simply explore the world. The online community is also quite active and friendly, which makes playing with others even more fun.

Of course, it is not a perfect game. There are still some bugs and minor performance issues, although nothing that truly ruins the gameplay experience. Also, some missions can become a little repetitive after a while, but that is to be expected in any open-world game.

Overall, if you are a fan of open-world games and post-apocalyptic settings, I would definitely recommend giving Fallout 76 a chance. With its huge world, multiplayer mechanics, continuous updates, and new content, it is a game that is truly worth exploring.`,
    accent: "vault"
  },
  {
    title: "Red Dead Redemption II",
    appId: "1174180",
    kicker: "FAVORITE.03",
    bay: "A.03",
    meta: "Van der Linde signal",
    genre: "western adventure",
    hours: "2,399h played",
    favoriteRank: "legendary cart",
    badges: ["open-world", "cinematic", "comfort replay"],
    serial: "SN//1174180",
    image: "/games/rdr2-cover-card.webp",
    logo: "/games/rdr2-logo.png",
    character: "/games/rdr2-arthur-card.webp",
    review: `The best game in the history of the sector regardless of the genre we are talking about, it is a masterpiece from beginning to end.
When you play it you know and notice perfectly the 8 years of development, because this work simply has no rival at all levels it covers.
A game set in the western, in the year 1899 in the interior of America, is the time of the decline of the old west, and I love this. Technical design, graphics, physics, masterful soundtrack, setting, narrative, characters from the entire campaign with their own character and a wonderful independent charisma, very top artificial intelligence, a crazy fauna, a world totally alive and with limitless exploration, it does not lack mystery, gameplay and outstanding entertainment.
The Spanish dubbing would have been cool but when you play it you understand perfectly why it is better if it is not translated into any language, the level of care and pampering that this game has is excessively demanding, and dubbing the title in a certain way does not go with the narration of the title.
Everything that is said about Red Dead Redemption 2 is little, you don't really play it, you live it when you play it, you get excited and you always want to be Arthur, you don't want to abandon him, you empathize so much with him that it makes you angry to leave him. A true simulator of being a cowboy in a totally alive world and realism in its purest form.
It is not a matter of personal taste to say that it is the best game in history to date, it is objectivity, preference is one thing and being objective is another, and objectively there is no title that unfortunately casts a shadow on it.`,
    accent: "outlaw"
  }
];

export const projects = [
  {
    title: "TradeDex",
    kicker: "01",
    visual: "tradedex",
    image: "/projects/tradedex-card.webp",
    href: "https://github.com/Daiivr/TradeDex/releases/latest",
    repoHref: "https://github.com/Daiivr/TradeDex",
    badge: "v1.10",
    status: "vt digest lookup",
    virusTotal: {
      state: "unavailable",
      detections: 0
    },
    channel: "open-source // main",
    description:
      "Open-source Discord bot work around SysBot.NET trading workflows, queue control, event drops, PKHeX-adjacent checks, and a monitor-style presentation layer.",
    tags: ["C#", ".NET", "Discord.NET", "SysBot.NET", "PKHeX"],
    meta: "Pokemon trade queues // Discord automation",
    stats: [
      ["issues", "0"],
      ["stars", "1"],
      ["forks", "0"]
    ],
    modal: {
      type: "download",
      path: "~/tradedex",
      title: "TradeDex .exe",
      label: "VirusTotal safety check",
      description: "Checks the SHA-256 published with the latest GitHub release against VirusTotal. This website never downloads or uploads the release file.",
      release: "v1.10",
      asset: "98 MB",
      sha: "a0ce3a88...13cdacad",
      engines: "lookup pending",
      progress: 100,
      verdict: "CHECKING REPORT",
      status: "Waiting for VirusTotal",
      command: "tradedex verify --release latest --digest-only",
      terminal: [
        ["init scanner", "OK"],
        ["resolve asset metadata", "OK", "TradeDex_1.10.exe · 98 MB"],
        ["read GitHub sha-256", "OK", "a0ce3a88...13cdacad"],
        ["query virustotal", "OK"]
      ],
      primaryAction: "Open release",
      secondaryAction: "Open repo"
    }
  },
  {
    title: "Palwatch",
    kicker: "02",
    visual: "palwatch",
    image: "/projects/palwatch-logo.png",
    href: "https://github.com/Daiivr/Palwatch-Live-Server-Map",
    repoHref: "https://github.com/Daiivr/Palwatch-Live-Server-Map#readme",
    badge: "main",
    status: "open source",
    channel: "open-source // main",
    description:
      "Responsive Palworld dedicated-server map with live players, guild-owned PalBoxes, searchable locations, privacy-focused server-side REST access, and desktop/mobile controls.",
    tags: ["TypeScript", "React", "MapLibre GL", "Cloudflare Workers", "Vinext"],
    meta: "live players // guild bases // private REST bridge",
    stats: [
      ["issues", "0"],
      ["stars", "0"],
      ["forks", "0"]
    ],
    modal: {
      type: "site",
      path: "~/palwatch",
      title: "Palwatch",
      label: "live server map",
      description: "A privacy-focused Palworld live map that keeps server credentials behind the backend while presenting player, guild-base, location, resource, NPC, and Pal data.",
      previewImage: "https://raw.githubusercontent.com/Daiivr/Palwatch-Live-Server-Map/main/docs/screenshots/palwatch-desktop.jpg",
      endpoint: "github.com/Daiivr/Palwatch-Live-Server-Map",
      repo: "Daiivr/Palwatch-Live-Server-Map",
      status: "repository online",
      systems: [
        ["player radar", "live server positions"],
        ["guild PalBoxes", "owned base markers"],
        ["map layers", "Palpagos + World Tree"],
        ["privacy bridge", "server-side REST auth"]
      ],
      primaryAction: "Open repository",
      secondaryAction: "Read documentation"
    }
  }
];

export const signals = [
  {
    title: "profile.md",
    body: "Full-stack dev, bilingual EN/ES, happiest around bots, tooling, and interfaces that feel custom-built."
  },
  {
    title: "game-room",
    body: "Fallout, Minecraft, VRChat, DBD, anime, lo-fi, and late-night coding inform the mood without overwhelming the work."
  },
  {
    title: "build-log",
    body: "Current direction: make the fun more intentional, the hierarchy cleaner, and the project architecture easier to grow."
  }
];

export const systems = [
  {
    number: "01",
    title: "Personal first",
    body: "The site reads like Dai's room before it reads like a pitch: status notes, favorite worlds, build logs, and command-line details."
  },
  {
    number: "02",
    title: "Arcade, not chaos",
    body: "Cabinet panels, scanlines, pixel labels, and terminal states repeat carefully so the theme feels intentional."
  },
  {
    number: "03",
    title: "Easy to keep alive",
    body: "New notes, favorites, builds, and commands live in data files so this can grow like a personal website should."
  }
];

export const stack = [
  {
    title: "Front-end craft",
    body: "Custom interfaces that feel good to use, from the first click to the smallest animation.",
    tags: ["Responsive UI", "Accessibility", "Motion"]
  },
  {
    title: "Bots + tooling",
    body: "Discord bots and control panels that keep queues moving and communities running.",
    tags: ["Discord", "Queue flows", "Automation"]
  },
  {
    title: "Game-adjacent UX",
    body: "The personality of a game menu, built into practical tools for the web.",
    tags: ["Inventories", "Launchers", "Terminals"]
  },
  {
    title: "Shipping hygiene",
    body: "Small, maintainable builds with clear structure and a final check in the browser.",
    tags: ["Semantic HTML", "Modular JS", "Browser QA"]
  }
];

