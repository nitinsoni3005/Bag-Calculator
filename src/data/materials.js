/**
 * materials.js — Raw Material Master data store
 * Satyendra Packaging ERP — Phase 3
 *
 * Categories: Fabric | Tape | BOPP Film | Lamination | Ink |
 *             Thread | Liner | Packing Material | Adhesive |
 *             Loop Material | Filler
 */

export const RM_CATEGORIES = [
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
  'Filler',
  'Handle Material',
];

export const UOM_LIST = ['KG', 'MTR', 'PCS', 'LTR', 'GM', 'SET', 'ROLL', 'BAG'];

export let materials = [
  // ── FABRIC ──
  {
    id: 1, code: 'FAB-001',
    name: 'Natural PP Fabric - BOPP Flat NAT (86.2cm)',
    category: 'Fabric', uom: 'KG',
    currentRate: 95, supplier: 'In-house Weaving',
    description: 'FABRIC-TUBE-86.2CMS-38.3GPM-NATURAL, LMS01453',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 2, code: 'FAB-002',
    name: 'Milky White PP Fabric - Tube 61cm 100GPM',
    category: 'Fabric', uom: 'KG',
    currentRate: 92, supplier: 'In-house Weaving',
    description: 'FABRIC-TUBE-61CMS-100GPM-MILKY WHITE',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 3, code: 'FAB-003',
    name: 'Natural PP Fabric - Tube 60cm 85GPM',
    category: 'Fabric', uom: 'KG',
    currentRate: 93, supplier: 'In-house Weaving',
    description: 'FABRIC-TUBE-60CMS-85GPM-NATURAL',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 4, code: 'FAB-004',
    name: 'FIBC Body Fabric - 200GSM Natural',
    category: 'Fabric', uom: 'KG',
    currentRate: 110, supplier: 'In-house Weaving',
    description: 'FABRIC-TUBE-90CMS-200GPM-NATURAL COATED',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── TAPE ──
  {
    id: 5, code: 'TAP-001',
    name: 'PP Tape - 2.67mm Natural Denier 267',
    category: 'Tape', uom: 'KG',
    currentRate: 87, supplier: 'In-house Extrusion',
    description: 'TAP00175 - TAPE-2.67MM-0267 DENIER NATURAL',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 6, code: 'TAP-002',
    name: 'PP Tape - 2.65mm Milky White Denier 840',
    category: 'Tape', uom: 'KG',
    currentRate: 88, supplier: 'In-house Extrusion',
    description: 'TAP00227 - TAPE-2.65MM-0840 DENIER MILKY WHITE',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 7, code: 'TAP-003',
    name: 'PP Granules - HGX030SP',
    category: 'Tape', uom: 'KG',
    currentRate: 153, supplier: 'External',
    description: 'POLYPROPYLENE HGX030SP for tape extrusion',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── BOPP FILM ──
  {
    id: 8, code: 'BOPP-001',
    name: 'BOPP Film - 15 Micron Matt Finish 80cm',
    category: 'BOPP Film', uom: 'KG',
    currentRate: 425, supplier: 'Cosmo Films / Polyplex',
    description: '15MIC BOPP MATT FINISH, Width 80cm, RGP04179',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 9, code: 'BOPP-002',
    name: 'BOPP Film - 15 Micron Gloss Finish 80cm',
    category: 'BOPP Film', uom: 'KG',
    currentRate: 420, supplier: 'Cosmo Films / Polyplex',
    description: '15MIC BOPP GLOSS FINISH, Width 80cm',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 10, code: 'BOPP-003',
    name: 'Metalized BOPP Film - 15 Micron',
    category: 'BOPP Film', uom: 'KG',
    currentRate: 311, supplier: 'Uflex / Cosmo',
    description: '15MIC METALIZE FILM, DCT04882',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── LAMINATION ──
  {
    id: 11, code: 'LAM-001',
    name: 'PP Lamination Granules - 75% Mix',
    category: 'Lamination', uom: 'KG',
    currentRate: 155, supplier: 'IOCL / Reliance',
    description: 'PP Lami granules for extrusion lamination, ELR03482',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 12, code: 'LAM-002',
    name: 'LDPE Granules - 25% Mix',
    category: 'Lamination', uom: 'KG',
    currentRate: 197, supplier: 'IOCL / GAIL',
    description: 'LDPE for extrusion lamination blend',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── INK ──
  {
    id: 13, code: 'INK-001',
    name: 'Solvent Based Ink - Mixed Colors (BOPP)',
    category: 'Ink', uom: 'KG',
    currentRate: 300, supplier: 'Toyo Ink / Sun Chemical',
    description: 'Roto gravure solvent based ink for BOPP printing',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 14, code: 'INK-002',
    name: 'Flexo Ink - Mixed Colors (Fabric)',
    category: 'Ink', uom: 'KG',
    currentRate: 180, supplier: 'Toyo Ink',
    description: 'Water based flexo ink for fabric direct printing',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 15, code: 'INK-003',
    name: 'Hardener for Lamination Adhesive',
    category: 'Adhesive', uom: 'KG',
    currentRate: 220, supplier: 'Bostik / Henkel',
    description: 'Hardener component for 2-part PU adhesive',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── THREAD ──
  {
    id: 16, code: 'THR-001',
    name: 'MFY Stitching Thread - Natural',
    category: 'Thread', uom: 'KG',
    currentRate: 175, supplier: 'JBF Industries',
    description: 'Multifilament yarn thread for bag stitching - SFDS',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 17, code: 'THR-002',
    name: 'Bottom Yarn - Natural PP',
    category: 'Thread', uom: 'KG',
    currentRate: 170, supplier: 'In-house',
    description: 'Matching yarn for bag bottom closure',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── LINER ──
  {
    id: 18, code: 'LIN-001',
    name: 'HDPE Liner - 25 Micron',
    category: 'Liner', uom: 'KG',
    currentRate: 125, supplier: 'Reliance / GAIL',
    description: 'HDPE inner liner for food grade bags',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── PACKING ──
  {
    id: 19, code: 'PCK-001',
    name: 'Bale Strapping PP Band',
    category: 'Packing Material', uom: 'KG',
    currentRate: 55, supplier: 'Local',
    description: 'PP strapping band for bale packing',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 20, code: 'PCK-002',
    name: 'Cardboard Inner Core',
    category: 'Packing Material', uom: 'PCS',
    currentRate: 12, supplier: 'Local',
    description: 'Cardboard core for roll packing',
    status: 'Active', createdAt: '2026-01-01',
  },
  {
    id: 21, code: 'PCK-003',
    name: 'BOPP Packing Tape',
    category: 'Packing Material', uom: 'ROLL',
    currentRate: 45, supplier: 'Local',
    description: 'Sealing tape for bale/carton',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── ADHESIVE ──
  {
    id: 22, code: 'ADH-001',
    name: 'PU Adhesive - 2 Part System',
    category: 'Adhesive', uom: 'KG',
    currentRate: 233, supplier: 'Bostik',
    description: 'Polyurethane adhesive for metalize lamination, ALM01872',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── HANDLE ──
  {
    id: 23, code: 'HDL-001',
    name: 'Cross Handle - Natural PP Tape',
    category: 'Handle Material', uom: 'KG',
    currentRate: 170, supplier: 'In-house',
    description: 'Top matching cross handle, woven PP tape',
    status: 'Active', createdAt: '2026-01-01',
  },
  // ── LOOP ──
  {
    id: 24, code: 'LOP-001',
    name: 'FIBC Lift Loop - 2 Tonne WLL',
    category: 'Loop Material', uom: 'SET',
    currentRate: 85, supplier: 'Storsack',
    description: 'Cross corner lifting loops, 4 per bag',
    status: 'Active', createdAt: '2026-01-01',
  },
];

let _nextId   = materials.length + 1;
let _nextCode = materials.length + 1;

export function getNextMaterialId()   { return _nextId++; }
export function getNextMaterialCode(category) {
  const prefix = {
    'Fabric': 'FAB', 'Tape': 'TAP', 'BOPP Film': 'BOPP',
    'Lamination': 'LAM', 'Ink': 'INK', 'Thread': 'THR',
    'Liner': 'LIN', 'Packing Material': 'PCK',
    'Adhesive': 'ADH', 'Loop Material': 'LOP',
    'Handle Material': 'HDL', 'Filler': 'FIL',
  }[category] || 'MAT';
  return `${prefix}-${String(_nextCode++).padStart(3, '0')}`;
}
