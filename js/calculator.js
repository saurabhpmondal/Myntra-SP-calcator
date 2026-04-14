// js/calculator.js

import { money, showToast } from "./config.js";
import {
  getProductByStyle,
  getProductBySku
} from "./normalizer.js";

import {
  solvePrice,
  evaluatePrice
} from "./pricing-engine.js";

/* ----------------------------------
   INIT
-----------------------------------*/
export function initCalculator() {
  bindSearchEvents();
  bindManualEvents();
}

/* ----------------------------------
   SEARCH TAB
-----------------------------------*/
function bindSearchEvents() {
  const btn = document.getElementById("calcBtn");
  const clr = document.getElementById("clearCalcBtn");

  btn?.addEventListener("click", runCalculation);
  clr?.addEventListener("click", clearSearch);
}

export function runCalculation() {
  const style =
    document.getElementById("calcStyleId")?.value.trim();

  const sku =
    document.getElementById("calcSku")?.value.trim();

  const target =
    Number(
      document.getElementById("profitTarget")?.value || 5
    );

  let product = null;

  if (style) product = getProductByStyle(style);
  if (!product && sku) product = getProductBySku(sku);

  if (!product) {
    renderSearch("No style found");
    return;
  }

  const r = solvePrice(product, target);

  if (!r) {
    renderSearch("No solution found");
    return;
  }

  renderSearchBlock(r);
  showToast("Search complete");
}

function renderSearch(msg) {
  const el = document.getElementById("calcOutput");
  if (el) el.innerHTML = `<div class="empty-box">${msg}</div>`;
}

function clearSearch() {
  document.getElementById("calcStyleId").value = "";
  document.getElementById("calcSku").value = "";
  renderSearch("Search style and view pricing.");
}

function renderSearchBlock(r) {
  const el = document.getElementById("calcOutput");

  if (!el) return;

  el.innerHTML = resultHtml(r);
}

/* ----------------------------------
   MANUAL CALCULATOR TAB
-----------------------------------*/
function bindManualEvents() {
  const mode = document.getElementById("manualMode");
  const btn = document.getElementById("manualCalcBtn");

  mode?.addEventListener("change", updateManualLabel);
  btn?.addEventListener("click", runManualCalc);

  updateManualLabel();
}

function updateManualLabel() {
  const mode =
    document.getElementById("manualMode")?.value;

  const label =
    document.getElementById("manualInputLabel");

  if (!label) return;

  label.textContent =
    mode === "tp"
      ? "TP Value"
      : "SP Value";
}

function runManualCalc() {
  const mode =
    document.getElementById("manualMode")?.value;

  const brand =
    document.getElementById("manualBrand")?.value;

  const val =
    Number(
      document.getElementById("manualInput")?.value || 0
    );

  if (!brand || !val) {
    renderManual("Enter all inputs.");
    return;
  }

  const dummyProduct = {
    erpSku: "MANUAL",
    styleId: "MANUAL",
    brand: brand,
    articleType: "Saree",
    status: "Manual",
    mrp: val * 3,
    tp: mode === "tp" ? val : 0
  };

  let result = null;

  if (mode === "tp") {
    result = solvePrice(dummyProduct, 5);
  } else {
    result = evaluatePrice(dummyProduct, val);
  }

  if (!result) {
    renderManual("No result found.");
    return;
  }

  renderManualBlock(result, mode);
  showToast("Calculated");
}

function renderManual(msg) {
  const el = document.getElementById("manualOutput");
  if (el) el.innerHTML = `<div class="empty-box">${msg}</div>`;
}

function renderManualBlock(r, mode) {
  const el = document.getElementById("manualOutput");
  if (!el) return;

  let top = "";

  if (mode === "tp") {
    top = `
      <div class="result-box">
        <div class="result-label">Recommended SP</div>
        <div class="result-value">
          ₹${money(r.sp)}
        </div>
      </div>
    `;
  } else {
    top = `
      <div class="result-box">
        <div class="result-label">Effective TP</div>
        <div class="result-value">
          ₹${money(r.payoutAfterCodb)}
        </div>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="result-grid">
      ${top}

      <div class="result-box">
        <div class="result-label">GT</div>
        <div class="result-value">
          ₹${money(r.gta)}
        </div>
      </div>

      <div class="result-box">
        <div class="result-label">List Price</div>
        <div class="result-value">
          ₹${money(r.listPrice)}
        </div>
      </div>

      <div class="result-box">
        <div class="result-label">Profit</div>
        <div class="result-value">
          ₹${money(r.tpProfitRs)}
        </div>
      </div>
    </div>

    <div class="breakdown">
      ${line("SP", r.sp)}
      ${line("TP", r.tp)}
      ${line("Upload Settlement", r.uploadSettlement)}
      ${line("Bank Settlement", r.bankSettlement)}
      ${line("Royalty", r.royalty)}
      ${line("Marketing", r.marketing)}
      ${line("Dispatch", r.dispatchCost)}
      ${line("RTV CODB", r.rtvCodb)}
      ${line("Payout After CODB", r.payoutAfterCodb)}
    </div>
  `;
}

/* ----------------------------------
   COMMON HTML
-----------------------------------*/
function resultHtml(r) {
  return `
    <div class="result-grid">

      <div class="result-box">
        <div class="result-label">SP</div>
        <div class="result-value">
          ₹${money(r.sp)}
        </div>
      </div>

      <div class="result-box">
        <div class="result-label">TP</div>
        <div class="result-value">
          ₹${money(r.tp)}
        </div>
      </div>

      <div class="result-box">
        <div class="result-label">Profit</div>
        <div class="result-value">
          ₹${money(r.tpProfitRs)}
        </div>
      </div>

      <div class="result-box">
        <div class="result-label">RTV%</div>
        <div class="result-value">
          ${money(r.rtvPct)}%
        </div>
      </div>

    </div>

    <div class="breakdown">
      ${line("GT", r.gta)}
      ${line("List Price", r.listPrice)}
      ${line("Upload", r.uploadSettlement)}
      ${line("Bank", r.bankSettlement)}
      ${line("Dispatch", r.dispatchCost)}
      ${line("RTV CODB", r.rtvCodb)}
      ${line("Payout After", r.payoutAfterCodb)}
    </div>
  `;
}

function line(label, val) {
  return `
    <div class="break-row">
      <div>${label}</div>
      <div>${money(val)}</div>
    </div>
  `;
}