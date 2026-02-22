import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';
import Warehouse from '../models/Warehouse';
import Supplier from '../models/Supplier';
import Partner from '../models/Partner';
import { User } from '../models/User';
import CustomerOrder from '../models/CustomerOrder';
import CustomerInvoice from '../models/CustomerInvoice';
import Shipment from '../models/Shipment';
import PurchaseOrder from '../models/PurchaseOrder';
import SupplierInvoice from '../models/SupplierInvoice';
import Receipt from '../models/Receipt';
import Payment from '../models/Payment';
import CustomerReturn from '../models/CustomerReturn';
import SupplierReturn from '../models/SupplierReturn';
import WarehouseTransfer from '../models/WarehouseTransfer';
import Writeoff from '../models/Writeoff';
import Inventory from '../models/Inventory';
import WarehouseReceipt from '../models/WarehouseReceipt';
import WarehouseExpense from '../models/WarehouseExpense';
import InternalOrder from '../models/InternalOrder';
import Task from '../models/Task';
import Contract from '../models/Contract';
import TaxInvoice from '../models/TaxInvoice';
import Counter from '../models/Counter';
import AuditLog from '../models/AuditLog';
import { hashPassword } from '../utils/password';
import { generateDocNumber } from '../utils/documentNumber';

dotenv.config();

// ===== YORDAMCHI FUNKSIYALAR =====
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);
  return d;
};
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

// ===== MA'LUMOTLAR =====
const WAREHOUSES_DATA = [
  { name: 'Asosiy ombor', code: 'WH-001', address: 'Toshkent sh., Chilonzor tumani, 1-mavze', contactPerson: 'Akbarov Jasur', phone: '+998901234567', capacity: 5000, color: '#3B82F6' },
  { name: 'Yordamchi ombor', code: 'WH-002', address: 'Toshkent sh., Sergeli tumani, Sergeli-7', contactPerson: 'Karimov Sardor', phone: '+998901234568', capacity: 3000, color: '#10B981' },
  { name: 'Buxoro filiali', code: 'WH-003', address: "Buxoro sh., Kogon ko'chasi 15", contactPerson: 'Raxmatov Dilshod', phone: '+998914567890', capacity: 2000, color: '#F59E0B' },
];

const SUPPLIERS_DATA = [
  { name: 'Samsung Distribution UZ', contactPerson: 'Kim Sergey', phone: '+998712345678', email: 'samsung@dist.uz', address: 'Toshkent sh., Mirzo Ulugbek tumani', inn: '123456789', bankAccount: '20208000123456789012' },
  { name: 'Artel Group', contactPerson: 'Abdullayev Farhod', phone: '+998712345679', email: 'artel@group.uz', address: 'Toshkent sh., Chilonzor', inn: '234567890', bankAccount: '20208000234567890123' },
  { name: 'Qurilish Market', contactPerson: "Ro'ziyev Anvar", phone: '+998935551122', email: 'qurilish@market.uz', address: "Samarqand sh., Registon ko'chasi", inn: '345678901', bankAccount: '20208000345678901234' },
  { name: 'Global Paint UZ', contactPerson: 'Tursunov Bobur', phone: '+998946667788', email: 'globalpaint@uz.com', address: "Toshkent sh., Yakkasaroy", inn: '456789012', bankAccount: '20208000456789012345' },
  { name: 'MegaStroy Import', contactPerson: 'Petrov Viktor', phone: '+998957778899', email: 'megastroy@import.uz', address: "Toshkent sh., Olmazor tumani", inn: '567890123', bankAccount: '20208000567890123456' },
];

