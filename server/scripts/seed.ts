import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';
import Warehouse from '../models/Warehouse';
import Supplier from '../models/Supplier';
import Partner from '../models/Partner';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';
import { generateDocNumber } from '../utils/documentNumber';

dotenv.config();

// ============ OMBORLAR ============
const WAREHOUSES = [
  {
    name: 'Asosiy ombor',
    code: 'WH-001',
    address: 'Toshkent sh., Chilonzor tumani, 1-mavze',
    contactPerson: 'Akbarov Jasur',
    phone: '+998901234567',
    capacity: 5000,
    color: '#3B82F6',
  },
  {
    name: 'Yordamchi ombor',
    code: 'WH-002',
    address: 'Toshkent sh., Sergeli tumani, Sergeli-7',
    contactPerson: 'Karimov Sardor',
    phone: '+998901234568',
    capacity: 3000,
    color: '#10B981',
  },
];

// ============ YETKAZIB BERUVCHILAR ============
const SUPPLIERS = [
  { name: 'Samsung Uzbekistan', contactPerson: 'Aliyev Bobur', phone: '+998901112233', email: 'samsung@supplier.uz', address: 'Toshkent sh., Mirzo Ulugbek tumani', inn: '123456789', bankAccount: '20208000123456789012' },
  { name: 'Apple Central Asia', contactPerson: 'Johnson Mark', phone: '+998901112244', email: 'apple@supplier.uz', address: 'Toshkent sh., Yakkasaroy tumani', inn: '234567890', bankAccount: '20208000234567890123' },
  { name: 'Coca-Cola Bottlers Uzbekistan', contactPerson: 'Rahimov Anvar', phone: '+998901112255', email: 'cocacola@supplier.uz', address: 'Toshkent viloyati, Chirchiq shahri', inn: '345678901', bankAccount: '20208000345678901234' },
  { name: 'Qurilish Materiallari OOO', contactPerson: 'Toshmatov Ulug', phone: '+998901112266', email: 'qurilish@supplier.uz', address: 'Toshkent sh., Olmazor tumani', inn: '456789012', bankAccount: '20208000456789012345' },
  { name: 'Fashion Trade Group', contactPerson: 'Madaminova Nilufar', phone: '+998901112277', email: 'fashion@supplier.uz', address: 'Toshkent sh., Shayxontohur tumani', inn: '567890123', bankAccount: '20208000567890123456' },
];

