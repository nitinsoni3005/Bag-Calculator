/**
 * products.js — Seed data for Product Master
 * Based on real FGS (Finished Goods) codes from Satyendra Packaging ERP
 * Data stored in-memory JavaScript array (no DB in Phase 1)
 */

export let products = [
  {
    id: 1,
    code: 'FGS03783',
    name: 'BLUE ROSE STEAM RICE 10 KG',
    type: 'BOPP Bag',
    size: '15 X 22 INCH',
    weight: '58/60 GMS',
    mesh: '9.5 X 9.5',
    fabric: 'NATURAL',
    lamination: 'YES - 1 SIDE',
    printing: 'BOPP MATT FINISH - 6 COLOR',
    description: 'Both side printed mat BOPP, matlised, gusset, backseam bag, full natural fabric, top matching cross handle, bottom matching yarn.',
    status: 'Active',
    createdAt: '2026-01-10',
  },
  {
    id: 2,
    code: 'FGS05305',
    name: 'SARSA TUBE BAG 90CM',
    type: 'PP Woven Bag',
    size: '90 X 108 CM',
    weight: '108 GMS',
    mesh: '9.5 X 9.5',
    fabric: 'MILKY WHITE',
    lamination: 'NO',
    printing: 'FLEXO - 2 COLOR',
    description: 'Tube fabric, milky white, back seam bag, SFDS stitch, standard PP woven bag for grain storage.',
    status: 'Active',
    createdAt: '2026-01-15',
  },
  {
    id: 3,
    code: 'FGS04210',
    name: 'AMUL WHEAT FLOUR 50 KG',
    type: 'Laminated Bag',
    size: '66 X 112 CM',
    weight: '112 GMS',
    mesh: '9.5 X 9.5',
    fabric: 'MILKY WHITE',
    lamination: 'YES - BOTH SIDE',
    printing: 'BOPP GLOSS FINISH - 4 COLOR',
    description: 'Laminated PP woven bag for wheat flour packaging, BOPP printed both sides, HDPE liner inside.',
    status: 'Active',
    createdAt: '2026-02-01',
  },
  {
    id: 4,
    code: 'FGS04125',
    name: 'BARDOLI SUGAR 50 KG',
    type: 'PP Woven Bag',
    size: '61 X 125 CM',
    weight: '125 GMS',
    mesh: '9.0 X 9.0',
    fabric: 'MILKY WHITE + RED',
    lamination: 'NO',
    printing: 'FLEXO - 2 COLOR',
    description: 'Multi-colour strip fabric (MW+RED), standard sugar bag with SFDS stitching, bottom yarn.',
    status: 'Active',
    createdAt: '2026-02-10',
  },
  {
    id: 5,
    code: 'FGS03992',
    name: 'PPBM TUBE M/W 100 CM',
    type: 'PP Woven Bag',
    size: '100 X 97 CM',
    weight: '97 GMS',
    mesh: '9.5 X 9.5',
    fabric: 'MILKY WHITE',
    lamination: 'NO',
    printing: 'NO PRINTING',
    description: 'Plain milky white tube fabric bag, no printing, used for general commodity packaging.',
    status: 'Active',
    createdAt: '2026-02-20',
  },
  {
    id: 6,
    code: 'FGS04567',
    name: 'SANTINATH ORANGE 63CM',
    type: 'Laminated Bag',
    size: '63 X 125 CM',
    weight: '125 GMS',
    mesh: '9.5 X 9.5',
    fabric: 'ORANGE',
    lamination: 'YES - 1 SIDE',
    printing: 'BOPP MATT - 6 COLOR',
    description: 'Orange coloured fabric, laminated BOPP bag for food grade packaging, with gusset and handle.',
    status: 'Active',
    createdAt: '2026-03-05',
  },
  {
    id: 7,
    code: 'FGS04888',
    name: 'LENO MESH CC NAT 85CM',
    type: 'PP Woven Bag',
    size: '85 X 47 CM',
    weight: '47 GMS',
    mesh: 'LENO',
    fabric: 'MILKY WHITE',
    lamination: 'NO',
    printing: 'NO PRINTING',
    description: 'Leno mesh fabric for produce / vegetable packaging, breathable design, circular cut.',
    status: 'Active',
    createdAt: '2026-03-10',
  },
  {
    id: 8,
    code: 'FGS05001',
    name: 'SHOPPING ZIPPER POUCH 200X760',
    type: 'Shopping Bag',
    size: '200 X 760 MM',
    weight: '24.22 GMS',
    mesh: 'N/A',
    fabric: 'POLYSTER + LD + BOPP',
    lamination: 'YES - MULTI LAYER',
    printing: 'ROTO GRAVURE - 8 COLOR',
    description: 'Multi-layer laminated shopping pouch with zipper, polyster+LD+metalised BOPP, high-gloss finish.',
    status: 'Active',
    createdAt: '2026-03-20',
  },
  {
    id: 9,
    code: 'FGS05210',
    name: 'FIBC BULK BAG 90X90X140',
    type: 'FIBC',
    size: '90 X 90 X 140 CM',
    weight: '2200 GMS',
    mesh: 'N/A',
    fabric: 'NATURAL COATED',
    lamination: 'YES - PE COATED',
    printing: 'SCREEN - 2 COLOR',
    description: 'Flexible intermediate bulk container, 1-tonne safe working load, lift loops, filling spout and discharge spout.',
    status: 'Inactive',
    createdAt: '2026-04-01',
  },
  {
    id: 10,
    code: 'FGS05310',
    name: 'SILAGE TARPAULIN 20X30 FT',
    type: 'Tarpaulin',
    size: '20 X 30 FT',
    weight: '120 GSM',
    mesh: 'N/A',
    fabric: 'HDPE FLAT',
    lamination: 'YES - BOTH SIDE LDPE',
    printing: 'NO PRINTING',
    description: 'Heavy duty HDPE woven tarpaulin with LDPE lamination both sides, UV stabilised, heat sealed edges.',
    status: 'Active',
    createdAt: '2026-04-15',
  },
];

/** Auto-increment counter for new IDs */
let nextId = products.length + 1;

/** Generate next product ID */
export function getNextProductId() {
  return nextId++;
}

/** Generate next product code (e.g. FGS05400) */
export function getNextProductCode() {
  const base = 5300 + nextId;
  return `FGS0${base}`;
}

/** All product types for dropdown */
export const PRODUCT_TYPES = [
  'BOPP Bag',
  'PP Woven Bag',
  'Laminated Bag',
  'Shopping Bag',
  'Pouch',
  'FIBC',
  'Tarpaulin',
];
