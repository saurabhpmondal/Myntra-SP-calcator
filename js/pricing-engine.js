// js/pricing-engine.js

import { CONFIG, num } from "./config.js";
import {
  findCommercial,
  findGta,
  getRtv
} from "./normalizer.js";

/* ----------------------------------
   PUBLIC
-----------------------------------*/

export function solvePrice(product, targetPct = 5) {
  const tp = num(product.tp);
  const targetValue =
    tp * (1 + num(targetPct) / 100);

  for (
    let seed = Math.max(99, Math.ceil(tp));
    seed <= CONFIG.LIMITS.MAX_SP_SEARCH;
    seed++
  ) {
    const sp = roundToNext9(seed);

    const calc = evaluatePrice(product, sp);

    if (calc.payoutAfterCodb >= targetValue) {
      calc.targetPct = targetPct;
      calc.targetValue = targetValue;
      return calc;
    }

    seed = sp;
  }

  return null;
}


export function evaluatePrice(product, sp) {
  const tp = num(product.tp);
  const rtvPct = getRtv(product.styleId);

  /* pass 1 */
  let sellerPrice = sp;

  let comm =
    findCommercial(
      product.brand,
      product.articleType,
      sellerPrice
    ) || defaultCommercial();

  let gtaRow =
    findGta(
      product.brand,
      product.articleType,
      comm.level,
      sp
    );

  const gta =
    gtaRow ? num(gtaRow.gtaCharges) : 0;

  sellerPrice = sp - gta;

  /* final pass */
  comm =
    findCommercial(
      product.brand,
      product.articleType,
      sellerPrice
    ) || comm;

  const commissionPct =
    num(comm.commission);

  const fixedFee =
    num(comm.fixedFee);

  const royaltyPct =
    num(comm.royalty);

  const marketingPct =
    num(comm.marketing);

  const collectionFee =
    CONFIG.COSTS.COLLECTION_FEE;

  /* seller side */
  const commissionRs =
    sellerPrice *
    commissionPct / 100;

  const gstBase =
    commissionRs +
    fixedFee +
    collectionFee;

  const taxOnComFixed =
    gstBase *
    CONFIG.TAX.GST_PERCENT / 100;

  const uploadSettlement =
    sellerPrice
    - commissionRs
    - fixedFee
    - collectionFee
    - taxOnComFixed;

  const tds =
    uploadSettlement *
    CONFIG.TAX.TDS_PERCENT / 100;

  const tcs =
    uploadSettlement *
    CONFIG.TAX.TCS_PERCENT / 100;

  const tdsTcs = tds + tcs;

  const bankSettlement =
    uploadSettlement - tdsTcs;

  /* SP side */
  const royalty =
    sp * royaltyPct / 100;

  const marketing =
    sp * marketingPct / 100;

  const rebate = 0;

  const payoutBeforeCodb =
    bankSettlement
    - royalty
    - marketing
    - rebate;

  const dispatchCost =
    getDispatchCost(sp);

  const returnCharge =
    CONFIG.COSTS.RETURN_CHARGE;

  const returnCost =
    (fixedFee + returnCharge) *
    (1 + CONFIG.TAX.GST_PERCENT / 100);

  /* capped RTV CODB */
  const rawRtvCodb =
    (returnCost * rtvPct) /
    (100 - rtvPct);

  const rtvCodb =
    Math.min(rawRtvCodb, returnCost);

  const payoutAfterCodb =
    payoutBeforeCodb
    - dispatchCost
    - rtvCodb;

  const tpProfitRs =
    payoutAfterCodb - tp;

  const tpProfitPct =
    tp > 0
      ? (tpProfitRs / tp) * 100
      : 0;

  return {
    erpSku: product.erpSku,
    styleId: product.styleId,
    brand: product.brand,
    articleType: product.articleType,
    status: product.status,
    mrp: num(product.mrp),
    tp,

    sp,
    gta,
    listPrice: sellerPrice,

    commissionPct,
    commissionRs,
    fixedFee,
    taxOnComFixed,

    uploadSettlement,
    tdsTcs,
    bankSettlement,

    royalty,
    marketing,
    rebate,

    payoutBeforeCodb,

    dispatchCost,
    returnCharge,
    returnCost,

    rtvPct,
    rtvCodb,

    payoutAfterCodb,

    tpProfitRs,
    tpProfitPct
  };
}


/* ----------------------------------
   HELPERS
-----------------------------------*/

function getDispatchCost(sp) {
  if (sp < 500) return 25;
  if (sp <= 1000) return 30;
  return 35;
}

function roundToNext9(value) {
  const n = Math.ceil(num(value));

  const base =
    Math.floor(n / 10) * 10 + 9;

  if (base >= n) return base;

  return base + 10;
}

function defaultCommercial() {
  return {
    commission: 0,
    level: "default",
    royalty: 0,
    marketing: 0,
    fixedFee: 0
  };
}