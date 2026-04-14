// js/main.js

import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";
import { initCalculator } from "./calculator.js";
import { renderPricingTable } from "./table.js";
import { initExport } from "./export.js";
import { STORE } from "./config.js";
import { renderBrandSummary } from "./brand-summary.js";

/* ----------------------------------
   INIT
-----------------------------------*/
document.addEventListener(
  "DOMContentLoaded",
  initApp
);

async function initApp() {
  bindTabs();
  bindControls();
  initCalculator();
  initExport();

  await refreshApp();
}

/* ----------------------------------
   REFRESH
-----------------------------------*/
async function refreshApp() {
  const ok =
    await loadAllData();

  if (!ok) return;

  normalizeAllData();

  fillBrands();

  STORE.ui.rowLimit = 50;

  renderPricingTable();
  renderBrandSummary();
}

/* ----------------------------------
   CONTROLS
-----------------------------------*/
function bindControls() {
  const refresh =
    document.getElementById(
      "refreshBtn"
    );

  const brand =
    document.getElementById(
      "brandFilter"
    );

  const target =
    document.getElementById(
      "profitTarget"
    );

  const loadMore =
    document.getElementById(
      "loadMoreBtn"
    );

  refresh?.addEventListener(
    "click",
    refreshApp
  );

  brand?.addEventListener(
    "change",
    rerenderAll
  );

  target?.addEventListener(
    "change",
    rerenderAll
  );

  loadMore?.addEventListener(
    "click",
    () => {
      STORE.ui.rowLimit += 50;
      renderPricingTable();
    }
  );
}

function rerenderAll() {
  STORE.ui.rowLimit = 50;

  renderPricingTable();
  renderBrandSummary();
}

/* ----------------------------------
   BRAND FILTERS
-----------------------------------*/
function fillBrands() {
  const brands = [
    ...new Set(
      STORE.normalized.products.map(
        x => x.brand
      )
    )
  ].sort();

  const selects = [
    document.getElementById(
      "brandFilter"
    ),
    document.getElementById(
      "manualBrand"
    )
  ];

  selects.forEach(sel => {
    if (!sel) return;

    const first =
      sel.id ===
      "brandFilter"
        ? `<option value="">All Brands</option>`
        : `<option value="">Select Brand</option>`;

    sel.innerHTML =
      first +
      brands
        .map(
          b =>
            `<option value="${b}">${b}</option>`
        )
        .join("");
  });
}

/* ----------------------------------
   TABS
-----------------------------------*/
function bindTabs() {
  const tabs =
    document.querySelectorAll(
      ".tab"
    );

  tabs.forEach(btn => {
    btn.addEventListener(
      "click",
      () => {
        const key =
          btn.dataset.tab;

        document
          .querySelectorAll(
            ".tab"
          )
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        document
          .querySelectorAll(
            ".tab-panel"
          )
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        btn.classList.add(
          "active"
        );

        document
          .getElementById(
            key + "Tab"
          )
          ?.classList.add(
            "active"
          );

        STORE.ui.activeTab =
          key;

        if (
          key === "summary"
        ) {
          renderBrandSummary();
        }
      }
    );
  });
}