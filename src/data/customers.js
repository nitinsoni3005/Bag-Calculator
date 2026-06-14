/**
 * customers.js — Seed data for Customer Master
 * Based on real customer names from Satyendra Packaging ERP data
 * Data stored in-memory JavaScript array (no DB in Phase 1)
 */

export let customers = [
  {
    id: 1,
    code: 'CUST-001',
    name: 'M.RAMSINGH AGRO FOODS PRIVATE LIMITED',
    contact: 'Mr. Ramsingh',
    mobile: '9876543210',
    email: 'ramsingh@agrofoods.com',
    gst: '33AABCR1234A1Z5',
    address: '12, Industrial Area, Phase 2',
    city: 'Theni',
    state: 'Tamil Nadu',
    status: 'Active',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    code: 'CUST-002',
    name: 'PPBM PACKAGING SOLUTIONS',
    contact: 'Mr. Priya',
    mobile: '9876501234',
    email: 'info@ppbmpack.com',
    gst: '24AAGCP5678B1Z2',
    address: 'Plot 45, GIDC Industrial Estate',
    city: 'Anand',
    state: 'Gujarat',
    status: 'Active',
    createdAt: '2024-02-10',
  },
  {
    id: 3,
    code: 'CUST-003',
    name: 'ETG COMMODITIES PVT LTD',
    contact: 'Mr. Anil Sharma',
    mobile: '9988776655',
    email: 'anilsharma@etgcommodities.com',
    gst: '27AACCE4321C1Z8',
    address: '7th Floor, Business Park',
    city: 'Mumbai',
    state: 'Maharashtra',
    status: 'Active',
    createdAt: '2024-03-05',
  },
  {
    id: 4,
    code: 'CUST-004',
    name: 'AMUL DAIRY - GCMMF',
    contact: 'Mr. Rajiv Patel',
    mobile: '9712345678',
    email: 'procurement@amul.coop',
    gst: '24AAACG1122D1Z3',
    address: 'Amul Dairy Road',
    city: 'Anand',
    state: 'Gujarat',
    status: 'Active',
    createdAt: '2024-03-20',
  },
  {
    id: 5,
    code: 'CUST-005',
    name: 'SANTINATH TRADING CO',
    contact: 'Mr. Santilal',
    mobile: '9009876543',
    email: 'santinath@tradingco.in',
    gst: '24ABJPS9988E1Z1',
    address: '23 Commerce Road, GIDC',
    city: 'Surat',
    state: 'Gujarat',
    status: 'Active',
    createdAt: '2024-04-01',
  },
  {
    id: 6,
    code: 'CUST-006',
    name: 'RENUKA SUGAR LTD',
    contact: 'Mr. Vijay',
    mobile: '9845612300',
    email: 'vijay@renukasugar.com',
    gst: '29AACCS7766F1Z6',
    address: 'Sugar Factory Complex, NH-4',
    city: 'Belagavi',
    state: 'Karnataka',
    status: 'Active',
    createdAt: '2024-04-15',
  },
  {
    id: 7,
    code: 'CUST-007',
    name: 'OLAM INTERNATIONAL',
    contact: 'Mr. Samuel',
    mobile: '8800112233',
    email: 'samuel@olamintl.com',
    gst: '07AAACO6655G1Z9',
    address: 'Agri Business Tower, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    status: 'Inactive',
    createdAt: '2024-05-01',
  },
  {
    id: 8,
    code: 'CUST-008',
    name: 'BARDOLI SUGAR COOPERATIVE',
    contact: 'Mr. Raman',
    mobile: '9427654321',
    email: 'bardoli@sugarco.in',
    gst: '24AACCB3344H1Z5',
    address: 'Sugar Mill Road, Bardoli',
    city: 'Bardoli',
    state: 'Gujarat',
    status: 'Active',
    createdAt: '2024-05-20',
  },
];

/** Auto-increment counter for new IDs */
let nextId = customers.length + 1;

/** Generate next customer ID */
export function getNextCustomerId() {
  return nextId++;
}

/** Generate next customer code (e.g. CUST-009) */
export function getNextCustomerCode() {
  const padded = String(nextId).padStart(3, '0');
  return `CUST-${padded}`;
}
