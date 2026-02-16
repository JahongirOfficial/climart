import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Partner from '../models/Partner';
import Product from '../models/Product';
import Warehouse from '../models/Warehouse';
import PurchaseOrder from '../models/PurchaseOrder';
import Receipt from '../models/Receipt';
import CustomerOrder from '../models/CustomerOrder';
import Shipment from '../models/Shipment';
import Payment from '../models/Payment';

dotenv.config();

// Real product data
const REAL_PRODUCTS = [
  // Electronics
  { name: 'Samsung Galaxy S24', category: 'Electronics', unit: 'dona', costPrice: 8500000, salePrice: 9500000 },
  { name: 'iPhone 15 Pro', category: 'Electronics', unit: 'dona', costPrice: 12000000, salePrice: 13500000 },
  { name: 'Xiaomi Redmi Note 13', category: 'Electronics', unit: 'dona', costPrice: 2500000, salePrice: 2800000 },
  { name: 'Samsung 55" Smart TV', category: 'Electronics', unit: 'dona', costPrice: 4500000, salePrice: 5200000 },
  { name: 'Sony PlayStation 5', category: 'Electronics', unit: 'dona', costPrice: 5500000, salePrice: 6200000 },
  { name: 'Apple MacBook Air M2', category: 'Electronics', unit: 'dona', costPrice: 11000000, salePrice: 12500000 },
  { name: 'Dell XPS 15 Laptop', category: 'Electronics', unit: 'dona', costPrice: 9500000, salePrice: 10800000 },
  { name: 'iPad Pro 12.9"', category: 'Electronics', unit: 'dona', costPrice: 8000000, salePrice: 9200000 },
  { name: 'AirPods Pro 2', category: 'Electronics', unit: 'dona', costPrice: 2200000, salePrice: 2500000 },
  { name: 'Canon EOS R6 Camera', category: 'Electronics', unit: 'dona', costPrice: 15000000, salePrice: 17000000 },
  
  // Home Appliances
  { name: 'LG Muzlatgich 350L', category: 'Home Appliances', unit: 'dona', costPrice: 3500000, salePrice: 4000000 },
  { name: 'Samsung Kir yuvish mashinasi', category: 'Home Appliances', unit: 'dona', costPrice: 2800000, salePrice: 3200000 },
  { name: 'Artel Konditsioner 12000 BTU', category: 'Home Appliances', unit: 'dona', costPrice: 2200000, salePrice: 2600000 },
  { name: 'Bosch Idish yuvish mashinasi', category: 'Home Appliances', unit: 'dona', costPrice: 4200000, salePrice: 4800000 },
  { name: 'Tefal Mikroto\'lqinli pech', category: 'Home Appliances', unit: 'dona', costPrice: 850000, salePrice: 1000000 },
  { name: 'Philips Changyutgich', category: 'Home Appliances', unit: 'dona', costPrice: 1200000, salePrice: 1400000 },
  { name: 'Dyson V15 Changyutgich', category: 'Home Appliances', unit: 'dona', costPrice: 4500000, salePrice: 5200000 },
  { name: 'Arzum Blender', category: 'Home Appliances', unit: 'dona', costPrice: 450000, salePrice: 550000 },
  { name: 'Xiaomi Robot Changyutgich', category: 'Home Appliances', unit: 'dona', costPrice: 2800000, salePrice: 3200000 },
  { name: 'Electrolux Gaz plitasi', category: 'Home Appliances', unit: 'dona', costPrice: 1800000, salePrice: 2100000 },
  
  // Furniture
  { name: 'Yotoq xonasi garnituri', category: 'Furniture', unit: 'to\'plam', costPrice: 5500000, salePrice: 6500000 },
  { name: 'Mehmonxona divani', category: 'Furniture', unit: 'dona', costPrice: 3200000, salePrice: 3800000 },
  { name: 'Ish stoli', category: 'Furniture', unit: 'dona', costPrice: 850000, salePrice: 1100000 },
  { name: 'Ofis kreslo', category: 'Furniture', unit: 'dona', costPrice: 650000, salePrice: 850000 },
  { name: 'Shkaf 3 eshikli', category: 'Furniture', unit: 'dona', costPrice: 2200000, salePrice: 2700000 },
  { name: 'Ovqat stoli 6 kishilik', category: 'Furniture', unit: 'to\'plam', costPrice: 2800000, salePrice: 3400000 },
  { name: 'Kitob javoni', category: 'Furniture', unit: 'dona', costPrice: 950000, salePrice: 1250000 },
  { name: 'Bolalar krovati', category: 'Furniture', unit: 'dona', costPrice: 1500000, salePrice: 1900000 },
  { name: 'Prixojka garnituri', category: 'Furniture', unit: 'to\'plam', costPrice: 4200000, salePrice: 5000000 },
  { name: 'Kompyuter stoli', category: 'Furniture', unit: 'dona', costPrice: 750000, salePrice: 950000 },
  
  // Clothing
  { name: 'Erkaklar ko\'ylagi', category: 'Clothing', unit: 'dona', costPrice: 120000, salePrice: 180000 },
  { name: 'Ayollar ko\'ylagi', category: 'Clothing', unit: 'dona', costPrice: 150000, salePrice: 220000 },
  { name: 'Jins shim', category: 'Clothing', unit: 'dona', costPrice: 180000, salePrice: 280000 },
  { name: 'Kurtka', category: 'Clothing', unit: 'dona', costPrice: 350000, salePrice: 500000 },
  { name: 'Sportiv kostyum', category: 'Clothing', unit: 'dona', costPrice: 250000, salePrice: 380000 },
  { name: 'Futbolka', category: 'Clothing', unit: 'dona', costPrice: 45000, salePrice: 75000 },
  { name: 'Ayollar paltosi', category: 'Clothing', unit: 'dona', costPrice: 280000, salePrice: 420000 },
  { name: 'Erkaklar kostyumi', category: 'Clothing', unit: 'dona', costPrice: 650000, salePrice: 950000 },
  { name: 'Bolalar ko\'ylagi', category: 'Clothing', unit: 'dona', costPrice: 85000, salePrice: 130000 },
  { name: 'Sharf', category: 'Clothing', unit: 'dona', costPrice: 35000, salePrice: 55000 },
  
  // Shoes
  { name: 'Nike Air Max', category: 'Shoes', unit: 'juft', costPrice: 850000, salePrice: 1200000 },
  { name: 'Adidas Superstar', category: 'Shoes', unit: 'juft', costPrice: 750000, salePrice: 1050000 },
  { name: 'Puma RS-X', category: 'Shoes', unit: 'juft', costPrice: 650000, salePrice: 920000 },
  { name: 'Klassik erkaklar tufli', category: 'Shoes', unit: 'juft', costPrice: 450000, salePrice: 650000 },
  { name: 'Ayollar tuflisi', category: 'Shoes', unit: 'juft', costPrice: 380000, salePrice: 550000 },
  { name: 'Bolalar krossovkasi', category: 'Shoes', unit: 'juft', costPrice: 280000, salePrice: 420000 },
  { name: 'Sandal', category: 'Shoes', unit: 'juft', costPrice: 150000, salePrice: 230000 },
  { name: 'Botinka', category: 'Shoes', unit: 'juft', costPrice: 550000, salePrice: 800000 },
  { name: 'Sportiv oyoq kiyim', category: 'Shoes', unit: 'juft', costPrice: 320000, salePrice: 480000 },
  { name: 'Uy shippagi', category: 'Shoes', unit: 'juft', costPrice: 45000, salePrice: 75000 },
  
  // Food & Beverages
  { name: 'Guruch 25kg', category: 'Food', unit: 'qop', costPrice: 280000, salePrice: 350000 },
  { name: 'Un 50kg', category: 'Food', unit: 'qop', costPrice: 420000, salePrice: 520000 },
  { name: 'Shakar 50kg', category: 'Food', unit: 'qop', costPrice: 380000, salePrice: 470000 },
  { name: 'Yog\' 5L', category: 'Food', unit: 'dona', costPrice: 85000, salePrice: 110000 },
  { name: 'Choy 1kg', category: 'Food', unit: 'kg', costPrice: 45000, salePrice: 65000 },
  { name: 'Kofe 500g', category: 'Food', unit: 'dona', costPrice: 120000, salePrice: 170000 },
  { name: 'Makaron 1kg', category: 'Food', unit: 'kg', costPrice: 12000, salePrice: 18000 },
  { name: 'Tuz 1kg', category: 'Food', unit: 'kg', costPrice: 3500, salePrice: 5500 },
  { name: 'Coca Cola 1.5L', category: 'Beverages', unit: 'dona', costPrice: 8500, salePrice: 12000 },
  { name: 'Mineral suv 1.5L', category: 'Beverages', unit: 'dona', costPrice: 3500, salePrice: 5500 },
  
  // Cosmetics
  { name: 'Shampun L\'Oreal', category: 'Cosmetics', unit: 'dona', costPrice: 45000, salePrice: 65000 },
  { name: 'Parfyum Chanel', category: 'Cosmetics', unit: 'dona', costPrice: 850000, salePrice: 1200000 },
  { name: 'Krem Nivea', category: 'Cosmetics', unit: 'dona', costPrice: 35000, salePrice: 50000 },
  { name: 'Tish pastasi Colgate', category: 'Cosmetics', unit: 'dona', costPrice: 18000, salePrice: 28000 },
  { name: 'Sovun Dove', category: 'Cosmetics', unit: 'dona', costPrice: 12000, salePrice: 18000 },
  { name: 'Deodorant Rexona', category: 'Cosmetics', unit: 'dona', costPrice: 28000, salePrice: 42000 },
  { name: 'Makiyaj to\'plami', category: 'Cosmetics', unit: 'dona', costPrice: 250000, salePrice: 380000 },
  { name: 'Soch bo\'yog\'i', category: 'Cosmetics', unit: 'dona', costPrice: 55000, salePrice: 85000 },
  { name: 'Tirnoq laki', category: 'Cosmetics', unit: 'dona', costPrice: 15000, salePrice: 25000 },
  { name: 'Yuz niqobi', category: 'Cosmetics', unit: 'dona', costPrice: 25000, salePrice: 40000 },
  
  // Sports Equipment
  { name: 'Futbol to\'pi', category: 'Sports', unit: 'dona', costPrice: 120000, salePrice: 180000 },
  { name: 'Basketbol to\'pi', category: 'Sports', unit: 'dona', costPrice: 150000, salePrice: 220000 },
  { name: 'Velosiped', category: 'Sports', unit: 'dona', costPrice: 1800000, salePrice: 2400000 },
  { name: 'Ganteli to\'plami', category: 'Sports', unit: 'to\'plam', costPrice: 450000, salePrice: 650000 },
  { name: 'Yoga matsi', category: 'Sports', unit: 'dona', costPrice: 85000, salePrice: 130000 },
  { name: 'Suzish ko\'zoynak', category: 'Sports', unit: 'dona', costPrice: 45000, salePrice: 70000 },
  { name: 'Tennis raketkasi', category: 'Sports', unit: 'dona', costPrice: 280000, salePrice: 420000 },
  { name: 'Boks qo\'lqoplari', category: 'Sports', unit: 'juft', costPrice: 180000, salePrice: 280000 },
  { name: 'Skeyboard', category: 'Sports', unit: 'dona', costPrice: 350000, salePrice: 520000 },
  { name: 'Rolikli konkida', category: 'Sports', unit: 'juft', costPrice: 420000, salePrice: 620000 },
  
  // Stationery
  { name: 'Daftar A4 100 varaq', category: 'Stationery', unit: 'dona', costPrice: 8500, salePrice: 13000 },
  { name: 'Ruchka to\'plami', category: 'Stationery', unit: 'to\'plam', costPrice: 15000, salePrice: 23000 },
  { name: 'Qalam to\'plami', category: 'Stationery', unit: 'to\'plam', costPrice: 12000, salePrice: 18000 },
  { name: 'Rangli qalamlar 24 rang', category: 'Stationery', unit: 'to\'plam', costPrice: 35000, salePrice: 52000 },
  { name: 'Marker to\'plami', category: 'Stationery', unit: 'to\'plam', costPrice: 28000, salePrice: 42000 },
  { name: 'Papka A4', category: 'Stationery', unit: 'dona', costPrice: 5500, salePrice: 9000 },
  { name: 'Kalkulyator', category: 'Stationery', unit: 'dona', costPrice: 45000, salePrice: 68000 },
  { name: 'Stepler', category: 'Stationery', unit: 'dona', costPrice: 18000, salePrice: 28000 },
  { name: 'Skotch', category: 'Stationery', unit: 'dona', costPrice: 8500, salePrice: 13000 },
  { name: 'Qaychi', category: 'Stationery', unit: 'dona', costPrice: 12000, salePrice: 18000 },
];