const CUSTOMERS_DATA = [
  { code: 'C-001', name: 'Hamidov Rustam', type: 'customer' as const, status: 'vip' as const, phone: '+998901001020', legalAddress: "Toshkent sh., Mirzo Ulug'bek tumani", group: 'VIP' },
  { code: 'C-002', name: 'Normatov Dilshod', type: 'customer' as const, status: 'active' as const, phone: '+998902002030', legalAddress: "Buxoro sh., Kogon ko'chasi 5", group: 'Optom' },
  { code: 'C-003', name: 'Karimova Nilufar', type: 'customer' as const, status: 'active' as const, phone: '+998903003040', legalAddress: "Samarqand sh., Registon 10", group: 'Chakana' },
  { code: 'C-004', name: 'Ergashev Sardor', type: 'customer' as const, status: 'active' as const, phone: '+998904004050', legalAddress: "Namangan sh., Navbahor ko'chasi", group: 'Optom' },
  { code: 'C-005', name: 'Oddiy mijoz', type: 'customer' as const, status: 'new' as const, phone: '+998905005060', legalAddress: "Toshkent sh.", group: 'Chakana' },
  { code: 'C-006', name: 'Aliyev Sherzod', type: 'customer' as const, status: 'vip' as const, phone: '+998906006070', legalAddress: "Farg'ona sh., Mustaqillik 22", group: 'VIP' },
  { code: 'C-007', name: 'Toshmatov Ulugbek', type: 'customer' as const, status: 'active' as const, phone: '+998907007080', legalAddress: "Andijon sh., Navoiy 8", group: 'Optom' },
  { code: 'C-008', name: "To'rayev Bobur", type: 'customer' as const, status: 'active' as const, phone: '+998908008090', legalAddress: "Xorazm sh., Urganch 15", group: 'Chakana' },
  { code: 'C-009', name: 'OOO Qurilish Plus', type: 'both' as const, status: 'active' as const, phone: '+998909009010', legalAddress: "Toshkent sh., Sergeli 3", taxId: '111222333', group: 'Korporativ' },
  { code: 'C-010', name: "OOO Bo'ston Trade", type: 'both' as const, status: 'active' as const, phone: '+998900100200', legalAddress: "Toshkent sh., Yakkasaroy 7", taxId: '222333444', group: 'Korporativ' },
];

const PRODUCTS_DATA = [
  // Bo'yoq va laklar
  { name: "Bo'yoq oq 10L", sku: 'BYQ-001', category: "Bo'yoq", unit: 'dona', costPrice: 180000, sellingPrice: 220000, minStock: 20 },
  { name: "Bo'yoq ko'k 10L", sku: 'BYQ-002', category: "Bo'yoq", unit: 'dona', costPrice: 190000, sellingPrice: 235000, minStock: 15 },
  { name: "Bo'yoq qizil 10L", sku: 'BYQ-003', category: "Bo'yoq", unit: 'dona', costPrice: 195000, sellingPrice: 240000, minStock: 10 },
  { name: "Lak parkye uchun 5L", sku: 'BYQ-004', category: "Bo'yoq", unit: 'dona', costPrice: 250000, sellingPrice: 310000, minStock: 10 },
  { name: "Gruntovka 10L", sku: 'BYQ-005', category: "Bo'yoq", unit: 'dona', costPrice: 120000, sellingPrice: 155000, minStock: 25 },
  // Qurilish materiallari
  { name: 'Sement M-400 50kg', sku: 'QRL-001', category: 'Qurilish', unit: 'qop', costPrice: 55000, sellingPrice: 68000, minStock: 100 },
  { name: "G'isht qizil 1 dona", sku: 'QRL-002', category: 'Qurilish', unit: 'dona', costPrice: 1200, sellingPrice: 1600, minStock: 500 },
  { name: 'Armatura 12mm 12m', sku: 'QRL-003', category: 'Qurilish', unit: 'dona', costPrice: 85000, sellingPrice: 105000, minStock: 50 },
  { name: 'Profil 60x27 3m', sku: 'QRL-004', category: 'Qurilish', unit: 'dona', costPrice: 18000, sellingPrice: 24000, minStock: 100 },
  { name: 'Gipsokarton 12mm', sku: 'QRL-005', category: 'Qurilish', unit: 'dona', costPrice: 45000, sellingPrice: 58000, minStock: 50 },
  // Santexnika
  { name: 'Unitaz Artel Premium', sku: 'SAN-001', category: 'Santexnika', unit: 'dona', costPrice: 650000, sellingPrice: 820000, minStock: 10 },
  { name: "Dush kabina 90x90", sku: 'SAN-002', category: 'Santexnika', unit: 'dona', costPrice: 1800000, sellingPrice: 2350000, minStock: 5 },
  { name: "Kran aralashtirgich", sku: 'SAN-003', category: 'Santexnika', unit: 'dona', costPrice: 120000, sellingPrice: 165000, minStock: 20 },
  // Elektrika
  { name: 'Kabel 3x2.5 100m', sku: 'ELK-001', category: 'Elektrika', unit: 'dona', costPrice: 350000, sellingPrice: 430000, minStock: 20 },
  { name: 'Rozetka 2-li', sku: 'ELK-002', category: 'Elektrika', unit: 'dona', costPrice: 15000, sellingPrice: 22000, minStock: 100 },
  { name: "LED lampa 12W", sku: 'ELK-003', category: 'Elektrika', unit: 'dona', costPrice: 18000, sellingPrice: 28000, minStock: 50 },
  // Asboblar
  { name: 'Drel Bosch GSB 13', sku: 'ASB-001', category: 'Asboblar', unit: 'dona', costPrice: 850000, sellingPrice: 1050000, minStock: 5 },
  { name: 'Bolgarki 125mm', sku: 'ASB-002', category: 'Asboblar', unit: 'dona', costPrice: 420000, sellingPrice: 550000, minStock: 5 },
  { name: 'Shlifer devoriy', sku: 'ASB-003', category: 'Asboblar', unit: 'dona', costPrice: 750000, sellingPrice: 950000, minStock: 3 },
  { name: "O'lchov lenta 5m", sku: 'ASB-004', category: 'Asboblar', unit: 'dona', costPrice: 12000, sellingPrice: 18000, minStock: 30 },
];

