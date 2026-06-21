/**
 * bomEngine.js — Material Consumption Engine (BOM Generator)
 * Satyendra Packaging ERP — Phase 3
 *
 * DESIGN:
 *  - Pure functions only — no DOM, no global state
 *  - Input: spec object + quantity + wastageSettings
 *  - Output: BomLine[] array with full consumption data
 *  - Routes to type-specific generators based on productType
 *  - Each generator uses formulas from calculations.js
 *
 * BomLine schema:
 * {
 *   seq:                 number   — item sequence (10, 20, 30...)
 *   materialCode:        string   — internal code (e.g. FAB-001)
 *   sapCode:             string   — SAP MM01 code (e.g. LMS01453)
 *   description:         string   — material description
 *   category:            string   — Fabric | Tape | BOPP Film | etc.
 *   uom:                 string   — KG | MTR | PCS
 *   consumptionPerBag:   number   — grams or units per bag
 *   consumptionPerBagKg: number   — KG per bag (for KG items)
 *   totalConsumption:    number   — net total (KG or units)
 *   wastagePercent:      number   — wastage %
 *   wastageQty:          number   — wastage quantity
 *   netRequirement:      number   — final procurement requirement
 * }
 */

import {
  calcBagArea,
  calcBoppArea,
  calcFabricWeight,
  calcBoppWeight,
  calcLaminationWeight,
  calcMetalizeWeight,
  calcAdhesiveWeight,
  calcInkWeight,
  calcFabricGPM,
  calcTotalFabricWeight,
  calcTotalBoppRequirement,
  calcFIBCBodyArea,
} from './calculations.js';

// ─────────────────────────────────────────────────
// DEFAULT WASTAGE SETTINGS
// ─────────────────────────────────────────────────

export const DEFAULT_WASTAGE = {
  fabric:   3.5,
  tape:     2.0,
  bopp:     8.0,
  lami:     3.0,
  metalize: 1.5,
  ink:      60.0,   // Ink evaporation is high in roto-gravure
  thread:   1.0,
  liner:    2.0,
  packing:  1.0,
  adhesive: 5.0,
  handle:   0.0,
  loop:     0.0,
};

// ─────────────────────────────────────────────────
// MASTER BOM GENERATOR — routes by product type
// ─────────────────────────────────────────────────

/**
 * Main entry point: generates BOM lines for a given spec.
 * @param {Object} spec           — product specification object
 * @param {number} quantity       — order quantity in PCS
 * @param {Object} wastageOverride — partial wastage % overrides (optional)
 * @returns {BomLine[]} Complete list of BOM lines
 */
export function generateBOM(spec, quantity, wastageOverride = {}) {
  // Merge defaults with any user overrides
  const w = { ...DEFAULT_WASTAGE, ...wastageOverride };

  const type = spec.productType || 'BOPP Bag';

  switch (type) {
    case 'BOPP Bag':
    case 'Laminated Bag':
      return generateBOPPBom(spec, quantity, w);
    case 'PP Woven Bag':
      return generatePPBom(spec, quantity, w);
    case 'Shopping Bag':
      return generateShoppingBom(spec, quantity, w);
    case 'FIBC':
      return generateFIBCBom(spec, quantity, w);
    default:
      return generatePPBom(spec, quantity, w);
  }
}

// ─────────────────────────────────────────────────
// BOPP BAG BOM GENERATOR
// Covers: BOPP Bag, Laminated Bag
// ─────────────────────────────────────────────────

/**
 * Generates BOM for BOPP / Laminated bag.
 * Components: Fabric → Tape → BOPP Film → Metalize → Lamination →
 *             Adhesive → Ink → Thread → Handle → Liner → Packing
 */
