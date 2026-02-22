// Shared TypeScript interfaces for API communication

export interface DemoResponse {
  message: string;
}

// Helper type for populated MongoDB references
// Fields can be either a string ID or a populated object
export interface PopulatedRef {
  _id: string;
  name: string;
  [key: string]: any;
}

// Partner types
export interface Partner {
  _id: string;
  code: string;
  name: string;
  type: 'customer' | 'supplier' | 'both' | 'worker';
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

export interface PartnerWithStats extends Partner {
  totalOrders?: number;
  totalRevenue?: number;
  totalDebt?: number;
  totalSales?: number;
  balance?: number;
}

// Pending Invoice Response
export interface PendingInvoiceResponse {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  totalAmount: number;
  pendingItemsCount: number;
  items: Array<{
    productName: string;
    quantity: number;
    costPricePending: boolean;
  }>;
}

// Corrected Invoice Response
export interface CorrectedInvoiceResponse {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  updatedAt: string;
  totalAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    costPrice: number;
    costPricePending: boolean;
  }>;
}

// Profit Report Response
export interface ProfitReportResponse {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  confirmedProfit: number;
  estimatedProfit: number;
  hasPendingCosts: boolean;
  invoices: Array<{
    invoiceNumber: string;
    customerName: string;
    invoiceDate: string;
    revenue: number;
    cost: number;
    profit: number;
    hasPendingCosts: boolean;
  }>;
}

// User Profile & Auth types
export interface UserProfile {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  role: 'admin' | 'employee';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

// Contract types
export interface Contract {
  _id: string;
  contractNumber: string;
  partner: string | PopulatedRef;
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

// Customer Order types
export type CustomerOrderStatus = 'new' | 'confirmed' | 'assembled' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

export interface CustomerOrderItem {
  product: string | PopulatedRef;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  vat: number;
  total: number;
  shipped: number;
  reserved: number;
}

export interface CustomerOrder {
  _id: string;
  orderNumber: string;
  customer?: string | PopulatedRef;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  status: CustomerOrderStatus;
  items: CustomerOrderItem[];
  totalAmount: number;
  paidAmount: number;
  shippedAmount: number;
  invoicedSum: number;
  reservedSum: number;
  vatEnabled: boolean;
  vatIncluded: boolean;
  vatSum: number;
  warehouse?: string | PopulatedRef;
  warehouseName?: string;
  reserved: boolean;
  assignedWorker?: string | PopulatedRef;
  assignedWorkerName?: string;
  salesChannel?: string;
  notes?: string;
  sent?: boolean;
  printed?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Purchase Order types
export interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplier: string | PopulatedRef;
  supplierName: string;
  orderDate: string;
  status: string;
  items: Array<{
    product?: string | PopulatedRef;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  notes?: string;
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
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  duration?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Shipment types
export interface Shipment {
  _id: string;
  shipmentNumber: string;
  customer: string | PopulatedRef;
  customerName: string;
  receiver?: string;
  organization?: string;
  order: string | PopulatedRef;
  orderNumber: string;
  invoice?: string | PopulatedRef;
  invoiceNumber?: string;
  shipmentDate: string;
  warehouse: string | PopulatedRef;
  warehouseName: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  items: Array<{
    product: string | PopulatedRef;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  deliveryAddress: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Supplier Invoice types
export interface SupplierInvoice {
  _id: string;
  invoiceNumber: string;
  supplier: string | PopulatedRef;
  supplierName: string;
  purchaseOrder?: string;
  orderNumber?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Supplier Return types
export interface SupplierReturn {
  _id: string;
  returnNumber: string;
  supplier: string | PopulatedRef;
  supplierName: string;
  warehouse?: string;
  warehouseName?: string;
  receipt?: string;
  receiptNumber?: string;
  returnDate: string;
  items: Array<{
    product: string | PopulatedRef;
    productName: string;
    quantity: number;
    costPrice: number;
    total: number;
    reason?: string;
  }>;
  totalAmount: number;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Warehouse Receipt types
export interface WarehouseReceipt {
  _id: string;
  receiptNumber: string;
  warehouse: string | PopulatedRef;
  warehouseName: string;
  organization?: string;
  receiptDate: string;
  status: 'draft' | 'confirmed';
  items: Array<{
    product: string | PopulatedRef;
    productName: string;
    quantity: number;
    costPrice: number;
    total: number;
  }>;
  totalAmount: number;
  reason: 'inventory_adjustment' | 'found_items' | 'production' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Existing types (keeping for compatibility)
export interface Product {
  _id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  brand?: string;
  unit: string;
  unitType: 'count' | 'uncount';
  weight?: number;
  weightUnit?: string;
  country?: string;
  supplier?: string;
  supplierName?: string;
  quantity: number;
  reserved: number;
  costPrice: number;
  sellingPrice: number;
  minStock?: number;
  minQuantity?: number;
  description?: string;
  image?: string;
  qrCode?: string;
  variants: Array<{
    name: string;
    sku?: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
  }>;
  stockByWarehouse: Array<{
    warehouse: string;
    warehouseName: string;
    quantity: number;
    reserved: number;
  }>;
  files: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  status: 'active' | 'inactive' | 'discontinued';
  dailyAverage?: number;
  daysRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  _id: string;
  receiptNumber: string;
  supplier: string | PopulatedRef;
  supplierName: string;
  warehouse?: string | PopulatedRef;
  warehouseName?: string;
  purchaseOrder?: string;
  orderNumber?: string;
  receiptDate: string;
  items: Array<{
    product: string | PopulatedRef;
    productName: string;
    quantity: number;
    costPrice: number;
    total: number;
  }>;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInvoice {
  _id: string;
  invoiceNumber: string;
  customer: string | PopulatedRef;
  customerName: string;
  organization?: string;
  warehouse?: string | PopulatedRef;
  warehouseName?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  shippedStatus: 'not_shipped' | 'partial' | 'shipped';
  items: Array<{
    product: string | PopulatedRef;
    productName: string;
    quantity: number;
    sellingPrice: number;
    costPrice: number;
    discount: number;
    discountAmount: number;
    total: number;
    warehouse: string | PopulatedRef;
    warehouseName: string;
    costPricePending?: boolean;
  }>;
  totalAmount: number;
  discountTotal: number;
  finalAmount: number;
  paidAmount: number;
  shippedAmount: number;
  notes?: string;
  isMinusCorrection?: boolean;
  customerOrder?: string;
  orderNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// Debt Management Types
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

export interface PaymentScheduleItem {
  date: string;
  amount: number;
  remainingAmount: number;
  supplier: string;
  invoiceNumber: string;
  status: string;
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
  status: string;
}

// Customer Return types
export interface CustomerReturn {
  _id: string;
  returnNumber: string;
  customer: string | PopulatedRef;
  customerName: string;
  organization?: string;
  warehouse?: string | PopulatedRef;
  warehouseName?: string;
  invoice: string | PopulatedRef;
  invoiceNumber: string;
  shipment?: string | PopulatedRef;
  shipmentNumber?: string;
  customerOrder?: string | PopulatedRef;
  orderNumber?: string;
  returnDate: string;
  status: 'pending' | 'accepted' | 'cancelled';
  items: Array<{
    product: string | PopulatedRef;
    productName: string;
    quantity: number;
    price: number;
    total: number;
    reason: 'defective' | 'wrong_item' | 'customer_request' | 'other';
  }>;
  totalAmount: number;
  reason: 'defective' | 'wrong_item' | 'customer_request' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
