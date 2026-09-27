export const projectStories = {
  TradeDex: {
    slug: "tradedex",
    eyebrow: "DISCORD AUTOMATION / C# + .NET",
    headline: "A trading workflow that belongs in the community.",
    problem: "A trading community needs a clear way to request trades, follow a queue, and understand what the bot is doing. Those steps need to work together inside Discord.",
    contribution: "TradeDex brings Discord commands, queue control, event drops, and SysBot.NET trading workflows together, with a monitor-style presentation layer and PKHeX-adjacent checks.",
    workflow: ["A member starts a request through Discord.", "Queue controls organize the trading workflow.", "Bot status and responses keep the process visible to the community."],
    outcome: "An open-source tool built around community trading operations. The repository and releases are available to inspect and try; deployment depends on your own bot and trading setup.",
    imageCaption: "TradeDex project artwork",
    focus: ["Queue visibility", "Discord-native interactions", "Open-source tooling"]
  },
  Palwatch: {
    slug: "palwatch",
    eyebrow: "LIVE MAP / TYPESCRIPT + REACT",
    headline: "A shared view of the server, with credentials kept behind it.",
    problem: "A Palworld server has activity spread across players, guild bases, and a large world. A useful map needs to bring that context together without exposing server credentials to the browser.",
    contribution: "Palwatch combines a React interface and MapLibre GL with a server-side REST bridge. It presents live player positions, guild PalBoxes, map layers, and location, resource, NPC, and Pal information.",
    workflow: ["The backend connects to the server through a private REST bridge.", "The map brings players, guild bases, and world information into one view.", "Visitors explore the layers relevant to their session."],
    outcome: "A privacy-focused, open-source live map for server communities. The repository includes setup documentation and a desktop preview of the interface.",
    imageCaption: "Palwatch desktop interface · repository screenshot",
    focus: ["Live world context", "Map exploration", "Server-side credentials"]
  }
};
