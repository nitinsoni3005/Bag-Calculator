/**
 * calculations.js — Centralized Dimension & Material Calculation Engine
 * Satyendra Packaging ERP — Phase 2
 *
 * DESIGN PRINCIPLES:
 *  - Pure functions only: no DOM, no global state, no side effects
 *  - Every formula is individually exported and testable
 *  - All inputs are in standard units (cm, gsm, grams)
 *  - Results are rounded to configurable decimal places
 *  - Based on real Satyendra Packaging manufacturing formulas
 *
 * UNIT CONVENTIONS:
 *  Width / Length / Gusset → centimetres (cm)
 *  GSM values              → grams per square metre (g/m²)
 *  GPM values              → grams per metre (g/m)
 *  Weight results          → grams (g)
 *  Area results            → square metres (m²)
 *  Tape denier             → denier (D)
 */

// ─────────────────────────────────────────────────
// 1. AREA CALCULATIONS
// ─────────────────────────────────────────────────

/**
 * Calculates the flat (open) bag area in square metres.
 * For a tube bag: area = width * length (both sides included)
 * @param {number} widthCm   - Bag flat width in cm
 * @param {number} lengthCm  - Bag cut length in cm
 * @returns {number} Area in m²
 */
export function calcBagArea(widthCm, lengthCm) {
  if (!isPositive(widthCm) || !isPositive(lengthCm)) return 0;
  // Convert cm² to m²: divide by 10000
  return round4((widthCm * lengthCm) / 10000);
}

/**
 * Calculates BOPP film area including gusset.
 * BOPP wraps around the bag: (width + gusset) * length * 2 (front + back if double sided)
 * @param {number} widthCm    - Flat bag width in cm
 * @param {number} lengthCm   - Cut length in cm
 * @param {number} gussetCm   - Gusset depth in cm (0 if no gusset)
 * @param {number} sides      - 1 = single side, 2 = double side BOPP
 * @returns {number} BOPP film area in m²
 */
export function calcBoppArea(widthCm, lengthCm, gussetCm = 0, sides = 1) {
  if (!isPositive(widthCm) || !isPositive(lengthCm)) return 0;
  const effectiveWidth = widthCm + (2 * gussetCm);
  return round4((effectiveWidth * lengthCm * sides) / 10000);
}

/**
 * Calculates fabric tube circumference in cm.
 * Tube circumference = 2 * (flat width)
 * @param {number} flatWidthCm
 * @returns {number} Circumference in cm
 */
export function calcTubeCircumference(flatWidthCm) {
  return round2(2 * flatWidthCm);
}

// ─────────────────────────────────────────────────
// 2. FABRIC WEIGHT CALCULATIONS
// ─────────────────────────────────────────────────

/**
 * Calculates fabric weight per bag from GSM and area.
 * @param {number} areaSqm   - Bag area in m²
 * @param {number} fabricGsm - Fabric weight in g/m²
 * @returns {number} Fabric weight per bag in grams
 */
export function calcFabricWeight(areaSqm, fabricGsm) {
  if (!isPositive(areaSqm) || !isPositive(fabricGsm)) return 0;
  return round4(areaSqm * fabricGsm);
}

/**
 * Calculates fabric GPM (grams per metre) from GSM and fabric width.
 * GPM = GSM * (width in metres)
 * @param {number} fabricGsm
 * @param {number} widthCm
 * @returns {number} GPM
 */
export function calcFabricGPM(fabricGsm, widthCm) {
  if (!isPositive(fabricGsm) || !isPositive(widthCm)) return 0;
  return round2(fabricGsm * (widthCm / 100));
}

/**
 * Calculates total fabric weight for full order.
 * @param {number} fabricWeightPerBagGrams
 * @param {number} quantity
 * @param {number} wastagePercent  - e.g. 3.5 for 3.5%
 * @returns {{ net: number, gross: number }} Both in KG
 */