const SUPPLIERS = [
  { name: 'Samsung Electronics Uzbekistan', code: 'SUP-001', type: 'supplier', phone: '+998901234567', address: 'Toshkent, Chilonzor' },
  { name: 'Apple Store Tashkent', code: 'SUP-002', type: 'supplier', phone: '+998901234568', address: 'Toshkent, Yunusobod' },
  { name: 'LG Home Appliances', code: 'SUP-003', type: 'supplier', phone: '+998901234569', address: 'Toshkent, Mirzo Ulug\'bek' },
  { name: 'Artel Electronics', code: 'SUP-004', type: 'supplier', phone: '+998901234570', address: 'Toshkent, Sergeli' },
  { name: 'Mebel Olami', code: 'SUP-005', type: 'supplier', phone: '+998901234571', address: 'Toshkent, Yakkasaroy' },
];

const CUSTOMERS = [
  { name: 'Anvar Karimov', code: 'CUST-001', type: 'customer', phone: '+998901111111', address: 'Toshkent, Chilonzor 12' },
  { name: 'Dilnoza Rahimova', code: 'CUST-002', type: 'customer', phone: '+998902222222', address: 'Toshkent, Yunusobod 5' },
  { name: 'Bobur Aliyev', code: 'CUST-003', type: 'customer', phone: '+998903333333', address: 'Toshkent, Mirzo Ulug\'bek 8' },
  { name: 'Malika Tursunova', code: 'CUST-004', type: 'customer', phone: '+998904444444', address: 'Toshkent, Sergeli 3' },
  { name: 'Sardor Umarov', code: 'CUST-005', type: 'customer', phone: '+998905555555', address: 'Toshkent, Yakkasaroy 15' },
  { name: 'Nigora Sharipova', code: 'CUST-006', type: 'customer', phone: '+998906666666', address: 'Toshkent, Olmazor 7' },
  { name: 'Jasur Mahmudov', code: 'CUST-007', type: 'customer', phone: '+998907777777', address: 'Toshkent, Uchtepa 9' },
  { name: 'Zarina Abdullayeva', code: 'CUST-008', type: 'customer', phone: '+998908888888', address: 'Toshkent, Bektemir 4' },
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/climart');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('\n🗑️  Clearing database...');
  await Partner.deleteMany({});
  await Product.deleteMany({});
  await Warehouse.deleteMany({});
  await PurchaseOrder.deleteMany({});
  await Receipt.deleteMany({});
  await CustomerOrder.deleteMany({});
  await Shipment.deleteMany({});
  await Payment.deleteMany({});
  console.log('✅ Database cleared');
}