// ============ KONTRAGENTLAR (Mijozlar + Yetkazib beruvchilar) ============
const PARTNERS = [
  // Mijozlar (customers)
  { code: 'C-001', name: 'Texnomart do\'koni', type: 'customer' as const, status: 'vip' as const, group: 'Chakana savdo', contactPerson: 'Rustamov Bekzod', phone: '+998933334455', email: 'texnomart@client.uz', physicalAddress: 'Toshkent sh., Chilonzor tumani', taxId: '111222333' },
  { code: 'C-002', name: 'Oltin Bozor MCHJ', type: 'customer' as const, status: 'active' as const, group: 'Ulgurji savdo', contactPerson: 'Alimov Sherzod', phone: '+998933334466', email: 'oltinbozor@client.uz', physicalAddress: 'Samarqand sh., Registon ko\'chasi', taxId: '222333444' },
  { code: 'C-003', name: 'Baraka Savdo', type: 'customer' as const, status: 'active' as const, group: 'Chakana savdo', contactPerson: 'Qodirov Jamshid', phone: '+998933334477', email: 'baraka@client.uz', physicalAddress: 'Buxoro sh., Markaziy bozor', taxId: '333444555' },
  { code: 'C-004', name: 'Mega Planet', type: 'customer' as const, status: 'vip' as const, group: 'Ulgurji savdo', contactPerson: 'Nazarov Dilshod', phone: '+998933334488', email: 'megaplanet@client.uz', physicalAddress: 'Toshkent sh., Yunusobod tumani', taxId: '444555666' },
  { code: 'C-005', name: 'Zilol Savdo', type: 'customer' as const, status: 'active' as const, group: 'Chakana savdo', contactPerson: 'Haydarov Nodir', phone: '+998933334499', email: 'zilol@client.uz', physicalAddress: 'Namangan sh., Navbahor ko\'chasi', taxId: '555666777' },
  { code: 'C-006', name: 'Ideal Qurilish', type: 'customer' as const, status: 'active' as const, group: 'Qurilish', contactPerson: 'Ahmedov Firdavs', phone: '+998933335500', email: 'ideal@client.uz', physicalAddress: 'Andijon sh., Mashinasozlar ko\'chasi', taxId: '666777888' },
  { code: 'C-007', name: 'SportZona do\'koni', type: 'customer' as const, status: 'new' as const, group: 'Chakana savdo', contactPerson: 'Ibragimov Oybek', phone: '+998933335511', email: 'sportzona@client.uz', physicalAddress: 'Toshkent sh., Mirzo Ulugbek tumani', taxId: '777888999' },
  { code: 'C-008', name: 'Savdo Markaz MCHJ', type: 'customer' as const, status: 'active' as const, group: 'Ulgurji savdo', contactPerson: 'Xolmatov Asror', phone: '+998933335522', email: 'savdomarkaz@client.uz', physicalAddress: 'Farg\'ona sh., Mustaqillik ko\'chasi', taxId: '888999000' },
  // Yetkazib beruvchilar (suppliers - Partners jadvalidagi)
  { code: 'S-001', name: 'Samsung Uzbekistan', type: 'supplier' as const, status: 'active' as const, group: 'Elektronika', contactPerson: 'Aliyev Bobur', phone: '+998901112233', taxId: '123456789' },
  { code: 'S-002', name: 'Apple Central Asia', type: 'supplier' as const, status: 'active' as const, group: 'Elektronika', contactPerson: 'Johnson Mark', phone: '+998901112244', taxId: '234567890' },
  { code: 'S-003', name: 'Coca-Cola Bottlers Uzbekistan', type: 'supplier' as const, status: 'active' as const, group: 'Ichimliklar', contactPerson: 'Rahimov Anvar', phone: '+998901112255', taxId: '345678901' },
  { code: 'S-004', name: 'Qurilish Materiallari OOO', type: 'supplier' as const, status: 'active' as const, group: 'Qurilish', contactPerson: 'Toshmatov Ulug', phone: '+998901112266', taxId: '456789012' },
  { code: 'S-005', name: 'Fashion Trade Group', type: 'supplier' as const, status: 'active' as const, group: 'Kiyim-kechak', contactPerson: 'Madaminova Nilufar', phone: '+998901112277', taxId: '567890123' },
];