export function calcTotalFabricWeight(fabricWeightPerBagGrams, quantity, wastagePercent = 3.5) {
  if (!isPositive(fabricWeightPerBagGrams) || !isPositive(quantity)) return { net: 0, gross: 0 };
  const netKg   = round2((fabricWeightPerBagGrams * quantity) / 1000);
  const grossKg = round2(netKg * (1 + wastagePercent / 100));
  return { net: netKg, gross: grossKg };
}

// ─────────────────────────────────────────────────
// 3. BOPP FILM CALCULATIONS
// ─────────────────────────────────────────────────

/**
 * Calculates BOPP film weight per bag.
 * BOPP GSM = micron * density (BOPP density ≈ 0.905 g/cm³)
 * @param {number} boppAreaSqm   - BOPP film area per bag in m²
 * @param {number} boppMicron    - Film thickness in microns
 * @returns {number} BOPP weight per bag in grams
 */
export function calcBoppWeight(boppAreaSqm, boppMicron) {
  if (!isPositive(boppAreaSqm) || !isPositive(boppMicron)) return 0;
  const BOPP_DENSITY = 0.905; // g/cm³
  const boppGsm = boppMicron * BOPP_DENSITY;
  return round4(boppAreaSqm * boppGsm);
}

/**
 * Calculates BOPP film GPM (grams per metre) for production planning.
 * @param {number} boppMicron
 * @param {number} boppWidthCm
 * @returns {number} GPM
 */
export function calcBoppGPM(boppMicron, boppWidthCm) {
  if (!isPositive(boppMicron) || !isPositive(boppWidthCm)) return 0;
  const BOPP_DENSITY = 0.905;
  const gsm = boppMicron * BOPP_DENSITY;
  return round2(gsm * (boppWidthCm / 100));
}

/**
 * Calculates total BOPP film required for order in KG and metres.
 * @param {number} boppWeightPerBagGrams
 * @param {number} quantity
 * @param {number} wastagePercent  - default 8%
 * @param {number} boppWidthCm
 * @param {number} boppMicron
 * @returns {{ netKg, grossKg, netMetres, grossMetres }}
 */
export function calcTotalBoppRequirement(boppWeightPerBagGrams, quantity, wastagePercent = 8, boppWidthCm = 80, boppMicron = 15) {
  if (!isPositive(boppWeightPerBagGrams) || !isPositive(quantity)) {
    return { netKg: 0, grossKg: 0, netMetres: 0, grossMetres: 0 };
  }
  const netKg     = round2((boppWeightPerBagGrams * quantity) / 1000);
  const grossKg   = round2(netKg * (1 + wastagePercent / 100));
  const gpm       = calcBoppGPM(boppMicron, boppWidthCm);
  const netMetres   = gpm > 0 ? round0((netKg   * 1000) / gpm) : 0;
  const grossMetres = gpm > 0 ? round0((grossKg * 1000) / gpm) : 0;
  return { netKg, grossKg, netMetres, grossMetres };
}

// ─────────────────────────────────────────────────
// 4. METALIZE / LAMINATION CALCULATIONS
// ─────────────────────────────────────────────────

/**
 * Calculates lamination coating weight per bag.
 * Lamination micron → GSM using LDPE density ≈ 0.92 g/cm³
 * @param {number} bagAreaSqm
 * @param {number} lamiMicron   - Lamination thickness in microns
 * @param {number} sides        - 1 = one side, 2 = both sides
 * @returns {number} Lamination weight in grams
 */
export function calcLaminationWeight(bagAreaSqm, lamiMicron, sides = 1) {
  if (!isPositive(bagAreaSqm) || !isPositive(lamiMicron)) return 0;
  const LDPE_DENSITY = 0.92;
  const lamiGsm = lamiMicron * LDPE_DENSITY;
  return round4(bagAreaSqm * lamiGsm * sides);
}

/**
 * Calculates metalize film weight per bag.
 * Metalize film density ≈ 1.45 g/cm³ (aluminium coated BOPP/PET)
 * @param {number} bagAreaSqm
 * @param {number} metalizeMicron
 * @returns {number} Metalize weight in grams
 */
