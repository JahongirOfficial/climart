/**
 * SUPPLIER INVOICES TEST SCRIPT
 * 
 * Bu skript quyidagilarni bajaradi:
 * 1. 20 ta yangi mahsulot yaratadi
 * 2. 55 ta purchase order yaratadi
 * 3. Barcha orderlarni qabul qiladi (avtomatik invoice yaratiladi)
 * 4. Invoicelarning bir qismiga to'lov qiladi
 * 5. Real savdo jarayonini simulyatsiya qiladi
 * 
 * Ishlatish: npm run test:supplier-invoices
 */

const API_BASE = 'http://localhost:8080/api';

// Yangi mahsulotlar ro'yxati
const NEW_PRODUCTS = [
  { name: 'Samsung Galaxy S24 Ultra', category: 'Smartfonlar', costPrice: 12000000, sellingPrice: 14500000, unit: 'dona' },
  { name: 'iPhone 15 Pro Max', category: 'Smartfonlar', costPrice: 15000000, sellingPrice: 18000000, unit: 'dona' },
  { name: 'Xiaomi 14 Pro', category: 'Smartfonlar', costPrice: 8000000, sellingPrice: 9500000, unit: 'dona' },
  { name: 'MacBook Pro M3', category: 'Noutbuklar', costPrice: 25000000, sellingPrice: 29000000, unit: 'dona' },
  { name: 'Dell XPS 15', category: 'Noutbuklar', costPrice: 18000000, sellingPrice: 21000000, unit: 'dona' },
  { name: 'HP Pavilion Gaming', category: 'Noutbuklar', costPrice: 12000000, sellingPrice: 14500000, unit: 'dona' },
  { name: 'iPad Pro 12.9', category: 'Planshetlar', costPrice: 10000000, sellingPrice: 12000000, unit: 'dona' },
  { name: 'Samsung Galaxy Tab S9', category: 'Planshetlar', costPrice: 6000000, sellingPrice: 7500000, unit: 'dona' },
  { name: 'Sony WH-1000XM5', category: 'Audio', costPrice: 3500000, sellingPrice: 4200000, unit: 'dona' },
  { name: 'AirPods Pro 2', category: 'Audio', costPrice: 2500000, sellingPrice: 3000000, unit: 'dona' },
  { name: 'JBL Flip 6', category: 'Audio', costPrice: 1200000, sellingPrice: 1500000, unit: 'dona' },
  { name: 'Canon EOS R6', category: 'Kameralar', costPrice: 28000000, sellingPrice: 32000000, unit: 'dona' },
  { name: 'Sony A7 IV', category: 'Kameralar', costPrice: 30000000, sellingPrice: 35000000, unit: 'dona' },
  { name: 'GoPro Hero 12', category: 'Kameralar', costPrice: 4500000, sellingPrice: 5500000, unit: 'dona' },
  { name: 'Apple Watch Series 9', category: 'Smart soatlar', costPrice: 4000000, sellingPrice: 4800000, unit: 'dona' },
  { name: 'Samsung Galaxy Watch 6', category: 'Smart soatlar', costPrice: 3000000, sellingPrice: 3600000, unit: 'dona' },
  { name: 'Dyson V15 Detect', category: 'Uy texnikasi', costPrice: 6000000, sellingPrice: 7200000, unit: 'dona' },
  { name: 'Philips Air Fryer XXL', category: 'Uy texnikasi', costPrice: 2500000, sellingPrice: 3000000, unit: 'dona' },
  { name: 'LG OLED TV 65"', category: 'Televizorlar', costPrice: 20000000, sellingPrice: 24000000, unit: 'dona' },
  { name: 'Samsung QLED 55"', category: 'Televizorlar', costPrice: 12000000, sellingPrice: 14500000, unit: 'dona' },
];

interface ApiResponse {
  _id: string;
  [key: string]: any;
}