// ===== SEED FUNKSIYA =====
async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI topilmadi .env faylda');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('MongoDB ga ulandi\n');

  // ===== 1. BARCHA MA'LUMOTLARNI TOZALASH =====
  console.log('🧹 Barcha ma\'lumotlar tozalanmoqda...');
  await Promise.all([
    Counter.deleteMany({}),
    AuditLog.deleteMany({}),
    TaxInvoice.deleteMany({}),
    CustomerReturn.deleteMany({}),
    SupplierReturn.deleteMany({}),
    Shipment.deleteMany({}),
    CustomerInvoice.deleteMany({}),
    CustomerOrder.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    SupplierInvoice.deleteMany({}),
    Receipt.deleteMany({}),
    Payment.deleteMany({}),
    WarehouseTransfer.deleteMany({}),
    Writeoff.deleteMany({}),
    Inventory.deleteMany({}),
    WarehouseReceipt.deleteMany({}),
    WarehouseExpense.deleteMany({}),
    InternalOrder.deleteMany({}),
    Task.deleteMany({}),
    Contract.deleteMany({}),
    Product.deleteMany({}),
    Supplier.deleteMany({}),
    Partner.deleteMany({}),
    Warehouse.deleteMany({}),
    User.deleteMany({ role: { $ne: 'admin' } }), // admin ni saqlaymiz
  ]);
  console.log('  Barcha jadvallar tozalandi\n');

  // ===== 2. OMBORLAR =====
  console.log('🏭 Omborlar yaratilmoqda...');
  const warehouses = await Warehouse.insertMany(WAREHOUSES_DATA);
  console.log(`  ${warehouses.length} ta ombor yaratildi\n`);

  // ===== 3. YETKAZIB BERUVCHILAR =====
  console.log('🚚 Yetkazib beruvchilar yaratilmoqda...');
  const suppliers = await Supplier.insertMany(SUPPLIERS_DATA);
  console.log(`  ${suppliers.length} ta yetkazib beruvchi yaratildi\n`);

  // ===== 4. KONTRAGENTLAR =====
  console.log('👥 Kontragentlar yaratilmoqda...');
  const partners = await Partner.insertMany(CUSTOMERS_DATA);
  const customers = partners.filter(p => p.type === 'customer' || p.type === 'both');
  console.log(`  ${partners.length} ta kontragent yaratildi\n`);

  // ===== 5. MAHSULOTLAR =====
  console.log('📦 Mahsulotlar yaratilmoqda...');
  const productsToInsert = PRODUCTS_DATA.map((p, i) => {
    const supplierIdx = i % suppliers.length;
    const qty1 = randomInt(30, 200);
    const qty2 = randomInt(10, 80);
    const qty3 = randomInt(5, 40);
    return {
      ...p,
      barcode: `899${String(i + 1).padStart(10, '0')}`,
      supplier: suppliers[supplierIdx]._id,
      supplierName: suppliers[supplierIdx].name,
      quantity: qty1 + qty2 + qty3,
      reserved: 0,
      status: 'active',
      stockByWarehouse: [
        { warehouse: warehouses[0]._id, warehouseName: warehouses[0].name, quantity: qty1, reserved: 0 },
        { warehouse: warehouses[1]._id, warehouseName: warehouses[1].name, quantity: qty2, reserved: 0 },
        { warehouse: warehouses[2]._id, warehouseName: warehouses[2].name, quantity: qty3, reserved: 0 },
      ],
    };
  });
  const products = await Product.insertMany(productsToInsert);
  console.log(`  ${products.length} ta mahsulot yaratildi\n`);

  // ===== 6. XODIMLAR =====
  console.log('👤 Xodimlar yaratilmoqda...');
  const employeeData = [
    { firstName: 'Jamshid', lastName: 'Karimov', phone: '+998911112233' },
    { firstName: 'Aziza', lastName: 'Rahimova', phone: '+998912223344' },
    { firstName: 'Botir', lastName: 'Toshmatov', phone: '+998913334455' },
  ];
  const employeeCredentials: any[] = [];
  for (const emp of employeeData) {
    const username = `${emp.firstName.toLowerCase()}_${emp.lastName.toLowerCase()}`;
    const password = `${emp.firstName.toLowerCase()}123`;
    const passwordHash = await hashPassword(password);
    await User.create({
      username,
      passwordHash,
      firstName: emp.firstName,
      lastName: emp.lastName,
      phoneNumber: emp.phone,
      role: 'employee',
      permissions: ['sales', 'purchases', 'warehouse', 'products', 'finance'],
      isActive: true,
    });
    employeeCredentials.push({ name: `${emp.firstName} ${emp.lastName}`, username, password, phone: emp.phone });
  }
  console.log(`  ${employeeCredentials.length} ta xodim yaratildi\n`);

  // ===== 7. XARID BUYURTMALARI (7 kun) =====
  console.log('🛒 Xarid buyurtmalari yaratilmoqda...');
  const purchaseOrders: any[] = [];
  for (let day = 6; day >= 0; day--) {
    const count = randomInt(1, 3);
    for (let j = 0; j < count; j++) {
      const supplier = randomChoice(suppliers);
      const itemCount = randomInt(2, 5);
      const poItems = [];
      const usedProducts = new Set<number>();
      for (let k = 0; k < itemCount; k++) {
        let idx: number;
        do { idx = randomInt(0, products.length - 1); } while (usedProducts.has(idx));
        usedProducts.add(idx);
        const p = products[idx];
        const qty = randomInt(10, 50);
        poItems.push({ product: p._id, productName: p.name, quantity: qty, price: p.costPrice, total: qty * p.costPrice });
      }
      const totalAmount = poItems.reduce((s, i) => s + i.total, 0);
      const poNumber = await generateDocNumber('PO');
      const status = day > 3 ? 'received' : day > 1 ? randomChoice(['received', 'pending'] as const) : 'pending';
      const po = await PurchaseOrder.create({
        orderNumber: poNumber, supplier: supplier._id, supplierName: supplier.name,
        orderDate: daysAgo(day), status, items: poItems, totalAmount, notes: `${day} kun oldingi xarid`,
      });
      purchaseOrders.push(po);
    }
  }
  console.log(`  ${purchaseOrders.length} ta xarid buyurtmasi yaratildi\n`);

  // ===== 8. QABUL QILISHLAR (received PO lar uchun) =====
  console.log('📥 Qabul qilishlar yaratilmoqda...');
  const receipts: any[] = [];
  for (const po of purchaseOrders.filter(p => p.status === 'received')) {
    const wh = randomChoice(warehouses);
    const recNumber = await generateDocNumber('REC');
    const rec = await Receipt.create({
      receiptNumber: recNumber, supplier: po.supplier, supplierName: po.supplierName,
      warehouse: wh._id, warehouseName: wh.name, purchaseOrder: po._id, orderNumber: po.orderNumber,
      receiptDate: new Date(po.orderDate.getTime() + 86400000), // keyingi kun
      items: po.items.map((i: any) => ({
        product: i.product, productName: i.productName, quantity: i.quantity, costPrice: i.price, total: i.total,
      })),
      totalAmount: po.totalAmount,
    });
    receipts.push(rec);
  }
  console.log(`  ${receipts.length} ta qabul qilish yaratildi\n`);

  // ===== 9. YETKAZIB BERUVCHI FAKTURALARI =====
  console.log('📋 Yetkazib beruvchi fakturalari yaratilmoqda...');
  const supplierInvoices: any[] = [];
  for (const po of purchaseOrders.filter(p => p.status === 'received')) {
    const invNumber = await generateDocNumber('SI');
    const paid = randomChoice([0, po.totalAmount * 0.5, po.totalAmount]);
    const si = await SupplierInvoice.create({
      invoiceNumber: invNumber, supplier: po.supplier, supplierName: po.supplierName,
      purchaseOrder: po._id, orderNumber: po.orderNumber,
      invoiceDate: po.orderDate, dueDate: daysFromNow(randomInt(7, 30)),
      items: po.items.map((i: any) => ({ productName: i.productName, quantity: i.quantity, price: i.price, total: i.total })),
      totalAmount: po.totalAmount, paidAmount: Math.round(paid),
    });
    supplierInvoices.push(si);
  }
  console.log(`  ${supplierInvoices.length} ta yetkazib beruvchi fakturasi yaratildi\n`);

  // ===== 10. MIJOZ BUYURTMALARI (7 kun, har xil statuslar) =====
  console.log('📝 Mijoz buyurtmalari yaratilmoqda...');
  const customerOrders: any[] = [];
  const statuses: any[] = ['new', 'confirmed', 'assembled', 'shipped', 'delivered', 'cancelled'];
  for (let day = 6; day >= 0; day--) {
    const count = randomInt(2, 5);
    for (let j = 0; j < count; j++) {
      const customer = randomChoice(customers);
      const wh = randomChoice(warehouses);
      const itemCount = randomInt(1, 4);
      const orderItems = [];
      const usedProducts = new Set<number>();
      for (let k = 0; k < itemCount; k++) {
        let idx: number;
        do { idx = randomInt(0, products.length - 1); } while (usedProducts.has(idx));
        usedProducts.add(idx);
        const p = products[idx];
        const qty = randomInt(1, 10);
        const discount = randomChoice([0, 0, 0, 5, 10]);
        const base = qty * p.sellingPrice;
        const total = Math.round(base * (1 - discount / 100));
        orderItems.push({
          product: p._id, productName: p.name, quantity: qty, price: p.sellingPrice,
          discount, vat: 0, total, shipped: 0, reserved: 0,
        });
      }
      const totalAmount = orderItems.reduce((s, i) => s + i.total, 0);

      // Eski buyurtmalar delivered/shipped, yangilari new/confirmed
      let status: string;
      if (day >= 5) status = randomChoice(['delivered', 'delivered', 'shipped', 'cancelled']);
      else if (day >= 3) status = randomChoice(['shipped', 'delivered', 'assembled', 'confirmed']);
      else if (day >= 1) status = randomChoice(['confirmed', 'assembled', 'new', 'confirmed']);
      else status = randomChoice(['new', 'new', 'confirmed']);

      const paidAmount = status === 'delivered' ? totalAmount : status === 'shipped' ? Math.round(totalAmount * randomChoice([0.5, 1, 0])) : 0;
      const shippedAmount = ['shipped', 'delivered'].includes(status) ? totalAmount : 0;

      const coNumber = await generateDocNumber('CO');
      const co = await CustomerOrder.create({
        orderNumber: coNumber, customer: customer._id, customerName: customer.name,
        orderDate: daysAgo(day), deliveryDate: daysFromNow(randomInt(1, 14)),
        status, items: orderItems, totalAmount, paidAmount, shippedAmount,
        invoicedSum: status !== 'new' ? totalAmount : 0,
        warehouse: wh._id, warehouseName: wh.name,
        vatEnabled: false, vatIncluded: true, vatSum: 0, reserved: false,
        notes: `Buyurtma ${coNumber}`,
      });
      customerOrders.push(co);
    }
  }
  console.log(`  ${customerOrders.length} ta mijoz buyurtmasi yaratildi\n`);

  // ===== 11. MIJOZ FAKTURALARI =====
  console.log('🧾 Mijoz fakturalari yaratilmoqda...');
  const customerInvoices: any[] = [];
  for (const co of customerOrders.filter(o => o.status !== 'new' && o.status !== 'cancelled')) {
    const invNumber = await generateDocNumber('CF');
    const isPaid = co.status === 'delivered';
    const isShipped = ['shipped', 'delivered'].includes(co.status);
    const wh = warehouses.find((w: any) => w._id.equals(co.warehouse)) || warehouses[0];
    const ci = await CustomerInvoice.create({
      invoiceNumber: invNumber, customer: co.customer, customerName: co.customerName,
      warehouse: wh._id, warehouseName: wh.name,
      invoiceDate: co.orderDate, dueDate: daysFromNow(randomInt(7, 30)),
      status: isPaid ? 'paid' : co.paidAmount > 0 ? 'partial' : 'unpaid',
      shippedStatus: isShipped ? 'shipped' : 'not_shipped',
      items: co.items.map((i: any) => ({
        product: i.product, productName: i.productName, quantity: i.quantity,
        sellingPrice: i.price, costPrice: Math.round(i.price * 0.7),
        discount: i.discount || 0, discountAmount: 0, total: i.total,
        warehouse: wh._id, warehouseName: wh.name,
      })),
      totalAmount: co.totalAmount, finalAmount: co.totalAmount,
      paidAmount: co.paidAmount, shippedAmount: co.shippedAmount || 0,
      customerOrder: co._id, orderNumber: co.orderNumber,
    });
    customerInvoices.push(ci);
  }
  console.log(`  ${customerInvoices.length} ta mijoz fakturasi yaratildi\n`);

  // ===== 12. JO'NATISHLAR (shipped/delivered buyurtmalar uchun) =====
  console.log('🚛 Jo\'natishlar yaratilmoqda...');
  const shipments: any[] = [];
  for (const co of customerOrders.filter(o => ['shipped', 'delivered'].includes(o.status))) {
    const shNumber = await generateDocNumber('SH');
    const wh = warehouses.find((w: any) => w._id.equals(co.warehouse)) || warehouses[0];
    const sh = await Shipment.create({
      shipmentNumber: shNumber, customer: co.customer, customerName: co.customerName,
      order: co._id, orderNumber: co.orderNumber,
      shipmentDate: new Date(co.orderDate.getTime() + 86400000),
      warehouse: wh._id, warehouseName: wh.name,
      status: co.status === 'delivered' ? 'delivered' : 'in_transit',
      items: co.items.map((i: any) => ({
        product: i.product, productName: i.productName, quantity: i.quantity, price: i.price, total: i.total,
      })),
      totalAmount: co.totalAmount, paidAmount: co.paidAmount,
      deliveryAddress: co.customerName + ' manzili',
    });
    shipments.push(sh);
  }
  console.log(`  ${shipments.length} ta jo'natish yaratildi\n`);

  // ===== 13. TO'LOVLAR =====
  console.log('💰 To\'lovlar yaratilmoqda...');
  const payments: any[] = [];
  // Mijozlardan kirim
  for (const co of customerOrders.filter(o => o.paidAmount > 0)) {
    const customer = customers.find((c: any) => c._id.equals(co.customer));
    const payNumber = await generateDocNumber('PAY');
    const pay = await Payment.create({
      paymentNumber: payNumber, type: 'incoming', paymentDate: co.orderDate,
      amount: co.paidAmount, partner: co.customer, partnerName: co.customerName,
      account: randomChoice(['cash', 'bank'] as const),
      paymentMethod: randomChoice(['cash', 'bank_transfer', 'card'] as const),
      purpose: `Buyurtma ${co.orderNumber} uchun to'lov`,
      linkedDocument: co._id, linkedDocumentType: 'CustomerOrder', linkedDocumentNumber: co.orderNumber,
      status: 'confirmed',
    });
    payments.push(pay);
  }
  // Yetkazib beruvchilarga chiqim
  for (const si of supplierInvoices.filter((s: any) => s.paidAmount > 0)) {
    const payNumber = await generateDocNumber('PAY');
    const pay = await Payment.create({
      paymentNumber: payNumber, type: 'outgoing', paymentDate: si.invoiceDate,
      amount: si.paidAmount, partner: undefined, partnerName: si.supplierName,
      account: 'bank', paymentMethod: 'bank_transfer',
      purpose: `Xarid ${si.orderNumber} uchun to'lov`,
      status: 'confirmed',
    });
    payments.push(pay);
  }
  console.log(`  ${payments.length} ta to'lov yaratildi\n`);

  // ===== 14. QAYTARISHLAR =====
  console.log('↩️ Qaytarishlar yaratilmoqda...');
  // Mijoz qaytarishlari (delivered buyurtmalardan 2-3 ta)
  const deliveredOrders = customerOrders.filter(o => o.status === 'delivered');
  const customerReturns: any[] = [];
  for (let i = 0; i < Math.min(3, deliveredOrders.length); i++) {
    const co = deliveredOrders[i];
    const ci = customerInvoices.find((inv: any) => inv.customerOrder?.equals(co._id));
    const sh = shipments.find((s: any) => s.order.equals(co._id));
    if (!ci) continue;
    const wh = warehouses.find((w: any) => w._id.equals(co.warehouse)) || warehouses[0];
    const returnItem = co.items[0];
    const retQty = Math.max(1, Math.floor(returnItem.quantity / 2));
    const retNumber = await generateDocNumber('CR');
    const cr = await CustomerReturn.create({
      returnNumber: retNumber, customer: co.customer, customerName: co.customerName,
      warehouse: wh._id, warehouseName: wh.name,
      invoice: ci._id, invoiceNumber: ci.invoiceNumber,
      shipment: sh?._id, shipmentNumber: sh?.shipmentNumber,
      customerOrder: co._id, orderNumber: co.orderNumber,
      returnDate: daysAgo(randomInt(0, 2)),
      status: randomChoice(['pending', 'accepted'] as const),
      items: [{
        product: returnItem.product, productName: returnItem.productName,
        quantity: retQty, price: returnItem.price, total: retQty * returnItem.price,
        reason: randomChoice(['defective', 'wrong_item', 'customer_request'] as const),
      }],
      totalAmount: retQty * returnItem.price,
      reason: 'defective',
    });
    customerReturns.push(cr);
  }
  console.log(`  ${customerReturns.length} ta mijoz qaytarishi yaratildi\n`);

  // ===== 15. OMBOR TRANSFERLARI =====
  console.log('🔄 Ombor transferlari yaratilmoqda...');
  const transfers: any[] = [];
  for (let i = 0; i < 3; i++) {
    const srcIdx = i % warehouses.length;
    const dstIdx = (i + 1) % warehouses.length;
    const src = warehouses[srcIdx];
    const dst = warehouses[dstIdx];
    const tItems = [];
    for (let k = 0; k < randomInt(2, 4); k++) {
      const p = products[randomInt(0, products.length - 1)];
      tItems.push({ product: p._id, productName: p.name, quantity: randomInt(5, 20) });
    }
    const trNumber = await generateDocNumber('TR');
    const tr = await WarehouseTransfer.create({
      transferNumber: trNumber,
      sourceWarehouse: src._id, sourceWarehouseName: src.name,
      destinationWarehouse: dst._id, destinationWarehouseName: dst.name,
      transferDate: daysAgo(randomInt(1, 5)),
      items: tItems, status: randomChoice(['completed', 'in_transit', 'pending'] as const),
    });
    transfers.push(tr);
  }
  console.log(`  ${transfers.length} ta transfer yaratildi\n`);

  // ===== 16. OMBOR XARAJATLARI =====
  console.log('💸 Ombor xarajatlari yaratilmoqda...');
  const expenses: any[] = [];
  const expenseCategories: any[] = ['rent', 'utilities', 'maintenance', 'salaries', 'equipment'];
  for (const wh of warehouses) {
    for (let day = 6; day >= 0; day -= 2) {
      const cat = randomChoice(expenseCategories);
      await WarehouseExpense.create({
        warehouse: wh._id, warehouseName: wh.name,
        expenseDate: daysAgo(day), category: cat,
        amount: randomInt(500000, 5000000),
        description: `${wh.name} - ${cat} xarajati`,
      });
      expenses.push(cat);
    }
  }
  console.log(`  ${expenses.length} ta ombor xarajati yaratildi\n`);

  // ===== 17. SHARTNOMALAR =====
  console.log('📄 Shartnomalar yaratilmoqda...');
  const contracts: any[] = [];
  for (let i = 0; i < 5; i++) {
    const partner = customers[i];
    const ctNumber = await generateDocNumber('CT');
    const ct = await Contract.create({
      contractNumber: ctNumber, partner: partner._id, partnerName: partner.name,
      contractDate: daysAgo(30), startDate: daysAgo(30), endDate: daysFromNow(335),
      currency: 'UZS', totalAmount: randomInt(50000000, 500000000),
      creditLimit: randomInt(10000000, 100000000),
      paymentTerms: 'Net 30', status: 'active',
    });
    contracts.push(ct);
  }
  console.log(`  ${contracts.length} ta shartnoma yaratildi\n`);

  // ===== 18. VAZIFALAR =====
  console.log('✅ Vazifalar yaratilmoqda...');
  const taskTitles = [
    "Ombor inventarizatsiyasini o'tkazish",
    "Yangi mijoz bilan shartnoma tuzish",
    "Mahsulot narxlarini yangilash",
    "Yetkazib beruvchi bilan muzokara",
    "Oylik hisobot tayyorlash",
    "Omborni tartibga keltirish",
    "Yangi mahsulotlarni kiritish",
    "Mijozlarga qarz eslatish",
  ];
  const tasks: any[] = [];
  const allUsers = await User.find({ role: 'employee' });
  for (const title of taskTitles) {
    const assignee = randomChoice(allUsers);
    const task = await Task.create({
      title, description: `${title} - batafsil`,
      assignedTo: assignee._id, assignedToName: `${assignee.firstName} ${assignee.lastName}`,
      createdByName: 'Admin',
      priority: randomChoice(['low', 'medium', 'high', 'urgent'] as const),
      status: randomChoice(['pending', 'in_progress', 'completed'] as const),
      dueDate: daysFromNow(randomInt(1, 14)),
      category: randomChoice(['Ombor', 'Savdo', 'Moliya', 'Umumiy']),
    });
    tasks.push(task);
  }
  console.log(`  ${tasks.length} ta vazifa yaratildi\n`);

  // ===== NATIJA =====
  console.log('═══════════════════════════════════════════');
  console.log('  SEED MA\'LUMOTLARI MUVAFFAQIYATLI YARATILDI');
  console.log('═══════════════════════════════════════════');
  console.log(`  Omborlar:              ${warehouses.length}`);
  console.log(`  Yetkazib beruvchilar:  ${suppliers.length}`);
  console.log(`  Kontragentlar:         ${partners.length}`);
  console.log(`  Mahsulotlar:           ${products.length}`);
  console.log(`  Xodimlar:              ${employeeCredentials.length}`);
  console.log(`  Xarid buyurtmalari:    ${purchaseOrders.length}`);
  console.log(`  Qabul qilishlar:       ${receipts.length}`);
  console.log(`  Yetk. beruvchi HF:     ${supplierInvoices.length}`);
  console.log(`  Mijoz buyurtmalari:    ${customerOrders.length}`);
  console.log(`  Mijoz fakturalari:     ${customerInvoices.length}`);
  console.log(`  Jo'natishlar:          ${shipments.length}`);
  console.log(`  To'lovlar:             ${payments.length}`);
  console.log(`  Qaytarishlar:          ${customerReturns.length}`);
  console.log(`  Ombor transferlari:    ${transfers.length}`);
  console.log(`  Ombor xarajatlari:     ${expenses.length}`);
  console.log(`  Shartnomalar:          ${contracts.length}`);
  console.log(`  Vazifalar:             ${tasks.length}`);
  console.log('═══════════════════════════════════════════');

  console.log('\nXodimlar:');
  console.log('  ┌──────────────────────┬──────────────────────┬──────────────┐');
  console.log('  │ Ism                  │ Login                │ Parol        │');
  console.log('  ├──────────────────────┼──────────────────────┼──────────────┤');
  for (const e of employeeCredentials) {
    console.log(`  │ ${e.name.padEnd(20)} │ ${e.username.padEnd(20)} │ ${e.password.padEnd(12)} │`);
  }
  console.log('  └──────────────────────┴──────────────────────┴──────────────┘');

  await mongoose.disconnect();
  console.log('\nSeed muvaffaqiyatli yakunlandi!');
}

seed().catch((err) => {
  console.error('Seed xatolik:', err);
  process.exit(1);
});
