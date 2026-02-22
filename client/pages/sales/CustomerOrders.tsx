import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Edit, Trash2, Loader2, Truck, Lock, Unlock,
  ChevronDown, MoreHorizontal, Filter, Search, Columns3,
  RefreshCw, FileText, Printer, Copy, CreditCard
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { useCustomerOrders, CustomerOrderFilters } from "@/hooks/useCustomerOrders";
import { CustomerOrderModal } from "@/components/CustomerOrderModal";
import { ShipmentModal } from "@/components/ShipmentModal";
import { useShipments } from "@/hooks/useShipments";
import { usePartners } from "@/hooks/usePartners";
import { useWarehouses } from "@/hooks/useWarehouses";
import { CustomerOrder, CustomerOrderStatus } from "@shared/api";
import { ExportButton } from "@/components/ExportButton";
import { formatCurrency, formatDate, getOrderStatusLabel } from "@/lib/format";
import { api } from '@/lib/api';
import { AdvancedFilter, FilterField } from "@/components/shared/AdvancedFilter";
import { DataPagination } from "@/components/shared/DataPagination";
import { StatusBadge, ORDER_STATUS_CONFIG } from "@/components/shared/StatusBadge";

const STATUS_OPTIONS = [
  { value: 'new', label: 'Yangi' },
  { value: 'confirmed', label: 'Tasdiqlangan' },
  { value: 'assembled', label: "Yig'ilgan" },
  { value: 'shipped', label: 'Yuborilgan' },
  { value: 'delivered', label: 'Yetkazilgan' },
  { value: 'returned', label: 'Qaytarilgan' },
  { value: 'cancelled', label: 'Bekor qilingan' },
];

const PAYMENT_OPTIONS = [
  { value: 'paid', label: "To'langan" },
  { value: 'partlyPaid', label: "Qisman to'langan" },
  { value: 'unpaid', label: "To'lanmagan" },
];

const SHIPMENT_OPTIONS = [
  { value: 'shipped', label: "Jo'natilgan" },
  { value: 'partiallyShipped', label: "Qisman jo'natilgan" },
  { value: 'unshipped', label: "Jo'natilmagan" },
];

// Status o'tish qoidalari
const STATUS_TRANSITIONS: Record<string, CustomerOrderStatus[]> = {
  'new': ['confirmed', 'cancelled'],
  'confirmed': ['assembled', 'shipped', 'cancelled'],
  'assembled': ['shipped', 'cancelled'],
  'shipped': ['delivered', 'returned'],
  'delivered': ['returned'],
  'returned': [],
  'cancelled': ['new'],
  'pending': ['confirmed', 'cancelled'],
  'fulfilled': [],
};

// Ustun ta'riflari (spec 4.1)
type ColumnKey = 'orderNumber' | 'orderDate' | 'customerName' | 'assignedWorkerName' | 'warehouseName' | 'totalAmount' | 'invoicedSum' | 'paidAmount' | 'shippedAmount' | 'reservedSum' | 'status' | 'deliveryDate' | 'notes';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
  align?: 'left' | 'right' | 'center';
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'orderNumber', label: '№', defaultVisible: true, align: 'left' },
  { key: 'orderDate', label: 'Vaqt', defaultVisible: true, align: 'left' },
  { key: 'customerName', label: 'Kontragent', defaultVisible: true, align: 'left' },
  { key: 'assignedWorkerName', label: 'Usta', defaultVisible: true, align: 'left' },
  { key: 'warehouseName', label: 'Ombor', defaultVisible: false, align: 'left' },
  { key: 'totalAmount', label: 'Summa', defaultVisible: true, align: 'right' },
  { key: 'invoicedSum', label: 'Hisob-faktura', defaultVisible: false, align: 'right' },
  { key: 'paidAmount', label: "To'langan", defaultVisible: true, align: 'right' },
  { key: 'shippedAmount', label: "Jo'natilgan", defaultVisible: true, align: 'right' },
  { key: 'reservedSum', label: 'Zahiralangan', defaultVisible: false, align: 'right' },
  { key: 'status', label: 'Holat', defaultVisible: true, align: 'left' },
  { key: 'deliveryDate', label: 'Yetkazish sanasi', defaultVisible: false, align: 'left' },
  { key: 'notes', label: 'Izoh', defaultVisible: false, align: 'left' },
];

