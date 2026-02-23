import { PurchasesLayout } from "@/components/purchases/PurchasesLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
  Search,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
  Filter,
  X
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useSupplierInvoices } from "@/hooks/useSupplierInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { storeDocumentIds } from "@/hooks/useDocumentNavigation";
import { formatCurrency, formatCurrencyAmount, formatDate } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "",        label: "Barcha statuslar" },
  { value: "paid",    label: "To'langan" },
  { value: "partial", label: "Qisman to'langan" },
  { value: "unpaid",  label: "To'lanmagan" },
];

const ReceivedInvoices = () => {
  const navigate = useNavigate();
  const { invoices, loading, error, refetch } = useSupplierInvoices();
  const { suppliers } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({ value: s._id, label: s.name }))
  , [suppliers]);

  const activeFilterCount = [statusFilter, supplierFilter].filter(Boolean).length;

  const getStatusBadge = (status: string) => {
    if (status === 'paid')    return { label: "To'langan",         icon: CheckCircle,   className: "bg-green-50 text-green-700 border-green-300" };
    if (status === 'partial') return { label: "Qisman to'langan",  icon: Clock,         className: "bg-blue-50 text-blue-700 border-blue-300" };
    return                           { label: "To'lanmagan",        icon: AlertTriangle, className: "bg-yellow-50 text-yellow-700 border-yellow-300" };
  };

  const filteredInvoices = useMemo(() => invoices.filter(invoice => {
    const matchesSearch = !debouncedSearch || (
      invoice.supplierName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    const matchesSupplier = !supplierFilter ||
      (typeof invoice.supplier === 'object' ? (invoice.supplier as any)?._id : invoice.supplier) === supplierFilter;
    return matchesSearch && matchesStatus && matchesSupplier;
  }), [invoices, debouncedSearch, statusFilter, supplierFilter]);

  const totalInvoices = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalUnpaid = invoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

  const handleOpen = (invoice: any) => {
    storeDocumentIds('received-invoices', filteredInvoices.map(i => i._id));
    navigate(`/purchases/received-invoices/${invoice._id}`);
  };

  if (loading) {
    return (
      <PurchasesLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Ma'lumotlar yuklanmoqda...</span>
        </div>
      </PurchasesLayout>
    );
  }

  if (error) {
    return (
      <PurchasesLayout>
        <div className="p-6">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
                <p className="text-red-700">{error}</p>
                <Button onClick={() => refetch()} className="mt-3 bg-red-600 hover:bg-red-700" size="sm">Qayta urinish</Button>
              </div>
            </div>
          </Card>
        </div>
      </PurchasesLayout>
    );
  }

  return (
    <PurchasesLayout>
      <div className="p-6 max-w-[1920px] mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Jami fakturalar</span>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-base font-bold text-blue-600">{formatCurrency(totalInvoices)}</p>
            <p className="text-xs text-gray-500 mt-1">{invoices.length} ta hujjat</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">To'langan</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-base font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-500 mt-1">Amalga oshirilgan</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">To'lanmagan</span>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-base font-bold text-red-600">{formatCurrency(totalUnpaid)}</p>
            <p className="text-xs text-gray-500 mt-1">Qoldiq</p>
          </Card>
        </div>

        <Card>
          {/* Toolbar */}
          <div className="p-3 border-b border-gray-200 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(v => !v)}
              className={`gap-1.5 ${showFilters || activeFilterCount > 0 ? "border-primary text-primary bg-primary/5" : ""}`}
            >
              <Filter className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Faktura raqami yoki yetkazib beruvchi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <span className="text-sm text-gray-500 ml-auto">{filteredInvoices.length} ta</span>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="px-3 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-2 items-center">
              <div className="w-52">
                <Combobox
                  options={supplierOptions}
                  value={supplierFilter}
                  onValueChange={setSupplierFilter}
                  placeholder="Yetkazib beruvchi"
                  searchPlaceholder="Qidirish..."
                  emptyText="Topilmadi"
                />
              </div>
              <div className="w-48">
                <Combobox
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="To'lov holati"
                  searchPlaceholder="Qidirish..."
                  emptyText="Topilmadi"
                />
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setStatusFilter(""); setSupplierFilter(""); }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1.5 hover:bg-gray-200 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                  Tozalash
                </button>
              )}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faktura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yetkazib beruvchi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sana</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jami</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">To'langan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qoldiq</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice) => {
                  const remaining = invoice.totalAmount - invoice.paidAmount;
                  const badge = getStatusBadge(invoice.status);
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-primary">
                        <button onClick={() => handleOpen(invoice)} className="hover:underline">{invoice.invoiceNumber}</button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{invoice.supplierName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(invoice.invoiceDate)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatCurrencyAmount(invoice.totalAmount, (invoice as any).currency || 'UZS')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                        {formatCurrencyAmount(invoice.paidAmount, (invoice as any).currency || 'UZS')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right">
                        {formatCurrencyAmount(remaining, (invoice as any).currency || 'UZS')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border rounded-full ${badge.className}`}>
                          <BadgeIcon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleOpen(invoice)} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Fakturalar topilmadi</p>
              <p className="text-sm text-gray-400 mt-1">
                {invoices.length === 0 ? "Hali fakturalar yo'q" : "Qidiruv shartini o'zgartiring"}
              </p>
            </div>
          )}

          <div className="p-3 border-t border-gray-200 text-sm text-gray-500">
            Jami {filteredInvoices.length} ta faktura
          </div>
        </Card>
      </div>
    </PurchasesLayout>
  );
};

export default ReceivedInvoices;