export function calcMetalizeWeight(bagAreaSqm, metalizeMicron) {
  if (!isPositive(bagAreaSqm) || !isPositive(metalizeMicron)) return 0;
  const METALIZE_DENSITY = 1.45;
  const gsm = metalizeMicron * METALIZE_DENSITY;
  return round4(bagAreaSqm * gsm);
}

/**
 * Calculates adhesive weight for lamination.
 * Standard adhesive dosage: 1.5 g/m² per side
 * @param {number} bagAreaSqm
 * @param {number} sides
 * @returns {number} Adhesive weight in grams
 */
export function calcAdhesiveWeight(bagAreaSqm, sides = 1) {
  const ADHESIVE_GSM = 1.5;
  return round4(bagAreaSqm * ADHESIVE_GSM * sides);
}

// ─────────────────────────────────────────────────
// 5. INK CONSUMPTION
// ─────────────────────────────────────────────────

/**
 * Calculates ink weight per bag based on number of colours.
 * Industry standard: ~0.5 g/m² per colour (solid coverage)
 * @param {number} bagAreaSqm
 * @param {number} noOfColors
 * @param {number} [coverageFactor=0.5] - g/m² per colour
 * @returns {number} Ink weight in grams
 */
export function calcInkWeight(bagAreaSqm, noOfColors, coverageFactor = 0.5) {
  if (!isPositive(bagAreaSqm) || noOfColors <= 0) return 0;
  return round4(bagAreaSqm * noOfColors * coverageFactor);
}

// ─────────────────────────────────────────────────
// 6. THREAD / STITCHING CONSUMPTION
// ─────────────────────────────────────────────────

/**
 * Calculates thread consumption per bag.
 * Stitch length standard: 4 cm for top + 0 for hemming (SFDS)
 * Thread factor = 3.5x the stitch length for MFY thread
 * @param {number} bagWidthCm
 * @param {number} stitchType   - 'SFDS' | 'SFSS' | 'hemming'
 * @returns {number} Thread weight per bag in grams
 */
export function calcThreadWeight(bagWidthCm, stitchType = 'SFDS') {
  if (!isPositive(bagWidthCm)) return 0;
  const THREAD_FACTOR = 3.5;   // thread length multiplier
  const THREAD_DENSITY = 0.08; // grams per cm of thread
  let stitchCm = bagWidthCm + 4; // cross stitch = bag width + seam allowance
  if (stitchType === 'hemming') stitchCm = bagWidthCm * 2;
  return round2(stitchCm * THREAD_FACTOR * THREAD_DENSITY);
}

// ─────────────────────────────────────────────────
// 7. LINER CALCULATIONS
// ─────────────────────────────────────────────────

/**
 * Calculates liner weight per bag (HDPE inner liner).
 * @param {number} linerWidthCm
 * @param {number} linerLengthCm
 * @param {number} linerMicron
 * @returns {number} Liner weight in grams
 */
export function calcLinerWeight(linerWidthCm, linerLengthCm, linerMicron) {
  if (!isPositive(linerWidthCm) || !isPositive(linerLengthCm) || !isPositive(linerMicron)) return 0;
  const HDPE_DENSITY = 0.95; // g/cm³
  const linerGsm = linerMicron * HDPE_DENSITY;
  const areaSqm  = (linerWidthCm * linerLengthCm) / 10000;
  // Liner is a tube: 2 layers
  return round4(areaSqm * linerGsm * 2);
}

// ─────────────────────────────────────────────────
// 8. TAPE & DENIER CALCULATIONS
// ─────────────────────────────────────────────────

/**
 * Calculates tape denier from tape width and fabric GSM.
 * Denier = GPM / (mesh count / cm * tape width factor)
 * Approximate method from production data:
 *   Denier = (fabric GSM * tape width mm² * 9000) / (mesh wrap * mesh weft * tape width * 10000)
 *
 * @param {number} fabricGsm
 * @param {number} tapeWidthMm    - Tape width in mm
 * @param {number} meshWrap       - Warp mesh count (threads per cm)
 * @param {number} meshWeft       - Weft mesh count
 * @returns {number} Calculated denier
 */
