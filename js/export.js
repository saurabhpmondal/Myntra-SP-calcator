// js/export.js

import { STORE, money, showToast } from "./config.js";
import { solvePrice } from "./pricing-engine.js";

/* ----------------------------------
   INIT
-----------------------------------*/
export function initExport() {
  const btn = document.getElementById("exportBtn");

  btn?.addEventListener("click", exportPricingCsv);
}


/* ----------------------------------
   EXPORT CSV
-----------------------------------*/
function exportPricingCsv() {
  const rows = buildExportRows();

  if (!rows.length) {
    showToast("No rows to export");
    return;
  }

  const csv = arrayToCsv(rows);
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName();
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  showToast("CSV exported");
}


/* ----------------------------------
   BUILD DATA
-----------------------------------*/
function buildExportRows() {
  const target = STORE.ui.currentTarget;
  const search = STORE.ui.searchText;
  const limit = STORE.ui.rowLimit;

  let data = [...STORE.normalized.products];

  if (search) {
    data = data.filter(item =>
      item.erpSku.toLowerCase().includes(search) ||
      item.styleId.toLowerCase().includes(search) ||
      item.brand.toLowerCase().includes(search) ||
      item.articleType.toLowerCase().includes(search)
    );
  }

  data = data.slice(0, limit);

  const rows = [];

  rows.push([
    "ERP SKU",
    "Style ID",
    "Brand",
    "Article",
    "ERP Status",
    "MRP",
    "SP",
    "GT Charge",
    "List Price",
    "Com %",
    "Com Rs",
    "Fixed Fee Rs",
    "Tax on Com+Fixed Fee",
    "Upload Settlement",
    "TDS + TCS",
    "Bank Settlement",
    "Royalty",
    "Marketing",
    "Rebate",
    "Payout Before CODB",
    "Dispatch Cost",
    "Return Charge",
    "Return Cost",
    "RTV CODB",
    "Payout After CODB",
    "TP Profit %",
    "TP Profit Rs",
    "TP",
    "RTV %"
  ]);

  data.forEach(product => {
    const r = solvePrice(product, target);

    if (!r) return;

    rows.push([
      r.erpSku,
      r.styleId,
      r.brand,
      r.articleType,
      r.status,
      money(r.mrp),
      money(r.sp),
      money(r.gta),
      money(r.listPrice),
      money(r.commissionPct),
      money(r.commissionRs),
      money(r.fixedFee),
      money(r.taxOnComFixed),
      money(r.uploadSettlement),
      money(r.tdsTcs),
      money(r.bankSettlement),
      money(r.royalty),
      money(r.marketing),
      money(r.rebate),
      money(r.payoutBeforeCodb),
      money(r.dispatchCost),
      money(r.returnCharge),
      money(r.returnCost),
      money(r.rtvCodb),
      money(r.payoutAfterCodb),
      money(r.tpProfitPct),
      money(r.tpProfitRs),
      money(r.tp),
      money(r.rtvPct)
    ]);
  });

  return rows;
}


/* ----------------------------------
   CSV HELPERS
-----------------------------------*/
function arrayToCsv(rows) {
  return rows
    .map(row =>
      row
        .map(cell => escapeCsv(cell))
        .join(",")
    )
    .join("\n");
}

function escapeCsv(value) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function fileName() {
  const d = new Date();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `myntra_pricing_master_${y}${m}${day}.csv`;
}