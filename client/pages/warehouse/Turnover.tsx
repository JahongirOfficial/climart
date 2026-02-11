import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Loader2, Package, CalendarIcon, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTurnover } from "@/hooks/useTurnover";
import { useMemo } from "react";

interface TurnoverItem {
  _id: string;
  name: string;
  sku?: string;
  category?: string;
  unit?: string;
  costPrice: number;
  openingQty: number;
  openingAmount: number;
  incomingQty: number;
  incomingAmount: number;
  outgoingQty: number;
  outgoingAmount: number;
  closingQty: number;
  closingAmount: number;
  hasMovement: boolean;
}

interface TurnoverTotals {
  openingQty: number;
  openingAmount: number;
  incomingQty: number;
  incomingAmount: number;
  outgoingQty: number;
  outgoingAmount: number;
  closingQty: number;
  closingAmount: number;
}

const Turnover = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);

  // Date range - default to current month
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { items, totals, loading, error, refetch } = useTurnover({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    category: categoryFilter,
    showInactive
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [items, searchTerm]);

  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('uz-UZ').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('uz-UZ').format(num) + " so'm";
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Aylanma</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Tovarlar aylanmasi hisoboti</p>
        </div>

        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Boshlang'ich qoldiq</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(totals.openingAmount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatNumber(totals.openingQty)} dona</p>
                </div>
                <BarChart3 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kirim</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totals.incomingAmount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatNumber(totals.incomingQty)} dona</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Chiqim</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(totals.outgoingAmount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatNumber(totals.outgoingQty)} dona</p>
                </div>
                <TrendingDown className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Yakuniy qoldiq</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{formatCurrency(totals.closingAmount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatNumber(totals.closingQty)} dona</p>
                </div>
                <Package className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
            </Card>
          </div>
        )}

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-600 mb-2 block">Davr</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd.MM.yyyy") : "Boshlanish"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd.MM.yyyy") : "Tugash"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="relative md:col-span-2">
              <Label className="text-xs text-gray-600 mb-2 block">Qidiruv</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Mahsulot nomi yoki SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Kategoriya</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategoriya" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showInactive"
                  checked={showInactive}
                  onCheckedChange={(checked) => setShowInactive(checked as boolean)}
                />
                <Label htmlFor="showInactive" className="cursor-pointer text-sm">
                  Harakatsizlarni ko'rsatish
                </Label>
              </div>
            </div>
          </div>
        </Card>

        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-gray-500 font-medium animate-pulse">Aylanma hisoboti tayyorlanmoqda...</span>
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" rowSpan={2}>Mahsulot</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" rowSpan={2}>SKU</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l" colSpan={2}>Boshlang'ich qoldiq</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l" colSpan={2}>Kirim</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l" colSpan={2}>Chiqim</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-l" colSpan={2}>Yakuniy qoldiq</th>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-l">Miqdor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-l">Miqdor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-l">Miqdor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase border-l">Miqdor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p>Ma'lumotlar topilmadi</p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item._id}
                        className={`hover:bg-gray-50 ${item.closingQty < 0 ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium">{item.name}</div>
                          {item.category && (
                            <div className="text-xs text-gray-500">{item.category}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.sku || '-'}</td>

                        {/* Opening Balance */}
                        <td className={`px-4 py-4 text-sm text-right border-l ${item.openingQty < 0 ? 'text-red-600 font-bold' : 'text-blue-600'}`}>
                          {formatNumber(item.openingQty)}
                        </td>
                        <td className={`px-4 py-4 text-sm text-right ${item.openingAmount < 0 ? 'text-red-600 font-bold' : 'text-blue-600'}`}>
                          {formatCurrency(item.openingAmount)}
                        </td>

                        {/* Incoming */}
                        <td className="px-4 py-4 text-sm text-right text-green-600 border-l font-medium">
                          {item.incomingQty > 0 ? formatNumber(item.incomingQty) : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-green-600 font-medium">
                          {item.incomingAmount > 0 ? formatCurrency(item.incomingAmount) : '-'}
                        </td>

                        {/* Outgoing */}
                        <td className="px-4 py-4 text-sm text-right text-red-600 border-l font-medium">
                          {item.outgoingQty > 0 ? formatNumber(item.outgoingQty) : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-red-600 font-medium">
                          {item.outgoingAmount > 0 ? formatCurrency(item.outgoingAmount) : '-'}
                        </td>

                        {/* Closing Balance */}
                        <td className={`px-4 py-4 text-sm text-right border-l font-bold ${item.closingQty < 0 ? 'text-red-600' : 'text-purple-600'}`}>
                          {formatNumber(item.closingQty)}
                        </td>
                        <td className={`px-4 py-4 text-sm text-right font-bold ${item.closingAmount < 0 ? 'text-red-600' : 'text-purple-600'}`}>
                          {formatCurrency(item.closingAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {totals && filteredItems.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold border-t-2">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm text-right">JAMI:</td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600 border-l">{formatNumber(totals.openingQty)}</td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCurrency(totals.openingAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 border-l">{formatNumber(totals.incomingQty)}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(totals.incomingAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 border-l">{formatNumber(totals.outgoingQty)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(totals.outgoingAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-purple-600 border-l">{formatNumber(totals.closingQty)}</td>
                      <td className="px-4 py-3 text-sm text-right text-purple-600">{formatCurrency(totals.closingAmount)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Turnover;
