import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  Globe,
  Truck,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Package,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";

interface SalesChannel {
  id: string;
  name: string;
  type: "store" | "online" | "wholesale" | "marketplace";
  status: "active" | "inactive";
}

const typeIcons: Record<string, typeof Store> = {
  store: Store,
  online: Globe,
  wholesale: Truck,
  marketplace: ShoppingBag,
};

const typeColors: Record<string, string> = {
  store: "text-blue-600 bg-blue-100",
  online: "text-purple-600 bg-purple-100",
  wholesale: "text-orange-600 bg-orange-100",
  marketplace: "text-green-600 bg-green-100",
};

const Statistics = () => {
  const [period, setPeriod] = useState("month");

  const channels: SalesChannel[] = useMemo(() => {
    try {
      const saved = localStorage.getItem("sales_channels");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  const { invoices } = useCustomerInvoices();

  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const periodInvoices = invoices.filter(
      (inv: any) => new Date(inv.invoiceDate || inv.createdAt) >= startDate
    );

    const totalSales = periodInvoices.reduce(
      (s: number, inv: any) => s + (inv.finalAmount || inv.totalAmount || 0),
      0
    );
    const totalCollected = periodInvoices.reduce(
      (s: number, inv: any) => s + (inv.paidAmount || 0),
      0
    );
    const totalInvoices = periodInvoices.length;
    const uniqueCustomers = new Set(
      periodInvoices.map((inv: any) => inv.customer)
    ).size;

    // Group by channel type (approximation: distribute across active channels)
    const activeChannels = channels.filter((c) => c.status === "active");
    const typeStats = ["store", "online", "wholesale", "marketplace"].map((type) => {
      const typeChannels = activeChannels.filter((c) => c.type === type);
      const channelCount = typeChannels.length;
      // Proportionally distribute sales if channels exist, otherwise show 0
      const share = activeChannels.length > 0 ? channelCount / activeChannels.length : 0;
      return {
        type,
        channelCount,
        sales: Math.round(totalSales * share),
        invoices: Math.round(totalInvoices * share),
        collected: Math.round(totalCollected * share),
      };
    });

    return {
      totalSales,
      totalCollected,
      totalInvoices,
      uniqueCustomers,
      typeStats,
      activeChannels: activeChannels.length,
    };
  }, [invoices, channels, period]);

  const formatCurrency = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kanal statistikasi</h1>
            <p className="text-gray-600 mt-1">
              Savdo kanallari bo'yicha umumiy statistika
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Hafta</SelectItem>
              <SelectItem value="month">Oy</SelectItem>
              <SelectItem value="year">Yil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* General Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami savdo</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.totalSales)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yig'ilgan</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatCurrency(stats.totalCollected)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fakturalar</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.totalInvoices}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faol mijozlar</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats.uniqueCustomers}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Channel Type Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.typeStats.map((ts) => {
            const Icon = typeIcons[ts.type] || Store;
            const labels: Record<string, string> = {
              store: "Do'konlar",
              online: "Online savdo",
              wholesale: "Ulgurji savdo",
              marketplace: "Marketplace",
            };
            return (
              <Card key={ts.type} className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${typeColors[ts.type]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{labels[ts.type]}</p>
                    <p className="text-sm text-gray-500">
                      {ts.channelCount} ta kanal
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Savdo</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(ts.sales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Yig'ilgan</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(ts.collected)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fakturalar</p>
                    <p className="font-semibold text-blue-600">{ts.invoices}</p>
                  </div>
                </div>

                {/* Sales share bar */}
                {stats.totalSales > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Ulush</span>
                      <span>
                        {((ts.sales / stats.totalSales) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${typeColors[ts.type].split(" ")[1].replace("text", "bg")}`}
                        style={{
                          width: `${(ts.sales / stats.totalSales) * 100}%`,
                          backgroundColor:
                            ts.type === "store"
                              ? "#2563eb"
                              : ts.type === "online"
                              ? "#9333ea"
                              : ts.type === "wholesale"
                              ? "#ea580c"
                              : "#16a34a",
                        }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {channels.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            <p>Hali savdo kanallari qo'shilmagan.</p>
            <p className="text-sm mt-1">
              Avval "Savdo kanallari" sahifasida kanallarni yarating.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Statistics;
