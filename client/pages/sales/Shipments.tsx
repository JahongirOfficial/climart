import { Layout } from "@/components/Layout";
import { printViaIframe } from "@/utils/print";
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
  Plus, Trash2, Loader2, Truck, ChevronDown, MoreHorizontal,
  Filter, Search, Columns3, RefreshCw, FileText, Printer, Edit, CheckCircle
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { useShipments, ShipmentFilters } from "@/hooks/useShipments";
import { usePartners } from "@/hooks/usePartners";
import { useWarehouses } from "@/hooks/useWarehouses";
import { TaxInvoiceModal } from "@/components/TaxInvoiceModal";
import { useTaxInvoices } from "@/hooks/useTaxInvoices";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ExportButton } from "@/components/ExportButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { AdvancedFilter, FilterField } from "@/components/shared/AdvancedFilter";
import { DataPagination } from "@/components/shared/DataPagination";
import { StatusBadge, SHIPMENT_STATUS_CONFIG } from "@/components/shared/StatusBadge";
import { Shipment } from "@shared/api";
import { ShipmentModal } from "@/components/ShipmentModal";

const STATUS_OPTIONS = [
  { value: 'pending', label: "Kutilmoqda" },
  { value: 'in_transit', label: "Yo'lda" },
  { value: 'delivered', label: "Yetkazildi" },
  { value: 'cancelled', label: "Bekor qilindi" },
];

// Holat o'tish qoidalari
const STATUS_TRANSITIONS: Record<string, string[]> = {
  'pending': ['in_transit', 'cancelled'],
  'in_transit': ['delivered', 'cancelled'],
  'delivered': [],
  'cancelled': ['pending'],
};

// Ustun ta'riflari
type ColumnKey = 'shipmentNumber' | 'shipmentDate' | 'customerName' | 'orderNumber' | 'warehouseName' | 'totalAmount' | 'paidAmount' | 'status' | 'deliveryAddress' | 'trackingNumber' | 'notes';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
  align?: 'left' | 'right' | 'center';
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'shipmentNumber', label: '№', defaultVisible: true, align: 'left' },
  { key: 'shipmentDate', label: 'Vaqt', defaultVisible: true, align: 'left' },
  { key: 'customerName', label: 'Kontragent', defaultVisible: true, align: 'left' },
  { key: 'orderNumber', label: 'Buyurtma', defaultVisible: false, align: 'left' },
  { key: 'warehouseName', label: 'Ombor', defaultVisible: false, align: 'left' },
  { key: 'totalAmount', label: 'Summa', defaultVisible: true, align: 'right' },
  { key: 'paidAmount', label: "To'langan", defaultVisible: true, align: 'right' },
  { key: 'status', label: 'Holat', defaultVisible: true, align: 'left' },
  { key: 'deliveryAddress', label: 'Manzil', defaultVisible: false, align: 'left' },
  { key: 'trackingNumber', label: 'Kuzatuv raqami', defaultVisible: false, align: 'left' },
  { key: 'notes', label: 'Izoh', defaultVisible: false, align: 'left' },
];

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    'pending': 'Kutilmoqda',
    'in_transit': "Yo'lda",
    'delivered': 'Yetkazildi',
    'cancelled': 'Bekor qilindi',
  };
  return map[status] || status;
};

