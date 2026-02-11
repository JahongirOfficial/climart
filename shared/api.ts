/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Supplier types
export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  inn?: string;
  bankAccount?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Warehouse types
export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  address: string;
  contactPerson?: string;
  phone?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Purchase Order types
export interface PurchaseOrderItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplier: string | Supplier;
  supplierName: string;
  orderDate: string;
  status: 'pending' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Supplier Invoice types
export interface SupplierInvoiceItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface SupplierInvoice {
  _id: string;
  invoiceNumber: string;
  supplier: string | Supplier;
  supplierName: string;
  purchaseOrder?: string | PurchaseOrder;
  orderNumber?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  items: SupplierInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface ProductStock {
  warehouse: string;
  warehouseName: string;
  quantity: number;
  reserved: number;
}

// Product types
export interface Product {
  _id: string;
  name: string;
  sku?: string;
  category?: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  minQuantity?: number;
  unit?: string;
  unitType?: 'count' | 'uncount';
  weight?: number;
  weightUnit?: string;
  description?: string;
  image?: string;
  qrCode?: string;
  dailyAverage?: number;
  daysRemaining?: number;
  stockByWarehouse?: ProductStock[];
  createdAt: string;
  updatedAt: string;
}

// Service types
export interface Service {
  _id: string;
  name: string;
  code?: string;
  category?: string;
  unit: string;
  price: number;
  duration?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Receipt types
export interface ReceiptItem {
  product: string | Product;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface Receipt {
  _id: string;
  receiptNumber: string;
  supplier: string | Supplier;
  supplierName: string;
  purchaseOrder?: string | PurchaseOrder;
  orderNumber?: string;
  receiptDate: string;
  items: ReceiptItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Supplier Return types
export interface SupplierReturnItem {
  product: string | Product;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
  reason?: 'brak' | 'nuqson' | 'noto\'g\'ri_model' | 'boshqa';
}

export interface SupplierReturn {
  _id: string;
  returnNumber: string;
  supplier: string | Supplier;
  supplierName: string;
  receipt?: string | Receipt;
  receiptNumber?: string;
  returnDate: string;
  items: SupplierReturnItem[];
  totalAmount: number;
  reason: 'brak' | 'nuqson' | 'noto\'g\'ri_model' | 'boshqa';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
// Payment types
export interface Payment {
  _id: string;
  paymentNumber: string;
  supplier: string | Supplier;
  supplierName: string;
  supplierInvoice?: string | SupplierInvoice;
  invoiceNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Debt types
export interface SupplierDebt {
  supplier: {
    _id: string;
    name: string;
  };
  totalDebt: number;
  paidAmount: number;
  returnedAmount: number;
  remainingDebt: number;
  lastOperationDate: string;
  dueDate: string;
  status: 'ok' | 'due-soon' | 'overdue';
  receiptsCount: number;
  paymentsCount: number;
  returnsCount: number;
}

export interface SupplierDebtDetail {
  supplier: Supplier;
  summary: {
    totalReceipts: number;
    totalPayments: number;
    totalReturns: number;
    remainingDebt: number;
  };
  documents: {
    receipts: Receipt[];
    payments: Payment[];
    returns: SupplierReturn[];
    invoices: SupplierInvoice[];
  };
}

export interface PaymentScheduleItem {
  date: string;
  supplier: string;
  supplierId: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'unpaid' | 'partial' | 'paid';
}

// Payment types
export interface Payment {
  _id: string;
  paymentNumber: string;
  supplier: string | Supplier;
  supplierName: string;
  supplierInvoice?: string | SupplierInvoice;
  invoiceNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Debt types
export interface DebtSummary {
  id: string;
  supplier: string;
  lastOperationDate: string;
  totalDebt: number;
  paidAmount: number;
  returnedAmount: number;
  remainingDebt: number;
  dueDate?: string;
  status: 'ok' | 'due-soon' | 'overdue';
  receipts: Array<{
    receiptNumber: string;
    receiptDate: string;
    totalAmount: number;
  }>;
  payments: Array<{
    paymentNumber: string;
    paymentDate: string;
    amount: number;
  }>;
}

export interface OverduePayment {
  id: string;
  supplier: string;
  invoiceNumber: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  daysOverdue: number;
  status: 'overdue';
}

// Procurement analysis types
export interface ProcurementAnalysis {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  dailyAverageSales: number;
  lastWeekSales: number;
  supplier: string;
  costPrice: number;
  forecastDays: number;
  deficit: number;
  needToOrder: number;
  status: 'critical' | 'warning' | 'ok';
}

// Sales Module Types

// Partner types (used for customers and suppliers)
export interface Partner {
  _id: string;
  code: string;
  name: string;
  type: 'customer' | 'supplier' | 'both';
  status: 'new' | 'active' | 'vip' | 'inactive' | 'blocked';
  group?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  legalAddress?: string;
  physicalAddress?: string;
  taxId?: string;
  bankAccount?: string;
  telegramUsername?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Partner with statistics
export interface PartnerWithStats extends Partner {
  balance: number;
  totalSales: number;
  totalPurchases: number;
  lastPurchaseDate?: string;
  averageCheck: number;
  debtorStatus: 'ok' | 'debtor' | 'creditor';
}

// Customer Invoice types
export interface CustomerInvoiceItem {
  product: string | Product;
  productName: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  total: number;
  warehouse?: string | Warehouse;
  warehouseName?: string;
  costPricePending?: boolean;
}

export interface CustomerInvoice {
  _id: string;
  invoiceNumber: string;
  customer: string | Partner;
  customerName: string;
  organization?: string;
  warehouse?: string | Warehouse;
  warehouseName?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  shippedStatus: 'not_shipped' | 'partial' | 'shipped';
  items: CustomerInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  shippedAmount: number;
  notes?: string;
  isMinusCorrection?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer Order types
export interface CustomerOrderItem {
  product: string | Product;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CustomerOrder {
  _id: string;
  orderNumber: string;
  customer: string | Partner;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'fulfilled' | 'cancelled';
  items: CustomerOrderItem[];
  totalAmount: number;
  paidAmount: number;
  shippedAmount: number;
  reserved: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Customer Return types
export interface CustomerReturnItem {
  product: string | Product;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  reason: 'defective' | 'wrong_item' | 'customer_request' | 'other';
}

export interface CustomerReturn {
  _id: string;
  returnNumber: string;
  customer: string | Partner;
  customerName: string;
  organization?: string;
  warehouse?: string;
  warehouseName?: string;
  invoice: string | CustomerInvoice;
  invoiceNumber: string;
  returnDate: string;
  status: 'pending' | 'accepted' | 'cancelled';
  items: CustomerReturnItem[];
  totalAmount: number;
  reason: 'defective' | 'wrong_item' | 'customer_request' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Shipment types
export interface ShipmentItem {
  product: string | Product;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Shipment {
  _id: string;
  shipmentNumber: string;
  customer: string | Partner;
  customerName: string;
  receiver?: string;
  organization?: string;
  order: string | CustomerOrder;
  orderNumber: string;
  shipmentDate: string;
  warehouse: string;
  warehouseName: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  items: ShipmentItem[];
  totalAmount: number;
  paidAmount: number;
  deliveryAddress: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Tax Invoice types
export interface TaxInvoiceItem {
  product: string | Product;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface TaxInvoice {
  _id: string;
  invoiceNumber: string;
  customer: string | Partner;
  customerName: string;
  shipment: string | Shipment;
  shipmentNumber: string;
  invoiceDate: string;
  status: 'not_sent' | 'sent';
  items: TaxInvoiceItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Contract types
export interface Contract {
  _id: string;
  contractNumber: string;
  partner: string | Partner;
  partnerName: string;
  organization?: string;
  contractDate: string;
  startDate: string;
  endDate: string;
  currency: 'UZS' | 'USD' | 'EUR' | 'RUB';
  totalAmount?: number;
  creditLimit?: number;
  paymentTerms?: string;
  status: 'active' | 'expired' | 'cancelled';
  isDefault: boolean;
  priceList?: string;
  fileUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Warehouse Receipt types
export interface WarehouseReceiptItem {
  product: string | Product;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface WarehouseReceipt {
  _id: string;
  receiptNumber: string;
  warehouse: string;
  warehouseName: string;
  organization?: string;
  receiptDate: string;
  status: 'draft' | 'confirmed';
  items: WarehouseReceiptItem[];
  totalAmount: number;
  reason: 'inventory_adjustment' | 'found_items' | 'production' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Writeoff types
export interface WriteoffItem {
  product: string | Product;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface Writeoff {
  _id: string;
  writeoffNumber: string;
  warehouse: string;
  warehouseName: string;
  organization?: string;
  writeoffDate: string;
  status: 'draft' | 'confirmed';
  items: WriteoffItem[];
  totalAmount: number;
  reason: 'damaged' | 'expired' | 'lost' | 'personal_use' | 'inventory_shortage' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory types
export interface InventoryItem {
  product: string | Product;
  productName: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  costPrice: number;
  differenceAmount: number;
}

export interface Inventory {
  _id: string;
  inventoryNumber: string;
  warehouse: string;
  warehouseName: string;
  organization?: string;
  inventoryDate: string;
  status: 'draft' | 'confirmed';
  category?: string;
  items: InventoryItem[];
  totalShortage: number;
  totalSurplus: number;
  shortageAmount: number;
  surplusAmount: number;
  writeoffCreated: boolean;
  receiptCreated: boolean;
  writeoffId?: string;
  receiptId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication and User Management types
export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'admin' | 'employee';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'admin' | 'employee';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  identifier: string; // username or phone
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  permissions: string[];
}

export interface CreateEmployeeResponse {
  employee: User;
  credentials: {
    username: string;
    password: string;
  };
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  permissions?: string[];
  isActive?: boolean;
}

// Permission constants
export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  PRODUCTS: 'products',
  PURCHASES: 'purchases',
  SALES: 'sales',
  WAREHOUSE: 'warehouse',
  FINANCE: 'finance',
  CONTACTS: 'contacts',
  PRODUCTION: 'production',
  ECOMMERCE: 'ecommerce',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
