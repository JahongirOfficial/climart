import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2, Users, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Settlement {
  partner: {
    _id: string;
    name: string;
    code: string;
    type: string;
  };
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
  isDebitor: boolean;
  isKreditor: boolean;
}

interface Totals {
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
  totalDebitors: number;
  totalKreditors: number;
}

const MutualSettlements = () => {
  const [loading, setLoading] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [partnerType, setPartnerType] = useState("all");
  
  // Date range - default to current month
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    if (startDate && endDate) {
      fetchSettlements();
    }
  }, [startDate, endDate, partnerType]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());
      if (partnerType !== 'all') params.append('partnerType', partnerType);
      
      const response = await fetch(`/api/mutual-settlements?${params}`);
      if (!response.ok) throw new Error('Failed to fetch settlements');
      const data = await response.json();
      setSettlements(data.settlements);
      setTotals(data.totals);
    } catch (error) {
      console.error('Error fetching settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.abs(num)) + " so'm";
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">O'zaro hisob-kitoblar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Hamkorlar bilan qarzdorlik hisoboti</p>
        </div>

        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Boshlang'ich qoldiq</p>
                  <p className={`text-2xl font-bold mt-1 ${totals.openingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(totals.openingBalance)}
                  </p>
                </div>
                <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Debitorlar (Bizdan qarz)</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totals.totalDebitors)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kreditorlar (Biz qarz)</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(totals.totalKreditors)}</p>
                </div>
                <TrendingDown className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Yakuniy qoldiq</p>
                  <p className={`text-2xl font-bold mt-1 ${totals.closingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(totals.closingBalance)}
                  </p>
                </div>
                <FileText className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
            </Card>
          </div>
        )}

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
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

            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Hamkor turi</Label>
              <Select value={partnerType} onValueChange={setPartnerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="customer">Mijozlar</SelectItem>
                  <SelectItem value="supplier">Yetkazib beruvchilar</SelectItem>
                  <SelectItem value="both">Ikkala turi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hamkor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turi</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Boshlang'ich</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kirim</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Chiqim</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Yakuniy</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Holat</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p>Ma'lumotlar topilmadi</p>
                      </td>
                    </tr>
                  ) : (
                    settlements.map((settlement) => (
                      <tr key={settlement.partner._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium">{settlement.partner.name}</div>
                          <div className="text-xs text-gray-500">{settlement.partner.code}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {settlement.partner.type === 'customer' && 'Mijoz'}
                          {settlement.partner.type === 'supplier' && 'Yetkazib beruvchi'}
                          {settlement.partner.type === 'both' && 'Ikkala turi'}
                        </td>
                        <td className={`px-4 py-4 text-sm text-right font-medium ${settlement.openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(settlement.openingBalance)}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-blue-600">
                          {formatCurrency(settlement.periodDebit)}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-orange-600">
                          {formatCurrency(settlement.periodCredit)}
                        </td>
                        <td className={`px-4 py-4 text-sm text-right font-bold ${settlement.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(settlement.closingBalance)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {settlement.isDebitor && (
                            <Badge className="bg-green-100 text-green-800">Debitor</Badge>
                          )}
                          {settlement.isKreditor && (
                            <Badge className="bg-red-100 text-red-800">Kreditor</Badge>
                          )}
                          {!settlement.isDebitor && !settlement.isKreditor && (
                            <Badge variant="secondary">Qoldiq yo'q</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {totals && settlements.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold border-t-2">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm text-right">JAMI:</td>
                      <td className={`px-4 py-3 text-sm text-right ${totals.openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totals.openingBalance)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600">
                        {formatCurrency(totals.periodDebit)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-orange-600">
                        {formatCurrency(totals.periodCredit)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right ${totals.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totals.closingBalance)}
                      </td>
                      <td></td>
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

export default MutualSettlements;
