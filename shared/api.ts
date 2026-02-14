// Shared TypeScript interfaces for API communication

export interface DemoResponse {
  message: string;
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

// Existing types (keeping for compatibility)
export interface Product {
  _id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
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
  supplier: string;
  supplierName: string;
  warehouse?: string;
  warehouseName?: string;
  purchaseOrder?: string;
  orderNumber?: string;
  receiptDate: string;
  items: Array<{
    product: string;
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
  customer: string;
  customerName: string;
  organization?: string;
  warehouse?: string;
  warehouseName?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  shippedStatus: 'not_shipped' | 'partial' | 'shipped';
  items: Array<{
    product: string;
    productName: string;
    quantity: number;
    sellingPrice: number;
    costPrice: number;
    total: number;
    warehouse: string;
    warehouseName: string;
    costPricePending?: boolean;
  }>;
  totalAmount: number;
  paidAmount: number;
  shippedAmount: number;
  notes?: string;
  isMinusCorrection?: boolean;
  createdAt: string;
  updatedAt: string;
}
