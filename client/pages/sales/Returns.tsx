import { Layout } from "@/components/Layout";
import { printViaIframe } from "@/utils/print";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Plus, Trash2, Loader2, RotateCcw, AlertCircle, DollarSign, Package, Printer, CheckCircle, Clock, XCircle
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomerReturns, CustomerReturnFilters } from "@/hooks/useCustomerReturns";
import { usePartners } from "@/hooks/usePartners";
import { CustomerReturnModal } from "@/components/CustomerReturnModal";
import { useToast } from "@/hooks/use-toast";
import { ExportButton } from "@/components/ExportButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { AdvancedFilter, FilterField } from "@/components/shared/AdvancedFilter";
import { DataPagination } from "@/components/shared/DataPagination";
import { StatusBadge, RETURN_STATUS_CONFIG } from "@/components/shared/StatusBadge";

const STATUS_OPTIONS = [
  { value: 'pending', label: "Kutilmoqda" },
  { value: 'accepted', label: "Qabul qilindi" },
  { value: 'cancelled', label: "Bekor qilindi" },
];

const REASON_OPTIONS = [
  { value: 'defective', label: "Nuqsonli mahsulot" },
  { value: 'wrong_item', label: "Noto'g'ri mahsulot" },
  { value: 'customer_request', label: "Mijoz talabi" },
  { value: 'other', label: "Boshqa" },
];