// ============ MAHSULOTLAR ============
const PRODUCTS = [
  { name: 'Samsung Galaxy S24', category: 'Elektronika', unit: 'dona', costPrice: 8500000, sellingPrice: 9500000, sku: 'EL-001' },
  { name: 'iPhone 15 Pro', category: 'Elektronika', unit: 'dona', costPrice: 12000000, sellingPrice: 13500000, sku: 'EL-002' },
  { name: 'Xiaomi Redmi Note 13', category: 'Elektronika', unit: 'dona', costPrice: 2500000, sellingPrice: 2800000, sku: 'EL-003' },
  { name: 'Samsung 55" Smart TV', category: 'Elektronika', unit: 'dona', costPrice: 4500000, sellingPrice: 5200000, sku: 'EL-004' },
  { name: 'Apple MacBook Air M2', category: 'Elektronika', unit: 'dona', costPrice: 14000000, sellingPrice: 15500000, sku: 'EL-005' },
  { name: 'Coca-Cola 1L', category: 'Ichimliklar', unit: 'dona', costPrice: 8000, sellingPrice: 12000, sku: 'IC-001' },
  { name: 'Pepsi 1.5L', category: 'Ichimliklar', unit: 'dona', costPrice: 9000, sellingPrice: 13000, sku: 'IC-002' },
  { name: 'Nestle suv 0.5L', category: 'Ichimliklar', unit: 'dona', costPrice: 2000, sellingPrice: 3500, sku: 'IC-003' },
  { name: 'Un 1-sort 50kg', category: 'Oziq-ovqat', unit: 'qop', costPrice: 180000, sellingPrice: 210000, sku: 'OO-001' },
  { name: 'Shakar 1kg', category: 'Oziq-ovqat', unit: 'kg', costPrice: 12000, sellingPrice: 15000, sku: 'OO-002' },
  { name: 'Palov guruch 5kg', category: 'Oziq-ovqat', unit: 'kg', costPrice: 65000, sellingPrice: 78000, sku: 'OO-003' },
  { name: "O'simlik yog'i 1L", category: 'Oziq-ovqat', unit: 'dona', costPrice: 22000, sellingPrice: 28000, sku: 'OO-004' },
  { name: 'Sement M400 50kg', category: 'Qurilish', unit: 'qop', costPrice: 62000, sellingPrice: 75000, sku: 'QU-001' },
  { name: "G'isht qizil 1-sort", category: 'Qurilish', unit: 'dona', costPrice: 1200, sellingPrice: 1600, sku: 'QU-002' },
  { name: 'Armaturas 12mm', category: 'Qurilish', unit: 'metr', costPrice: 14000, sellingPrice: 18000, sku: 'QU-003' },
  { name: "Bo'yoq oq 10L", category: 'Qurilish', unit: 'dona', costPrice: 180000, sellingPrice: 220000, sku: 'QU-004' },
  { name: 'Nike Air Max', category: 'Kiyim-kechak', unit: 'dona', costPrice: 850000, sellingPrice: 1100000, sku: 'KK-001' },
  { name: 'Adidas futbolka', category: 'Kiyim-kechak', unit: 'dona', costPrice: 180000, sellingPrice: 250000, sku: 'KK-002' },
  { name: 'Jinsi shim erkaklar', category: 'Kiyim-kechak', unit: 'dona', costPrice: 250000, sellingPrice: 350000, sku: 'KK-003' },
  { name: 'Qish kurtka erkaklar', category: 'Kiyim-kechak', unit: 'dona', costPrice: 450000, sellingPrice: 650000, sku: 'KK-004' },
];

