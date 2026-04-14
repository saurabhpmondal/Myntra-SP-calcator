// js/main.js

import { STORE, showToast } from "./config.js";
import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";

import {
  initCalculator,
  runCalculation
} from "./calculator.js";

import {
  initTable,
  renderPricingTable,
  fillBrandFilter
} from "./table.js";

import {
  initExport
} from "./export.js";

/* ----------------------------------
   APP BOOT
-----------------------------------*/
document.addEventListener(
  "DOMContentLoaded",
  initApp
);

async function initApp() {
  bindGlobalEvents();
  initTabs();

  initCalculator();
  initTable();
  initExport();

  await refreshApp();
}

/* ----------------------------------
   REFRESH
-----------------------------------*/
async function refreshApp() {
  const ok = await loadAllData();

  if (!ok) {
    showToast("Sheet load failed");
    return;
  }

  normalizeAllData();

  fillBrandFilter();
  updateCounts();

  renderPricingTable();

  showToast("App ready");
}

/* ----------------------------------
   GLOBAL EVENTS
-----------------------------------*/
function bindGlobalEvents() {
  const refreshBtn =
    document.getElementById("refreshBtn");

  const target =
    document.getElementById("profitTarget");

  refreshBtn?.addEventListener(
    "click",
    refreshApp
  );

  target?.addEventListener(
    "change",
    () => {
      STORE.ui.currentTarget =
        Number(target.value || 5);

      renderPricingTable();

      if (
        STORE.ui.activeTab ===
        "calculator"
      ) {
        runCalculation();
      }
    }
  );
}

/* ----------------------------------
   TABS
-----------------------------------*/
function initTabs() {
  const tabs =
    document.querySelectorAll(".tab");

  tabs.forEach(btn => {
    btn.addEventListener(
      "click",
      () => {
        const tab =
          btn.dataset.tab;

        tabs.forEach(x =>
          x.classList.remove("active")
        );

        btn.classList.add("active");

        switchTab(tab);

        STORE.ui.activeTab = tab;

        if (tab === "master") {
          renderPricingTable();
        }
      }
    );
  });
}

function switchTab(name) {
  const calc =
    document.getElementById(
      "calculatorTab"
    );

  const master =
    document.getElementById(
      "masterTab"
    );

  calc?.classList.remove("active");
  master?.classList.remove("active");

  if (name === "calculator") {
    calc?.classList.add("active");
  } else {
    master?.classList.add("active");
  }
}

/* ----------------------------------
   STATUS
-----------------------------------*/
function updateCounts() {
  const el =
    document.getElementById(
      "recordStatus"
    );

  if (!el) return;

  el.textContent =
    STORE.normalized.products.length +
    " Styles";
}