import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Package, AlertTriangle, TrendingUp, TrendingDown, FilterX } from "lucide-react";
import { useState, useMemo } from "react";
import { useBalance } from "@/hooks/useBalance";

interface BalanceItem {
  _id: string;
  name: string;
  sku?: string;
  category?: string;
  unit?: string;
  quantity: number;
  reserved: number;
  available: number;
  minStock: number;
  isLowStock: boolean;
  costPrice: number;
  sellingPrice: number;
  costValue: number;
  sellingValue: number;
  potentialProfit: number;
}

interface BalanceTotals {
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  totalCostValue: number;
  totalSellingValue: number;
  totalPotentialProfit: number;
  lowStockCount: number;
  negativeStockCount: number;
}

const Balance = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [hideZero, setHideZero] = useState(false);

  const { items, totals, loading, error, refetch } = useBalance({
    category: categoryFilter,
    hideZero
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [items, searchTerm]);

  const categories = useMemo(() =>
    Array.from(new Set(items.map(item => item.category).filter((c): c is string => !!c))),
    [items]
  );

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('uz-UZ').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('uz-UZ').format(num) + " so'm";
  };

  if (loading && items.length === 0) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-gray-500 font-medium animate-pulse">Ma'lumotlar yuklanmoqda...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ombor qoldig'i</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Real vaqtda mahsulotlar qoldig'ini kuzating</p>
        </div>

        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tannarx qiymati</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(totals.totalCostValue)}</p>
                </div>
                <Package className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sotuv qiymati</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totals.totalSellingValue)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Potensial foyda</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{formatCurrency(totals.totalPotentialProfit)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kam qolgan</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{totals.lowStockCount}</p>
                  {totals.negativeStockCount > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Manfiy: {totals.negativeStockCount}</p>
                  )}
                </div>
                <AlertTriangle className="h-10 w-10 text-orange-600 dark:text-orange-400" />
              </div>
            </Card>
          </div>
        )}

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Mahsulot nomi yoki SKU bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hideZero"
                checked={hideZero}
                onCheckedChange={(checked) => setHideZero(checked as boolean)}
              />
              <Label htmlFor="hideZero" className="cursor-pointer">
                Nol qoldiqlarni yashirish
              </Label>
            </div>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mahsulot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qoldiq</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rezerv</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mavjud</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Min</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tannarx</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sotuv narxi</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tannarx qiymati</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sotuv qiymati</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p>Mahsulotlar topilmadi</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${item.quantity < 0 ? 'bg-red-50 dark:bg-red-900/20' : item.isLowStock ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium dark:text-white">{item.name}</span>
                          {item.isLowStock && (
                            <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">Kam</Badge>
                          )}
                          {item.quantity < 0 && (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">Manfiy</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{item.sku || '-'}</td>
                      <td className={`px-4 py-4 text-sm text-right font-bold ${item.quantity < 0 ? 'text-red-600 dark:text-red-400' : 'dark:text-white'}`}>
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-orange-600 dark:text-orange-400">
                        {item.reserved > 0 ? formatNumber(item.reserved) : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
                        {formatNumber(item.available)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                        {item.minStock > 0 ? formatNumber(item.minStock) : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                        {formatNumber(item.costPrice)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                        {formatNumber(item.sellingPrice)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-blue-600 dark:text-blue-400">
                        {formatCurrency(item.costValue)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-green-600 dark:text-green-400">
                        {formatCurrency(item.sellingValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {totals && filteredItems.length > 0 && (
                <tfoot className="bg-gray-50 dark:bg-gray-900 font-bold">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm text-right dark:text-white">JAMI:</td>
                    <td className="px-4 py-3 text-sm text-right dark:text-white">{formatNumber(totals.totalQuantity)}</td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400">{formatNumber(totals.totalReserved)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">{formatNumber(totals.totalAvailable)}</td>
                    <td colSpan={3}></td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400">{formatCurrency(totals.totalCostValue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">{formatCurrency(totals.totalSellingValue)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Balance;
