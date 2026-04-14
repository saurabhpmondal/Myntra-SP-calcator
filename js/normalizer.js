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
    .filter(item =>
      isValidStyle(item.styleId)
    );
}

/* ----------------------------------
   COMMERCIALS
-----------------------------------*/
function normalizeCommercials() {
  const rows = STORE.raw.commercials || [];

  STORE.normalized.commercials =
    rows.map(row => ({
      brand: text(row.brand).toLowerCase(),
      articleType:
        text(row.article_type).toLowerCase(),

      lower: num(row.lower