/**
 * boms.js — Generated BOM store
 * Satyendra Packaging ERP — Phase 3
 *
 * Each BOM record links to a Sales Order and Specification.
 * BOM lines contain full material consumption data.
 */

export let boms = [
  {
    id: 1,
    bomNumber:    'BOM-001',
    soNumber:     'ZAD/2627/200151',
    specNumber:   'SPEC-001',
    productCode:  'FGS03783',
    productName:  'BLUE ROSE STEAM RICE 10 KG',
    productType:  'BOPP Bag',
    customerName: 'M.RAMSINGH AGRO FOODS PRIVATE LIMITED',
    quantity:     25000,
    uom:          'PCS',
    status:       'Approved',
    generatedBy:  'Nitin Soni',
    generatedAt:  '2026-04-17',
    // BOM Lines — one entry per material
    lines: [
      {
        seq: 10,
        materialCode:   'LMS01453',
        sapCode:        'LMS01453',
        description:    'FABRIC-TUBE-86.2CMS-38.3GPM-NATURAL',
        category:       'Fabric',
        uom:            'KG',
        consumptionPerBag: 0.02143,
        totalConsumption:  535.75,
        wastagePercent:    3.5,
        wastageQty:        18.75,
        netRequirement:    554.5,
      },
      {
        seq: 20,
        materialCode:   'TAP00175',
        sapCode:        'TAP00175',
        description:    'TAPE-2.67MM-0267 DENIER NATURAL',
        category:       'Tape',
        uom:            'KG',
        consumptionPerBag: 0.02195,
        totalConsumption:  548.75,
        wastagePercent:    2.0,
        wastageQty:        10.98,
        netRequirement:    559.73,
      },
      {
        seq: 30,
        materialCode:   'RGP04179',
        sapCode:        'RGP04179',
        description:    'BOPP MATT FINISH 15MIC PRINTED (6 COLOR)',
        category:       'BOPP Film',
        uom:            'KG',
        consumptionPerBag: 0.00608,
        totalConsumption:  152.0,
        wastagePercent:    8.0,
        wastageQty:        12.16,
        netRequirement:    164.16,
      },
      {
        seq: 40,
        materialCode:   'DCT04882',
        sapCode:        'DCT04882',
        description:    'METALIZE FILM 15 MICRON SLITTED',
        category:       'BOPP Film',
        uom:            'KG',
        consumptionPerBag: 0.00638,
        totalConsumption:  159.5,
        wastagePercent:    1.5,
        wastageQty:        2.39,
        netRequirement:    161.89,
      },
      {
        seq: 50,
        materialCode:   'ELR03482',
        sapCode:        'ELR03482',
        description:    'EXTRUSION LAMINATION PP+LDPE 20 MICRON',
        category:       'Lamination',
        uom:            'KG',
        consumptionPerBag: 0.01776,
        totalConsumption:  444.0,
        wastagePercent:    3.0,
        wastageQty:        13.32,
        netRequirement:    457.32,
      },
      {
        seq: 60,
        materialCode:   'INK00001',
        sapCode:        'INK00001',
        description:    'SOLVENT BASED ROTO INK 6 COLORS',
        category:       'Ink',
        uom:            'KG',
        consumptionPerBag: 0.000672,
        totalConsumption:  16.8,
        wastagePercent:    60.0,
        wastageQty:        10.08,
        netRequirement:    26.88,
      },
      {
        seq: 70,
        materialCode:   'THR00001',
        sapCode:        'THR00001',
        description:    'MFY STITCHING THREAD NATURAL',
        category:       'Thread',
        uom:            'KG',
        consumptionPerBag: 0.002,
        totalConsumption:  50.0,
        wastagePercent:    1.0,
        wastageQty:        0.5,
        netRequirement:    50.5,
      },
      {
        seq: 80,
        materialCode:   'HDL00001',
        sapCode:        'HDL00001',
        description:    'CROSS HANDLE NATURAL PP TAPE',
        category:       'Handle Material',
        uom:            'KG',
        consumptionPerBag: 0.005,
        totalConsumption:  125.0,
        wastagePercent:    0.0,
        wastageQty:        0.0,
        netRequirement:    125.0,
      },
      {
        seq: 90,
        materialCode:   'PCK-001',
        sapCode:        'PCK-001',
        description:    'BALE PACKING - PP STRAPPING BAND',
        category:       'Packing Material',
        uom:            'KG',
        consumptionPerBag: 0.00004,
        totalConsumption:  1.0,
        wastagePercent:    1.0,
        wastageQty:        0.01,
        netRequirement:    1.01,
      },
    ],
    // Totals
    totalBagWeight:    60.0,
    totalOrderWeightKg: 1500.0,
  },
];

let _nextId  = boms.length + 1;
let _nextNum = boms.length + 1;

export function getNextBOMId()     { return _nextId++; }
export function getNextBOMNumber() { return `BOM-${String(_nextNum++).padStart(3, '0')}`; }

export const BOM_STATUSES = ['Draft', 'Approved', 'Revised', 'Obsolete'];
