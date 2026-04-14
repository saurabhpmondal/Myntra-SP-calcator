// js/table.js

import { STORE, money, showToast } from "./config.js";
import { solvePrice } from "./pricing-engine.js";

/* ----------------------------------
   INIT
-----------------------------------*/
export function initTable() {
  bindTableEvents();
}


/* ----------------------------------
   EVENTS
-----------------------------------*/
function bindTableEvents() {
  const target = document.getElementById("profitTarget");
  const search = document.getElementById("globalSearch");
  const rows = document.getElementById("rowLimit");

  target?.addEventListener("change", () => {
    STORE.ui.currentTarget = Number(target.value || 5);
    renderPricingTable();
  });

  search?.addEventListener("input", () => {
    STORE.ui.searchText = search.value.trim().toLowerCase();
    renderPricingTable();
  });

  rows?.addEventListener("change", () => {
    STORE.ui.rowLimit = Number(rows.value || 100);
    renderPricingTable();
  });
}


/* ----------------------------------
   MAIN RENDER
-----------------------------------*/
export function renderPricingTable() {
  const head = document.getElementById("pricingHead");
  const body = document.getElementById("pricingBody");

  if (!head || !body) return;

  const products = filteredProducts();

  head.innerHTML = headerHtml();

  if (!products.length) {
    body.innerHTML = `
      <tr>
        <td colspan="12" class="center">No records found</td>
      </tr>
    `;
    return;
  }

  const rows = [];

  products.forEach(product => {
    const calc = solvePrice(
      product,
      STORE.ui.currentTarget
    );

    if (!calc) return;

    rows.push(rowHtml(calc));
  });

  body.innerHTML = rows.join("");

  showToast("Pricing master updated");
}


/* ----------------------------------
   FILTERS
-----------------------------------*/
function filteredProducts() {
  let data = [...STORE.normalized.products];

  const search = STORE.ui.searchText;

  if (search) {
    data = data.filter(item =>
      item.erpSku.toLowerCase().includes(search) ||
      item.styleId.toLowerCase().includes(search) ||
      item.brand.toLowerCase().includes(search) ||
      item.articleType.toLowerCase().includes(search)
    );
  }

  return data.slice(0, STORE.ui.rowLimit);
}


/* ----------------------------------
   TABLE HTML
-----------------------------------*/
function headerHtml() {
  return `
    <tr>
      <th>ERP SKU</th>
      <th>Style ID</th>
      <th>Brand</th>
      <th>Article</th>
      <th>MRP</th>
      <th>TP</th>
      <th>SP</th>
      <th>GT</th>
      <th>List Price</th>
      <th>Payout</th>
      <th>Profit Rs</th>
      <th>Profit %</th>
    </tr>
  `;
}

function rowHtml(r) {
  const cls =
    r.tpProfitRs >= 0 ? "success" : "danger";

  return `
    <tr>
      <td>${r.erpSku}</td>
      <td>${r.styleId}</td>
      <td>${r.brand}</td>
      <td>${r.articleType}</td>
      <td>${money(r.mrp)}</td>
      <td>${money(r.tp)}</td>
      <td><b>${money(r.sp)}</b></td>
      <td>${money(r.gta)}</td>
      <td>${money(r.listPrice)}</td>
      <td>${money(r.payoutAfterCodb)}</td>
      <td class="${cls}">
        ${money(r.tpProfitRs)}
      </td>
      <td class="${cls}">
        ${money(r.tpProfitPct)}%
      </td>
    </tr>
  `;
}