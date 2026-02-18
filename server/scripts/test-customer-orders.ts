const API_BASE_URL = process.env.API_URL || 'https://climart.biznesjon.uz';

async function createProducts() {
  console.log('\n📦 Creating 30 products...');
  
  const categories = ['Elektronika', 'Kiyim', 'Oziq-ovqat', 'Mebel', 'Kitoblar'];
  const products = [];

  for (let i = 1; i <= 30; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const costPrice = Math.floor(Math.random() * 90000) + 10000;
    const sellingPrice = costPrice + Math.floor(costPrice * (0.2 + Math.random() * 0.3));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Mahsulot ${i}`,
          sku: `PRD-${String(i).padStart(4, '0')}`,
          barcode: `890${String(i).padStart(10, '0')}`,
          category,
          unit: 'dona',
          unitType: 'count',
          quantity: Math.floor(Math.random() * 100) + 50,
          costPrice,
          sellingPrice,
          minStock: 10,
          description: `Test mahsulot ${i} - ${category}`,
          status: 'active'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ Product ${i} failed:`, error.message);
        continue;
      }
      
      const product = await response.json();
      products.push(product);
      console.log(`✅ Product ${i}: ${product.name} - ${product.sku}`);
    } catch (error: any) {
      console.error(`❌ Product ${i} failed:`, error.message);
    }
  }
  
  console.log(`\n✅ Created ${products.length} products`);
  return products;
}

async function createCustomers() {
  console.log('\n👥 Creating 5 customers...');
  
  const customers = [];
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Mijoz ${i}`,
          type: 'customer',
          phone: `+998 90 ${String(i).padStart(3, '0')} ${String(i * 11).padStart(2, '0')} ${String(i * 13).padStart(2, '0')}`,
          address: `Toshkent shahar, ${i}-ko'cha`,
          isActive: true
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ Customer ${i} failed:`, error.message);
        continue;
      }
      
      const customer = await response.json();
      customers.push(customer);
      console.log(`✅ Customer ${i}: ${customer.name}`);
    } catch (error: any) {
      console.error(`❌ Customer ${i} failed:`, error.message);
    }
  }
  
  console.log(`\n✅ Created ${customers.length} customers`);
  return customers;
}

async function createCustomerOrders(customers: any[], products: any[]) {
  console.log('\n🛒 Creating 10 customer orders...');
  
  const orders = [];
  
  for (let i = 0; i < 10; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const itemCount = Math.floor(Math.random() * 3) + 2;
    const items = [];
    
    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      
      items.push({
        product: product._id,
        productName: product.name,
        quantity,
        price: product.sellingPrice,
        total: quantity * product.sellingPrice
      });
    }
    
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: customer._id,
          customerName: customer.name,
          orderDate: new Date(),
          deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          items,
          totalAmount,
          status: 'pending',
          reserved: false,
          notes: `Test buyurtma ${i + 1}`
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ Order ${i + 1} failed:`, error.message);
        continue;
      }
      
      const order = await response.json();
      orders.push(order);
      console.log(`✅ Order ${i + 1}: ${order.orderNumber} - ${customer.name} - ${totalAmount.toLocaleString()} so'm`);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`❌ Order ${i + 1} failed:`, error.message);
    }
  }
  
  console.log(`\n✅ Successfully created ${orders.length} orders`);
  return orders;
}

async function displaySummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  try {
    const productsRes = await fetch(`${API_BASE_URL}/api/products`);
    const products = await productsRes.json();
    
    const partnersRes = await fetch(`${API_BASE_URL}/api/partners?type=customer`);
    const customers = await partnersRes.json();
    
    const ordersRes = await fetch(`${API_BASE_URL}/api/customer-orders`);
    const orders = await ordersRes.json();
    
    console.log(`\n📦 Products: ${products.length}`);
    console.log(`👥 Customers: ${customers.length}`);
    console.log(`🛒 Customer Orders: ${orders.length}`);
    
    const recentOrders = orders.slice(0, 5);
    
    console.log('\n📋 Last 5 Orders:');
    recentOrders.forEach((order: any) => {
      console.log(`   ${order.orderNumber} - ${order.customerName} - ${order.totalAmount.toLocaleString()} so'm`);
    });
  } catch (error: any) {
    console.error('❌ Failed to get summary:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
}

async function main() {
  try {
    console.log('🚀 Starting Customer Orders Test...\n');
    console.log(`📡 API URL: ${API_BASE_URL}\n`);
    
    const products = await createProducts();
    const customers = await createCustomers();
    
    console.log('\n⏳ Waiting for data to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await createCustomerOrders(customers, products);
    
    await displaySummary();
    
    console.log('\n✅ Test completed successfully!');
    console.log(`💡 Check ${API_BASE_URL}/sales/orders to see the orders\n`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

main();