async function apiCall(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }
  
  return response.json();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('🚀 SUPPLIER INVOICES TEST SCRIPT BOSHLANDI\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Omborlarni olish
    console.log('\n📦 1. Omborlarni tekshirish...');
    const warehouses = await apiCall('/warehouses');
    if (!warehouses || warehouses.length === 0) {
      throw new Error('Omborlar topilmadi! Avval omborlar yarating.');
    }
    const warehouse = warehouses[0];
    console.log(`✅ Ombor topildi: ${warehouse.name}`);
    
    // 2. Taminotchilarni olish
    console.log('\n🏢 2. Taminotchilarni tekshirish...');
    const partners = await apiCall('/partners?type=supplier');
    if (!partners || partners.length === 0) {
      throw new Error('Taminotchilar topilmadi! Avval taminotchilar yarating.');
    }
    console.log(`✅ ${partners.length} ta taminotchi topildi`);
    
    // 3. Yangi mahsulotlar yaratish
    console.log('\n🆕 3. 20 ta yangi mahsulot yaratilmoqda...');
    const createdProducts: ApiResponse[] = [];
    
    for (const product of NEW_PRODUCTS) {
      try {
        const created = await apiCall('/products', 'POST', {
          ...product,
          quantity: 0,
          minQuantity: 5,
          unitType: 'count',
        });
        createdProducts.push(created);
        console.log(`   ✓ ${product.name}`);
      } catch (error: any) {
        console.log(`   ⚠ ${product.name} - ${error.message}`);
      }
    }
    
    console.log(`✅ ${createdProducts.length} ta mahsulot yaratildi`);
    
    // 4. Barcha mahsulotlarni olish
    const allProducts = await apiCall('/products');
    console.log(`📊 Jami mahsulotlar: ${allProducts.length}`);
    
    // 5. 55 ta purchase order yaratish
    console.log('\n📝 4. 55 ta purchase order yaratilmoqda...');
    const orders: ApiResponse[] = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date();
    
    for (let i = 0; i < 55; i++) {
      const supplier = partners[randomInt(0, partners.length - 1)];
      const itemCount = randomInt(2, 6);
      const items = [];
      let totalAmount = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const product = allProducts[randomInt(0, allProducts.length - 1)];
        const quantity = randomInt(5, 20);
        const price = product.costPrice;
        const total = quantity * price;
        
        items.push({
          product: product._id,
          productName: product.name,
          quantity,
          price,
          total,
        });
        
        totalAmount += total;
      }
      
      const orderData = {
        supplier: supplier._id,
        supplierName: supplier.name,
        orderDate: randomDate(startDate, endDate),
        items,
        totalAmount,
        status: 'pending',
      };
      
      const order = await apiCall('/purchase-orders', 'POST', orderData);
      orders.push(order);
      
      if ((i + 1) % 10 === 0) {
        console.log(`   ✓ ${i + 1}/55 buyurtma yaratildi`);
      }
    }
    
    console.log(`✅ ${orders.length} ta purchase order yaratildi`);
    
    // 6. Barcha orderlarni qabul qilish (avtomatik invoice yaratiladi)
    console.log('\n📥 5. Buyurtmalarni qabul qilish (invoicelar yaratiladi)...');
    let invoicesCreated = 0;
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      
      try {
        // Statusni "received" ga o'zgartirish
        await apiCall(`/purchase-orders/${order._id}/status`, 'PATCH', {
          status: 'received'
        });
        
        invoicesCreated++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`   ✓ ${i + 1}/${orders.length} buyurtma qabul qilindi`);
        }
      } catch (error: any) {
        console.log(`   ⚠ Buyurtma ${order.orderNumber} qabul qilinmadi: ${error.message}`);
      }
    }
    
    console.log(`✅ ${invoicesCreated} ta invoice avtomatik yaratildi`);
    
    // 7. Invoicelarni tekshirish
    console.log('\n💰 6. Invoicelarni tekshirish...');
    const invoices = await apiCall('/supplier-invoices');
    console.log(`✅ ${invoices.length} ta supplier invoice topildi`);
    
    // 8. Invoicelarning bir qismiga to'lov qilish
    console.log('\n💳 7. Tolovlar amalga oshirilmoqda...');
    let paymentsCount = 0;
    const paymentCount = Math.min(30, invoices.length); // 30 ta invoicega to'lov
    
    for (let i = 0; i < paymentCount; i++) {
      const invoice = invoices[i];
      const paymentAmount = invoice.totalAmount * (randomInt(30, 100) / 100); // 30-100% to'lash
      
      try {
        const paymentData = {
          type: 'outgoing',
          paymentDate: randomDate(new Date(invoice.invoiceDate), endDate),
          amount: Math.round(paymentAmount),
          partner: invoice.supplier,
          partnerName: invoice.supplierName,
          account: randomInt(0, 1) === 0 ? 'cash' : 'bank',
          paymentMethod: 'bank_transfer',
          purpose: `Tolov: ${invoice.invoiceNumber}`,
          category: 'purchase',
          linkedDocument: invoice.order,
          linkedDocumentType: 'PurchaseOrder',
          linkedDocumentNumber: invoice.orderNumber,
        };
        
        await apiCall('/payments', 'POST', paymentData);
        paymentsCount++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`   ✓ ${i + 1}/${paymentCount} tolov amalga oshirildi`);
        }
      } catch (error: any) {
        console.log(`   ⚠ Tolov amalga oshmadi: ${error.message}`);
      }
    }
    
    console.log(`✅ ${paymentsCount} ta tolov amalga oshirildi`);
    
    // 9. Yakuniy statistika
    console.log('\n' + '='.repeat(60));
    console.log('📊 YAKUNIY STATISTIKA:\n');
    
    const finalInvoices = await apiCall('/supplier-invoices');
    const totalInvoiceAmount = finalInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
    const totalPaidAmount = finalInvoices.reduce((sum: number, inv: any) => sum + inv.paidAmount, 0);
    const totalRemaining = totalInvoiceAmount - totalPaidAmount;
    
    const unpaidCount = finalInvoices.filter((inv: any) => inv.status === 'unpaid').length;
    const partialCount = finalInvoices.filter((inv: any) => inv.status === 'partial').length;
    const paidCount = finalInvoices.filter((inv: any) => inv.status === 'paid').length;
    
    console.log(`📦 Mahsulotlar: ${allProducts.length} ta`);
    console.log(`📝 Purchase Orders: ${orders.length} ta`);
    console.log(`💰 Supplier Invoices: ${finalInvoices.length} ta`);
    console.log(`   - Tolanmagan: ${unpaidCount} ta`);
    console.log(`   - Qisman tolangan: ${partialCount} ta`);
    console.log(`   - Toliq tolangan: ${paidCount} ta`);
    console.log(`💳 Tolovlar: ${paymentsCount} ta`);
    console.log(`\n💵 Moliyaviy malumotlar:`);
    console.log(`   - Jami invoice summasi: ${totalInvoiceAmount.toLocaleString()} som`);
    console.log(`   - Tolangan: ${totalPaidAmount.toLocaleString()} som`);
    console.log(`   - Qoldiq (qarz): ${totalRemaining.toLocaleString()} som`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST MUVAFFAQIYATLI YAKUNLANDI!');
    console.log('\n📍 Tekshirish uchun:');
    console.log('   1. Xaridlar -> Taminotchiga tolov qilish -> Hisoblar');
    console.log('   2. Moliya -> Pul aylanmasi');
    console.log('   3. Moliya -> Ozaro hisob-kitoblar');
    
  } catch (error: any) {
    console.error('\n❌ XATOLIK:', error.message);
    console.error('\n💡 Tekshiring:');
    console.error('   1. Server ishlab turibmi? (http://localhost:8080)');
    console.error('   2. MongoDB ulanganmi?');
    console.error('   3. Omborlar va taminotchilar yaratilganmi?');
    process.exit(1);
  }
}

// Skriptni ishga tushirish
main();
