// js/data-loader.js

import { CONFIG, STORE, nowTime } from "./config.js";

/* ----------------------------------
   PUBLIC: LOAD ALL SHEETS
-----------------------------------*/
export async function loadAllData() {
  try {
    setStatus("Loading data...");

    const [
      productMaster,
      commercials,
      gta,
      orders,
      returnsData
    ] = await Promise.all([
      fetchCsv(CONFIG.SHEETS.PRODUCT_MASTER),
      fetchCsv(CONFIG.SHEETS.COMMERCIALS),
      fetchCsv(CONFIG.SHEETS.GTA),
      fetchCsv(CONFIG.SHEETS.ORDERS),
      fetchCsv(CONFIG.SHEETS.RETURNS)
    ]);

    STORE.raw.productMaster = productMaster;
    STORE.raw.commercials = commercials;
    STORE.raw.gta = gta;
    STORE.raw.orders = orders;
    STORE.raw.returns = returnsData;

    STORE.meta.loaded = true;
    STORE.meta.loadTime = nowTime();

    setStatus("Data loaded");
    setLoadMeta();

    return true;

  } catch (error) {
    console.error(error);
    setStatus("Load failed");
    return false;
  }
}


/* ----------------------------------
   FETCH CSV
-----------------------------------*/
async function fetchCsv(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch: " + url);
  }

  const text = await response.text();
  return parseCsv(text);
}


/* ----------------------------------
   CSV PARSER
-----------------------------------*/
function parseCsv(csvText) {
  const rows = [];
  const lines = csvText
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);

  if (!lines.length) return [];

  const headers = splitCsvLine(lines[0]).map(cleanHeader);

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = (values[index] || "").trim();
    });

    rows.push(row);
  }

  return rows;
}


/* ----------------------------------
   HANDLE QUOTED CSV VALUES
-----------------------------------*/
function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);

  return result;
}


/* ----------------------------------
   HEADER NORMALIZATION
-----------------------------------*/
function cleanHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[()%]/g, "")
    .replace(/__+/g, "_");
}


/* ----------------------------------
   UI HELPERS
-----------------------------------*/
function setStatus(text) {
  const el = document.getElementById("loadStatus");
  if (el) el.textContent = text;
}

function setLoadMeta() {
  const recordEl = document.getElementById("recordStatus");
  const timeEl = document.getElementById("timeStatus");

  if (recordEl) {
    recordEl.textContent =
      (STORE.raw.productMaster?.length || 0) + " Styles";
  }

  if (timeEl) {
    timeEl.textContent = STORE.meta.loadTime || "--";
  }
}