export function generateBOPPBom(spec, quantity, w) {
  const {
    widthCm       = 86.2,
    lengthCm      = 56.0,
    gussetCm      = 0,
    fabricGsm     = 22.2,
    boppMicron    = 15,
    boppSides     = 1,
    boppWidth     = 80,
    lamiMicron    = 20,
    lamiSides     = 1,
    metalizeMicron = 15,
    noOfColors    = 6,
    handleWeight  = 5,
    threadWeight  = 2,
    linerMicron   = 0,
    linerWidthCm  = 0,
    linerLengthCm = 0,
  } = spec;

  const bagArea   = calcBagArea(widthCm, lengthCm);
  const boppArea  = calcBoppArea(widthCm, lengthCm, gussetCm, boppSides);

  const fabricWtG  = calcFabricWeight(bagArea, fabricGsm);
  const boppWtG    = calcBoppWeight(boppArea, boppMicron);
  const lamiWtG    = lamiMicron > 0 ? calcLaminationWeight(bagArea, lamiMicron, lamiSides) : 0;
  const metaWtG    = metalizeMicron > 0 ? calcMetalizeWeight(boppArea, metalizeMicron) : 0;
  const adhesiveWtG = (lamiMicron > 0 || metalizeMicron > 0)
    ? calcAdhesiveWeight(boppArea, boppSides) : 0;
  const inkWtG     = calcInkWeight(boppArea, noOfColors, 0.5);

  const lines = [];
  let seq = 10;

  // ── 1. FABRIC ──
  lines.push(makeLine({
    seq,
    materialCode: 'LMS01453',
    sapCode:      'LMS01453',
    description:  `FABRIC-TUBE-${widthCm}CMS-${calcFabricGPM(fabricGsm, widthCm).toFixed(1)}GPM-${spec.fabricColor || 'NATURAL'}`,
    category:     'Fabric',
    uom:          'KG',
    consumptionPerBag: r6(fabricWtG / 1000),
    quantity,
    wastagePercent: w.fabric,
  }));
  seq += 10;

  // ── 2. TAPE (derives from fabric weight + weaving wastage) ──
  const tapeWtG = fabricWtG * (1 + w.tape / 100);
  lines.push(makeLine({
    seq,
    materialCode: 'TAP00175',
    sapCode:      'TAP00175',
    description:  `PP TAPE ${(boppWidth / 10).toFixed(1)}MM NATURAL ${spec.denier || ''}`,
    category:     'Tape',
    uom:          'KG',
    consumptionPerBag: r6(tapeWtG / 1000),
    quantity,
    wastagePercent: w.tape,
  }));
  seq += 10;

  // ── 3. BOPP FILM (printed) ──
  if (boppWtG > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'RGP04179',
      sapCode:      'RGP04179',
      description:  `BOPP ${spec.boppType || 'MATT FINISH'} ${boppMicron}MIC ${noOfColors} COLOR`,
      category:     'BOPP Film',
      uom:          'KG',
      consumptionPerBag: r6(boppWtG / 1000),
      quantity,
      wastagePercent: w.bopp,
    }));
    seq += 10;
  }

  // ── 4. METALIZE FILM ──
  if (metaWtG > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'DCT04882',
      sapCode:      'DCT04882',
      description:  `METALIZE FILM ${metalizeMicron} MICRON SLITTED`,
      category:     'BOPP Film',
      uom:          'KG',
      consumptionPerBag: r6(metaWtG / 1000),
      quantity,
      wastagePercent: w.metalize,
    }));
    seq += 10;
  }

  // ── 5. LAMINATION (PP+LDPE blend) ──
  if (lamiWtG > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'ELR03482',
      sapCode:      'ELR03482',
      description:  `EXTRUSION LAMINATION ${lamiMicron}MIC - ${lamiSides === 2 ? 'BOTH SIDES' : '1 SIDE'}`,
      category:     'Lamination',
      uom:          'KG',
      consumptionPerBag: r6(lamiWtG / 1000),
      quantity,
      wastagePercent: w.lami,
    }));
    seq += 10;
  }

  // ── 6. ADHESIVE ──
  if (adhesiveWtG > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'ADH00001',
      sapCode:      'ADH00001',
      description:  `PU ADHESIVE 2-PART FOR LAMINATION`,
      category:     'Adhesive',
      uom:          'KG',
      consumptionPerBag: r6(adhesiveWtG / 1000),
      quantity,
      wastagePercent: w.adhesive,
    }));
    seq += 10;
  }

  // ── 7. INK ──
  if (inkWtG > 0 && noOfColors > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'INK00001',
      sapCode:      'INK00001',
      description:  `SOLVENT BASED ROTO INK ${noOfColors} COLORS`,
      category:     'Ink',
      uom:          'KG',
      consumptionPerBag: r6(inkWtG / 1000),
      quantity,
      wastagePercent: w.ink,
    }));
    seq += 10;
  }

  // ── 8. THREAD ──
  lines.push(makeLine({
    seq,
    materialCode: 'THR00001',
    sapCode:      'THR00001',
    description:  `MFY STITCHING THREAD NATURAL - ${spec.stitchType || 'SFDS'}`,
    category:     'Thread',
    uom:          'KG',
    consumptionPerBag: r6(threadWeight / 1000),
    quantity,
    wastagePercent: w.thread,
  }));
  seq += 10;

  // ── 9. HANDLE ──
  if (handleWeight > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'HDL00001',
      sapCode:      'HDL00001',
      description:  `CROSS HANDLE NATURAL PP TAPE`,
      category:     'Handle Material',
      uom:          'KG',
      consumptionPerBag: r6(handleWeight / 1000),
      quantity,
      wastagePercent: w.handle,
    }));
    seq += 10;
  }

  // ── 10. LINER ──
  if (linerMicron > 0 && linerWidthCm > 0) {
    const HDPE_DENSITY = 0.95;
    const linerWtG = ((linerWidthCm * linerLengthCm) / 10000) * (linerMicron * HDPE_DENSITY) * 2;
    lines.push(makeLine({
      seq,
      materialCode: 'LIN00001',
      sapCode:      'LIN00001',
      description:  `HDPE LINER ${linerMicron} MICRON ${linerWidthCm}x${linerLengthCm}CM`,
      category:     'Liner',
      uom:          'KG',
      consumptionPerBag: r6(linerWtG / 1000),
      quantity,
      wastagePercent: w.liner,
    }));
    seq += 10;
  }

  // ── 11. PACKING MATERIAL ──
  lines.push(makePackingLine(seq, quantity));

  return lines;
}

