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
  Plus, Trash2, Loader2, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal,
  Filter, Search, Columns3, RefreshCw, Printer, Edit, DollarSign, Eye, Truck
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/contexts/ModalContext";
import { useCustomerInvoices, CustomerInvoiceFilters } from "@/hooks/useCustomerInvoices";
import { CustomerInvoiceModal } from "@/components/CustomerInvoiceModal";
import { ViewInvoiceModal } from "@/components/ViewInvoiceModal";
import { CustomerPaymentModal } from "@/components/CustomerPaymentModal";
import { CustomerInvoice } from "@shared/api";
import { ExportButton } from "@/components/ExportButton";
import { formatAmount } from "@/lib/format";
import { AdvancedFilter, FilterField } from "@/components/shared/AdvancedFilter";
import { StatusBadge, INVOICE_STATUS_CONFIG } from "@/components/shared/StatusBadge";
import { usePartners } from "@/hooks/usePartners";
import { useWarehouses } from "@/hooks/useWarehouses";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: 'unpaid', label: "To'lanmagan" },
  { value: 'partial', label: "Qisman to'langan" },
  { value: 'paid', label: "To'langan" },
  { value: 'cancelled', label: "Bekor qilingan" },
  { value: 'overdue', label: "Muddati o'tgan" },
];

const SHIPPED_STATUS_OPTIONS = [
  { value: 'not_shipped', label: "Jo'natilmagan" },
  { value: 'partial', label: "Qisman jo'natilgan" },
  { value: 'shipped', label: "Jo'natilgan" },
];

// Ustun ta'riflari — MoySklad uslubida
type ColumnKey = 'invoiceNumber' | 'invoiceDate' | 'customerName' | 'organization' | 'warehouseName' | 'totalAmount' | 'dueDate' | 'paidAmount' | 'shippedAmount' | 'sent' | 'printed' | 'status' | 'notes';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
  align?: 'left' | 'right' | 'center';
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'invoiceNumber', label: '№', defaultVisible: true, align: 'left' },
  { key: 'invoiceDate', label: 'Vaqt', defaultVisible: true, align: 'left' },
  { key: 'customerName', label: 'Kontragent', defaultVisible: true, align: 'left' },
  { key: 'organization', label: 'Tashkilot', defaultVisible: true, align: 'left' },
  { key: 'warehouseName', label: 'Ombordan', defaultVisible: true, align: 'left' },
  { key: 'totalAmount', label: 'Summa', defaultVisible: true, align: 'right' },
  { key: 'dueDate', label: "Reja to'lov sanasi", defaultVisible: true, align: 'left' },
  { key: 'paidAmount', label: "To'langan", defaultVisible: true, align: 'right' },
  { key: 'shippedAmount', label: "Jo'natilgan", defaultVisible: true, align: 'right' },
  { key: 'sent', label: 'Yuborilgan', defaultVisible: true, align: 'center' },
  { key: 'printed', label: 'Chop etilgan', defaultVisible: true, align: 'center' },
  { key: 'status', label: 'Holat', defaultVisible: false, align: 'left' },
  { key: 'notes', label: 'Izoh', defaultVisible: true, align: 'left' },
];