const Returns = () => {
  const [filters, setFilters] = useState<CustomerReturnFilters>({
    page: 1,
    pageSize: 25,
  });

  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    search: '',
    startDate: '',
    endDate: '',
    status: '',
    customerId: '',
    reason: '',
  });

  // Debounce search input for server-side filtering
  const debouncedSearch = useDebounce(filterValues.search, 500);

  // Auto-apply debounced search to server filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const { returns, total, page, pageSize, loading, error, refetch, createReturn, updateStatus, deleteReturn } = useCustomerReturns(filters);
  const { partners: customers } = usePartners('customer');
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<string | null>(null);

  // Filter fields
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Qidirish', type: 'text', placeholder: 'Raqam, mijoz yoki faktura...' },
    { key: 'startDate', label: 'Sana dan', type: 'date' },
    { key: 'endDate', label: 'Sana gacha', type: 'date' },
    { key: 'status', label: 'Holat', type: 'select', options: STATUS_OPTIONS },
    {
      key: 'customerId', label: 'Mijoz', type: 'select',
      options: customers.map(c => ({ value: c._id, label: c.name }))
    },
    { key: 'reason', label: 'Sabab', type: 'select', options: REASON_OPTIONS },
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
    setFilters({ page: 1, pageSize: filters.pageSize });
  }, [filters.pageSize]);

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      'defective': "Nuqsonli mahsulot",
      'wrong_item': "Noto'g'ri mahsulot",
      'customer_request': "Mijoz talabi",
      'other': "Boshqa"
    };
    return labels[reason] || reason;
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      'defective': 'bg-red-100 text-red-800',
      'wrong_item': 'bg-orange-100 text-orange-800',
      'customer_request': 'bg-blue-100 text-blue-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[reason] || colors['other'];
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': "Kutilmoqda",
      'accepted': "Qabul qilindi",
      'cancelled': "Bekor qilindi"
    };
    return labels[status] || status;
  };

  // KPIs from current page
  const totalValue = returns.reduce((sum, ret) => sum + ret.totalAmount, 0);
  const defectiveCount = returns.filter(r => r.reason === 'defective').length;
  const pendingCount = returns.filter(r => r.status === 'pending').length;

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      await createReturn(data);
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error creating return:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    setReturnToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (returnToDelete) {
      try {
        await deleteReturn(returnToDelete);
        toast({ title: "Muvaffaqiyatli", description: "Qaytarish o'chirildi" });
        setShowDeleteDialog(false);
        setReturnToDelete(null);
        refetch();
      } catch (error) {
        toast({ title: "Xatolik", description: "Qaytarishni o'chirishda xatolik yuz berdi", variant: "destructive" });
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus(id, newStatus);
      toast({ title: "Muvaffaqiyatli", description: `Holat ${getStatusLabel(newStatus)} ga o'zgartirildi` });
      refetch();
    } catch (error) {
      toast({ title: "Xatolik", description: "Holatni o'zgartirishda xatolik yuz berdi", variant: "destructive" });
    }
  };

  const handlePrint = (ret: any) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Qaytarish akti ${ret.returnNumber}</title>
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
          .signature { display: flex; justify-content: space-between; margin-top: 40px; }
          .signature-box { width: 45%; }
          .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; text-align: center; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>QAYTARISH AKTI</h1>
          <p>${ret.returnNumber}</p>
          <p>Sana: ${formatDate(ret.returnDate)}</p>
        </div>

        <div class="info-grid">
          <div class="info-item"><div class="info-label">Mijoz:</div><div class="info-value">${ret.customerName}</div></div>
          <div class="info-item"><div class="info-label">Hisob-faktura №:</div><div class="info-value">${ret.invoiceNumber}</div></div>
          ${ret.organization ? `<div class="info-item"><div class="info-label">Tashkilot:</div><div class="info-value">${ret.organization}</div></div>` : ''}
          ${ret.warehouseName ? `<div class="info-item"><div class="info-label">Ombor:</div><div class="info-value">${ret.warehouseName}</div></div>` : ''}
          <div class="info-item"><div class="info-label">Qaytarish sababi:</div><div class="info-value">${getReasonLabel(ret.reason)}</div></div>
          <div class="info-item"><div class="info-label">Holat:</div><div class="info-value">${getStatusLabel(ret.status || 'pending')}</div></div>
        </div>

        <table>
          <thead><tr><th>#</th><th>Mahsulot</th><th class="text-right">Miqdor</th><th class="text-right">Narx</th><th class="text-right">Jami</th><th>Sabab</th></tr></thead>
          <tbody>
            ${ret.items.map((item: any, index: number) => `
              <tr><td>${index + 1}</td><td>${item.productName}</td><td class="text-right">${item.quantity}</td><td class="text-right">${formatCurrency(item.price)}</td><td class="text-right">${formatCurrency(item.total)}</td><td>${getReasonLabel(item.reason)}</td></tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row total"><span>Jami qaytarish summasi:</span><span>${formatCurrency(ret.totalAmount)}</span></div>
        </div>

        ${ret.notes ? `<div style="margin-top:30px;padding:15px;background:#f0f9ff;border-radius:5px;"><strong>Izoh:</strong><br>${ret.notes}</div>` : ''}

        <div class="signature">
          <div class="signature-box"><div class="signature-line">Topshiruvchi (Mijoz)</div></div>
          <div class="signature-box"><div class="signature-line">Qabul qiluvchi</div></div>
        </div>

        <div style="margin-top:50px;text-align:center;color:#666;font-size:12px;">
          <p>Chop etilgan: ${new Date().toLocaleDateString('uz-UZ')} ${new Date().toLocaleTimeString('uz-UZ')}</p>
        </div>
      </body>
      </html>
    `;

    printViaIframe(printContent);
  };

  if (loading && returns.length === 0) {
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

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mijozlardan qaytarish</h1>
            <p className="text-gray-600 mt-1">Jami: {total} ta qaytarish</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={returns}
              filename="qaytarishlar"
              fieldsToInclude={["returnNumber", "customerName", "returnDate", "totalAmount", "reason", "status"]}
            />
            <Button onClick={handleCreate} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Yangi qaytarish
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami qaytarishlar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-gray-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Qaytarish qiymati</p>
                <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nuqsonli</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{defectiveCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kutilmoqda</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              </div>
              <Package className="h-8 w-8 text-yellow-600" />
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
        />

        {/* Returns Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qaytarish №</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mijoz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hisob-faktura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sabab</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Qaytarishlar topilmadi
                    </td>
                  </tr>
                ) : (
                  returns.map((ret) => (
                    <tr key={ret._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{ret.returnNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.invoiceNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(ret.returnDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        {formatCurrency(ret.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(ret.reason)}`}>
                          {getReasonLabel(ret.reason)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={ret.status || 'pending'} config={RETURN_STATUS_CONFIG} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {ret.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(ret._id, 'accepted')}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                title="Qabul qilish"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Qabul
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(ret._id, 'cancelled')}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                title="Bekor qilish"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Bekor
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handlePrint(ret)} className="text-gray-600" title="Chop etish">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(ret._id)} className="text-red-600" title="O'chirish">
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

      <CustomerReturnModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Qaytarishni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Qaytarishni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setReturnToDelete(null); }}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
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

export default Returns;
