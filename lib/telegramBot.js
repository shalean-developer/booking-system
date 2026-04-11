/**
 * Standalone Telegram bot (polling). Run: node lib/telegramBot.js
 * Requires TELEGRAM_BOT_TOKEN in .env.local (or non-empty .env for shared defaults).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * True if file is missing, unreadable, whitespace-only, or has no KEY=value lines.
 */
function isEnvFileEmptyOrCommentOnly(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return true;
    return !raw.split("\n").some((line) => {
      const t = line.trim();
      return t && !t.startsWith("#") && /^[A-Za-z_][A-Za-z0-9_]*=/.test(t);
    });
  } catch {
    return true;
  }
}

function envPath(name) {
  return path.join(root, name);
}

/**
 * Load env: optional non-empty `.env`, then `.env.local` (primary overrides).
 */
function loadEnv() {
  const loaded = [];

  const dotEnvPath = envPath(".env");
  if (fs.existsSync(dotEnvPath) && !isEnvFileEmptyOrCommentOnly(dotEnvPath)) {
    dotenv.config({ path: dotEnvPath });
    loaded.push(".env");
  } else if (fs.existsSync(dotEnvPath)) {
    console.log("[telegram-bot] Skipping empty .env (no variables to load)");
  }

  const localPath = envPath(".env.local");
  if (fs.existsSync(localPath) && !isEnvFileEmptyOrCommentOnly(localPath)) {
    dotenv.config({ path: localPath, override: true });
    loaded.push(".env.local");
  } else if (fs.existsSync(localPath)) {
    console.log("[telegram-bot] Skipping empty .env.local (no variables to load)");
  }

  console.log(
    `[telegram-bot] Env files considered: ${loaded.length ? loaded.join(" → ") : "(none with variables)"}`
  );
}

/**
 * Log token presence without exposing the secret (Telegram tokens look like 123456:ABC...).
 */
function maskToken(t) {
  if (!t || t.length <= 10) return "(set, hidden)";
  return t.includes(":")
    ? `${t.split(":")[0]}:***`
    : `${t.slice(0, 4)}***`;
}

function logTokenStatus(token, { fromLegacyBotToken = false } = {}) {
  if (!token) {
    console.log("[telegram-bot] TELEGRAM_BOT_TOKEN: not set");
    return;
  }
  const m = maskToken(token);
  if (fromLegacyBotToken) {
    console.log(
      `[telegram-bot] TELEGRAM_BOT_TOKEN: not set — using BOT_TOKEN instead (${m}). Rename to TELEGRAM_BOT_TOKEN in .env.local.`
    );
  } else {
    console.log(`[telegram-bot] TELEGRAM_BOT_TOKEN: loaded (${m})`);
  }
}

loadEnv();

let token = process.env.TELEGRAM_BOT_TOKEN;
let fromLegacyBotToken = false;
if (!token && process.env.BOT_TOKEN) {
  token = process.env.BOT_TOKEN;
  fromLegacyBotToken = true;
}

logTokenStatus(token, { fromLegacyBotToken });

if (!token) {
  console.error(
    "[telegram-bot] Error: TELEGRAM_BOT_TOKEN is missing. Add it to .env.local (recommended) or a non-empty .env."
  );
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const MOCK_BOOKINGS = [
  { id: "BK-1001", service: "Deep clean", when: "Apr 12, 2026 · 10:00" },
  { id: "BK-1002", service: "Standard clean", when: "Apr 15, 2026 · 14:00" },
  { id: "BK-1003", service: "Move-out", when: "Apr 18, 2026 · 09:00" },
];

function formatMockBookings() {
  const lines = MOCK_BOOKINGS.map(
    (b, i) => `${i + 1}. ${b.id} — ${b.service} — ${b.when}`
  );
  return `📋 Mock bookings\n\n${lines.join("\n")}`;
}

bot.on("message", (msg) => {
  const preview = msg.text
    ? msg.text.length > 200
      ? `${msg.text.slice(0, 200)}…`
      : msg.text
    : `(non-text: ${msg.sticker ? "sticker" : msg.photo ? "photo" : "other"})`;
  console.log("[telegram-bot] Incoming message:", {
    chatId: msg.chat.id,
    from: msg.from?.username ?? msg.from?.id,
    text: preview,
  });
});

bot.onText(/^\/start(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id, "Bot is working ✅");
});

bot.onText(/^\/test(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id, "System is running 🚀");
});

bot.onText(/^\/bookings(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id, formatMockBookings());
});

bot.on("polling_error", (err) => {
  console.error("[telegram-bot] Polling error:", err?.message || err);
});

console.log("[telegram-bot] Bot started successfully · polling enabled · commands: /start /test /bookings");

export default bot;
