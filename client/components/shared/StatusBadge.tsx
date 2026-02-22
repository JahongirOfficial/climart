import { cn } from "@/lib/utils";

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

// MoySklad-style 7 ta buyurtma statuslari
export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  new:        { label: "Yangi",        color: "text-white", bg: "bg-[#4CAF50]" },
  confirmed:  { label: "Tasdiqlangan", color: "text-white", bg: "bg-[#2196F3]" },
  assembled:  { label: "Yig'ilgan",    color: "text-white", bg: "bg-[#FF9800]" },
  shipped:    { label: "Yuborilgan",   color: "text-white", bg: "bg-[#9C27B0]" },
  delivered:  { label: "Yetkazilgan",  color: "text-white", bg: "bg-[#00BCD4]" },
  returned:   { label: "Qaytarilgan",  color: "text-white", bg: "bg-[#F44336]" },
  cancelled:  { label: "Bekor",        color: "text-white", bg: "bg-[#9E9E9E]" },
  // Legacy status mapping
  pending:    { label: "Yangi",        color: "text-white", bg: "bg-[#4CAF50]" },
  fulfilled:  { label: "Yetkazilgan",  color: "text-white", bg: "bg-[#00BCD4]" },
};

export const INVOICE_STATUS_CONFIG: Record<string, StatusConfig> = {
  unpaid:    { label: "To'lanmagan",       color: "text-red-800",    bg: "bg-red-100" },
  partial:   { label: "Qisman to'langan",  color: "text-yellow-800", bg: "bg-yellow-100" },
  paid:      { label: "To'langan",         color: "text-green-800",  bg: "bg-green-100" },
  overdue:   { label: "Muddati o'tgan",    color: "text-red-800",    bg: "bg-red-100" },
  cancelled: { label: "Bekor qilingan",    color: "text-gray-800",   bg: "bg-gray-100" },
};

export const SHIPMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending:    { label: "Kutilmoqda",   color: "text-yellow-800", bg: "bg-yellow-100" },
  in_transit: { label: "Yo'lda",       color: "text-blue-800",   bg: "bg-blue-100" },
  delivered:  { label: "Yetkazildi",   color: "text-green-800",  bg: "bg-green-100" },
  cancelled:  { label: "Bekor",        color: "text-gray-800",   bg: "bg-gray-100" },
};

export const RETURN_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending:   { label: "Kutilmoqda", color: "text-yellow-800", bg: "bg-yellow-100" },
  accepted:  { label: "Qabul qilindi", color: "text-green-800", bg: "bg-green-100" },
  cancelled: { label: "Bekor qilingan", color: "text-gray-800", bg: "bg-gray-100" },
};

export const PAYMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  paid:       { label: "To'langan",         color: "text-white", bg: "bg-green-500" },
  partlyPaid: { label: "Qisman to'langan",  color: "text-white", bg: "bg-orange-500" },
  unpaid:     { label: "To'lanmagan",       color: "text-white", bg: "bg-red-500" },
};

interface StatusBadgeProps {
  status: string;
  config: Record<string, StatusConfig>;
  className?: string;
}

export const StatusBadge = ({ status, config, className }: StatusBadgeProps) => {
  const statusConfig = config[status] || { label: status, color: "text-gray-800", bg: "bg-gray-100" };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium whitespace-nowrap",
        statusConfig.bg,
        statusConfig.color,
        className
      )}
    >
      {statusConfig.label}
    </span>
  );
};
