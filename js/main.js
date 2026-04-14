// js/main.js

import { STORE, showToast } from "./config.js";
import { loadAllData } from "./data-loader.js";
import { normalizeAllData } from "./normalizer.js";

import {
  initCalculator
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
   BOOT
-----------------------------------*/
document.addEventListener(
  "DOMContentLoaded",
  bootApp
);

async function bootApp() {
  bindGlobalEvents();
  initTabs();

  initCalculator();
  initTable();
  initExport();

  await refreshApp();
}

/* ----------------------------------
   LOAD DATA
-----------------------------------*/
async function refreshApp() {
  const ok = await loadAllData();

  if (!ok) {
    showToast("Failed to load data");
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

        openTab(tab);

        STORE.ui.activeTab = tab;

        if (tab === "master") {
          renderPricingTable();
        }
      }
    );
  });
}

function openTab(name) {
  hideAllTabs();

  if (name === "search") {
    show("searchTab");
  }

  if (name === "master") {
    show("masterTab");
  }

  if (name === "calculator") {
    show("calculatorTab");
  }
}

function hideAllTabs() {
  showHide("searchTab", false);
  showHide("masterTab", false);
  showHide("calculatorTab", false);
}

function show(id) {
  showHide(id, true);
}

function showHide(id, state) {
  const el = document.getElementById(id);

  if (!el) return;

  if (state) {
    el.classList.add("active");
  } else {
    el.classList.remove("active");
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