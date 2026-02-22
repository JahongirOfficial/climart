import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  AlertTriangle,
  Clock,
  Package,
  TrendingDown
} from "lucide-react";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { usePendingInvoices } from "@/hooks/usePendingInvoices";
import { api } from '@/lib/api';
import { ViewInvoiceModal } from "@/components/ViewInvoiceModal";
import { format } from "date-fns";
import { usePartners } from "@/hooks/usePartners";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PendingInvoices = () => {
  const [dateFilter, setDateFilter] = useState<{ startDate: string; endDate: string }>({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const { invoices, loading, error } = usePendingInvoices({
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
    customerId: customerFilter !== "all" ? customerFilter : undefined
  });

  const { partners } = usePartners();
  const customers = partners.filter(p => p.type === 'customer' || p.type === 'both');

  // Filter invoices by search term (debounced for performance)
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [invoices, debouncedSearch]);

  // Calculate KPIs
  const totalPendingInvoices = filteredInvoices.length;
  const totalPendingItems = filteredInvoices.reduce((sum, inv) => sum + inv.pendingItemsCount, 0);
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const invoice = await api.get(`/api/customer-invoices/${invoiceId}`);
      setSelectedInvoice(invoice);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error('Error fetching invoice:', err);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold">Xatolik yuz berdi</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Kutilayotgan Tan Narxlar</h1>
            <p className="text-muted-foreground mt-1">
              Minus savdolar uchun tan narx kutilayotgan hisob-fakturalar
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kutilayotgan Hisob-fakturalar</p>
                <p className="text-2xl font-bold mt-2">{totalPendingInvoices}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kutilayotgan Mahsulotlar</p>
                <p className="text-2xl font-bold mt-2">{totalPendingItems}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Summa</p>
                <p className="text-2xl font-bold mt-2">{totalAmount.toLocaleString()} so'm</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
            />

            <Input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
            />

            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Barcha mijozlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha mijozlar</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Hisob-faktura №</th>
                  <th className="text-left p-4 font-medium">Mijoz</th>
                  <th className="text-left p-4 font-medium">Sana</th>
                  <th className="text-right p-4 font-medium">Summa</th>
                  <th className="text-center p-4 font-medium">Kutilayotgan Mahsulotlar</th>
                  <th className="text-center p-4 font-medium">Holat</th>
                  <th className="text-center p-4 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-16 mx-auto" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-24 mx-auto" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-20 mx-auto" /></td>
                    </tr>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Kutilayotgan hisob-fakturalar topilmadi</p>
                        <p className="text-sm mt-1">Barcha mahsulotlar uchun tan narx belgilangan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{invoice.customerName}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(invoice.invoiceDate), 'dd.MM.yyyy')}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-medium">{invoice.totalAmount.toLocaleString()} so'm</div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {invoice.pendingItemsCount} ta
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Kutilmoqda
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* View Invoice Modal */}
      {isViewModalOpen && selectedInvoice && (
        <ViewInvoiceModal
          invoice={selectedInvoice}
          open={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </Layout>
  );
};

export default PendingInvoices;