async function createWarehouses() {
  console.log('\n🏢 Creating warehouses...');
  const warehouses = await Warehouse.create([
    { name: 'Asosiy ombor', code: 'WH-001', address: 'Toshkent, Sergeli tumani', capacity: 10000, currentLoad: 0 },
    { name: 'Filial ombor', code: 'WH-002', address: 'Toshkent, Chilonzor tumani', capacity: 5000, currentLoad: 0 },
  ]);
  console.log(`✅ Created ${warehouses.length} warehouses`);
  return warehouses;
}

async function createPartners() {
  console.log('\n👥 Creating partners...');
  const suppliers = await Partner.create(SUPPLIERS);
  const customers = await Partner.create(CUSTOMERS);
  console.log(`✅ Created ${suppliers.length} suppliers and ${customers.length} customers`);
  return { suppliers, customers };
}

async function createProducts() {
  console.log('\n📦 Creating 100 products...');
  const products = await Product.create(REAL_PRODUCTS);
  console.log(`✅ Created ${products.length} products`);
  return products;
}

async function createPurchaseOrders(suppliers: any[], products: any[]) {
  console.log('\n📝 Creating purchase orders...');
  const orders = [];
  
  for (let i = 0; i < 5; i++) {
    const supplier = suppliers[i % suppliers.length];
    const orderProducts = [];
    const numProducts = Math.floor(Math.random() * 5) + 3; // 3-7 products per order
    
    for (let j = 0; j < numProducts; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 20) + 5; // 5-24 quantity
      orderProducts.push({
        productName: product.name,
        quantity,
        price: product.costPrice,
        total: quantity * product.costPrice,
      });
    }
    
    const totalAmount = orderProducts.reduce((sum, item) => sum + item.total, 0);
    const orderNumber = `ZK-2026-${String(i + 1).padStart(3, '0')}`;
    
    const order = await PurchaseOrder.create({
      orderNumber,
      supplier: supplier._id,
      supplierName: supplier.name,
      orderDate: new Date(2026, 0, i + 1),
      expectedDate: new Date(2026, 0, i + 5),
      items: orderProducts,
      totalAmount,
      status: 'pending',
    });
    
    orders.push(order);
  }
  
  console.log(`✅ Created ${orders.length} purchase orders`);
  return orders;
}