// ============ XODIMLAR ============
const EMPLOYEES = [
  { firstName: 'Jasur', lastName: 'Akbarov', phoneNumber: '+998901001001', address: 'Toshkent sh., Chilonzor tumani', role: 'employee' as const, permissions: ['warehouse', 'products'] },
  { firstName: 'Sardor', lastName: 'Karimov', phoneNumber: '+998901001002', address: 'Toshkent sh., Sergeli tumani', role: 'employee' as const, permissions: ['warehouse', 'products', 'purchases'] },
  { firstName: 'Nilufar', lastName: 'Umarova', phoneNumber: '+998901001003', address: 'Toshkent sh., Yakkasaroy tumani', role: 'employee' as const, permissions: ['sales', 'customers'] },
  { firstName: 'Bekzod', lastName: 'Toshmatov', phoneNumber: '+998901001004', address: 'Toshkent sh., Mirzo Ulugbek tumani', role: 'employee' as const, permissions: ['finance', 'payments'] },
  { firstName: 'Dilshod', lastName: 'Rahimov', phoneNumber: '+998901001005', address: 'Toshkent sh., Yunusobod tumani', role: 'employee' as const, permissions: ['sales', 'warehouse', 'products'] },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI topilmadi .env faylda');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('MongoDB ulandi');

  // ===== TOZALASH =====
  // Faqat seed orqali yaratilganlarni tozalash
  await Warehouse.deleteMany({ code: { $in: WAREHOUSES.map(w => w.code) } });
  await Product.deleteMany({ sku: { $in: PRODUCTS.map(p => p.sku) } });
  await Supplier.deleteMany({ phone: { $in: SUPPLIERS.map(s => s.phone) } });
  await Partner.deleteMany({ code: { $in: PARTNERS.map(p => p.code) } });
  await User.deleteMany({ phoneNumber: { $in: EMPLOYEES.map(e => e.phoneNumber) } });
  console.log('Eski seed ma\'lumotlar tozalandi');

  // ===== 1. OMBORLAR =====
  const warehouses = await Warehouse.insertMany(WAREHOUSES);
  console.log(`\n${warehouses.length} ta ombor yaratildi`);

  // ===== 2. YETKAZIB BERUVCHILAR (Supplier model) =====
  const suppliers = await Supplier.insertMany(SUPPLIERS);
  console.log(`${suppliers.length} ta yetkazib beruvchi yaratildi`);

  // ===== 3. KONTRAGENTLAR (Partner model) =====
  const partners = await Partner.insertMany(PARTNERS);
  const customers = partners.filter(p => p.type === 'customer');
  const supplierPartners = partners.filter(p => p.type === 'supplier');
  console.log(`${partners.length} ta kontragent yaratildi (${customers.length} mijoz, ${supplierPartners.length} yetkazib beruvchi)`);

  // ===== 4. MAHSULOTLAR =====
  const productsData = PRODUCTS.map((p) => {
    const qty1 = Math.floor(Math.random() * 100) + 10;
    const qty2 = Math.floor(Math.random() * 50) + 5;
    return {
      ...p,
      unitType: ['metr', 'kg'].includes(p.unit) ? 'uncount' as const : 'count' as const,
      quantity: qty1 + qty2,
      minStock: 5,
      status: 'active' as const,
      stockByWarehouse: [
        {
          warehouse: warehouses[0]._id,
          warehouseName: warehouses[0].name,
          quantity: qty1,
          reserved: 0,
        },
        {
          warehouse: warehouses[1]._id,
          warehouseName: warehouses[1].name,
          quantity: qty2,
          reserved: 0,
        },
      ],
    };
  });
  const products = await Product.insertMany(productsData);
  console.log(`${products.length} ta mahsulot yaratildi`);

  // ===== 5. XODIMLAR =====
  const employeeCredentials: { name: string; username: string; password: string; phone: string }[] = [];
  for (const emp of EMPLOYEES) {
    // Username yaratish
    const base = (emp.firstName + emp.lastName).toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = base;
    let suffix = 1;
    while (await User.findOne({ username })) {
      suffix++;
      username = `${base}${suffix}`;
    }

    const password = emp.lastName.toLowerCase() + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = await hashPassword(password);

    await User.create({
      username,
      passwordHash,
      firstName: emp.firstName,
      lastName: emp.lastName,
      phoneNumber: emp.phoneNumber,
      address: emp.address,
      role: emp.role,
      permissions: emp.permissions,
      isActive: true,
    });

    employeeCredentials.push({
      name: `${emp.firstName} ${emp.lastName}`,
      username,
      password,
      phone: emp.phoneNumber,
    });
  }
  console.log(`${employeeCredentials.length} ta xodim yaratildi`);

  // ===== NATIJA =====
  console.log('\n========================================');
  console.log('  SEED NATIJALARI');
  console.log('========================================');

  console.log('\nOmborlar:');
  for (const w of warehouses) {
    console.log(`  ${w.name} (${w.code}) - ${w.address}`);
  }

  console.log('\nYetkazib beruvchilar:');
  for (const s of suppliers) {
    console.log(`  ${s.name} | Tel: ${s.phone}`);
  }

  console.log('\nMijozlar:');
  for (const c of customers) {
    console.log(`  ${c.name} (${c.code}) | ${c.status} | Tel: ${c.phone}`);
  }

  console.log('\nMahsulotlar:');
  for (const p of products) {
    console.log(`  ${p.name} | ${p.sku} | Narx: ${p.sellingPrice.toLocaleString()} | Jami: ${p.quantity}`);
  }

  console.log('\nXodimlar:');
  console.log('  ┌──────────────────────┬────────────────┬──────────────────┬──────────────────┐');
  console.log('  │ Ism                  │ Login          │ Parol            │ Telefon          │');
  console.log('  ├──────────────────────┼────────────────┼──────────────────┼──────────────────┤');
  for (const e of employeeCredentials) {
    console.log(`  │ ${e.name.padEnd(20)} │ ${e.username.padEnd(14)} │ ${e.password.padEnd(16)} │ ${e.phone.padEnd(16)} │`);
  }
  console.log('  └──────────────────────┴────────────────┴──────────────────┴──────────────────┘');

  await mongoose.disconnect();
  console.log('\nSeed muvaffaqiyatli yakunlandi!');
}

seed().catch((err) => {
  console.error('Seed xatolik:', err);
  process.exit(1);
});