export function calcDenier(fabricGsm, tapeWidthMm, meshWrap, meshWeft) {
  if (!isPositive(fabricGsm) || !isPositive(tapeWidthMm) || !isPositive(meshWrap) || !isPositive(meshWeft)) return 0;
  // From industrial formula: D = (GSM * 9000) / (mesh_w * mesh_f * 2)
  // where mesh is in threads/cm
  const denier = (fabricGsm * 9000) / ((meshWrap + meshWeft) * tapeWidthMm * 10);
  return round0(denier);
}

/**
 * Calculates tape quantity required for order.
 * @param {number} fabricWeightNetKg  - Net fabric KG required
 * @param {number} weavingWastage     - Weaving wastage % (default 2%)
 * @returns {number} Tape required in KG
 */
export function calcTapeRequirement(fabricWeightNetKg, weavingWastage = 2) {
  if (!isPositive(fabricWeightNetKg)) return 0;
  return round2(fabricWeightNetKg * (1 + weavingWastage / 100));
}

// ─────────────────────────────────────────────────
// 9. HANDLE CALCULATIONS (for BOPP bags)
// ─────────────────────────────────────────────────

/**
 * Calculates handle weight and total metres required.
 * @param {number} handleWeightPerBagGrams
 * @param {number} quantity
 * @returns {{ totalKg: number, totalMetres: number }}
 */
export function calcHandleRequirement(handleWeightPerBagGrams, quantity) {
  if (!isPositive(handleWeightPerBagGrams) || !isPositive(quantity)) return { totalKg: 0, totalMetres: 0 };
  const totalKg = round2((handleWeightPerBagGrams * quantity) / 1000);
  // Estimate: 1 handle ≈ 0.5 cm width, approx 20g/m handle tape
  const totalMetres = round0((handleWeightPerBagGrams * quantity) / 20);
  return { totalKg, totalMetres };
}

// ─────────────────────────────────────────────────
// 10. TOTAL BAG WEIGHT AGGREGATOR
// ─────────────────────────────────────────────────

/**
 * Aggregates all component weights into total bag weight.
 * @param {Object} components
 * @param {number} components.fabric       - Fabric weight (g)
 * @param {number} components.bopp         - BOPP film weight (g)
 * @param {number} components.lamination   - Lamination weight (g)
 * @param {number} components.metalize     - Metalize film weight (g)
 * @param {number} components.ink          - Ink weight (g)
 * @param {number} components.thread       - Thread weight (g)
 * @param {number} components.liner        - Liner weight (g)
 * @param {number} components.handle       - Handle weight (g)
 * @returns {number} Total bag weight in grams
 */
export function calcTotalBagWeight(components) {
  const {
    fabric    = 0,
    bopp      = 0,
    lamination = 0,
    metalize  = 0,
    ink       = 0,
    thread    = 0,
    liner     = 0,
    handle    = 0,
  } = components;
  return round2(fabric + bopp + lamination + metalize + ink + thread + liner + handle);
}

/**
 * Calculates total order weight in KG.
 * @param {number} bagWeightGrams
 * @param {number} quantity
 * @returns {number} Total weight in KG
 */
export function calcTotalOrderWeight(bagWeightGrams, quantity) {
  if (!isPositive(bagWeightGrams) || !isPositive(quantity)) return 0;
  return round2((bagWeightGrams * quantity) / 1000);
}

// ─────────────────────────────────────────────────
// 11. FIBC SPECIFIC CALCULATIONS
// ─────────────────────────────────────────────────

/**
 * Calculates FIBC body fabric area.
 * Body = circumference * height = 4 * width * height (square body)
 * @param {number} widthCm
 * @param {number} heightCm
 * @returns {number} Area in m²
 */
export function calcFIBCBodyArea(widthCm, heightCm) {
  if (!isPositive(widthCm) || !isPositive(heightCm)) return 0;
  return round4((4 * widthCm * heightCm) / 10000);
}

