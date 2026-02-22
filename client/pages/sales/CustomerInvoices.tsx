import { Layout } from "@/components/Layout";
import { printViaIframe } from "@/utils/print";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Printer
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomerInvoices, CustomerInvoiceFilters } from "@/hooks/useCustomerInvoices";
import { CustomerInvoiceModal } from "@/components/CustomerInvoiceModal";
import { ViewInvoiceModal } from "@/components/ViewInvoiceModal";
import { CustomerPaymentModal } from "@/components/CustomerPaymentModal";
import { CustomerInvoice } from "@shared/api";
import { useModal } from "@/contexts/ModalContext";
import { format } from "date-fns";
import { ExportButton } from "@/components/ExportButton";
import { formatCurrency, formatDate, getInvoiceStatusColor, getInvoiceStatusLabel, getShippedStatusColor, getShippedStatusLabel } from "@/lib/format";
import { AdvancedFilter, FilterField } from "@/components/shared/AdvancedFilter";
import { DataPagination } from "@/components/shared/DataPagination";
import { usePartners } from "@/hooks/usePartners";
import { useWarehouses } from "@/hooks/useWarehouses";

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

const CustomerInvoices = () => {
  // Default date range: current month start to today
  const defaultStartDate = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  const defaultEndDate = format(new Date(), 'yyyy-MM-dd');

  // Server-side filter state (sent to API)
  const [filters, setFilters] = useState<CustomerInvoiceFilters>({
    page: 1,
    pageSize: 25,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });

  // Local filter form values (for AdvancedFilter inputs)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    search: '',
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    status: '',
    customerId: '',
    warehouseId: '',
    shippedStatus: '',
  });

  // Debounce search input for server-side filtering
  const debouncedSearch = useDebounce(filterValues.search, 500);

  // Auto-apply debounced search to server filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const { invoices, total, page, pageSize, loading, error, refetch, createInvoice, updateInvoice, deleteInvoice, recordPayment } = useCustomerInvoices(filters);
  const { partners } = usePartners('customer');
  const { warehouses } = useWarehouses();
  const { showError } = useModal();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filter fields definition for AdvancedFilter component
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Qidirish', type: 'text', placeholder: 'Invoys № yoki mijoz...' },
    { key: 'startDate', label: 'Sana dan', type: 'date' },
    { key: 'endDate', label: 'Sana gacha', type: 'date' },
    { key: 'status', label: 'Holat', type: 'select', options: STATUS_OPTIONS },
    { key: 'customerId', label: 'Mijoz', type: 'select', options: partners.map(p => ({ value: p._id, label: p.name })) },
    { key: 'warehouseId', label: 'Ombor', type: 'select', options: warehouses.map(w => ({ value: w._id, label: w.name })) },
    { key: 'shippedStatus', label: "Jo'natish holati", type: 'select', options: SHIPPED_STATUS_OPTIONS },
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
    setFilters({ page: 1, pageSize: filters.pageSize });
  }, [filters.pageSize]);

  const getStatusIcon = (status: string) => {
    if (status === 'paid') return <CheckCircle className="h-4 w-4" />;
    if (status === 'partial') return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  // Calculate KPIs from current page data
  const { totalInvoices, totalAmount, paidAmount, outstandingAmount, overdueCount } = useMemo(() => {
    const totalAmt = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const now = new Date();
    return {
      totalInvoices: total,
      totalAmount: totalAmt,
      paidAmount: paid,
      outstandingAmount: totalAmt - paid,
      overdueCount: invoices.filter(inv => inv.status !== 'paid' && new Date(inv.dueDate) < now).length,
    };
  }, [invoices, total]);

  const handleCreate = () => {
    setSelectedInvoice(null);
    setIsEditMode(false);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (invoice: CustomerInvoice) => {
    setSelectedInvoice(invoice);
    setIsEditMode(true);
    setIsCreateModalOpen(true);
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

        // Check for warnings about insufficient inventory
        if (result.warnings && result.warnings.length > 0) {
          const warningMessage = "⚠️ Ogohlantirish: Ba'zi mahsulotlar yetarli emas:\n\n" +
            result.warnings.map((w: string) => `• ${w}`).join('\n') +
            "\n\nHisob-faktura muvaffaqiyatli yaratildi, lekin inventar minusga tushdi.";
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
    if (window.confirm("Hisob-fakturani o'chirishni xohlaysizmi?")) {
      try {
        await deleteInvoice(id);
        refetch();
      } catch (error) {
        showError('Xatolik yuz berdi');
      }
    }
  };

  const handlePayment = async (invoice: CustomerInvoice) => {
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

  // Print both receipts
  const handlePrintBoth = useCallback((invoice: CustomerInvoice) => {
    handlePrintCustomer(invoice);
    setTimeout(() => handlePrintWarehouse(invoice), 1500);
  }, [handlePrintCustomer, handlePrintWarehouse]);

  if (loading && invoices.length === 0) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" /></div>
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (<Card key={i} className="p-6"><div className="flex items-center justify-between"><div><Skeleton className="h-4 w-28 mb-2" /><Skeleton className="h-7 w-20" /></div><Skeleton className="h-12 w-12 rounded-lg" /></div></Card>))}
          </div>
          <Card className="p-4"><div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10" />)}</div></Card>
          <Card>
            <div className="p-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
                  <Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28 ml-auto" /><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64 text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>Xatolik: {error}</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mijozlar hisob-fakturalari</h1>
            <p className="text-gray-600 mt-1">Jami: {total} ta hisob-faktura</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={invoices}
              filename="hisob-fakturalar"
              fieldsToInclude={["invoiceNumber", "customerName", "invoiceDate", "totalAmount", "paidAmount", "status"]}
            />
            <Button onClick={handleCreate} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Yangi hisob-faktura
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami hisob-fakturalar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalInvoices}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">To'langan summa</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(paidAmount)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Qoldiq summa</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(outstandingAmount)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Muddati o'tgan</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{overdueCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Advanced Filter */}
        <AdvancedFilter
          fields={filterFields}
          values={filterValues}
          onChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          defaultExpanded
        />

        {/* Invoices Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hisob-faktura №
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mijoz
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jami summa
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To'langan
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jo'natildi
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holat
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-gray-500">
                      Hisob-fakturalar topilmadi
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <div className="max-w-[180px] truncate">{invoice.customerName}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(invoice.paidAmount)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getShippedStatusColor(invoice.shippedStatus || 'not_shipped')}`}>
                          {getShippedStatusLabel(invoice.shippedStatus || 'not_shipped')}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {getInvoiceStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(invoice)}
                            title="Ko'rish"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintBoth(invoice)}
                            title="Chek chiqarish (Mijoz + Ombor)"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(invoice)}
                            title="Tahrirlash"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {invoice.status !== 'paid' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePayment(invoice)}
                              title="To'lov qabul qilish"
                              className="text-green-600 hover:text-green-700"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invoice._id)}
                            title="O'chirish"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <DataPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
            onPageSizeChange={(ps) => setFilters(prev => ({ ...prev, pageSize: ps, page: 1 }))}
          />
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
    </Layout>
  );
};

export default CustomerInvoices;
