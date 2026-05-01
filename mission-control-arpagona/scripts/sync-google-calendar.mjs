import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const HOME = os.homedir();
const WORKSPACE_ROOT = "/home/thibaud/.openclaw/workspace";
const APP_ROOT = path.join(WORKSPACE_ROOT, "mission-control-arpagona");
const CONFIG_DIR = path.join(HOME, ".config", "mission-control");
const CREDENTIALS_PATH = path.join(CONFIG_DIR, "google-oauth.json");
const TOKEN_PATH = path.join(CONFIG_DIR, "google-token.json");
const OUTPUT_PATH = path.join(WORKSPACE_ROOT, "state", "calendar.json");
const DEFAULT_TIME_MIN = new Date().toISOString();
const DEFAULT_TIME_MAX = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function loadSavedCredentialsIfExist() {
  try {
    const [tokenRaw, credentialsRaw] = await Promise.all([
      fs.readFile(TOKEN_PATH, "utf8"),
      fs.readFile(CREDENTIALS_PATH, "utf8"),
    ]);

    const token = JSON.parse(tokenRaw);
    const credentials = JSON.parse(credentialsRaw);
    const key = credentials.installed || credentials.web;

    if (!key?.client_id || !key?.client_secret) {
      return null;
    }

    const client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      key.redirect_uris?.[0] || "http://localhost"
    );

    client.setCredentials(token);
    return client;
  } catch {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH, "utf8");
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;

  if (!key) {
    throw new Error("Unsupported Google OAuth credentials file. Expected installed or web client.");
  }

  const payload = JSON.stringify(
    {
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    },
    null,
    2
  );

  await fs.writeFile(TOKEN_PATH, payload, "utf8");
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) return client;

  const auth = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  if (auth.credentials) {
    await saveCredentials(auth);
  }

  return auth;
}

function normalizeEvent(event, calendarLabel) {
  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;

  if (!event.id || !start || !event.summary) return null;

  return {
    id: `${calendarLabel}:${event.id}`,
    title: event.summary,
    start,
    end,
    status: event.status || "confirmed",
    location: event.location || undefined,
    notes: event.description || undefined,
    source: `google-calendar:${calendarLabel}`,
  };
}

async function main() {
  await ensureDir(CONFIG_DIR);

  try {
    await fs.access(CREDENTIALS_PATH);
  } catch {
    throw new Error(
      [
        `Missing Google OAuth credentials: ${CREDENTIALS_PATH}`,
        "Create a Google Cloud OAuth Desktop App client and save the downloaded JSON there.",
      ].join("\n")
    );
  }

  const auth = await authorize();
  const calendar = google.calendar({ version: "v3", auth });

  const forcedCalendarId = process.env.GOOGLE_CALENDAR_ID || "";
  const timeMin = process.env.GOOGLE_CALENDAR_TIME_MIN || DEFAULT_TIME_MIN;
  const timeMax = process.env.GOOGLE_CALENDAR_TIME_MAX || DEFAULT_TIME_MAX;
  const maxResults = Number(process.env.GOOGLE_CALENDAR_MAX_RESULTS || 100);

  const calendarListResponse = await calendar.calendarList.list();
  const visibleCalendars = (calendarListResponse.data.items || []).filter((item) => {
    if (!item.id) return false;
    if (forcedCalendarId) return item.id === forcedCalendarId;
    return item.selected !== false && item.accessRole !== "freeBusyReader";
  });

  const eventResponses = await Promise.all(
    visibleCalendars.map(async (item) => {
      const response = await calendar.events.list({
        calendarId: item.id,
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: "startTime",
      });

      const label = item.summaryOverride || item.summary || item.id;
      return (response.data.items || []).map((event) => normalizeEvent(event, label)).filter(Boolean);
    })
  );

  const events = eventResponses
    .flat()
    .sort((a, b) => a.start.localeCompare(b.start));

  const output = {
    meta: {
      name: "Mission Control Calendar",
      timezone: "Europe/Paris",
      description: "Canonical local calendar source for Mission Control ARPAGONA. Real events only.",
      syncedAt: new Date().toISOString(),
      source: forcedCalendarId ? `google-calendar:${forcedCalendarId}` : "google-calendar:all-visible",
      calendars: visibleCalendars.map((item) => ({
        id: item.id,
        title: item.summaryOverride || item.summary || item.id,
      })),
      appRoot: APP_ROOT,
    },
    events,
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Synced ${events.length} events from ${visibleCalendars.length} calendar(s) to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
