// Shared formatting utilities - replaces duplicate functions across 10+ pages

const currencyFormatter = new Intl.NumberFormat('uz-UZ');

export const formatCurrency = (amount: number): string => {
  return currencyFormatter.format(amount) + " so'm";
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('uz-UZ');
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('uz-UZ');
};

// ==================== ORDER STATUS (7 statuses - MoySklad style) ====================
export const orderStatusColors: Record<string, string> = {
  'new': 'bg-[#4CAF50] text-white',
  'confirmed': 'bg-[#2196F3] text-white',
  'assembled': 'bg-[#FF9800] text-white',
  'shipped': 'bg-[#9C27B0] text-white',
  'delivered': 'bg-[#00BCD4] text-white',
  'returned': 'bg-[#F44336] text-white',
  'cancelled': 'bg-[#9E9E9E] text-white',
  // Legacy mappings
  'pending': 'bg-[#4CAF50] text-white',
  'fulfilled': 'bg-[#00BCD4] text-white',
};

export const orderStatusLabels: Record<string, string> = {
  'new': "Yangi",
  'confirmed': "Tasdiqlangan",
  'assembled': "Yig'ilgan",
  'shipped': "Yuborilgan",
  'delivered': "Yetkazilgan",
  'returned': "Qaytarilgan",
  'cancelled': "Bekor qilingan",
  // Legacy mappings
  'pending': "Yangi",
  'fulfilled': "Yetkazilgan",
};

export const getOrderStatusColor = (status: string) => orderStatusColors[status] || orderStatusColors['new'];
export const getOrderStatusLabel = (status: string) => orderStatusLabels[status] || status;

// ==================== INVOICE STATUS ====================
export const invoiceStatusColors: Record<string, string> = {
  'unpaid': 'bg-red-100 text-red-800',
  'partial': 'bg-yellow-100 text-yellow-800',
  'paid': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
};

export const invoiceStatusLabels: Record<string, string> = {
  'unpaid': "To'lanmagan",
  'partial': "Qisman to'langan",
  'paid': "To'langan",
  'cancelled': "Bekor qilingan",
};

export const getInvoiceStatusColor = (status: string) => invoiceStatusColors[status] || invoiceStatusColors['unpaid'];
export const getInvoiceStatusLabel = (status: string) => invoiceStatusLabels[status] || status;

// ==================== SHIPPED STATUS ====================
export const shippedStatusColors: Record<string, string> = {
  'not_shipped': 'bg-gray-100 text-gray-800',
  'partial': 'bg-blue-100 text-blue-800',
  'shipped': 'bg-green-100 text-green-800',
};

export const shippedStatusLabels: Record<string, string> = {
  'not_shipped': "Jo'natilmagan",
  'partial': "Qisman jo'natilgan",
  'shipped': "Jo'natilgan",
};

export const getShippedStatusColor = (status: string) => shippedStatusColors[status] || shippedStatusColors['not_shipped'];
export const getShippedStatusLabel = (status: string) => shippedStatusLabels[status] || status;

// ==================== PAYMENT STATUS ====================
export const paymentStatusColors: Record<string, string> = {
  'draft': 'bg-gray-100 text-gray-800',
  'confirmed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
};

export const paymentStatusLabels: Record<string, string> = {
  'draft': "Qoralama",
  'confirmed': "Tasdiqlangan",
  'cancelled': "Bekor qilingan",
};

export const getPaymentStatusColor = (status: string) => paymentStatusColors[status] || paymentStatusColors['draft'];
export const getPaymentStatusLabel = (status: string) => paymentStatusLabels[status] || status;

// ==================== GENERAL STATUS (Dashboard) ====================
export const getGeneralStatusColor = (status: string) => {
  switch (status) {
    case "Bajarildi": return "bg-green-50 text-green-700 border border-green-200";
    case "Kutilmoqda": return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    case "Bekor qilindi": return "bg-red-50 text-red-700 border border-red-200";
    default: return "bg-gray-50 text-gray-700 border border-gray-200";
  }
};

// ==================== STOCK STATUS ====================
export const getStockStatus = (quantity: number, minQuantity: number = 0) => {
  if (quantity === 0) {
    return { label: "Tugagan", className: "bg-red-50 text-red-700 border-red-200" };
  } else if (quantity <= minQuantity) {
    return { label: "Kam qolgan", className: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  }
  return { label: "Yetarli", className: "bg-green-50 text-green-700 border-green-200" };
};

// ==================== QUERY PARAMS BUILDER ====================
export const buildQueryString = (params: Record<string, string | number | boolean | undefined | null>): string => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};
