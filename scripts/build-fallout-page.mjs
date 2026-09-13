import { mkdir, readFile, writeFile } from "node:fs/promises";

// A real HTML entry supports direct requests on the Node host and static
// directory hosts, and makes metadata visible before JavaScript executes.
const description = "Dai's Fallout 76 intelligence terminal: nuclear launch codes, Minerva's schedule and inventory, monthly axolotls, and wasteland events.";
const html = (await readFile(new URL("../dist/index.html", import.meta.url), "utf8"))
  .replace(/<title>.*?<\/title>/, "<title>Fallout Terminal | daivr.dev</title>")
  .replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/, `$1${description}$2`)
  .replace(/<link\s+rel="preload"\s+as="image"[^>]*>/g, "")
  .replace(/<\/head>/, `    <link rel="canonical" href="https://daivr.dev/fallout" />
    <meta property="og:title" content="Fallout Terminal | daivr.dev" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="https://daivr.dev/fallout" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
  </head>`);
await mkdir(new URL("../dist/fallout/", import.meta.url), { recursive: true });
await writeFile(new URL("../dist/fallout/index.html", import.meta.url), html);
console.log("Built /fallout HTML entry and metadata.");
