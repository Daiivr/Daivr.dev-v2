import { mkdir, readFile, writeFile } from "node:fs/promises";
import { FALLOUT_PAGES } from "../src/fallout/data/pages.js";

// A real HTML entry supports direct requests on the Node host and static
// directory hosts, and makes metadata visible before JavaScript executes.
const entry = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
for (const [path, { title, description }] of Object.entries(FALLOUT_PAGES)) {
  const html = entry
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/, `$1${description}$2`)
    .replace(/<link\s+rel="preload"\s+as="image"[^>]*>/g, "")
    .replace(/<\/head>/, `    <link rel="canonical" href="https://daivr.dev${path}" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:url" content="https://daivr.dev${path}" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
    </head>`);
  await mkdir(new URL(`../dist${path}/`, import.meta.url), { recursive: true });
  await writeFile(new URL(`../dist${path}/index.html`, import.meta.url), html);
  console.log(`Built ${path} HTML entry and metadata.`);
}
