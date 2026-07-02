import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const VISITS_FILE = join(process.cwd(), "data", "visits.json");

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function ensureVisitsFile() {
  const dir = dirname(VISITS_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(VISITS_FILE)) writeFileSync(VISITS_FILE, JSON.stringify({ count: 0 }, null, 2), "utf8");
}

function readVisits() {
  ensureVisitsFile();
  try {
    const data = JSON.parse(readFileSync(VISITS_FILE, "utf8"));
    if (typeof data.count !== "number" || data.count < 0) return { count: 0 };
    return data;
  } catch (error) {
    console.error("Visits read error", error.message || error);
    return { count: 0 };
  }
}

function writeVisits(data) {
  ensureVisitsFile();
  try {
    writeFileSync(VISITS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Visits write error", error.message || error);
  }
}

export async function handleVisitsRequest(request, response) {
  const url = new URL(request.url || "/", "http://localhost");
  const parts = url.pathname.replace(/^\/api\/visits\/?/, "").split("/").filter(Boolean);

  if (request.method === "GET" && parts.length === 0) {
    sendJson(response, 200, readVisits());
    return;
  }

  if (request.method === "POST" && parts.length === 1 && parts[0] === "hit") {
    const data = readVisits();
    data.count += 1;
    writeVisits(data);
    sendJson(response, 200, data);
    return;
  }

  sendJson(response, 404, { error: "Visits route not found." });
}
