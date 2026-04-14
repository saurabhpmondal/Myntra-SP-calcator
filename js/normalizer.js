// js/normalizer.js

import { STORE, CONFIG, num, text } from "./config.js";

/* ----------------------------------
   PUBLIC
-----------------------------------*/
export function normalizeAllData() {
  normalizeProducts();
  normalizeCommercials();
  normalizeGta();
  buildRtvMap();
}

/* ----------------------------------
   PRODUCTS
-----------------------------------*/
function normalizeProducts() {
  const rows = STORE.raw.productMaster || [];

  STORE.normalized.products = rows
    .map(row => ({
      styleId: cleanStyleId(
        row.style_id ||
        row.styleid
      ),

      launchDate: text(row.launch_date),
      liveDate: text(row.live_date),

      erpSku: text(
        row.erp_sku ||
        row.sku
      ),

      brand: text(row.brand),

      articleType: text(
        row.article_type ||
        row.article
      ),

      status: text(row.status),

      mrp: num(row.mrp),
      tp: num(row.tp)
    }))
    .filter(item =>
      isValidStyle(item.styleId)
    );
}

/* ----------------------------------
   COMMERCIALS
-----------------------------------*/
function normalizeCommercials() {
  const rows = STORE.raw.commercials || [];

  STORE.normalized.commercials = rows.map(row => ({
    brand: text(row.brand).toLowerCase(),
    articleType: text(
      row.article_type
    ).toLowerCase(),

    lower: num(row.lower_limit),
    upper: num(row.upper_limit),

    commission: num(row.commission),
    level: text(row.level),

    royalty: num(row.royalty),
    marketing: num(row.marketing),

    pickPack: num(row.pick_and_pack),
    returnFee: num(row.return_fee),
    fixedFee: num(row.fixed_fee)
  }));
}

/* ----------------------------------
   GTA
-----------------------------------*/
function normalizeGta() {
  const rows = STORE.raw.gta || [];

  STORE.normalized.gta = rows.map(row => ({
    brand: text(row.brand).toLowerCase(),

    articleType: text(
      row.article_type
    ).toLowerCase(),

    level: text(row.level).toLowerCase(),

    lower: num(row.lower_limit),
    upper: num(row.upper_limit),

    range: text(row.range),

    gtaCharges: num(row.gta_charges)
  }));
}

/* ----------------------------------
   RTV MAP
-----------------------------------*/
function buildRtvMap() {
  const orders = STORE.raw.orders || [];
  const returnsData = STORE.raw.returns || [];

  const orderLineMap = {};
  const orderCount = {};
  const returnCount = {};

  orders.forEach(row => {
    const styleId = cleanStyleId(
      row.style_id ||
      row.styleid
    );

    const orderLine = text(
      row.order_line_id ||
      row.orderlineid
    );

    if (!isValidStyle(styleId)) return;

    orderCount[styleId] =
      (orderCount[styleId] || 0) + 1;

    if (orderLine) {
      orderLineMap[orderLine] = styleId;
    }
  });

  returnsData.forEach(row => {
    const orderLine = text(
      row.order_line_id ||
      row.orderlineid
    );

    if (!orderLine) return;

    const styleId =
      orderLineMap[orderLine];

    if (!styleId) return;

    returnCount[styleId] =
      (returnCount[styleId] || 0) + 1;
  });

  const rtvMap = {};

  Object.keys(orderCount).forEach(id => {
    const o = orderCount[id] || 0;
    const r = returnCount[id] || 0;

    let pct =
      CONFIG.COSTS.DEFAULT_RTV_PERCENT;

    if (o > 0) {
      pct = (r / o) * 100;
    }

    rtvMap[id] = round2(pct);
  });

  STORE.normalized.rtvMap = rtvMap;
}

/* ----------------------------------
   LOOKUPS
-----------------------------------*/
export function getProductByStyle(styleId) {
  const id = cleanStyleId(styleId);

  return STORE.normalized.products.find(
    x => x.styleId === id
  ) || null;
}

export function getProductBySku(sku) {
  const key = text(sku).toLowerCase();

  return STORE.normalized.products.find(
    x => x.erpSku.toLowerCase() === key
  ) || null;
}

export function getRtv(styleId) {
  const id = cleanStyleId(styleId);

  return (
    STORE.normalized.rtvMap[id] ??
    CONFIG.COSTS.DEFAULT_RTV_PERCENT
  );
}

export function findCommercial(
  brand,
  articleType,
  sellerPrice
) {
  const b = text(brand).toLowerCase();
  const a = text(articleType).toLowerCase();
  const sp = num(sellerPrice);

  return STORE.normalized.commercials.find(
    row =>
      row.brand === b &&
      row.articleType === a &&
      sp >= row.lower &&
      sp <= row.upper
  ) || null;
}

export function findGta(
  brand,
  articleType,
  level,
  customerSp
) {
  const b = text(brand).toLowerCase();
  const a = text(articleType).toLowerCase();
  const l = text(level).toLowerCase();
  const sp = num(customerSp);

  return STORE.normalized.gta.find(
    row =>
      row.brand === b &&
      row.articleType === a &&
      row.level === l &&
      sp >= row.lower &&
      sp <= row.upper
  ) || null;
}

/* ----------------------------------
   HELPERS
-----------------------------------*/
function cleanStyleId(v) {
  return String(v || "")
    .replace(/[^0-9]/g, "")
    .trim();
}

function isValidStyle(v) {
  if (!v) return false;
  if (v === "0") return false;
  return Number(v) > 0;
}

function round2(v) {
  return Math.round(
    (Number(v) + Number.EPSILON) * 100
  ) / 100;
}