const Shipments = () => {
  const [filters, setFilters] = useState<ShipmentFilters>({
    page: 1,
    pageSize: 25,
  });
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    search: '',
    startDate: '',
    endDate: '',
    status: '',
    customerId: '',
    warehouseId: '',
  });

  const { shipments, total, page, pageSize, loading, refetch, updateStatus, deleteShipment, createShipment } = useShipments(filters);
  const { partners: customers } = usePartners('customer');
  const { warehouses } = useWarehouses();
  const { createInvoice } = useTaxInvoices();
  const { toast } = useToast();
  const { showError } = useModal();
  const navigate = useNavigate();

  const [isTaxInvoiceModalOpen, setIsTaxInvoiceModalOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | undefined>();
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<string | null>(null);

  // Debounce search - 0.5s kutib avtomatik qidiradi
  useEffect(() => {
    setFilterValues(prev => ({ ...prev, search: debouncedSearch }));
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  // Filtr maydonlari
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Qidirish', type: 'text', placeholder: 'Raqam, mijoz yoki kuzatuv...' },
    { key: 'startDate', label: 'Davr dan', type: 'date' },
    { key: 'endDate', label: 'Davr gacha', type: 'date' },
    { key: 'status', label: 'Holat', type: 'select', options: STATUS_OPTIONS },
    {
      key: 'customerId', label: 'Kontragent', type: 'select',
      options: customers.map(c => ({ value: c._id, label: c.name }))
    },
    {
      key: 'warehouseId', label: 'Ombor', type: 'select',
      options: warehouses.map(w => ({ value: w._id, label: w.name }))
    },
  ];

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, ...filterValues, page: 1 }));
  }, [filterValues]);

  const handleClearFilters = useCallback(() => {
    const empty: Record<string, string> = {};
    filterFields.forEach(f => { empty[f.key] = ''; });
    setFilterValues(empty);
    setSearchInput('');
    setFilters({ page: 1, pageSize: filters.pageSize });
  }, [filters.pageSize]);

  // Jami hisoblash
  const summaryTotals = useMemo(() => ({
    totalAmount: shipments.reduce((sum, s) => sum + s.totalAmount, 0),
    paidAmount: shipments.reduce((sum, s) => sum + (s.paidAmount || 0), 0),
  }), [shipments]);

  // Qator tanlash
  const selectedCount = selectedRows.size;
  const allSelected = shipments.length > 0 && shipments.every(s => selectedRows.has(s._id));
  const someSelected = shipments.some(s => selectedRows.has(s._id)) && !allSelected;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(shipments.map(s => s._id)));
    }
  }, [shipments, allSelected]);

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

  // Ommaviy holat o'zgartirish
  const handleBatchStatusChange = useCallback(async (newStatus: string) => {
    const selected = shipments.filter(s => selectedRows.has(s._id));
    for (const shipment of selected) {
      const available = STATUS_TRANSITIONS[shipment.status] || [];
      if (available.includes(newStatus)) {
        try { await updateStatus(shipment._id, newStatus); } catch { /* skip */ }
      }
    }
    setSelectedRows(new Set());
    refetch();
  }, [shipments, selectedRows, updateStatus, refetch]);

  // Ommaviy o'chirish
  const handleBatchDelete = useCallback(async () => {
    for (const id of selectedRows) {
      try { await deleteShipment(id); } catch { /* skip */ }
    }
    setSelectedRows(new Set());
    refetch();
  }, [selectedRows, deleteShipment, refetch]);

  const handleStatusChange = async (shipmentId: string, newStatus: string) => {
    try {
      await updateStatus(shipmentId, newStatus);
      refetch();
    } catch {
      showError('Xatolik yuz berdi');
    }
  };

  const handleDelete = (id: string) => {
    setShipmentToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (shipmentToDelete) {
      try {
        await deleteShipment(shipmentToDelete);
        setShowDeleteDialog(false);
        setShipmentToDelete(null);
        refetch();
      } catch {
        showError("Yetkazib berishni o'chirishda xatolik yuz berdi");
      }
    }
  };

  const handleCreateTaxInvoice = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setIsTaxInvoiceModalOpen(true);
  };

  const handleSaveTaxInvoice = async (data: any) => {
    try {
      await createInvoice(data);
      toast({ title: "Muvaffaqiyatli", description: "Hisob-faktura yaratildi" });
      setIsTaxInvoiceModalOpen(false);
      setSelectedShipmentId(undefined);
      navigate('/sales/tax-invoices');
    } catch {
      toast({ title: "Xatolik", description: "Hisob-fakturani yaratishda xatolik yuz berdi", variant: "destructive" });
    }
  };

  const handleSaveShipment = async (data: any) => {
    try {
      await createShipment(data);
      setIsShipmentModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  };

  const handlePrint = (shipment: Shipment) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Yuk xati ${shipment.shipmentNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #333; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-item { padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .info-label { font-size: 12px; color: #666; margin-bottom: 5px; }
          .info-value { font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .summary { margin-top: 20px; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; }
          .summary-row.total { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; }
          .signature { display: flex; justify-content: space-between; margin-top: 40px; }
          .signature-box { width: 45%; }
          .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; text-align: center; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>YUK XATI</h1>
          <p>${shipment.shipmentNumber}</p>
          <p>Sana: ${formatDate(shipment.shipmentDate)}</p>
        </div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Mijoz:</div><div class="info-value">${shipment.customerName}</div></div>
          <div class="info-item"><div class="info-label">Buyurtma №:</div><div class="info-value">${shipment.orderNumber}</div></div>
          ${shipment.receiver ? `<div class="info-item"><div class="info-label">Yuk qabul qiluvchi:</div><div class="info-value">${shipment.receiver}</div></div>` : ''}
          ${shipment.organization ? `<div class="info-item"><div class="info-label">Tashkilot:</div><div class="info-value">${shipment.organization}</div></div>` : ''}
          <div class="info-item"><div class="info-label">Ombor:</div><div class="info-value">${shipment.warehouseName}</div></div>
          <div class="info-item"><div class="info-label">Yetkazib berish manzili:</div><div class="info-value">${shipment.deliveryAddress}</div></div>
          ${shipment.trackingNumber ? `<div class="info-item"><div class="info-label">Kuzatuv raqami:</div><div class="info-value">${shipment.trackingNumber}</div></div>` : ''}
        </div>
        <table>
          <thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Miqdor</th><th class="text-right">Narx</th><th class="text-right">Jami</th></tr></thead>
          <tbody>
            ${shipment.items.map((item: any, index: number) => `
              <tr><td>${index + 1}</td><td>${item.productName}</td><td class="text-right">${item.quantity}</td><td class="text-right">${formatCurrency(item.price)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <div class="summary-row total"><span>Jami summa:</span><span>${formatCurrency(shipment.totalAmount)}</span></div>
          <div class="summary-row"><span>To'langan:</span><span>${formatCurrency(shipment.paidAmount)}</span></div>
          <div class="summary-row"><span>Qoldiq:</span><span>${formatCurrency(shipment.totalAmount - shipment.paidAmount)}</span></div>
        </div>
        ${shipment.notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px;"><strong>Izoh:</strong><br>${shipment.notes}</div>` : ''}
        <div class="signature">
          <div class="signature-box"><div class="signature-line">Topshiruvchi</div></div>
          <div class="signature-box"><div class="signature-line">Qabul qiluvchi</div></div>
        </div>
        <div class="footer">
          <p style="text-align:center;color:#666;font-size:12px;">Chop etilgan: ${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ')}</p>
        </div>
      </body>
      </html>
    `;
    printViaIframe(printContent);
  };

  if (loading && shipments.length === 0) {
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

  // Yacheyka chiqarish
  const renderCell = (shipment: Shipment, col: ColumnDef) => {
    const paidPercent = shipment.totalAmount > 0 ? (shipment.paidAmount / shipment.totalAmount) * 100 : 0;

    switch (col.key) {
      case 'shipmentNumber':
        return (
          <span className="font-medium text-blue-600">
            {shipment.shipmentNumber}
          </span>
        );
      case 'shipmentDate':
        return <span className="text-gray-600">{formatDate(shipment.shipmentDate)}</span>;
      case 'customerName':
        return <span className="font-medium">{shipment.customerName}</span>;
      case 'orderNumber':
        return <span className="text-gray-600">{shipment.orderNumber}</span>;
      case 'warehouseName':
        return <span className="text-gray-600">{shipment.warehouseName || '-'}</span>;
      case 'totalAmount':
        return <span className="font-medium">{formatCurrency(shipment.totalAmount)}</span>;
      case 'paidAmount':
        return (
          <div className="flex items-center gap-1.5 justify-end">
            <span className={`text-xs ${paidPercent >= 100 ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
              {formatCurrency(shipment.paidAmount || 0)}
            </span>
            <div className="w-12 bg-gray-200 rounded-full h-1.5 shrink-0">
              <div
                className={`h-1.5 rounded-full ${paidPercent >= 100 ? 'bg-green-500' : paidPercent > 0 ? 'bg-yellow-500' : 'bg-gray-200'}`}
                style={{ width: `${Math.min(paidPercent, 100)}%` }}
              />
            </div>
          </div>
        );
      case 'status':
        return <StatusBadge status={shipment.status} config={SHIPMENT_STATUS_CONFIG} />;
      case 'deliveryAddress':
        return <span className="text-gray-500 text-xs truncate max-w-[200px] block">{shipment.deliveryAddress || '-'}</span>;
      case 'trackingNumber':
        return <span className="text-gray-600">{shipment.trackingNumber || '-'}</span>;
      case 'notes':
        return <span className="text-gray-500 text-xs truncate max-w-[200px] block">{shipment.notes || '-'}</span>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-0">
        {/* ===== TOOLBAR ===== */}
        <div className="bg-white border rounded-t-lg px-3 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-semibold text-gray-700 hidden lg:block">Yuklab yuborish</h1>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => refetch()}
              title="Yangilash"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button size="sm" onClick={() => setIsShipmentModalOpen(true)} className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Jo'natish
            </Button>

            <div className="h-6 w-px bg-gray-200" />

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

            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Raqam yoki mijoz"
                className="h-8 w-52 pl-7 text-sm"
              />
            </div>

            <span className="text-xs text-gray-400 min-w-[16px] text-center font-medium bg-gray-100 rounded px-1.5 py-0.5">
              {selectedCount}
            </span>

            {/* O'zgartirish dropdown */}
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

            {/* Holat dropdown */}
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
                    <StatusBadge status={s.value} config={SHIPMENT_STATUS_CONFIG} className="mr-2" />
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Yaratish dropdown */}
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
                    const first = shipments.find(s => selectedRows.has(s._id));
                    if (first) handleCreateTaxInvoice(first._id);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Hisob-faktura
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Chop etish dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={selectedCount === 0}>
                  <Printer className="h-3.5 w-3.5" />
                  Chop etish
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    const first = shipments.find(s => selectedRows.has(s._id));
                    if (first) handlePrint(first);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Yuk xati
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            <ExportButton
              data={shipments}
              filename="yuklash"
              fieldsToInclude={["shipmentNumber", "customerName", "shipmentDate", "trackingNumber", "totalAmount", "status"]}
            />

            {/* Ustunlar */}
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

        {/* ===== FILTR PANELI ===== */}
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

        {/* ===== JADVAL ===== */}
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
                {shipments.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length + 2} className="px-4 py-12 text-center text-gray-500">
                      Jo'natishlar topilmadi
                    </td>
                  </tr>
                ) : (
                  shipments.map((shipment) => {
                    const availableTransitions = STATUS_TRANSITIONS[shipment.status] || [];
                    const isSelected = selectedRows.has(shipment._id);

                    return (
                      <tr
                        key={shipment._id}
                        className={`hover:bg-[#f0f7ff] transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                      >
                        <td className="w-10 px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(shipment._id)}
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
                            {renderCell(shipment, col)}
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
                              <DropdownMenuItem onClick={() => handlePrint(shipment)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Yuk xati chop etish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateTaxInvoice(shipment._id)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Hisob-faktura yaratish
                              </DropdownMenuItem>

                              {availableTransitions.length > 0 && (
                                <>
                                  <DropdownMenuSeparator />
                                  {availableTransitions.map(s => (
                                    <DropdownMenuItem key={s} onClick={() => handleStatusChange(shipment._id, s)}>
                                      <StatusBadge status={s} config={SHIPMENT_STATUS_CONFIG} className="mr-2" />
                                      {getStatusLabel(s)}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDelete(shipment._id)}
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

              {/* Jami qatori */}
              {shipments.length > 0 && showSummary && (
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
                        {col.key === 'shipmentNumber' && <span className="text-gray-700">Σ Jami</span>}
                        {col.key === 'totalAmount' && <span className="font-bold">{formatCurrency(summaryTotals.totalAmount)}</span>}
                        {col.key === 'paidAmount' && <span className="text-green-600 font-medium">{formatCurrency(summaryTotals.paidAmount)}</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Jami ko'rsatish toggle + Pagination */}
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

      <ShipmentModal
        open={isShipmentModalOpen}
        onClose={() => setIsShipmentModalOpen(false)}
        onSave={handleSaveShipment}
      />

      <TaxInvoiceModal
        open={isTaxInvoiceModalOpen}
        onClose={() => {
          setIsTaxInvoiceModalOpen(false);
          setSelectedShipmentId(undefined);
        }}
        onSave={handleSaveTaxInvoice}
        shipmentId={selectedShipmentId}
      />

      {/* O'chirish tasdiqlash dialogi */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jo'natishni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Jo'natishni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setShipmentToDelete(null);
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
    </Layout>
  );
};

export default Shipments;