const CustomerOrders = () => {
  const [filters, setFilters] = useState<CustomerOrderFilters>({
    page: 1,
    pageSize: 25,
  });
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    search: '',
    status: '',
    customerId: '',
    warehouseId: '',
    startDate: '',
    endDate: '',
    paymentStatus: '',
    shipmentStatus: '',
  });

  const { orders, total, page, pageSize, loading, refetch, createOrder, updateOrder, updateStatus, deleteOrder } = useCustomerOrders(filters);
  const { createShipment } = useShipments();
  const { partners } = usePartners('customer');
  const { warehouses } = useWarehouses();
  const { showError } = useModal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<string | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showUnreserveDialog, setShowUnreserveDialog] = useState(false);
  const [orderToUnreserve, setOrderToUnreserve] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => {
    const defaults = new Set<ColumnKey>();
    ALL_COLUMNS.forEach(c => { if (c.defaultVisible) defaults.add(c.key); });
    return defaults;
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [showSummary, setShowSummary] = useState(true);

  // Debounce search - 0.5s kutib avtomatik qidiradi
  useEffect(() => {
    setFilterValues(prev => ({ ...prev, search: debouncedSearch }));
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  // Filtr maydonlari (spec 3.1 - Climart uchun moslashtirilgan)
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Qidirish', type: 'text', placeholder: 'Raqam yoki izoh...' },
    { key: 'startDate', label: 'Davr dan', type: 'date' },
    { key: 'endDate', label: 'Davr gacha', type: 'date' },
    { key: 'status', label: 'Holat', type: 'select', options: STATUS_OPTIONS },
    { key: 'paymentStatus', label: "To'lov", type: 'select', options: PAYMENT_OPTIONS },
    { key: 'shipmentStatus', label: "Jo'natilgan", type: 'select', options: SHIPMENT_OPTIONS },
    { key: 'customerId', label: 'Kontragent', type: 'select', options: partners.map(p => ({ value: p._id, label: p.name })) },
    { key: 'warehouseId', label: 'Ombor', type: 'select', options: warehouses.map(w => ({ value: w._id, label: w.name })) },
  ];

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSearch = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      ...filterValues,
      page: 1,
    }));
  }, [filterValues]);

  const handleClearFilters = useCallback(() => {
    const empty: Record<string, string> = {};
    filterFields.forEach(f => { empty[f.key] = ''; });
    setFilterValues(empty);
    setSearchInput('');
    setFilters({ page: 1, pageSize: filters.pageSize });
  }, [filters.pageSize]);

  // Jami hisoblash (spec 4.3)
  const summaryTotals = useMemo(() => ({
    totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    invoicedSum: orders.reduce((sum, o) => sum + (o.invoicedSum || 0), 0),
    paidAmount: orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0),
    shippedAmount: orders.reduce((sum, o) => sum + (o.shippedAmount || 0), 0),
    reservedSum: orders.reduce((sum, o) => sum + (o.reservedSum || 0), 0),
  }), [orders]);

  // Qator tanlash
  const selectedCount = selectedRows.size;
  const allSelected = orders.length > 0 && orders.every(o => selectedRows.has(o._id));
  const someSelected = orders.some(o => selectedRows.has(o._id)) && !allSelected;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(orders.map(o => o._id)));
    }
  }, [orders, allSelected]);

  const toggleSelectRow = useCallback((id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Ustun sozlash
  const toggleColumn = useCallback((key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const activeColumns = useMemo(() => ALL_COLUMNS.filter(c => visibleColumns.has(c.key)), [visibleColumns]);

  // Ommaviy holat o'zgartirish (spec 2.2)
  const handleBatchStatusChange = useCallback(async (newStatus: string) => {
    const selected = orders.filter(o => selectedRows.has(o._id));
    for (const order of selected) {
      const available = STATUS_TRANSITIONS[order.status] || [];
      if (available.includes(newStatus as CustomerOrderStatus)) {
        try { await updateStatus(order._id, newStatus); } catch { /* o'tkazish */ }
      }
    }
    setSelectedRows(new Set());
    refetch();
  }, [orders, selectedRows, updateStatus, refetch]);

  // Ommaviy o'chirish
  const handleBatchDelete = useCallback(async () => {
    for (const id of selectedRows) {
      try { await deleteOrder(id); } catch { /* o'tkazish */ }
    }
    setSelectedRows(new Set());
    refetch();
  }, [selectedRows, deleteOrder, refetch]);

  const handleCreate = () => {
    setSelectedOrder(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (isEditMode && selectedOrder) {
        await updateOrder(selectedOrder._id, data);
      } else {
        await createOrder(data);
      }
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    setOrderToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
      try {
        await deleteOrder(orderToDelete);
        setShowDeleteDialog(false);
        setOrderToDelete(null);
        refetch();
      } catch {
        showError('Xatolik yuz berdi');
      }
    }
  };

  const handleStatusChange = async (order: CustomerOrder, newStatus: string) => {
    try {
      await updateStatus(order._id, newStatus);
      refetch();
    } catch {
      showError('Xatolik yuz berdi');
    }
  };

  const handleReserve = async (orderId: string) => {
    try {
      const result = await api.patch<{ warnings?: string[] }>(`/api/customer-orders/${orderId}/reserve`);
      if (result.warnings && result.warnings.length > 0) {
        const warningMessage = "Ogohlantirish: Ba'zi mahsulotlar yetarli emas:\n\n" +
          result.warnings.map((w: string) => `- ${w}`).join('\n') +
          "\n\nBuyurtma rezerv qilindi, lekin inventar minusga tushdi.";
        setTimeout(() => alert(warningMessage), 100);
      }
      refetch();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleUnreserve = async (orderId: string) => {
    setOrderToUnreserve(orderId);
    setShowUnreserveDialog(true);
  };

  const confirmUnreserve = async () => {
    if (orderToUnreserve) {
      try {
        await api.patch(`/api/customer-orders/${orderToUnreserve}/unreserve`);
        setShowUnreserveDialog(false);
        setOrderToUnreserve(null);
        refetch();
      } catch (error: any) {
        showError(error.message);
      }
    }
  };

  const handleCreateShipment = (orderId: string) => {
    setSelectedOrderForShipment(orderId);
    setIsShipmentModalOpen(true);
  };

  const handleSaveShipment = async (data: any) => {
    try {
      await createShipment(data);
      setIsShipmentModalOpen(false);
      setSelectedOrderForShipment(undefined);
      refetch();
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  // Yacheyka chiqarish (spec 4.1 ga mos)
  const renderCell = (order: CustomerOrder, col: ColumnDef) => {
    const paidPercent = order.totalAmount > 0 ? (order.paidAmount / order.totalAmount) * 100 : 0;
    const shippedPercent = order.totalAmount > 0 ? (order.shippedAmount / order.totalAmount) * 100 : 0;

    switch (col.key) {
      case 'orderNumber':
        return (
          <button
            onClick={() => handleEdit(order)}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {order.orderNumber}
          </button>
        );
      case 'orderDate':
        return <span className="text-gray-600">{formatDate(order.orderDate)}</span>;
      case 'customerName':
        return <span className="font-medium">{order.customerName}</span>;
      case 'assignedWorkerName':
        return <span className="text-gray-600">{order.assignedWorkerName || '-'}</span>;
      case 'warehouseName':
        return <span className="text-gray-600">{order.warehouseName || '-'}</span>;
      case 'totalAmount':
        return <span className="font-medium">{formatCurrency(order.totalAmount)}</span>;
      case 'invoicedSum':
        return <span className="text-gray-600">{formatCurrency(order.invoicedSum || 0)}</span>;
      case 'paidAmount':
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <span className={`text-xs ${paidPercent >= 100 ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
              {formatCurrency(order.paidAmount || 0)}
            </span>
            <div className="w-12 bg-gray-200 rounded-full h-1.5 shrink-0">
              <div
                className={`h-1.5 rounded-full ${paidPercent >= 100 ? 'bg-green-500' : paidPercent > 0 ? 'bg-yellow-500' : 'bg-gray-200'}`}
                style={{ width: `${Math.min(paidPercent, 100)}%` }}
              />
            </div>
          </div>
        );
      case 'shippedAmount':
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <span className={`text-xs ${shippedPercent >= 100 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
              {formatCurrency(order.shippedAmount || 0)}
            </span>
            <div className="w-12 bg-gray-200 rounded-full h-1.5 shrink-0">
              <div
                className={`h-1.5 rounded-full ${shippedPercent >= 100 ? 'bg-blue-500' : shippedPercent > 0 ? 'bg-blue-300' : 'bg-gray-200'}`}
                style={{ width: `${Math.min(shippedPercent, 100)}%` }}
              />
            </div>
          </div>
        );
      case 'reservedSum':
        return order.reserved ? (
          <span className="text-orange-600 text-xs font-medium">
            <Lock className="h-3 w-3 inline mr-0.5" />
            {formatCurrency(order.reservedSum || order.totalAmount)}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        );
      case 'status':
        return <StatusBadge status={order.status} config={ORDER_STATUS_CONFIG} />;
      case 'deliveryDate':
        return <span className="text-gray-600">{order.deliveryDate ? formatDate(order.deliveryDate) : '-'}</span>;
      case 'notes':
        return <span className="text-gray-500 text-xs truncate max-w-[200px] block">{order.notes || '-'}</span>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-0">
        {/* ===== TOOLBAR (spec 2.1) ===== */}
        <div className="bg-white border rounded-t-lg px-3 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sarlavha */}
            <h1 className="text-sm font-semibold text-gray-700 hidden lg:block">Mijoz buyurtmalari</h1>

            {/* Yangilash */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => refetch()}
              title="Yangilash"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            {/* + Buyurtma (spec #4) */}
            <Button size="sm" onClick={handleCreate} className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Buyurtma
            </Button>

            <div className="h-6 w-px bg-gray-200" />

            {/* Filtr toggle (spec #5) */}
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtr
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {/* Tezkor qidiruv (spec #6) */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Raqam yoki izoh"
                className="h-8 w-52 pl-7 text-sm"
              />
            </div>

            {/* Tanlangan soni (spec #7) */}
            <span className="text-xs text-gray-400 min-w-[16px] text-center font-medium bg-gray-100 rounded px-1.5 py-0.5">
              {selectedCount}
            </span>

            {/* O'zgartirish dropdown (spec #8 — ommaviy amallar) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={selectedCount === 0}>
                  O'zgartirish
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handleBatchDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  O'chirish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Holat dropdown (spec #9) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={selectedCount === 0}>
                  Holat
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {STATUS_OPTIONS.map(s => (
                  <DropdownMenuItem key={s.value} onClick={() => handleBatchStatusChange(s.value)}>
                    <StatusBadge status={s.value} config={ORDER_STATUS_CONFIG} className="mr-2" />
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Yaratish dropdown (spec #10) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={selectedCount === 0}>
                  Yaratish
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    const first = orders.find(o => selectedRows.has(o._id));
                    if (first) handleCreateShipment(first._id);
                  }}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Jo'natish (Otgruzka)
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Hisob-faktura
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Kirim to'lov
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Chop etish dropdown (spec #11) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={selectedCount === 0}>
                  <Printer className="h-3.5 w-3.5" />
                  Chop etish
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem disabled>
                  <Printer className="h-4 w-4 mr-2" />
                  Buyurtma
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            {/* Eksport */}
            <ExportButton
              data={orders}
              filename="buyurtmalar"
              fieldsToInclude={["orderNumber", "customerName", "orderDate", "deliveryDate", "totalAmount", "status"]}
            />

            {/* Ustunlar (spec #12) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                  <Columns3 className="h-3.5 w-3.5" />
                  Ustunlar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {ALL_COLUMNS.map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleColumns.has(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ===== FILTR PANELI (spec 3) ===== */}
        {showFilters && (
          <div className="bg-white border-x border-b px-3 py-3">
            <AdvancedFilter
              fields={filterFields}
              values={filterValues}
              onChange={handleFilterChange}
              onSearch={handleSearch}
              onClear={handleClearFilters}
              defaultExpanded
            />
          </div>
        )}

        {/* ===== JADVAL (spec 4) ===== */}
        <Card className={`rounded-none ${showFilters ? '' : 'border-t-0'} rounded-b-lg`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {activeColumns.map(col => (
                    <th
                      key={col.key}
                      className={`px-3 py-2 text-xs font-medium text-gray-500 uppercase whitespace-nowrap ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="w-12 px-3 py-2"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length + 2} className="px-4 py-12 text-center text-gray-500">
                      Buyurtmalar topilmadi
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const availableTransitions = STATUS_TRANSITIONS[order.status] || [];
                    const isSelected = selectedRows.has(order._id);

                    return (
                      <tr
                        key={order._id}
                        className={`hover:bg-[#f0f7ff] transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                      >
                        <td className="w-10 px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(order._id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        {activeColumns.map(col => (
                          <td
                            key={col.key}
                            className={`px-3 py-2 whitespace-nowrap ${
                              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                          >
                            {renderCell(order, col)}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(order)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Tahrirlash
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <Copy className="h-4 w-4 mr-2" />
                                Nusxa ko'chirish
                              </DropdownMenuItem>

                              {availableTransitions.length > 0 && (
                                <>
                                  <DropdownMenuSeparator />
                                  {availableTransitions.map(s => (
                                    <DropdownMenuItem key={s} onClick={() => handleStatusChange(order, s)}>
                                      <StatusBadge status={s} config={ORDER_STATUS_CONFIG} className="mr-2" />
                                      {getOrderStatusLabel(s)}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}

                              <DropdownMenuSeparator />

                              {!order.reserved && (order.status === 'new' || (order.status as string) === 'pending') && (
                                <DropdownMenuItem onClick={() => handleReserve(order._id)}>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Rezerv qilish
                                </DropdownMenuItem>
                              )}
                              {order.reserved && order.status !== 'delivered' && (order.status as string) !== 'fulfilled' && (
                                <DropdownMenuItem onClick={() => handleUnreserve(order._id)}>
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Rezervni bekor qilish
                                </DropdownMenuItem>
                              )}

                              {(order.status === 'confirmed' || order.status === 'assembled') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleCreateShipment(order._id)}>
                                    <Truck className="h-4 w-4 mr-2" />
                                    Jo'natish yaratish
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDelete(order._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                O'chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Jami qatori (spec 4.3) */}
              {orders.length > 0 && showSummary && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr className="font-medium text-sm">
                    <td className="px-3 py-2"></td>
                    {activeColumns.map(col => (
                      <td
                        key={col.key}
                        className={`px-3 py-2 whitespace-nowrap ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {col.key === 'orderNumber' && <span className="text-gray-700">Σ Jami</span>}
                        {col.key === 'totalAmount' && <span className="font-bold">{formatCurrency(summaryTotals.totalAmount)}</span>}
                        {col.key === 'invoicedSum' && <span className="text-gray-600">{formatCurrency(summaryTotals.invoicedSum)}</span>}
                        {col.key === 'paidAmount' && <span className="text-green-600 font-medium">{formatCurrency(summaryTotals.paidAmount)}</span>}
                        {col.key === 'shippedAmount' && <span className="text-blue-600 font-medium">{formatCurrency(summaryTotals.shippedAmount)}</span>}
                        {col.key === 'reservedSum' && <span className="text-orange-600">{formatCurrency(summaryTotals.reservedSum)}</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Jami ko'rsatish toggle + Pagination (spec 4.3 + 4.4) */}
          <div className="flex items-center justify-between border-t px-3 py-1">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {showSummary ? 'Jamini yashirish' : 'Σ Jamini ko\'rsatish'}
            </button>
            <DataPagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
              onPageSizeChange={(ps) => setFilters(prev => ({ ...prev, pageSize: ps, page: 1 }))}
            />
          </div>
        </Card>
      </div>

      <CustomerOrderModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        order={isEditMode ? selectedOrder : null}
      />

      <ShipmentModal
        open={isShipmentModalOpen}
        onClose={() => {
          setIsShipmentModalOpen(false);
          setSelectedOrderForShipment(undefined);
        }}
        onSave={handleSaveShipment}
        orderId={selectedOrderForShipment}
      />

      {/* O'chirish tasdiqlash dialogi */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buyurtmani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Buyurtmani o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setOrderToDelete(null);
            }}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rezervni bekor qilish dialogi */}
      <AlertDialog open={showUnreserveDialog} onOpenChange={setShowUnreserveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rezervni bekor qilish</AlertDialogTitle>
            <AlertDialogDescription>
              Rezervni bekor qilishni xohlaysizmi? Mahsulotlar omborda bo'shashadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnreserveDialog(false);
              setOrderToUnreserve(null);
            }}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmUnreserve();
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Rezervni bekor qilish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default CustomerOrders;
