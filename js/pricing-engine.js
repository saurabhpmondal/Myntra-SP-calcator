// js/pricing-engine.js

import { CONFIG, num } from "./config.js";
import {
  findCommercial,
  findGta,
  getRtv
} from "./normalizer.js";

/* ----------------------------------
   PUBLIC API
-----------------------------------*/

/**
 * Solve reverse SP based on TP target
 * targetPct examples:
 *  5  => TP +5%
 *  0  => TP +0%
 * -5  => TP -5%
 */
export function solvePrice(product, targetPct = 5) {
  const tp = num(product.tp);
  const targetValue = tp * (1 + (num(targetPct) / 100));

  for (let seed = Math.max(99, Math.ceil(tp)); seed <= CONFIG.LIMITS.MAX_SP_SEARCH; seed++) {
    const sp = roundToNext9(seed);

    const calc = evaluatePrice(product, sp);

    if (calc.payoutAfterCodb >= targetValue) {
      calc.targetTp = targetValue;
      calc.targetPct = targetPct;
      return calc;
    }

    seed = sp;
  }

  return null;
}


/**
 * Full calculation for one SP
 */
export function evaluatePrice(product, sp) {
  const styleId = product.styleId;
  const rtvPct = getRtv(styleId);

  /* temp commercial guess pass 1 */
  let sellerPrice = sp;
  let comm = findCommercial(product.brand, product.articleType, sellerPrice);

  if (!comm) {
    comm = defaultCommercial();
  }

  /* GTA from customer SP */
  let gtaRow = findGta(
    product.brand,
    product.articleType,
    comm.level,
    sp
  );

  const gta = gtaRow ? gtaRow.gtaCharges : 0;

  /* final seller price */
  sellerPrice = sp - gta;

  /* rematch commercials on seller price */
  comm = findCommercial(product.brand, product.articleType, sellerPrice) || comm;

  const commissionPct = num(comm.commission);
  const royaltyPct = num(comm.royalty);
  const marketingPct = num(comm.marketing);
  const fixedFee = num(comm.fixedFee);
  const collectionFee = CONFIG.COSTS.COLLECTION_FEE;

  const commissionRs = sellerPrice * commissionPct / 100;

  const gstBase = commissionRs + fixedFee + collectionFee;
  const gstFees = gstBase * CONFIG.TAX.GST_PERCENT / 100;

  const uploadSettlement =
    sellerPrice
    - commissionRs
    - fixedFee
    - collectionFee
    - gstFees;

  const tds = uploadSettlement * CONFIG.TAX.TDS_PERCENT / 100;
  const tcs = uploadSettlement * CONFIG.TAX.TCS_PERCENT / 100;
  const totalTaxHold = tds + tcs;

  const bankSettlement = uploadSettlement - totalTaxHold;

  const royaltyRs = sp * royaltyPct / 100;
  const marketingRs = sp * marketingPct / 100;
  const rebate = 0;

  const payoutBeforeCodb =
    bankSettlement
    - royaltyRs
    - marketingRs
    - rebate;

  const dispatchCost = getDispatchCost(sp);

  const returnCharge = CONFIG.COSTS.RETURN_CHARGE;

  const returnCost =
    (fixedFee + returnCharge) *
    (1 + CONFIG.TAX.GST_PERCENT / 100);

  const rtvCodb =
    (returnCost * rtvPct) /
    (100 - rtvPct);

  const payoutAfterCodb =
    payoutBeforeCodb
    - dispatchCost
    - rtvCodb;

  const tp = num(product.tp);
  const tpProfitRs = payoutAfterCodb - tp;
  const tpProfitPct = tp > 0 ? (tpProfitRs / tp) * 100 : 0;

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
    taxOnComFixed: gstFees,

    uploadSettlement,
    tdsTcs: totalTaxHold,
    bankSettlement,

    royalty: royaltyRs,
    marketing: marketingRs,
    rebate,

    payoutBeforeCodb,

    dispatchCost,
    returnCharge,
    returnCost,
    rtvPct,
    rtvCodb,

    payoutAfterCodb,

    tpProfitPct,
    tpProfitRs
  };
}


/* ----------------------------------
   HELPERS
-----------------------------------*/

function getDispatchCost(sp) {
  if (sp < CONFIG.DISPATCH.LOW_LIMIT) {
    return CONFIG.DISPATCH.LOW_COST;
  }

  if (sp <= CONFIG.DISPATCH.HIGH_LIMIT) {
    return CONFIG.DISPATCH.MID_COST;
  }

  return CONFIG.DISPATCH.HIGH_COST;
}

function roundToNext9(value) {
  const n = Math.ceil(num(value));

  const base = Math.floor(n / 10) * 10 + CONFIG.ROUNDING.END_DIGIT;

  if (base >= n) return base;

  return base + 10;
}

function defaultCommercial() {
  return {
    commission: 25,
    level: "default",
    royalty: 0,
    marketing: 0,
    fixedFee: 0
  };
}