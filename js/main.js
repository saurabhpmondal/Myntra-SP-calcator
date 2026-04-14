// js/main.js

import { STORE, showToast } from "./config.js";
import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";
import { initCalculator, runCalculation } from "./calculator.js";
import { initTable, renderPricingTable } from "./table.js";
import { initExport } from "./export.js";

/* ----------------------------------
   BOOT
-----------------------------------*/
document.addEventListener("DOMContentLoaded", bootApp);

async function bootApp() {
  bindGlobalUi();
  initTabs();

  initCalculator();
  initTable();
  initExport();

  await refreshApp();
}


/* ----------------------------------
   REFRESH DATA
-----------------------------------*/
async function refreshApp() {
  const ok = await loadAllData();

  if (!ok) {
    showToast("Failed to load sheets");
    return;
  }

  normalizeAllData();

  updateCounts();

  renderPricingTable();

  showToast("App ready");
}


/* ----------------------------------
   GLOBAL EVENTS
-----------------------------------*/
function bindGlobalUi() {
  const refreshBtn = document.getElementById("refreshBtn");
  const target = document.getElementById("profitTarget");

  refreshBtn?.addEventListener("click", refreshApp);

  target?.addEventListener("change", () => {
    STORE.ui.currentTarget = Number(target.value || 5);

    renderPricingTable();

    const active = STORE.ui.activeTab;

    if (active === "calculator") {
      runCalculation();
    }
  });
}


/* ----------------------------------
   TABS
-----------------------------------*/
function initTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      tabs.forEach(x =>
        x.classList.remove("active")
      );

      btn.classList.add("active");

      switchPanel(tab);

      STORE.ui.activeTab = tab;

      if (tab === "master") {
        renderPricingTable();
      }
    });
  });
}

function switchPanel(tabName) {
  const calculator =
    document.getElementById("calculatorTab");

  const master =
    document.getElementById("masterTab");

  calculator?.classList.remove("active");
  master?.classList.remove("active");

  if (tabName === "calculator") {
    calculator?.classList.add("active");
  } else {
    master?.classList.add("active");
  }
}


/* ----------------------------------
   STATUS
-----------------------------------*/
function updateCounts() {
  const recordEl =
    document.getElementById("recordStatus");

  if (recordEl) {
    recordEl.textContent =
      STORE.normalized.products.length +
      " Styles";
  }
}