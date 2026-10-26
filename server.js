// Marmat.ai — Node.js web server (no external dependencies)
// Serves the marketing site from ./public and handles demo requests at POST /api/contact.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const MAX_BODY_BYTES = 10 * 1024; // 10 KB

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; " +
    "font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; " +
    "connect-src 'self'; frame-ancestors 'none'",
};

// ---------- Helpers ----------

function send(res, status, headers, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, { "Content-Type": "application/json; charset=utf-8" }, JSON.stringify(payload));
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]", "utf8");
}

function saveLead(lead) {
  ensureDataFile();
  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8") || "[]");
  leads.push(lead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function validateContact(data) {
  const errors = [];
  const clean = {
    name: String(data.name || "").trim().slice(0, 120),
    email: String(data.email || "").trim().slice(0, 160),
    company: String(data.company || "").trim().slice(0, 160),
  };

  if (!clean.name) errors.push("Name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) errors.push("A valid email is required.");

  return { errors, clean };
}

// ---------- Route handlers ----------

async function handleContact(req, res) {
  let data;
  try {
    const raw = await readBody(req);
    data = JSON.parse(raw || "{}");
  } catch (err) {
    const status = err.status || 400;
    return sendJson(res, status, { ok: false, error: status === 413 ? "Request too large." : "Invalid JSON." });
  }

  const { errors, clean } = validateContact(data);
  if (errors.length) {
    return sendJson(res, 422, { ok: false, errors });
  }

  const lead = {
    id: randomUUID(),
    ...clean,
    createdAt: new Date().toISOString(),
    userAgent: req.headers["user-agent"] || "",
  };

  try {
    saveLead(lead);
  } catch (err) {
    console.error("Failed to save lead:", err);
    return sendJson(res, 500, { ok: false, error: "Could not save your request. Please try again." });
  }

  console.log(`New demo request: ${lead.name} <${lead.email}> ${lead.company}`);
  return sendJson(res, 201, {
    ok: true,
    message: `Thanks ${lead.name}! Our team will contact you shortly to schedule your demo.`,
  });
}

function serveStatic(req, res, pathname) {
  // Map "/" to index.html and block path traversal
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));

  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    return send(res, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const notFound = path.join(PUBLIC_DIR, "index.html");
      return fs.readFile(notFound, (e, data) => {
        if (e) return send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
        send(res, 404, { "Content-Type": MIME_TYPES[".html"] }, data);
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || "application/octet-stream";
    const cacheControl = ext === ".html" ? "no-cache" : "public, max-age=3600";

    res.writeHead(200, {
      ...SECURITY_HEADERS,
      "Content-Type": type,
      "Content-Length": stats.size,
      "Cache-Control": cacheControl,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ---------- Server ----------

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    if (pathname === "/api/health" && req.method === "GET") {
      return sendJson(res, 200, { ok: true, uptime: process.uptime() });
    }

    if (pathname === "/api/contact") {
      if (req.method !== "POST") {
        return sendJson(res, 405, { ok: false, error: "Method not allowed." });
      }
      return await handleContact(req, res);
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { ok: false, error: "Method not allowed." });
    }

    return serveStatic(req, res, decodeURIComponent(pathname));
  } catch (err) {
    console.error("Unhandled error:", err);
    return sendJson(res, 500, { ok: false, error: "Internal server error." });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Marmat.ai running at http://localhost:${PORT}`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
