/**
 * salesOrders.js — Sales Order data store
 * Satyendra Packaging ERP — Phase 2
 * In-memory array (no DB in Phase 2)
 */

export let salesOrders = [
  {
    id: 1,
    soNumber:     'ZAD/2627/200151',
    soDate:       '2026-04-17',
    customerId:   1,
    customerName: 'M.RAMSINGH AGRO FOODS PRIVATE LIMITED',
    poNumber:     'ZAD/2627/200151',
    poDate:       '2026-04-17',
    deliveryDate: '2026-05-07',
    productType:  'BOPP Bag',
    productCode:  'FGS03783',
    productName:  'BLUE ROSE STEAM RICE 10 KG',
    quantity:     25000,
    uom:          'PCS',
    remarks:      'BAG SIZE: 15 X 22 INCH, BAG WEIGHT: 58/60 GMS, BOTH SIDE PRINTED MAT BOPP',
    status:       'Production',
    salesPerson:  'Mr. Anand',
    branch:       'NAVALI',
    createdAt:    '2026-04-17',
  },
  {
    id: 2,
    soNumber:     'ZAD/2627/200152',
    soDate:       '2026-04-20',
    customerId:   5,
    customerName: 'SANTINATH TRADING CO',
    poNumber:     'STC/2627/0042',
    poDate:       '2026-04-19',
    deliveryDate: '2026-05-15',
    productType:  'Laminated Bag',
    productCode:  'FGS04567',
    productName:  'SANTINATH ORANGE 63CM',
    quantity:     50000,
    uom:          'PCS',
    remarks:      'Orange fabric, BOPP matt, 6 colour printing',
    status:       'Approved',
    salesPerson:  'Mr. Anand',
    branch:       'NAVALI',
    createdAt:    '2026-04-20',
  },
  {
    id: 3,
    soNumber:     'ZAD/2627/200153',
    soDate:       '2026-04-25',
    customerId:   6,
    customerName: 'RENUKA SUGAR LTD',
    poNumber:     'RSL/APR/26/88',
    poDate:       '2026-04-24',
    deliveryDate: '2026-05-20',
    productType:  'PP Woven Bag',
    productCode:  'FGS04125',
    productName:  'BARDOLI SUGAR 50 KG',
    quantity:     100000,
    uom:          'PCS',
    remarks:      'MW+RED strip fabric, SFDS stitch',
    status:       'Pending',
    salesPerson:  'Mr. Anand',
    branch:       'NAVALI',
    createdAt:    '2026-04-25',
  },
  {
    id: 4,
    soNumber:     'ZAD/2627/200154',
    soDate:       '2026-05-01',
    customerId:   4,
    customerName: 'AMUL DAIRY - GCMMF',
    poNumber:     'AMUL/2627/0199',
    poDate:       '2026-04-30',
    deliveryDate: '2026-06-01',
    productType:  'Laminated Bag',
    productCode:  'FGS04210',
    productName:  'AMUL WHEAT FLOUR 50 KG',
    quantity:     75000,
    uom:          'PCS',
    remarks:      'Both side lamination, HDPE liner',
    status:       'Approved',
    salesPerson:  'Mr. Anand',
    branch:       'NAVALI',
    createdAt:    '2026-05-01',
  },
  {
    id: 5,
    soNumber:     'ZAD/2627/200155',
    soDate:       '2026-05-10',
    customerId:   7,
    customerName: 'OLAM INTERNATIONAL',
    poNumber:     'OLAM/2627/555',
    poDate:       '2026-05-09',
    deliveryDate: '2026-06-10',
    productType:  'PP Woven Bag',
    productCode:  'FGS03992',
    productName:  'PPBM TUBE M/W 100 CM',
    quantity:     200000,
    uom:          'PCS',
    remarks:      'Plain bags, no printing',
    status:       'Completed',
    salesPerson:  'Nitin Soni',
    branch:       'NAVALI',
    createdAt:    '2026-05-10',
  },
];

/** Auto-increment counter */
let nextId = salesOrders.length + 1;

export function getNextSOId()     { return nextId++; }
export function getNextSONumber() {
  const seq = String(200150 + nextId).padStart(6, '0');
  return `ZAD/2627/${seq}`;
}

/** SO Status options */
export const SO_STATUSES = ['Pending', 'Approved', 'Production', 'Completed', 'Cancelled'];

/** UOM options */
export const UOM_OPTIONS = ['PCS', 'KG', 'MT'];
