/**
 * sapMaterials.js — SAP Material Master data store
 * Maps internal material codes to SAP MM01 codes
 * Satyendra Packaging ERP — Phase 3
 *
 * SAP Item Categories:
 *  L = Stock item (raw material)
 *  R = Variable size item
 *  T = Text item (no goods movement)
 */

export const SAP_CATEGORIES = [
  'Fabric',
  'Tape',
  'BOPP Film',
  'Lamination',
  'Ink',
  'Thread',
  'Liner',
  'Packing Material',
  'Adhesive',
  'Loop Material',
  'Handle Material',
  'Finished Goods',
];

export let sapMaterials = [
  // ── FABRIC SAP CODES ──
  {
    id: 1,
    sapCode: 'LMS01453',
    internalCode: 'FAB-001',
    description: 'FABRIC-TUBE-86.2CMS-38.3GPM-NATURAL BOPP FLAT NAT',
    category: 'Fabric',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  {
    id: 2,
    sapCode: 'LMS00047',
    internalCode: 'FAB-003',
    description: 'FABRIC-TUBE-48CMS-55GPM-NATURAL (NAT BOPP)',
    category: 'Fabric',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  {
    id: 3,
    sapCode: 'LMS00921',
    internalCode: 'FAB-002',
    description: 'FABRIC-TUBE-56CMS-98GPM-MILKY WHITE (ETG M/W)',
    category: 'Fabric',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  // ── TAPE SAP CODES ──
  {
    id: 4,
    sapCode: 'TAP00175',
    internalCode: 'TAP-001',
    description: 'TAPE-2.67MM-0267 DENIER NATURAL',
    category: 'Tape',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  {
    id: 5,
    sapCode: 'TAP00227',
    internalCode: 'TAP-002',
    description: 'TAPE-2.65MM-0840 DENIER MILKY WHITE',
    category: 'Tape',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  // ── BOPP FILM SAP CODES ──
  {
    id: 6,
    sapCode: 'RGP04179',
    internalCode: 'BOPP-001',
    description: 'BOPP MATT FINISH 15 MICRON 80CM WIDTH (PRINTED)',
    category: 'BOPP Film',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'F',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  {
    id: 7,
    sapCode: 'DCT04882',
    internalCode: 'BOPP-003',
    description: 'METALIZE FILM 15 MICRON (SLITTED)',
    category: 'BOPP Film',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  {
    id: 8,
    sapCode: 'ALM01872',
    internalCode: 'BOPP-003',
    description: 'ADHESIVE LAMINATED METALIZE FILM (COMBINED)',
    category: 'BOPP Film',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  // ── LAMINATION SAP CODES ──
  {
    id: 9,
    sapCode: 'ELR03482',
    internalCode: 'LAM-001',
    description: 'EXTRUSION LAMINATION - PP+LDPE BLEND 20 MICRON',
    category: 'Lamination',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  // ── INK SAP CODES ──
  {
    id: 10,
    sapCode: 'INK00001',
    internalCode: 'INK-001',
    description: 'SOLVENT BASED ROTO INK - MIXED COLORS',
    category: 'Ink',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'F',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  // ── THREAD SAP CODES ──
  {
    id: 11,
    sapCode: 'THR00001',
    internalCode: 'THR-001',
    description: 'MFY STITCHING THREAD NATURAL 840D',
    category: 'Thread',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'F',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  // ── LINER SAP CODES ──
  {
    id: 12,
    sapCode: 'LIN00001',
    internalCode: 'LIN-001',
    description: 'HDPE LINER 25 MICRON TUBE',
    category: 'Liner',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'F',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  // ── HANDLE SAP CODES ──
  {
    id: 13,
    sapCode: 'HDL00001',
    internalCode: 'HDL-001',
    description: 'CROSS HANDLE NATURAL PP TAPE WOVEN',
    category: 'Handle Material',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  // ── ADHESIVE SAP CODES ──
  {
    id: 14,
    sapCode: 'ADH00001',
    internalCode: 'ADH-001',
    description: 'PU ADHESIVE 2-PART SYSTEM FOR LAMINATION',
    category: 'Adhesive',
    uom: 'KG',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'F',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  // ── FINISHED GOODS SAP CODES ──
  {
    id: 15,
    sapCode: 'FGS03783',
    internalCode: 'FGS03783',
    description: 'BLUE ROSE STEAM RICE 10 KG - BOPP BAG',
    category: 'Finished Goods',
    uom: 'PCS',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
  {
    id: 16,
    sapCode: 'FGS05305',
    internalCode: 'FGS05305',
    description: 'SARSA TUBE BAG 90CM MW - PP WOVEN BAG',
    category: 'Finished Goods',
    uom: 'PCS',
    itemCategory: 'L',
    plant: 'SPL1',
    mrpType: 'PD',
    procurementType: 'E',
    status: 'Active',
    createdAt: '2026-01-01',
  },
];

let _nextId = sapMaterials.length + 1;
export function getNextSAPMaterialId() { return _nextId++; }

/** Look up SAP code by internal code */
export function getSAPCodeByInternal(internalCode) {
  return sapMaterials.find(m => m.internalCode === internalCode)?.sapCode || internalCode;
}

/** Look up SAP material by SAP code */
export function getSAPMaterialBySAPCode(sapCode) {
  return sapMaterials.find(m => m.sapCode === sapCode) || null;
}