// ─────────────────────────────────────────────────
// PP WOVEN BAG BOM GENERATOR
// Components: Fabric, Tape, Ink, Thread, Packing
// ─────────────────────────────────────────────────

export function generatePPBom(spec, quantity, w) {
  const {
    widthCm    = 61,
    lengthCm   = 100,
    fabricGsm  = 65,
    noOfColors = 0,
    threadWeight = 2,
  } = spec;

  const bagArea   = calcBagArea(widthCm, lengthCm);
  const fabricWtG = calcFabricWeight(bagArea, fabricGsm);
  const tapeWtG   = fabricWtG * (1 + w.tape / 100);
  const inkWtG    = noOfColors > 0 ? calcInkWeight(bagArea, noOfColors, 0.3) : 0;

  const lines = [];
  let seq = 10;

  lines.push(makeLine({
    seq,
    materialCode: 'LMS00047',
    sapCode:      'LMS00047',
    description:  `FABRIC-TUBE-${widthCm}CMS-${calcFabricGPM(fabricGsm, widthCm).toFixed(1)}GPM-${spec.fabricColor || 'MILKY WHITE'}`,
    category:     'Fabric',
    uom:          'KG',
    consumptionPerBag: r6(fabricWtG / 1000),
    quantity,
    wastagePercent: w.fabric,
  }));
  seq += 10;

  lines.push(makeLine({
    seq,
    materialCode: 'TAP00227',
    sapCode:      'TAP00227',
    description:  `PP TAPE ${spec.tapeWidth || '2.65'}MM ${spec.fabricColor || 'MILKY WHITE'}`,
    category:     'Tape',
    uom:          'KG',
    consumptionPerBag: r6(tapeWtG / 1000),
    quantity,
    wastagePercent: w.tape,
  }));
  seq += 10;

  if (inkWtG > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'INK00002',
      sapCode:      'INK00002',
      description:  `FLEXO INK ${noOfColors} COLORS`,
      category:     'Ink',
      uom:          'KG',
      consumptionPerBag: r6(inkWtG / 1000),
      quantity,
      wastagePercent: w.ink,
    }));
    seq += 10;
  }

  lines.push(makeLine({
    seq,
    materialCode: 'THR00001',
    sapCode:      'THR00001',
    description:  `MFY STITCHING THREAD - SFDS`,
    category:     'Thread',
    uom:          'KG',
    consumptionPerBag: r6(threadWeight / 1000),
    quantity,
    wastagePercent: w.thread,
  }));
  seq += 10;

  lines.push(makePackingLine(seq, quantity));
  return lines;
}

// ─────────────────────────────────────────────────
// SHOPPING BAG BOM GENERATOR
// Components: Fabric, Printing, Handle, Thread, Packing
// ─────────────────────────────────────────────────