/**
 * Calculates FIBC Safe Working Load (SWL) from Safety Factor (SF).
 * @param {number} capacity  - Bag capacity in KG
 * @param {number} sf        - Safety factor (typically 5:1 or 6:1)
 * @returns {number} Breaking load in KG
 */
export function calcFIBCBreakingLoad(capacity, sf = 5) {
  return round0(capacity * sf);
}

// ─────────────────────────────────────────────────
// 12. COMPLETE SPEC CALCULATOR (for ProductSpecification page)
// ─────────────────────────────────────────────────

/**
 * Master calculation function for BOPP Bag specification.
 * Call this from the ProductSpecification page with all form values.
 * Returns a complete result object for display.
 *
 * @param {Object} spec
 * @returns {Object} result with all weights and totals
 */
export function calcBOPPBagSpec(spec) {
  const {
    widthCm = 0,
    lengthCm = 0,
    gussetCm = 0,
    fabricGsm = 0,
    boppMicron = 15,
    boppSides = 1,
    boppWidthCm = 80,
    lamiMicron = 20,
    lamiSides = 1,
    metalizeMicron = 0,
    noOfColors = 0,
    threadWeightGrams = 2,
    linerWidthCm = 0,
    linerLengthCm = 0,
    linerMicron = 0,
    handleWeightGrams = 0,
    quantity = 0,
    wastagePercent = 3.5,
    boppWastagePercent = 8,
  } = spec;

  const bagArea    = calcBagArea(widthCm, lengthCm);
  const boppArea   = calcBoppArea(widthCm, lengthCm, gussetCm, boppSides);

  const fabricWt   = calcFabricWeight(bagArea, fabricGsm);
  const boppWt     = calcBoppWeight(boppArea, boppMicron);
  const lamiWt     = lamiMicron > 0 ? calcLaminationWeight(bagArea, lamiMicron, lamiSides) : 0;
  const metalizeWt = metalizeMicron > 0 ? calcMetalizeWeight(boppArea, metalizeMicron) : 0;
  const adhesiveWt = (lamiMicron > 0 || metalizeMicron > 0) ? calcAdhesiveWeight(boppArea, boppSides) : 0;
  const inkWt      = calcInkWeight(boppArea, noOfColors);
  const linerWt    = calcLinerWeight(linerWidthCm, linerLengthCm, linerMicron);

  const totalBagWt = calcTotalBagWeight({
    fabric:     fabricWt,
    bopp:       boppWt,
    lamination: lamiWt,
    metalize:   metalizeWt,
    ink:        inkWt,
    thread:     threadWeightGrams,
    liner:      linerWt,
    handle:     handleWeightGrams,
  });

  const totalOrderWt = calcTotalOrderWeight(totalBagWt, quantity);

  // Fabric order requirement
  const fabricReq  = calcTotalFabricWeight(fabricWt, quantity, wastagePercent);

  // BOPP requirement
  const boppReq    = calcTotalBoppRequirement(boppWt, quantity, boppWastagePercent, boppWidthCm, boppMicron);

  // GPM
  const fabricGpm  = calcFabricGPM(fabricGsm, widthCm);
  const boppGpm    = calcBoppGPM(boppMicron, boppWidthCm);

  return {
    // Per-bag breakdown
    bagArea:     round4(bagArea),
    boppArea:    round4(boppArea),
    fabricWt:    round2(fabricWt),
    boppWt:      round2(boppWt),
    lamiWt:      round2(lamiWt),
    metalizeWt:  round2(metalizeWt),
    adhesiveWt:  round2(adhesiveWt),
    inkWt:       round2(inkWt),
    threadWt:    round2(threadWeightGrams),
    linerWt:     round2(linerWt),
    handleWt:    round2(handleWeightGrams),
    totalBagWt:  round2(totalBagWt),

    // Order totals
    totalOrderWtKg: totalOrderWt,
    fabricNetKg:    fabricReq.net,
    fabricGrossKg:  fabricReq.gross,
    boppNetKg:      boppReq.netKg,
    boppGrossKg:    boppReq.grossKg,
    boppNetMetres:  boppReq.netMetres,
    boppGrossMetres: boppReq.grossMetres,

    // GPM info
    fabricGpm:   round2(fabricGpm),
    boppGpm:     round2(boppGpm),
  };
}

