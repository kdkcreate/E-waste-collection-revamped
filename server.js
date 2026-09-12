"use strict";

const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATABASE_DIRECTORY = path.join(ROOT, "private");
const DATABASE_PATH = path.join(DATABASE_DIRECTORY, "novara.sqlite");
const MAX_BODY_BYTES = 100_000;
const MIME_TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };

function loadKey() {
  const source = process.env.NOVARA_DATA_KEY;
  if (!source) throw new Error("NOVARA_DATA_KEY is required. Generate a 32-byte base64 key before running the service.");
  const key = Buffer.from(source, "base64");
  if (key.length !== 32) throw new Error("NOVARA_DATA_KEY must be exactly 32 bytes when decoded from base64.");
  return key;
}

const encryptionKey = loadKey();
fs.mkdirSync(DATABASE_DIRECTORY, { recursive: true });
const database = new DatabaseSync(DATABASE_PATH);
database.exec(`CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('estimate', 'order')),
  created_at TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  ciphertext TEXT NOT NULL
)`);
const insertSubmission = database.prepare("INSERT INTO submissions (id, kind, created_at, iv, auth_tag, ciphertext) VALUES (?, ?, ?, ?, ?, ?)");

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const part of request) {
    body += part;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("Request is too large.");
  }
  try { return JSON.parse(body); } catch { throw new Error("Request must contain valid JSON."); }
}

function encrypt(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return { iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") };
}

function store(kind, payload) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const encrypted = encrypt(payload);
  insertSubmission.run(id, kind, createdAt, encrypted.iv, encrypted.authTag, encrypted.ciphertext);
  return id;
}

function validString(value, maxLength) { return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength; }

function validateEstimate(data) {
  const validDevices = new Set(["smartphone", "laptop", "tablet", "desktop", "smartwatch", "console", "other"]);
  const validDamage = new Set(["minor", "moderate", "severe", "nonworking"]);
  return data && validDevices.has(data.deviceType) && validDamage.has(data.damageLevel) && Number.isInteger(data.usageMonths) && data.usageMonths >= 0 && data.usageMonths <= 180 && validString(data.damageDescription, 500) && (!data.modelName || typeof data.modelName === "string");
}

function validateOrder(data) {
  const customer = data && data.customer;
  return validateEstimate(data && data.estimate) && customer && validString(customer.customerName, 80) && validString(customer.customerEmail, 120) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.customerEmail) && validString(customer.customerPhone, 30) && validString(customer.customerCity, 80);
}

async function serveFile(request, response) {
  const urlPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const relativePath = urlPath === "/" ? "main web.html" : urlPath.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relativePath);
  if (!filePath.startsWith(`${ROOT}${path.sep}`) || filePath.includes(`${path.sep}private${path.sep}`)) return json(response, 403, { error: "Forbidden" });
  const mimeType = MIME_TYPES[path.extname(filePath).toLowerCase()];
  if (!mimeType) return json(response, 404, { error: "Not found" });
  try {
    const content = await fsp.readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeType, "X-Content-Type-Options": "nosniff" });
    response.end(content);
  } catch { json(response, 404, { error: "Not found" }); }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/estimates") {
      const estimate = await readJson(request);
      if (!validateEstimate(estimate)) return json(response, 400, { error: "Invalid estimate data." });
      return json(response, 201, { reference: store("estimate", estimate) });
    }
    if (request.method === "POST" && request.url === "/api/orders") {
      const order = await readJson(request);
      if (!validateOrder(order)) return json(response, 400, { error: "Invalid order data." });
      return json(response, 201, { reference: store("order", order) });
    }
    if (request.method === "GET" || request.method === "HEAD") return serveFile(request, response);
    json(response, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    json(response, 500, { error: "Secure service error." });
  }
});

server.listen(PORT, () => console.log(`NOVARA is running at http://localhost:${PORT}`));