const CustomerInvoices = () => {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();

  const defaultStartDate = urlParams.get('from') || format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  const defaultEndDate = urlParams.get('to') || format(new Date(), 'yyyy-MM-dd');
  const initialSearch = urlParams.get('q') || '';

  const [filters, setFilters] = useState<CustomerInvoiceFilters>({
    page: 1,
    pageSize: 25,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    search: initialSearch || undefined,
  });

  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    search: initialSearch,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    status: '',
    customerId: '',
    warehouseId: '',
    shippedStatus: '',
  });

  const { invoices, total, page, pageSize, loading, error, refetch, createInvoice, updateInvoice, deleteInvoice, recordPayment } = useCustomerInvoices(filters);
  const { partners } = usePartners('customer');
  const { warehouses } = useWarehouses();
  const { showError } = useModal();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => {
    const defaults = new Set<ColumnKey>();
    ALL_COLUMNS.forEach(c => { if (c.defaultVisible) defaults.add(c.key); });
    return defaults;
  });
  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 500);
  const [showSummary, setShowSummary] = useState(true);

  // Debounce search
  useEffect(() => {
    setFilterValues(prev => ({ ...prev, search: debouncedSearch }));
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  // Navigation filtri sinxronlash
  useEffect(() => {
    const q = urlParams.get('q') || '';
    const from = urlParams.get('from') || '';
    const to = urlParams.get('to') || '';
    setSearchInput(q);
    setFilterValues(prev => ({
      ...prev,
      search: q,
      ...(from && { startDate: from }),
      ...(to && { endDate: to }),
    }));
    setFilters(prev => ({
      ...prev,
      search: q || undefined,
      ...(from && { startDate: from }),
      ...(to && { endDate: to }),
      page: 1,
    }));
  }, [urlParams]);

  // Filtr maydonlari
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Qidirish', type: 'text', placeholder: 'Raqam yoki izoh...' },
    { key: 'startDate', label: 'Davr dan', type: 'date' },
    { key: 'endDate', label: 'Davr gacha', type: 'date' },
    { key: 'status', label: 'Holat', type: 'select', options: STATUS_OPTIONS, primary: true },
    { key: 'customerId', label: 'Kontragent', type: 'select', options: partners.map(p => ({ value: p._id, label: p.name })), primary: true },
    { key: 'warehouseId', label: 'Ombor', type: 'select', options: warehouses.map(w => ({ value: w._id, label: w.name })), primary: true },
    { key: 'shippedStatus', label: "Jo'natish holati", type: 'select', options: SHIPPED_STATUS_OPTIONS, primary: true },
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
    totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    paidAmount: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    shippedAmount: invoices.reduce((sum, inv) => sum + (inv.shippedAmount || 0), 0),
  }), [invoices]);

  // Qator tanlash
  const selectedCount = selectedRows.size;
  const allSelected = invoices.length > 0 && invoices.every(inv => selectedRows.has(inv._id));
  const someSelected = invoices.some(inv => selectedRows.has(inv._id)) && !allSelected;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) setSelectedRows(new Set());
    else setSelectedRows(new Set(invoices.map(inv => inv._id)));
  }, [invoices, allSelected]);

  const toggleSelectRow = useCallback((id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Ustun sozlash
  const toggleColumn = useCallback((key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const activeColumns = useMemo(() => ALL_COLUMNS.filter(c => visibleColumns.has(c.key)), [visibleColumns]);

  // Ommaviy o'chirish
  const handleBatchDelete = useCallback(async () => {
    for (const id of selectedRows) {
      try { await deleteInvoice(id); } catch { /* skip */ }
    }
    setSelectedRows(new Set());
    refetch();
  }, [selectedRows, deleteInvoice, refetch]);

  const handleCreate = () => {
    navigate('/sales/customer-invoices/new');
  };

  const handleEdit = (invoice: CustomerInvoice) => {
    storeDocumentIds('customer-invoices', invoices.map(i => i._id));
    navigate(`/sales/customer-invoices/${invoice._id}`);
  };

  const handleView = (invoice: CustomerInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (isEditMode && selectedInvoice) {
        await updateInvoice(selectedInvoice._id, data);
      } else {
        const result = await createInvoice(data);
        if (result.warnings && result.warnings.length > 0) {
          const warningMessage = "Ogohlantirish: Ba'zi mahsulotlar yetarli emas:\n\n" +
            result.warnings.map((w: string) => `- ${w}`).join('\n') +
            "\n\nHisob-faktura yaratildi, lekin inventar minusga tushdi.";
          setTimeout(() => alert(warningMessage), 100);
        }
      }
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving invoice:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    setInvoiceToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        await deleteInvoice(invoiceToDelete);
        setShowDeleteDialog(false);
        setInvoiceToDelete(null);
        refetch();
      } catch {
        showError('Xatolik yuz berdi');
      }
    }
  };

  const handlePayment = (invoice: CustomerInvoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (amount: number, paymentMethod: string, notes: string) => {
    if (!selectedInvoice) return;
    try {
      const newPaidAmount = selectedInvoice.paidAmount + amount;
      await recordPayment(selectedInvoice._id, newPaidAmount, paymentMethod, notes);
      refetch();
    } catch (error) {
      throw error;
    }
  };

  // Print customer receipt
  const handlePrintCustomer = useCallback((invoice: CustomerInvoice) => {
    const itemsRows = invoice.items.map((item, i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.productName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${new Intl.NumberFormat('uz-UZ').format(item.sellingPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${new Intl.NumberFormat('uz-UZ').format(item.total)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mijoz cheki - ${invoice.invoiceNumber}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}table{width:100%;border-collapse:collapse;margin:15px 0}
    .header{text-align:center;border-bottom:2px solid #333;padding-bottom:15px;margin-bottom:20px}
    .footer{margin-top:20px;border-top:1px dashed #ccc;padding-top:15px;text-align:center;font-size:12px}
    @media print{.no-print{display:none}}</style></head><body>
    <div class="header">
      <h2 style="margin:0">SOTUV CHEKI</h2>
      <p style="margin:5px 0;color:#666">Mijoz nusxasi</p>
      <p style="margin:5px 0"><strong>${invoice.invoiceNumber}</strong></p>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:15px">
      <div><strong>Mijoz:</strong> ${invoice.customerName}</div>
      <div><strong>Sana:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('uz-UZ')}</div>
    </div>
    <table><thead><tr style="background:#f5f5f5">
      <th style="padding:8px;text-align:left">#</th>
      <th style="padding:8px;text-align:left">Mahsulot</th>
      <th style="padding:8px;text-align:center">Miqdor</th>
      <th style="padding:8px;text-align:right">Narx</th>
      <th style="padding:8px;text-align:right">Jami</th>
    </tr></thead><tbody>${itemsRows}</tbody>
    <tfoot><tr style="font-weight:bold;font-size:16px">
      <td colspan="4" style="padding:10px;text-align:right">JAMI:</td>
      <td style="padding:10px;text-align:right">${new Intl.NumberFormat('uz-UZ').format(invoice.totalAmount)} so'm</td>
    </tr></tfoot></table>
    <div style="margin-top:10px"><strong>To'langan:</strong> ${new Intl.NumberFormat('uz-UZ').format(invoice.paidAmount)} so'm</div>
    <div><strong>Qoldiq:</strong> ${new Intl.NumberFormat('uz-UZ').format(invoice.totalAmount - invoice.paidAmount)} so'm</div>
    <div class="footer">Xaridingiz uchun rahmat!</div>
    </body></html>`;

    printViaIframe(html);
  }, []);

  // Print warehouse receipt
  const handlePrintWarehouse = useCallback((invoice: CustomerInvoice) => {
    const itemsRows = invoice.items.map((item, i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.productName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.warehouseName || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${new Intl.NumberFormat('uz-UZ').format(item.costPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${new Intl.NumberFormat('uz-UZ').format(item.quantity * item.costPrice)}</td>
      </tr>
    `).join('');

    const totalCost = invoice.items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ombor cheki - ${invoice.invoiceNumber}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}table{width:100%;border-collapse:collapse;margin:15px 0}
    .header{text-align:center;border-bottom:2px solid #d97706;padding-bottom:15px;margin-bottom:20px}
    @media print{.no-print{display:none}}</style></head><body>
    <div class="header">
      <h2 style="margin:0;color:#d97706">OMBOR CHEKI</h2>
      <p style="margin:5px 0;color:#666">Ombor nusxasi (ichki foydalanish uchun)</p>
      <p style="margin:5px 0"><strong>${invoice.invoiceNumber}</strong></p>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:15px">
      <div><strong>Mijoz:</strong> ${invoice.customerName}</div>
      <div><strong>Sana:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('uz-UZ')}</div>
    </div>
    <div style="margin-bottom:10px"><strong>Ombor:</strong> ${invoice.warehouseName || '-'}</div>
    <table><thead><tr style="background:#fef3c7">
      <th style="padding:8px;text-align:left">#</th>
      <th style="padding:8px;text-align:left">Mahsulot</th>
      <th style="padding:8px;text-align:center">Miqdor</th>
      <th style="padding:8px;text-align:left">Ombor</th>
      <th style="padding:8px;text-align:right">Tan narx</th>
      <th style="padding:8px;text-align:right">Jami tan narx</th>
    </tr></thead><tbody>${itemsRows}</tbody>
    <tfoot><tr style="font-weight:bold;font-size:16px">
      <td colspan="5" style="padding:10px;text-align:right">JAMI TAN NARX:</td>
      <td style="padding:10px;text-align:right">${new Intl.NumberFormat('uz-UZ').format(totalCost)} so'm</td>
    </tr><tr style="font-weight:bold;color:#16a34a">
      <td colspan="5" style="padding:10px;text-align:right">SOTUV NARXI:</td>
      <td style="padding:10px;text-align:right">${new Intl.NumberFormat('uz-UZ').format(invoice.totalAmount)} so'm</td>
    </tr><tr style="font-weight:bold;color:#2563eb">
      <td colspan="5" style="padding:10px;text-align:right">FOYDA:</td>
      <td style="padding:10px;text-align:right">${new Intl.NumberFormat('uz-UZ').format(invoice.totalAmount - totalCost)} so'm</td>
    </tr></tfoot></table>
    <div style="margin-top:20px;border-top:1px dashed #ccc;padding-top:15px;display:flex;justify-content:space-between">
      <div>Topshirdi: _______________</div>
      <div>Qabul qildi: _______________</div>
    </div>
    </body></html>`;

    printViaIframe(html);
  }, []);

  const handlePrintBoth = useCallback((invoice: CustomerInvoice) => {
    handlePrintCustomer(invoice);
    setTimeout(() => handlePrintWarehouse(invoice), 1500);
  }, [handlePrintCustomer, handlePrintWarehouse]);

  // Pagination
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  if (loading && invoices.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Yacheyka renderi — MoySklad uslubida
  const renderCell = (invoice: CustomerInvoice, col: ColumnDef) => {
    switch (col.key) {
      case 'invoiceNumber':
        return (
          <button
            onClick={() => handleEdit(invoice)}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {invoice.invoiceNumber}
          </button>
        );
      case 'invoiceDate': {
        const d = new Date(invoice.invoiceDate);
        return (
          <span className="text-gray-600">
            {d.toLocaleDateString('ru-RU')} {d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      }
      case 'customerName':
        return <span className="font-medium">{invoice.customerName}</span>;
      case 'organization':
        return <span className="text-gray-600">{invoice.organization || 'Climart'}</span>;
      case 'warehouseName':
        return <span className="text-gray-600">{invoice.warehouseName || '-'}</span>;
      case 'totalAmount':
        return <span className="font-medium">{formatAmount(invoice.totalAmount)}</span>;
      case 'dueDate':
        return <span className="text-gray-600">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ru-RU') : ''}</span>;
      case 'paidAmount': {
        const val = invoice.paidAmount || 0;
        return (
          <span className={val > 0 ? 'bg-[#fff3cd] px-1.5 py-0.5 rounded' : ''}>
            {formatAmount(val)}
          </span>
        );
      }
      case 'shippedAmount': {
        const val = invoice.shippedAmount || 0;
        return (
          <span className={val > 0 ? 'bg-[#fff3cd] px-1.5 py-0.5 rounded' : ''}>
            {formatAmount(val)}
          </span>
        );
      }
      case 'sent':
        return <span className="text-gray-300">—</span>;
      case 'printed':
        return <span className="text-gray-300">—</span>;
      case 'status':
        return <StatusBadge status={invoice.status} config={INVOICE_STATUS_CONFIG} />;
      case 'notes':
        return <span className="text-gray-500 text-xs truncate max-w-[200px] block">{invoice.notes || ''}</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-0">
        {/* ===== TOOLBAR — MoySklad uslubida ===== */}
        <div className="bg-white border rounded-t-lg px-3 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sarlavha */}
            <h1 className="text-sm font-semibold text-gray-700 hidden lg:block">Hisob-fakturalar</h1>

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

            {/* + Hisob-faktura */}
            <Button size="sm" onClick={handleCreate} className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Hisob-faktura
            </Button>

            <div className="h-6 w-px bg-gray-200" />

            {/* Filtr toggle */}
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

            {/* Tezkor qidiruv */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Raqam yoki izoh"
                className="h-8 w-52 pl-7 text-sm"
              />
            </div>

            {/* Tanlangan soni */}
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
                  <DropdownMenuItem key={s.value}>
                    <StatusBadge status={s.value} config={INVOICE_STATUS_CONFIG} className="mr-2" />
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Yaratish dropdown — yashil */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700 text-white" disabled={selectedCount === 0}>
                  Yaratish
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem disabled>
                  <Truck className="h-4 w-4 mr-2" />
                  Jo'natish (Otgruzka)
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Kirim to'lov
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
                    const first = invoices.find(inv => selectedRows.has(inv._id));
                    if (first) handlePrintBoth(first);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Chek (Mijoz + Ombor)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const first = invoices.find(inv => selectedRows.has(inv._id));
                    if (first) handlePrintCustomer(first);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Faqat mijoz cheki
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            {/* Eksport */}
            <ExportButton
              data={invoices}
              filename="hisob-fakturalar"
              fieldsToInclude={["invoiceNumber", "customerName", "invoiceDate", "totalAmount", "paidAmount", "status"]}
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
            <table className="w-full text-xs">
              <thead className="bg-[#e8edf5] border-b border-[#ccd5e0]">
                <tr>
                  <th className="w-8 px-1.5 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 h-3.5 w-3.5"
                    />
                  </th>
                  {activeColumns.map(col => (
                    <th
                      key={col.key}
                      className={`px-2 py-1.5 text-[11px] font-semibold text-[#555] uppercase whitespace-nowrap ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="w-8 px-1 py-1"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length + 2} className="px-4 py-8 text-center text-gray-500 text-sm">
                      Hisob-fakturalar topilmadi
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => {
                    const isSelected = selectedRows.has(invoice._id);
                    return (
                      <tr
                        key={invoice._id}
                        className={`hover:bg-[#f0f7ff] transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                      >
                        <td className="w-8 px-1.5 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(invoice._id)}
                            className="rounded border-gray-300 h-3.5 w-3.5"
                          />
                        </td>
                        {activeColumns.map(col => (
                          <td
                            key={col.key}
                            className={`px-2 py-1 whitespace-nowrap ${
                              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                          >
                            {renderCell(invoice, col)}
                          </td>
                        ))}
                        <td className="px-1 py-1 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(invoice)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ko'rish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Tahrirlash
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {invoice.status !== 'paid' && (
                                <DropdownMenuItem onClick={() => handlePayment(invoice)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  To'lov qabul qilish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handlePrintBoth(invoice)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Chop etish
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(invoice._id)} className="text-red-600">
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
              {invoices.length > 0 && showSummary && (
                <tfoot className="bg-[#f5f7fa] border-t border-[#ccd5e0]">
                  <tr className="font-bold text-xs">
                    <td className="px-1.5 py-1"></td>
                    {activeColumns.map(col => (
                      <td
                        key={col.key}
                        className={`px-2 py-1 whitespace-nowrap ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {col.key === 'totalAmount' && formatAmount(summaryTotals.totalAmount)}
                        {col.key === 'paidAmount' && formatAmount(summaryTotals.paidAmount)}
                        {col.key === 'shippedAmount' && formatAmount(summaryTotals.shippedAmount)}
                      </td>
                    ))}
                    <td className="px-1 py-1"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ===== PAGINATION — MoySklad uslubida ===== */}
          <div className="flex items-center justify-between px-2 py-1 border-t text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page <= 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page >= totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-xs ml-1">
                {total > 0 ? `${startItem}-${endItem} dan ${total}` : '0'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <CustomerInvoiceModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSave}
        invoice={isEditMode ? selectedInvoice : null}
      />

      <ViewInvoiceModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        invoice={selectedInvoice}
      />

      <CustomerPaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSavePayment}
        invoice={selectedInvoice}
      />

      {/* O'chirish dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hisob-fakturani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Hisob-fakturani o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CustomerInvoices;
