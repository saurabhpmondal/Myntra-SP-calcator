// js/table.js

import { STORE, money, showToast } from "./config.js";
import { solvePrice } from "./pricing-engine.js";

/* ----------------------------------
   STATE
-----------------------------------*/
let visibleCount = 50;

/* ----------------------------------
   INIT
-----------------------------------*/
export function initTable() {
  bindEvents();
}

/* ----------------------------------
   EVENTS
-----------------------------------*/
function bindEvents() {
  const target =
    document.getElementById("profitTarget");

  const brand =
    document.getElementById("brandFilter");

  const more =
    document.getElementById("loadMoreBtn");

  target?.addEventListener("change", resetAndRender);
  brand?.addEventListener("change", resetAndRender);

  more?.addEventListener("click", () => {
    visibleCount += 50;
    renderPricingTable();
  });
}

/* ----------------------------------
   FILTERS
-----------------------------------*/
export function fillBrandFilter() {
  const top =
    document.getElementById("brandFilter");

  const manual =
    document.getElementById("manualBrand");

  const brands = [
    ...new Set(
      STORE.normalized.products
        .map(x => x.brand)
        .filter(Boolean)
    )
  ].sort();

  const html =
    `<option value="">All Brands</option>` +
    brands.map(
      b => `<option value="${b}">${b}</option>`
    ).join("");

  if (top) top.innerHTML = html;

  if (manual) {
    manual.innerHTML =
      `<option value="">Select Brand</option>` +
      brands.map(
        b => `<option value="${b}">${b}</option>`
      ).join("");
  }
}

/* ----------------------------------
   RESET
-----------------------------------*/
function resetAndRender() {
  visibleCount = 50;
  renderPricingTable();
}

/* ----------------------------------
   MAIN TABLE
-----------------------------------*/
export function renderPricingTable() {
  const head =
    document.getElementById("pricingHead");

  const body =
    document.getElementById("pricingBody");

  const more =
    document.getElementById("loadMoreBtn");

  if (!head || !body) return;

  const allRows = getVisibleRows();
  const rows =
    allRows.slice(0, visibleCount);

  head.innerHTML = headerHtml();

  if (!rows.length) {
    body.innerHTML = `
      <tr>
        <td colspan="28" class="center">
          No rows found
        </td>
      </tr>
    `;

    if (more) more.style.display = "none";
    return;
  }

  body.innerHTML =
    rows.map(rowHtml).join("");

  if (more) {
    more.style.display =
      visibleCount >= allRows.length
        ? "none"
        : "block";

    more.textContent =
      `Load More 50 Rows (${rows.length}/${allRows.length})`;
  }

  showToast("Pricing updated");
}

/* ----------------------------------
   DATA
-----------------------------------*/
export function getVisibleRows() {
  const target =
    Number(
      document.getElementById("profitTarget")
        ?.value || 5
    );

  const brand =
    (
      document.getElementById("brandFilter")
        ?.value || ""
    ).toLowerCase();

  let data =
    [...STORE.normalized.products];

  if (brand) {
    data = data.filter(
      x =>
        x.brand.toLowerCase() === brand
    );
  }

  const rows = [];

  data.forEach(product => {
    const calc =
      solvePrice(product, target);

    if (calc) rows.push(calc);
  });

  return rows;
}

/* ----------------------------------
   HEADER
-----------------------------------*/
function headerHtml() {
  return `
    <tr>
      <th>ERP SKU</th>
      <th>Style ID</th>
      <th>Brand</th>
      <th>Article</th>
      <th>Status</th>
      <th>MRP</th>
      <th>SP</th>
      <th>GT</th>
      <th>List Price</th>
      <th>Com %</th>
      <th>Com Rs</th>
      <th>Fixed Fee</th>
      <th>Tax</th>
      <th>Upload</th>
      <th>TDS+TCS</th>
      <th>Bank</th>
      <th>Royalty</th>
      <th>Marketing</th>
      <th>Payout Before</th>
      <th>Dispatch</th>
      <th>Return Chg</th>
      <th>Return Cost</th>
      <th>RTV %</th>
      <th>RTV CODB</th>
      <th>Payout After</th>
      <th>TP</th>
      <th>Profit Rs</th>
      <th>Profit %</th>
    </tr>
  `;
}

/* ----------------------------------
   ROW
-----------------------------------*/
function rowHtml(r) {
  const cls =
    r.tpProfitRs >= 0
      ? "success"
      : "danger";

  return `
    <tr>
      <td>${r.erpSku}</td>
      <td>${r.styleId}</td>
      <td>${r.brand}</td>
      <td>${r.articleType}</td>
      <td>${r.status}</td>

      <td>${money(r.mrp)}</td>
      <td><b>${money(r.sp)}</b></td>
      <td>${money(r.gta)}</td>
      <td>${money(r.listPrice)}</td>

      <td>${money(r.commissionPct)}</td>
      <td>${money(r.commissionRs)}</td>
      <td>${money(r.fixedFee)}</td>
      <td>${money(r.taxOnComFixed)}</td>

      <td>${money(r.uploadSettlement)}</td>
      <td>${money(r.tdsTcs)}</td>
      <td>${money(r.bankSettlement)}</td>

      <td>${money(r.royalty)}</td>
      <td>${money(r.marketing)}</td>

      <td>${money(r.payoutBeforeCodb)}</td>

      <td>${money(r.dispatchCost)}</td>
      <td>${money(r.returnCharge)}</td>
      <td>${money(r.returnCost)}</td>

      <td>${money(r.rtvPct)}</td>
      <td>${money(r.rtvCodb)}</td>

      <td>${money(r.payoutAfterCodb)}</td>

      <td>${money(r.tp)}</td>

      <td class="${cls}">
        ${money(r.tpProfitRs)}
      </td>

      <td class="${cls}">
        ${money(r.tpProfitPct)}%
      </td>
    </tr>
  `;
}