export function generateShoppingBom(spec, quantity, w) {
  const {
    widthCm    = 30,
    lengthCm   = 40,
    fabricGsm  = 80,
    noOfColors = 4,
    threadWeight = 1.5,
  } = spec;

  const bagArea   = calcBagArea(widthCm, lengthCm);
  const fabricWtG = calcFabricWeight(bagArea, fabricGsm);
  const tapeWtG   = fabricWtG * (1 + w.tape / 100);
  const inkWtG    = noOfColors > 0 ? calcInkWeight(bagArea, noOfColors, 0.4) : 0;

  const lines = [];
  let seq = 10;

  lines.push(makeLine({
    seq,
    materialCode: 'FAB-003',
    sapCode:      'LMS00047',
    description:  `FABRIC ${widthCm}x${lengthCm}CM ${fabricGsm}GSM ${spec.fabricColor || 'MILKY WHITE'}`,
    category:     'Fabric',
    uom:          'KG',
    consumptionPerBag: r6(fabricWtG / 1000),
    quantity,
    wastagePercent: w.fabric,
  }));
  seq += 10;

  lines.push(makeLine({
    seq,
    materialCode: 'TAP-002',
    sapCode:      'TAP00227',
    description:  `PP TAPE ${spec.fabricColor || 'MILKY WHITE'}`,
    category:     'Tape',
    uom:          'KG',
    consumptionPerBag: r6(tapeWtG / 1000),
    quantity,
    wastagePercent: w.tape,
  }));
  seq += 10;

  if (inkWtG > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'INK-001',
      sapCode:      'INK00001',
      description:  `PRINTING INK ${noOfColors} COLORS`,
      category:     'Ink',
      uom:          'KG',
      consumptionPerBag: r6(inkWtG / 1000),
      quantity,
      wastagePercent: w.ink,
    }));
    seq += 10;
  }

  // Handle (D-cut or cross handle)
  lines.push(makeLine({
    seq,
    materialCode: 'HDL-001',
    sapCode:      'HDL00001',
    description:  `HANDLE - ${spec.handleType || 'D-CUT'}`,
    category:     'Handle Material',
    uom:          'KG',
    consumptionPerBag: r6(3 / 1000),
    quantity,
    wastagePercent: w.handle,
  }));
  seq += 10;

  lines.push(makeLine({
    seq,
    materialCode: 'THR-001',
    sapCode:      'THR00001',
    description:  `MFY STITCHING THREAD`,
    category:     'Thread',
    uom:          'KG',
    consumptionPerBag: r6(threadWeight / 1000),
    quantity,
    wastagePercent: w.thread,
  }));
  seq += 10;

  lines.push(makePackingLine(seq, quantity));
  return lines;
}

// ─────────────────────────────────────────────────
// FIBC BAG BOM GENERATOR
// Components: Fabric, Tape, Loops, Thread, Liner, Printing, Packing
// ─────────────────────────────────────────────────

export function generateFIBCBom(spec, quantity, w) {
  const {
    widthCm      = 90,
    heightCm     = 140,
    fabricGsm    = 200,
    noOfColors   = 2,
    linerMicron  = 0,
  } = spec;

  const bodyArea  = calcFIBCBodyArea(widthCm, heightCm);
  // Total fabric includes body + top panel + bottom panel
  const totalArea = bodyArea * 1.3;
  const fabricWtG = calcFabricWeight(totalArea, fabricGsm);
  const tapeWtG   = fabricWtG * (1 + w.tape / 100);
  const inkWtG    = noOfColors > 0 ? calcInkWeight(bodyArea, noOfColors, 0.3) : 0;
  const LOOP_WT_G = 280; // 4 loops × 70g each

  const lines = [];
  let seq = 10;

  lines.push(makeLine({
    seq,
    materialCode: 'FAB-004',
    sapCode:      'LMS00921',
    description:  `FIBC BODY FABRIC ${widthCm}x${widthCm}x${heightCm}CM ${fabricGsm}GSM NATURAL`,
    category:     'Fabric',
    uom:          'KG',
    consumptionPerBag: r6(fabricWtG / 1000),
    quantity,
    wastagePercent: w.fabric,
  }));
  seq += 10;

  lines.push(makeLine({
    seq,
    materialCode: 'TAP-001',
    sapCode:      'TAP00175',
    description:  `PP TAPE NATURAL FOR FIBC`,
    category:     'Tape',
    uom:          'KG',
    consumptionPerBag: r6(tapeWtG / 1000),
    quantity,
    wastagePercent: w.tape,
  }));
  seq += 10;

  // Lift Loops
  lines.push(makeLine({
    seq,
    materialCode: 'LOP-001',
    sapCode:      'LOP-001',
    description:  `LIFT LOOPS 2T WLL - 4 PCS PER BAG`,
    category:     'Loop Material',
    uom:          'SET',
    consumptionPerBag: 1,
    quantity,
    wastagePercent: w.loop,
  }));
  seq += 10;

  // Thread — FIBC uses heavy thread
  lines.push(makeLine({
    seq,
    materialCode: 'THR-001',
    sapCode:      'THR00001',
    description:  `HEAVY STITCHING THREAD FOR FIBC`,
    category:     'Thread',
    uom:          'KG',
    consumptionPerBag: r6(15 / 1000),
    quantity,
    wastagePercent: w.thread,
  }));
  seq += 10;

  if (linerMicron > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'LIN-001',
      sapCode:      'LIN00001',
      description:  `HDPE LINER ${linerMicron} MICRON FOR FIBC`,
      category:     'Liner',
      uom:          'KG',
      consumptionPerBag: r6(350 / 1000),
      quantity,
      wastagePercent: w.liner,
    }));
    seq += 10;
  }

  if (inkWtG > 0) {
    lines.push(makeLine({
      seq,
      materialCode: 'INK-002',
      sapCode:      'INK00001',
      description:  `SCREEN PRINTING INK ${noOfColors} COLORS`,
      category:     'Ink',
      uom:          'KG',
      consumptionPerBag: r6(inkWtG / 1000),
      quantity,
      wastagePercent: w.ink,
    }));
    seq += 10;
  }

  lines.push(makePackingLine(seq, quantity));
  return lines;
}

