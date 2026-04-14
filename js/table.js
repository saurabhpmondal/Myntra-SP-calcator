// js/table.js

import { STORE, money, showToast } from "./config.js";
import { solvePrice } from "./pricing-engine.js";

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
  const target = document.getElementById("profitTarget");
  const brand = document.getElementById("brandFilter");
  const search = document.getElementById("globalSearch");

  target?.addEventListener("change", renderPricingTable);
  brand?.addEventListener("change", renderPricingTable);
  search?.addEventListener("input", renderPricingTable);
}

/* ----------------------------------
   BRAND DROPDOWN
-----------------------------------*/
export function fillBrandFilter() {
  const el = document.getElementById("brandFilter");
  if (!el) return;

  const brands = [
    ...new Set(
      STORE.normalized.products.map(x => x.brand).filter(Boolean)
    )
  ].sort();

  el.innerHTML =
    `<option value="">All Brands</option>` +
    brands.map(b => `<option value="${b}">${b}</option>`).join("");
}

/* ----------------------------------
   MAIN TABLE
-----------------------------------*/
export function renderPricingTable() {
  const head = document.getElementById("pricingHead");
  const body = document.getElementById("pricingBody");

  if (!head || !body) return;

  const rows = getVisibleRows();

  head.innerHTML = headerHtml();

  if (!rows.length) {
    body.innerHTML = `
      <tr>
        <td colspan="29" class="center">
          No records found
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = rows.map(rowHtml).join("");

  showToast("Pricing master updated");
}

/* ----------------------------------
   VISIBLE ROWS
-----------------------------------*/
export function getVisibleRows() {
  const target =
    Number(
      document.getElementById("profitTarget")?.value || 5
    );

  const brand =
    (
      document.getElementById("brandFilter")?.value || ""
    ).toLowerCase();

  const search =
    (
      document.getElementById("globalSearch")?.value || ""
    ).toLowerCase();

  let data = [...STORE.normalized.products];

  if (brand) {
    data = data.filter(
      x => x.brand.toLowerCase() === brand
    );
  }

  if (search) {
    data = data.filter(x =>
      x.erpSku.toLowerCase().includes(search) ||
      x.styleId.toLowerCase().includes(search) ||
      x.brand.toLowerCase().includes(search) ||
      x.articleType.toLowerCase().includes(search)
    );
  }

  const rows = [];

  data.forEach(product => {
    const calc = solvePrice(product, target);
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
      <th>Fixed</th>
      <th>Tax</th>
      <th>Upload</th>
      <th>TDS+TCS</th>
      <th>Bank</th>
      <th>Royalty</th>
      <th>Marketing</th>
      <th>Rebate</th>
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
    r.tpProfitRs >= 0 ? "success" : "danger";

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
      <td>${money(r.rebate)}</td>
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