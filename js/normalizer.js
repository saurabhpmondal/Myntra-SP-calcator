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

  STORE.normalized.products = rows.map(row => ({
    styleId: text(
      row.style_id ||
      row.styleid
    ),

    launchDate: text(
      row.launch_date
    ),

    liveDate: text(
      row.live_date
    ),

    erpSku: text(
      row.erp_sku ||
      row.sku
    ),

    brand: text(
      row.brand
    ),

    articleType: text(
      row.article_type ||
      row.article
    ),

    status: text(
      row.status
    ),

    mrp: num(
      row.mrp
    ),

    tp: num(
      row.tp
    )
  }))
  .filter(item => item.styleId);
}


/* ----------------------------------
   COMMERCIALS
-----------------------------------*/
function normalizeCommercials() {
  const rows = STORE.raw.commercials || [];

  STORE.normalized.commercials = rows.map(row => ({
    brand: text(row.brand).toLowerCase(),
    articleType: text(row.article_type).toLowerCase(),

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
    articleType: text(row.article_type).toLowerCase(),
    level: text(row.level).toLowerCase(),

    lower: num(row.lower_limit),
    upper: num(row.upper_limit),

    range: text(row.range),
    gtaCharges: num(row.gta_charges)
  }));
}


/* ----------------------------------
   RTV MAP
   return% = returned / orders *100
-----------------------------------*/
function buildRtvMap() {
  const orders = STORE.raw.orders || [];
  const returnsData = STORE.raw.returns || [];

  const orderLineToStyle = {};
  const orderCount = {};
  const returnCount = {};

  /* orders sheet */
  orders.forEach(row => {
    const styleId = text(
      row.style_id ||
      row.styleid ||
      row.style_id_
    );

    const orderLineId = text(
      row.order_line_id ||
      row.order_lineid ||
      row.order_line_id_fk ||
      row.order_line_id_
    );

    if (!styleId) return;

    orderCount[styleId] = (orderCount[styleId] || 0) + 1;

    if (orderLineId) {
      orderLineToStyle[orderLineId] = styleId;
    }
  });

  /* returns sheet */
  returnsData.forEach(row => {
    const orderLineId = text(
      row.order_line_id ||
      row.orderlineid
    );

    if (!orderLineId) return;

    const styleId = orderLineToStyle[orderLineId];

    if (!styleId) return;

    returnCount[styleId] = (returnCount[styleId] || 0) + 1;
  });

  const rtvMap = {};

  Object.keys(orderCount).forEach(styleId => {
    const totalOrders = orderCount[styleId] || 0;
    const totalReturns = returnCount[styleId] || 0;

    let rtv = CONFIG.COSTS.DEFAULT_RTV_PERCENT;

    if (totalOrders > 0) {
      rtv = (totalReturns / totalOrders) * 100;
    }

    rtvMap[styleId] = round2(rtv);
  });

  STORE.normalized.rtvMap = rtvMap;
}


/* ----------------------------------
   LOOKUP HELPERS
-----------------------------------*/
export function getProductByStyle(styleId) {
  const id = text(styleId);

  return STORE.normalized.products.find(
    item => item.styleId === id
  ) || null;
}

export function getProductBySku(erpSku) {
  const sku = text(erpSku).toLowerCase();

  return STORE.normalized.products.find(
    item => item.erpSku.toLowerCase() === sku
  ) || null;
}

export function getRtv(styleId) {
  return STORE.normalized.rtvMap[styleId]
    ?? CONFIG.COSTS.DEFAULT_RTV_PERCENT;
}


/* ----------------------------------
   MATCH COMMERCIALS BY BRAND/ARTICLE/SP
-----------------------------------*/
export function findCommercial(brand, articleType, sellerPrice) {
  const b = text(brand).toLowerCase();
  const a = text(articleType).toLowerCase();
  const sp = num(sellerPrice);

  return STORE.normalized.commercials.find(row =>
    row.brand === b &&
    row.articleType === a &&
    sp >= row.lower &&
    sp <= row.upper
  ) || null;
}


/* ----------------------------------
   MATCH GTA
-----------------------------------*/
export function findGta(brand, articleType, level, customerSp) {
  const b = text(brand).toLowerCase();
  const a = text(articleType).toLowerCase();
  const l = text(level).toLowerCase();
  const sp = num(customerSp);

  return STORE.normalized.gta.find(row =>
    row.brand === b &&
    row.articleType === a &&
    row.level === l &&
    sp >= row.lower &&
    sp <= row.upper
  ) || null;
}


/* ----------------------------------
   UTILS
-----------------------------------*/
function round2(v) {
  return Math.round((Number(v) + Number.EPSILON) * 100) / 100;
}