async function receiveOrders(orders: any[], products: any[]) {
  console.log('\n📥 Receiving orders (creating receipts)...');
  const receipts = [];
  
  for (const order of orders) {
    const receiptItems = [];
    
    for (const item of order.items) {
      const product = products.find(p => p.name === item.productName);
      if (product) {
        receiptItems.push({
          product: product._id,
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.price,
          total: item.total,
        });
        
        // Update product quantity
        const oldQuantity = product.quantity;
        const oldCostPrice = product.costPrice;
        const newQuantity = oldQuantity + item.quantity;
        
        if (newQuantity > 0) {
          product.costPrice = ((oldQuantity * oldCostPrice) + (item.quantity * item.price)) / newQuantity;
        }
        product.quantity = newQuantity;
        await product.save();
      }
    }
    
    const receiptNumber = `QQ-2026-${String(receipts.length + 1).padStart(3, '0')}`;
    const receipt = await Receipt.create({
      receiptNumber,
      supplier: order.supplier,
      supplierName: order.supplierName,
      purchaseOrder: order._id,
      orderNumber: order.orderNumber,
      receiptDate: new Date(order.orderDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      items: receiptItems,
      totalAmount: order.totalAmount,
    });
    
    order.status = 'received';
    await order.save();
    
    receipts.push(receipt);
  }
  
  console.log(`✅ Created ${receipts.length} receipts and updated inventory`);
  return receipts;
}

async function createSupplierPayments(orders: any[], suppliers: any[]) {
  console.log('\n💰 Creating supplier payments...');
  const payments = [];
  
  for (const order of orders) {
    const paymentAmount = order.totalAmount * 0.7; // Pay 70% upfront
    const paymentNumber = `TO-2026-${String(payments.length + 1).padStart(3, '0')}`;
    
    const payment = await Payment.create({
      paymentNumber,
      type: 'outgoing',
      paymentDate: new Date(order.orderDate.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day after order
      amount: paymentAmount,
      account: 'bank',
      paymentMethod: 'bank_transfer',
      partner: order.supplier,
      partnerName: order.supplierName,
      purpose: `To'lov: ${order.orderNumber}`,
      category: 'purchase',
      status: 'confirmed',
    });
    
    payments.push(payment);
  }
  
  console.log(`✅ Created ${payments.length} supplier payments`);
  return payments;
}

async function createCustomerOrders(customers: any[], products: any[]) {
  console.log('\n🛒 Creating customer orders...');
  const orders = [];
  
  for (let i = 0; i < 10; i++) {
    const customer = customers[i % customers.length];
    const orderItems = [];
    const numProducts = Math.floor(Math.random() * 4) + 2; // 2-5 products per order
    
    for (let j = 0; j < numProducts; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      if (product && product.quantity > 0) {
        const quantity = Math.min(Math.floor(Math.random() * 3) + 1, product.quantity); // 1-3 quantity
        const price = product.salePrice || product.costPrice * 1.3; // Use salePrice or 30% markup
        orderItems.push({
          product: product._id,
          productName: product.name,
          quantity,
          price: price,
          total: quantity * price,
        });
      }
    }
    
    if (orderItems.length === 0) continue;
    
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
    const orderNumber = `CO-2026-${String(i + 1).padStart(3, '0')}`;
    
    const order = await CustomerOrder.create({
      orderNumber,
      customer: customer._id,
      customerName: customer.name,
      orderDate: new Date(2026, 0, i + 10),
      deliveryDate: new Date(2026, 0, i + 15),
      items: orderItems,
      totalAmount,
      paidAmount: 0,
      shippedAmount: 0,
      status: 'pending',
      reserved: false,
    });
    
    orders.push(order);
  }
  
  console.log(`✅ Created ${orders.length} customer orders`);
  return orders;
}

async function reserveAndShipOrders(orders: any[], products: any[], warehouses: any[], customers: any[]) {
  console.log('\n📦 Reserving and shipping customer orders...');
  const shipments = [];
  
  for (const order of orders) {
    // Reserve inventory
    for (const item of order.items) {
      const product = products.find(p => p._id.toString() === item.product.toString());
      if (product && product.quantity >= item.quantity) {
        product.quantity -= item.quantity;
        await product.save();
      }
    }
    
    order.reserved = true;
    order.status = 'confirmed';
    await order.save();
    
    // Get customer details
    const customer = customers.find(c => c._id && order.customer && c._id.toString() === order.customer.toString());
    const warehouse = warehouses[0]; // Use first warehouse
    
    // Create shipment
    const shipmentNumber = `YK-2026-${String(shipments.length + 1).padStart(3, '0')}`;
    const shipment = await Shipment.create({
      shipmentNumber,
      customer: order.customer,
      customerName: order.customerName,
      order: order._id,
      orderNumber: order.orderNumber,
      shipmentDate: new Date(order.orderDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after order
      warehouse: warehouse._id,
      warehouseName: warehouse.name,
      deliveryAddress: customer?.address || 'Toshkent, Chilonzor',
      items: order.items,
      totalAmount: order.totalAmount,
      paidAmount: 0,
      status: 'delivered',
    });
    
    order.shippedAmount = order.totalAmount;
    order.status = 'fulfilled';
    await order.save();
    
    shipments.push(shipment);
  }
  
  console.log(`✅ Created ${shipments.length} shipments`);
  return shipments;
}

async function createCustomerPayments(orders: any[], customers: any[]) {
  console.log('\n💵 Creating customer payments...');
  const payments = [];
  
  for (const order of orders) {
    // Create partial payment (50%)
    const partialAmount = order.totalAmount * 0.5;
    const paymentNumber1 = `TK-2026-${String(payments.length + 1).padStart(3, '0')}`;
    
    const payment1 = await Payment.create({
      paymentNumber: paymentNumber1,
      type: 'incoming',
      paymentDate: new Date(order.orderDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      amount: partialAmount,
      account: 'bank',
      paymentMethod: 'bank_transfer',
      partner: order.customer,
      partnerName: order.customerName,
      purpose: `To'lov olindi: ${order.orderNumber}`,
      status: 'confirmed',
    });
    
    payments.push(payment1);
    
    // Create full payment (remaining 50%)
    const remainingAmount = order.totalAmount - partialAmount;
    const paymentNumber2 = `TK-2026-${String(payments.length + 1).padStart(3, '0')}`;
    
    const payment2 = await Payment.create({
      paymentNumber: paymentNumber2,
      type: 'incoming',
      paymentDate: new Date(order.orderDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      amount: remainingAmount,
      account: 'cash',
      paymentMethod: 'cash',
      partner: order.customer,
      partnerName: order.customerName,
      purpose: `Qoldiq to'lov: ${order.orderNumber}`,
      status: 'confirmed',
    });
    
    payments.push(payment2);
    
    order.paidAmount = order.totalAmount;
    await order.save();
  }
  
  console.log(`✅ Created ${payments.length} customer payments`);
  return payments;
}

async function createOperationalExpenses() {
  console.log('\n💸 Creating operational expenses...');
  const expenses = [];
  
  const expenseTypes = [
    { purpose: 'Ofis ijarasi - Yanvar', amount: 15000000, category: 'rent' },
    { purpose: 'Xodimlar maoshi - Yanvar', amount: 45000000, category: 'salary' },
    { purpose: 'Elektr energiya', amount: 3500000, category: 'utilities' },
    { purpose: 'Internet va telefon', amount: 1200000, category: 'utilities' },
    { purpose: 'Marketing kampaniyasi', amount: 8000000, category: 'marketing' },
    { purpose: 'Ofis jihozlari', amount: 2500000, category: 'office_supplies' },
    { purpose: 'Transport xarajatlari', amount: 4000000, category: 'transport' },
    { purpose: 'Texnik xizmat ko\'rsatish', amount: 1800000, category: 'maintenance' },
  ];
  
  for (let i = 0; i < expenseTypes.length; i++) {
    const expense = expenseTypes[i];
    const paymentNumber = `XR-2026-${String(i + 1).padStart(3, '0')}`;
    
    const payment = await Payment.create({
      paymentNumber,
      type: 'outgoing',
      paymentDate: new Date(2026, 0, 5 + i),
      amount: expense.amount,
      account: 'bank',
      paymentMethod: 'bank_transfer',
      purpose: expense.purpose,
      category: expense.category,
      status: 'confirmed',
    });
    
    expenses.push(payment);
  }
  
  console.log(`✅ Created ${expenses.length} operational expenses`);
  return expenses;
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const productCount = await Product.countDocuments();
  const partnerCount = await Partner.countDocuments();
  const warehouseCount = await Warehouse.countDocuments();
  const purchaseOrderCount = await PurchaseOrder.countDocuments();
  const receiptCount = await Receipt.countDocuments();
  const customerOrderCount = await CustomerOrder.countDocuments();
  const shipmentCount = await Shipment.countDocuments();
  const paymentCount = await Payment.countDocuments();
  
  console.log(`\n📦 Products: ${productCount}`);
  console.log(`👥 Partners: ${partnerCount}`);
  console.log(`🏢 Warehouses: ${warehouseCount}`);
  console.log(`📝 Purchase Orders: ${purchaseOrderCount}`);
  console.log(`📥 Receipts: ${receiptCount}`);
  console.log(`🛒 Customer Orders: ${customerOrderCount}`);
  console.log(`📦 Shipments: ${shipmentCount}`);
  console.log(`💰 Payments: ${paymentCount}`);
  
  // Calculate financial summary
  const incomingPayments = await Payment.find({ type: 'incoming', status: 'confirmed' });
  const outgoingPayments = await Payment.find({ type: 'outgoing', status: 'confirmed' });
  
  const totalIncoming = incomingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutgoing = outgoingPayments.reduce((sum, p) => sum + p.amount, 0);
  const netProfit = totalIncoming - totalOutgoing;
  
  console.log('\n💵 Financial Summary:');
  console.log(`   Kirim: ${totalIncoming.toLocaleString()} so'm`);
  console.log(`   Chiqim: ${totalOutgoing.toLocaleString()} so'm`);
  console.log(`   Sof foyda: ${netProfit.toLocaleString()} so'm`);
  
  // Inventory summary
  const totalInventoryValue = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
  
  if (totalInventoryValue.length > 0) {
    console.log('\n📊 Inventory Summary:');
    console.log(`   Jami mahsulotlar: ${totalInventoryValue[0].totalQuantity} dona`);
    console.log(`   Ombor qiymati: ${totalInventoryValue[0].totalValue.toLocaleString()} so'm`);
  }
  
  console.log('\n' + '='.repeat(60));
}

async function main() {
  try {
    console.log('🚀 Starting Full Business Cycle Test...\n');
    
    await connectDB();
    await clearDatabase();
    
    const warehouses = await createWarehouses();
    const { suppliers, customers } = await createPartners();
    const products = await createProducts();
    
    const purchaseOrders = await createPurchaseOrders(suppliers, products);
    await createSupplierPayments(purchaseOrders, suppliers);
    await receiveOrders(purchaseOrders, products);
    
    const customerOrders = await createCustomerOrders(customers, products);
    await reserveAndShipOrders(customerOrders, products, warehouses, customers);
    await createCustomerPayments(customerOrders, customers);
    
    await createOperationalExpenses();
    
    await printSummary();
    
    console.log('\n✅ Test completed successfully!');
    console.log('🌐 You can now access the application at http://localhost:8080\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

main();
