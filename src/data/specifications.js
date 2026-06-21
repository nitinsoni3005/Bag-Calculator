/**
 * specifications.js — Product Specification data store
 * Satyendra Packaging ERP — Phase 2
 * In-memory array with full spec fields per product type
 */

export let specifications = [
  {
    id: 1,
    specNumber:   'SPEC-001',
    productCode:  'FGS03783',
    productName:  'BLUE ROSE STEAM RICE 10 KG',
    productType:  'BOPP Bag',
    soRef:        'ZAD/2627/200151',
    customerName: 'M.RAMSINGH AGRO FOODS PRIVATE LIMITED',
    // Dimensions (cm)
    widthCm:      86.2,
    lengthCm:     56.0,
    gussetCm:     0,
    // Fabric
    fabricGsm:    22.2,
    fabricGpm:    38.3,
    meshWrap:     9.5,
    meshWeft:     9.5,
    fabricColor:  'NATURAL',
    // BOPP Film
    boppMicron:   15,
    boppWidth:    80,
    boppType:     'MATT FINISH',
    boppSides:    2,
    noOfColors:   6,
    hasCylinder:  true,
    // Lamination
    lamiMicron:   20,
    lamiSides:    1,
    // Metalize
    metalizeMicron: 15,
    // Finishing
    stitchType:   'SFDS',
    hemming:      false,
    handle:       true,
    handleWeight: 5,
    bottomYarn:   true,
    // Liner
    linerRequired: false,
    linerMicron:  0,
    linerWidthCm: 0,
    linerLengthCm: 0,
    // Quantity
    quantity:     25000,
    // Calculated results (stored after calc)
    calcResults:  {
      bagArea:      0.9654,
      fabricWt:     21.43,
      boppWt:       12.37,
      lamiWt:       17.76,
      metalizeWt:   12.37,
      inkWt:         4.83,
      threadWt:      2.00,
      linerWt:       0.00,
      handleWt:      5.00,
      totalBagWt:   60.00,
      totalOrderWtKg: 1500,
      fabricGrossKg:  555,
      boppGrossKg:    152,
      boppGrossMetres: 14000,
    },
    status:      'Approved',
    createdAt:   '2026-04-17',
    createdBy:   'Nitin Soni',
  },
];

let nextId = specifications.length + 1;

export function getNextSpecId()     { return nextId++; }
export function getNextSpecNumber() {
  return `SPEC-${String(nextId).padStart(3, '0')}`;
}

/** Spec status options */
export const SPEC_STATUSES = ['Draft', 'Approved', 'Revised', 'Obsolete'];
