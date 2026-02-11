import mongoose from 'mongoose';
import Supplier from '../models/Supplier';
import Product from '../models/Product';
import PurchaseOrder from '../models/PurchaseOrder';
import Receipt from '../models/Receipt';
import SupplierInvoice from '../models/SupplierInvoice';
import SupplierReturn from '../models/SupplierReturn';
import Warehouse from '../models/Warehouse';
import QRCode from 'qrcode';

export const createSampleData = async (force: boolean = false) => {
  try {
    // Check if data already exists
    const existingSuppliers = await Supplier.countDocuments();
    if (existingSuppliers > 0 && !force) {
      console.log('Sample data already exists, skipping...');
      return;
    }

    if (force) {
      console.log('Clearing existing data...');
      await Promise.all([
        Supplier.deleteMany({}),
        Product.deleteMany({}),
        PurchaseOrder.deleteMany({}),
        Receipt.deleteMany({}),
        SupplierInvoice.deleteMany({}),
        SupplierReturn.deleteMany({}),
        Warehouse.deleteMany({})
      ]);
    }

    console.log('Creating sample data...');

    // Create Suppliers
    const suppliers = await Supplier.create([
      {
        name: 'Grohe Zavod',
        contactPerson: 'Hans Mueller',
        phone: '+49-211-9130-3000',
        email: 'info@grohe.de',
        address: 'Feldmühleplatz 15, 40545 Düsseldorf, Germany',
        inn: 'DE123456789',
        bankAccount: 'DE89370400440532013000',
        notes: 'Premium santexnika yetkazib beruvchisi'
      },
      {
        name: 'PPR Quvur Zavod',
        contactPerson: 'Ahmet Yılmaz',
        phone: '+90-212-555-0123',
        email: 'sales@pprpipe.com.tr',
        address: 'İstanbul Sanayi Sitesi, Türkiye',
        inn: 'TR987654321',
        bankAccount: 'TR330006100519786457841326',
        notes: 'PPR quvur va fitinglar'
      },
      {
        name: 'Roca Distribyutor',
        contactPerson: 'Carlos Rodriguez',
        phone: '+34-93-366-1200',
        email: 'info@roca.com',
        address: 'Av. Diagonal 513, Barcelona, Spain',
        inn: 'ES456789123',
        bankAccount: 'ES9121000418450200051332',
        notes: 'Vannalar va dush kabinalari'
      },
      {
        name: 'Vitra Turkiya',
        contactPerson: 'Mehmet Özkan',
        phone: '+90-224-294-1000',
        email: 'export@vitra.com.tr',
        address: 'Bozüyük, Bilecik, Türkiye',
        inn: 'TR147258369',
        bankAccount: 'TR640001009999999999999999',
        notes: 'Unitaz va lavabolar'
      },
      {
        name: 'Hansgrohe Official',
        contactPerson: 'Klaus Weber',
        phone: '+49-7723-140',
        email: 'info@hansgrohe.com',
        address: 'Auestraße 9, 77761 Schiltach, Germany',
        inn: 'DE369258147',
        bankAccount: 'DE12500105170648489890',
        notes: 'Premium smesitellar'
      }
    ]);

    // Create Products
    const productList = [
      {
        name: 'Kran Grohe Eurosmart',
        sku: 'GRH-001',
        category: 'Kranlar',
        quantity: 25,
        costPrice: 450000,
        sellingPrice: 650000,
        minQuantity: 15,
        unit: 'dona',
        description: 'Premium kran Grohe Eurosmart seriyasi'
      },
      {
        name: 'PPR Quvur 20mm',
        sku: 'PPR-020',
        category: 'Quvurlar',
        quantity: 150,
        costPrice: 15000,
        sellingPrice: 22000,
        minQuantity: 100,
        unit: 'metr',
        description: 'PPR quvur 20mm diametr'
      },
      {
        name: 'Dush kabina Roca',
        sku: 'ROC-DSH-01',
        category: 'Dush kabinalari',
        quantity: 8,
        costPrice: 1200000,
        sellingPrice: 1800000,
        minQuantity: 10,
        unit: 'dona',
        description: 'Roca dush kabina 90x90cm'
      },
      {
        name: 'Unitaz Vitra',
        sku: 'VTR-UNT-05',
        category: 'Unitazlar',
        quantity: 12,
        costPrice: 850000,
        sellingPrice: 1200000,
        minQuantity: 15,
        unit: 'dona',
        description: 'Vitra unitaz oq rang'
      },
      {
        name: 'Smesitel Hansgrohe',
        sku: 'HGR-SMS-12',
        category: 'Smesitellar',
        quantity: 18,
        costPrice: 680000,
        sellingPrice: 950000,
        minQuantity: 20,
        unit: 'dona',
        description: 'Hansgrohe vannaga smesitel'
      },
      {
        name: 'PPR Quvur 25mm',
        sku: 'PPR-025',
        category: 'Quvurlar',
        quantity: 80,
        costPrice: 18000,
        sellingPrice: 26000,
        minQuantity: 60,
        unit: 'metr',
        description: 'PPR quvur 25mm diametr'
      },
      {
        name: 'Lavabo Vitra',
        sku: 'VTR-LAV-03',
        category: 'Lavabolar',
        quantity: 15,
        costPrice: 320000,
        sellingPrice: 480000,
        minQuantity: 10,
        unit: 'dona',
        description: 'Vitra lavabo 60cm'
      }
    ];

    const products = await Promise.all(productList.map(async (p) => {
      const qrCode = await QRCode.toDataURL(p.sku);
      return await Product.create({ ...p, qrCode });
    }));

    // Create Purchase Orders
    const purchaseOrders = await PurchaseOrder.create([
      {
        orderNumber: 'ZP-2024-001',
        supplier: suppliers[0]._id,
        supplierName: suppliers[0].name,
        orderDate: new Date('2024-12-20'),
        status: 'received',
        items: [
          {
            productName: 'Kran Grohe Eurosmart',
            quantity: 20,
            price: 450000,
            total: 9000000
          },
          {
            productName: 'Smesitel Hansgrohe',
            quantity: 15,
            price: 680000,
            total: 10200000
          }
        ],
        totalAmount: 19200000,
        notes: 'Yangi model kranlar'
      },
      {
        orderNumber: 'ZP-2024-002',
        supplier: suppliers[1]._id,
        supplierName: suppliers[1].name,
        orderDate: new Date('2024-12-18'),
        status: 'received',
        items: [
          {
            productName: 'PPR Quvur 20mm',
            quantity: 200,
            price: 15000,
            total: 3000000
          },
          {
            productName: 'PPR Quvur 25mm',
            quantity: 100,
            price: 18000,
            total: 1800000
          }
        ],
        totalAmount: 4800000,
        notes: 'Quvurlar zaxirasi'
      },
      {
        orderNumber: 'ZP-2024-003',
        supplier: suppliers[2]._id,
        supplierName: suppliers[2].name,
        orderDate: new Date('2024-12-15'),
        status: 'pending',
        items: [
          {
            productName: 'Dush kabina Roca',
            quantity: 10,
            price: 1200000,
            total: 12000000
          }
        ],
        totalAmount: 12000000,
        notes: 'Dush kabinalari buyurtmasi'
      }
    ]);

    // Create Receipts
    const receipts = await Receipt.create([
      {
        receiptNumber: 'QQ-2024-001',
        supplier: suppliers[0]._id,
        supplierName: suppliers[0].name,
        purchaseOrder: purchaseOrders[0]._id,
        orderNumber: purchaseOrders[0].orderNumber,
        receiptDate: new Date('2024-12-21'),
        items: [
          {
            product: products[0]._id,
            productName: 'Kran Grohe Eurosmart',
            quantity: 20,
            costPrice: 450000,
            total: 9000000
          },
          {
            product: products[4]._id,
            productName: 'Smesitel Hansgrohe',
            quantity: 15,
            costPrice: 680000,
            total: 10200000
          }
        ],
        totalAmount: 19200000,
        notes: 'Grohe mahsulotlari qabul qilindi'
      },
      {
        receiptNumber: 'QQ-2024-002',
        supplier: suppliers[1]._id,
        supplierName: suppliers[1].name,
        purchaseOrder: purchaseOrders[1]._id,
        orderNumber: purchaseOrders[1].orderNumber,
        receiptDate: new Date('2024-12-19'),
        items: [
          {
            product: products[1]._id,
            productName: 'PPR Quvur 20mm',
            quantity: 200,
            price: 15000,
            total: 3000000
          },
          {
            product: products[5]._id,
            productName: 'PPR Quvur 25mm',
            quantity: 100,
            price: 18000,
            total: 1800000
          }
        ],
        totalAmount: 4800000,
        notes: 'PPR quvurlar qabul qilindi'
      }
    ]);

    // Create Supplier Invoices
    const supplierInvoices = await SupplierInvoice.create([
      {
        invoiceNumber: 'SF-2024-001',
        supplier: suppliers[0]._id,
        supplierName: suppliers[0].name,
        purchaseOrder: purchaseOrders[0]._id,
        orderNumber: purchaseOrders[0].orderNumber,
        invoiceDate: new Date('2024-12-21'),
        dueDate: new Date('2024-12-28'),
        status: 'partial',
        items: [
          {
            productName: 'Kran Grohe Eurosmart',
            quantity: 20,
            price: 450000,
            total: 9000000
          },
          {
            productName: 'Smesitel Hansgrohe',
            quantity: 15,
            price: 680000,
            total: 10200000
          }
        ],
        totalAmount: 19200000,
        paidAmount: 10000000,
        notes: 'Qisman to\'langan'
      },
      {
        invoiceNumber: 'SF-2024-002',
        supplier: suppliers[1]._id,
        supplierName: suppliers[1].name,
        purchaseOrder: purchaseOrders[1]._id,
        orderNumber: purchaseOrders[1].orderNumber,
        invoiceDate: new Date('2024-12-19'),
        dueDate: new Date('2024-12-26'),
        status: 'unpaid',
        items: [
          {
            productName: 'PPR Quvur 20mm',
            quantity: 200,
            price: 15000,
            total: 3000000
          },
          {
            productName: 'PPR Quvur 25mm',
            quantity: 100,
            price: 18000,
            total: 1800000
          }
        ],
        totalAmount: 4800000,
        paidAmount: 0,
        notes: 'To\'lanmagan'
      },
      {
        invoiceNumber: 'SF-2024-003',
        supplier: suppliers[2]._id,
        supplierName: suppliers[2].name,
        invoiceDate: new Date('2024-12-22'),
        dueDate: new Date('2024-12-25'),
        status: 'overdue',
        items: [
          {
            productName: 'Dush kabina Roca',
            quantity: 5,
            price: 1200000,
            total: 6000000
          }
        ],
        totalAmount: 6000000,
        paidAmount: 0,
        notes: 'Muddati o\'tib ketgan'
      }
    ]);

    // Create some returns
    console.log('Creating supplier returns...');
    const supplierReturns = await SupplierReturn.create([
      {
        returnNumber: 'VQ-2024-001',
        supplier: suppliers[0]._id,
        supplierName: suppliers[0].name,
        receipt: receipts[0]._id,
        receiptNumber: receipts[0].receiptNumber,
        returnDate: new Date('2024-12-22'),
        items: [
          {
            product: products[0]._id,
            productName: 'Kran Grohe Eurosmart',
            quantity: 2,
            costPrice: 450000,
            total: 900000,
            reason: 'brak'
          }
        ],
        totalAmount: 900000,
        reason: 'brak',
        notes: 'Kranlar ishlamayapti'
      }
    ]);

    // Create Warehouses
    const warehouses = await Warehouse.create([
      {
        name: 'Asosiy ombor',
        code: 'WH-001',
        address: 'Toshkent sh., Chilonzor tumani, Bunyodkor ko\'chasi 1',
        contactPerson: 'Alisher Karimov',
        phone: '+998-90-123-4567',
        capacity: 10000,
        isActive: true,
        notes: 'Asosiy mahsulotlar ombori'
      },
      {
        name: 'Qo\'shimcha ombor',
        code: 'WH-002',
        address: 'Toshkent sh., Sergeli tumani, Yangi Sergeli ko\'chasi 15',
        contactPerson: 'Bobur Rahimov',
        phone: '+998-90-234-5678',
        capacity: 5000,
        isActive: true,
        notes: 'Qo\'shimcha mahsulotlar ombori'
      }
    ]);

    console.log('Sample data created successfully!');
    console.log(`Created ${suppliers.length} suppliers`);
    console.log(`Created ${products.length} products`);
    console.log(`Created ${purchaseOrders.length} purchase orders`);
    console.log(`Created ${receipts.length} receipts`);
    console.log(`Created ${supplierInvoices.length} supplier invoices`);
    console.log(`Created ${supplierReturns.length} supplier returns`);
    console.log(`Created ${warehouses.length} warehouses`);

  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};