// ─────────────────────────────────────────────────
// HELPER BUILDERS
// ─────────────────────────────────────────────────

/**
 * Builds a single BOM line object and calculates all derived fields.
 * @param {Object} params
 * @returns {Object} BomLine
 */
function makeLine({
  seq,
  materialCode,
  sapCode,
  description,
  category,
  uom,
  consumptionPerBag,
  quantity,
  wastagePercent,
}) {
  const q             = quantity || 0;
  const cpb           = consumptionPerBag || 0;
  const totalConsump  = r4(cpb * q);
  const wastageQty    = r4(totalConsump * (wastagePercent / 100));
  const netReq        = r4(totalConsump + wastageQty);

  return {
    seq,
    materialCode,
    sapCode,
    description,
    category,
    uom,
    consumptionPerBag:   r6(cpb),
    consumptionPerBagKg: uom === 'KG' ? r6(cpb) : 0,
    totalConsumption:    r4(totalConsump),
    wastagePercent,
    wastageQty:          r4(wastageQty),
    netRequirement:      r4(netReq),
  };
}

/** Standard packing material line (50 bags per bale) */
function makePackingLine(seq, quantity) {
  const bales = Math.ceil(quantity / 500);
  return {
    seq,
    materialCode:      'PCK-001',
    sapCode:           'PCK-001',
    description:       'BALE PACKING - PP STRAPPING BAND',
    category:          'Packing Material',
    uom:               'KG',
    consumptionPerBag:  r6(1 / 500),
    consumptionPerBagKg: r6(1 / 500),
    totalConsumption:   r4(bales * 1),
    wastagePercent:     1.0,
    wastageQty:         r4(bales * 0.01),
    netRequirement:     r4(bales * 1.01),
  };
}

// ─────────────────────────────────────────────────
// SUMMARY AGGREGATORS
// ─────────────────────────────────────────────────

/**
 * Calculates total BOM weight summary from BOM lines.
 * @param {BomLine[]} lines
 * @returns {{ totalNetKg, totalGrossKg, lineCount }}
 */
export function calcBOMSummary(lines) {
  let totalNetKg   = 0;
  let totalGrossKg = 0;
  lines.forEach(l => {
    if (l.uom === 'KG') {
      totalNetKg   += l.totalConsumption;
      totalGrossKg += l.netRequirement;
    }
  });
  return {
    totalNetKg:   r4(totalNetKg),
    totalGrossKg: r4(totalGrossKg),
    lineCount:    lines.length,
  };
}

/**
 * Groups BOM lines by category for reporting.
 * @param {BomLine[]} lines
 * @returns {Object} { [category]: BomLine[] }
 */
export function groupBOMByCategory(lines) {
  return lines.reduce((acc, line) => {
    if (!acc[line.category]) acc[line.category] = [];
    acc[line.category].push(line);
    return acc;
  }, {});
}

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────
function r4(n) { return Math.round(n * 10000) / 10000; }
function r6(n) { return Math.round(n * 1000000) / 1000000; }

/**
 * Returns default wastage settings (user can override via settings UI).
 */
export function getDefaultWastage() {
  return { ...DEFAULT_WASTAGE };
}

/**
 * Loads wastage settings from localStorage (with defaults fallback).
 * @returns {Object}
 */
export function loadWastageSettings() {
  try {
    const saved = localStorage.getItem('erp_wastage_settings');
    return saved ? { ...DEFAULT_WASTAGE, ...JSON.parse(saved) } : { ...DEFAULT_WASTAGE };
  } catch {
    return { ...DEFAULT_WASTAGE };
  }
}

/**
 * Saves wastage settings to localStorage.
 * @param {Object} settings
 */
export function saveWastageSettings(settings) {
  localStorage.setItem('erp_wastage_settings', JSON.stringify(settings));
}