/**
 * Master calculation function for PP Woven Bag specification.
 * @param {Object} spec
 * @returns {Object} result
 */
export function calcPPBagSpec(spec) {
  const {
    widthCm = 0,
    lengthCm = 0,
    fabricGsm = 0,
    noOfColors = 0,
    threadWeightGrams = 2,
    quantity = 0,
    wastagePercent = 3.5,
  } = spec;

  const bagArea  = calcBagArea(widthCm, lengthCm);
  const fabricWt = calcFabricWeight(bagArea, fabricGsm);
  const inkWt    = noOfColors > 0 ? calcInkWeight(bagArea, noOfColors, 0.3) : 0;

  const totalBagWt    = calcTotalBagWeight({ fabric: fabricWt, ink: inkWt, thread: threadWeightGrams });
  const totalOrderWt  = calcTotalOrderWeight(totalBagWt, quantity);
  const fabricReq     = calcTotalFabricWeight(fabricWt, quantity, wastagePercent);
  const fabricGpm     = calcFabricGPM(fabricGsm, widthCm);

  return {
    bagArea:        round4(bagArea),
    fabricWt:       round2(fabricWt),
    inkWt:          round2(inkWt),
    threadWt:       round2(threadWeightGrams),
    totalBagWt:     round2(totalBagWt),
    totalOrderWtKg: totalOrderWt,
    fabricNetKg:    fabricReq.net,
    fabricGrossKg:  fabricReq.gross,
    fabricGpm:      round2(fabricGpm),
  };
}

/**
 * Master calculation function for FIBC Bag specification.
 * @param {Object} spec
 * @returns {Object} result
 */
export function calcFIBCSpec(spec) {
  const {
    widthCm = 0,
    heightCm = 0,
    fabricGsm = 0,
    capacity = 1000,
    sf = 5,
    quantity = 0,
  } = spec;

  const bodyArea    = calcFIBCBodyArea(widthCm, heightCm);
  const fabricWt    = calcFabricWeight(bodyArea, fabricGsm);
  const breakLoad   = calcFIBCBreakingLoad(capacity, sf);
  const totalBagWt  = round2(fabricWt * 1.35); // loops + spouts add ~35%
  const totalOrderWt = calcTotalOrderWeight(totalBagWt, quantity);

  return {
    bodyArea:       round4(bodyArea),
    fabricWt:       round2(fabricWt),
    totalBagWt,
    breakingLoad:   breakLoad,
    totalOrderWtKg: totalOrderWt,
    fabricNetKg:    round2((fabricWt * quantity) / 1000),
  };
}

// ─────────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────────

/** Round to 4 decimal places */
function round4(n) { return Math.round(n * 10000) / 10000; }

/** Round to 2 decimal places */
function round2(n) { return Math.round(n * 100) / 100; }

/** Round to 0 decimal places */
function round0(n) { return Math.round(n); }

/** Check if value is a positive number */
function isPositive(v) { return typeof v === 'number' && !isNaN(v) && v > 0; }

/**
 * Converts inches to centimetres.
 * @param {number} inches
 * @returns {number} cm
 */
export function inchToCm(inches) { return round4(inches * 2.54); }

/**
 * Converts centimetres to inches.
 * @param {number} cm
 * @returns {number} inches
 */
export function cmToInch(cm) { return round4(cm / 2.54); }

/**
 * Formats a number as grams with 2 decimal places.
 * @param {number} grams
 * @returns {string}
 */
export function formatGrams(grams) {
  if (!grams && grams !== 0) return '—';
  return `${round2(grams).toFixed(2)} g`;
}

/**
 * Formats a number as kilograms.
 * @param {number} kg
 * @returns {string}
 */
export function formatKg(kg) {
  if (!kg && kg !== 0) return '—';
  return `${round2(kg).toFixed(2)} KG`;
}
