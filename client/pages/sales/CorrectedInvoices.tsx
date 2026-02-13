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
  CheckCircle,
  Package,
  TrendingUp
} from "lucide-react";
import { useState, useMemo } from "react";
import { useCorrectedInvoices } from "@/hooks/useCorrectedInvoices";
import { ViewInvoiceModal } from "@/components/ViewInvoiceModal";
import { format } from "date-fns";
import { useProducts } from "@/hooks/useProducts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CorrectedInvoices = () => {
  const [dateFilter, setDateFilter] = useState<{ startDate: string; endDate: string }>({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [productFilter, setProductFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const { invoices, loading, error } = useCorrectedInvoices({
    startDate: dateFilter.startDate,
    endDate: dateFilter.endDate,
    productId: productFilter || undefined
  });

  const { products } = useProducts();

  // Filter invoices by search term
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  // Calculate KPIs
  const totalCorrectedInvoices = filteredInvoices.length;
  const totalCorrectedItems = filteredInvoices.reduce((sum, inv) => 
    sum + inv.items.filter(item => !item.costPricePending).length, 0
  );
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/customer-invoices/${invoiceId}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      const invoice = await response.json();
      setSelectedInvoice(invoice);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error('Error fetching invoice:', err);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold">Xatolik yuz berdi</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tuzatilgan Hisob-fakturalar</h1>
            <p className="text-muted-foreground mt-1">
              Tan narxi avtomatik tuzatilgan hisob-fakturalar
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tuzatilgan Hisob-fakturalar</p>
                <p className="text-2xl font-bold mt-2">{totalCorrectedInvoices}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tuzatilgan Mahsulotlar</p>
                <p className="text-2xl font-bold mt-2">{totalCorrectedItems}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Summa</p>
                <p className="text-2xl font-bold mt-2">{totalAmount.toLocaleString()} so'm</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
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

            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Barcha mahsulotlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Barcha mahsulotlar</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.name}
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
                  <th className="text-left p-4 font-medium">Savdo Sanasi</th>
                  <th className="text-left p-4 font-medium">Tuzatilgan Sana</th>
                  <th className="text-right p-4 font-medium">Summa</th>
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
                      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-24 mx-auto" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-20 mx-auto" /></td>
                    </tr>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Tuzatilgan hisob-fakturalar topilmadi</p>
                        <p className="text-sm mt-1">Hozircha hech qanday tan narx tuzatilmagan</p>
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
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(invoice.updatedAt), 'dd.MM.yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-medium">{invoice.totalAmount.toLocaleString()} so'm</div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Tuzatilgan
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

export default CorrectedInvoices;
