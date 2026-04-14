// js/calculator.js

import { money, showToast } from "./config.js";
import {
  getProductByStyle,
  getProductBySku
} from "./normalizer.js";
import {
  solvePrice
} from "./pricing-engine.js";

/* ----------------------------------
   INIT
-----------------------------------*/
export function initCalculator() {
  bindEvents();
}


/* ----------------------------------
   EVENTS
-----------------------------------*/
function bindEvents() {
  const calcBtn = document.getElementById("calcBtn");
  const clearBtn = document.getElementById("clearCalcBtn");

  const styleInput = document.getElementById("calcStyleId");
  const skuInput = document.getElementById("calcSku");

  calcBtn?.addEventListener("click", runCalculation);

  clearBtn?.addEventListener("click", clearCalculator);

  styleInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") runCalculation();
  });

  skuInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") runCalculation();
  });
}


/* ----------------------------------
   MAIN CALCULATION
-----------------------------------*/
export function runCalculation() {
  const styleId =
    document.getElementById("calcStyleId")?.value.trim();

  const sku =
    document.getElementById("calcSku")?.value.trim();

  const target =
    Number(
      document.getElementById("profitTarget")?.value || 5
    );

  let product = null;

  if (styleId) {
    product = getProductByStyle(styleId);
  }

  if (!product && sku) {
    product = getProductBySku(sku);
  }

  if (!product) {
    renderMessage("Style / SKU not found.");
    return;
  }

  const result = solvePrice(product, target);

  if (!result) {
    renderMessage("Unable to solve price.");
    return;
  }

  renderResult(result);
  showToast("Calculation done");
}


/* ----------------------------------
   RENDER RESULT
-----------------------------------*/
function renderResult(r) {
  const el = document.getElementById("calcOutput");

  if (!el) return;

  const profitClass =
    r.tpProfitRs >= 0 ? "success" : "danger";

  el.innerHTML = `
    <div class="result-grid">

      <div class="result-box">
        <div class="result-label">Recommended SP</div>
        <div class="result-value">₹${money(r.sp)}</div>
      </div>

      <div class="result-box">
        <div class="result-label">TP</div>
        <div class="result-value">₹${money(r.tp)}</div>
      </div>

      <div class="result-box">
        <div class="result-label">Payout After CODB</div>
        <div class="result-value">₹${money(r.payoutAfterCodb)}</div>
      </div>

      <div class="result-box">
        <div class="result-label">TP Profit</div>
        <div class="result-value ${profitClass}">
          ₹${money(r.tpProfitRs)}
        </div>
      </div>

    </div>

    <div class="breakdown">

      ${row("ERP SKU", r.erpSku)}
      ${row("Style ID", r.styleId)}
      ${row("Brand", r.brand)}
      ${row("Article", r.articleType)}
      ${row("MRP", money(r.mrp))}
      ${row("GT Charge", money(r.gta))}
      ${row("List Price", money(r.listPrice))}

      ${row("Commission %", money(r.commissionPct) + "%")}
      ${row("Commission Rs", money(r.commissionRs))}
      ${row("Fixed Fee", money(r.fixedFee))}
      ${row("Tax on Com + Fixed", money(r.taxOnComFixed))}

      ${row("Upload Settlement", money(r.uploadSettlement))}
      ${row("TDS + TCS", money(r.tdsTcs))}
      ${row("Bank Settlement", money(r.bankSettlement))}

      ${row("Royalty", money(r.royalty))}
      ${row("Marketing", money(r.marketing))}
      ${row("Payout Before CODB", money(r.payoutBeforeCodb))}

      ${row("Dispatch Cost", money(r.dispatchCost))}
      ${row("Return Charge", money(r.returnCharge))}
      ${row("Return Cost", money(r.returnCost))}
      ${row("RTV %", money(r.rtvPct) + "%")}
      ${row("RTV CODB", money(r.rtvCodb))}

      ${row("Payout After CODB", money(r.payoutAfterCodb))}
      ${row("TP Profit %", money(r.tpProfitPct) + "%")}

    </div>
  `;
}


/* ----------------------------------
   HELPERS
-----------------------------------*/
function row(label, value) {
  return `
    <div class="break-row">
      <div>${label}</div>
      <div class="right">${value}</div>
    </div>
  `;
}

function renderMessage(text) {
  const el = document.getElementById("calcOutput");

  if (!el) return;

  el.innerHTML = `
    <div class="empty-box">${text}</div>
  `;
}

function clearCalculator() {
  const styleEl = document.getElementById("calcStyleId");
  const skuEl = document.getElementById("calcSku");

  if (styleEl) styleEl.value = "";
  if (skuEl) skuEl.value = "";

  renderMessage("Search a style and click Calculate.");
}