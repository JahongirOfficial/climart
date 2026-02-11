import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, ExternalLink, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";

const Ecommerce = () => {
  const [syncStatuses, setSyncStatuses] = useState([
    {
      id: 1,
      platform: "Shopify",
      status: "connected",
      lastSync: "2024-12-15 14:30",
      synced: 1250,
    },
    {
      id: 2,
      platform: "WooCommerce",
      status: "connected",
      lastSync: "2024-12-15 14:25",
      synced: 890,
    },
    {
      id: 3,
      platform: "Telegram Shop",
      status: "pending",
      lastSync: "2024-12-14 10:15",
      synced: 0,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800";
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Onlayn savdo</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Marketplace ulash va sinxronizatsiya
          </p>
        </div>

        {/* Marketplace Connection Cards */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            Marketplace ulanishlari
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Shopify Card */}
            <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-md flex items-center justify-center text-white font-bold text-lg mb-3">
                    S
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Shopify</h3>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Kompyuter va elektronika savdosi uchun eng katta platform
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Ulangan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">1,250 mahsulot sinxron qilindi</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs py-2">
                  Sozlamalar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-xs py-2"
                >
                  Uzish
                </Button>
              </div>
            </div>

            {/* WooCommerce Card */}
            <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-md flex items-center justify-center text-white font-bold text-lg mb-3">
                    W
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">WooCommerce</h3>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                WordPress asosidagi etukali savdo platforma
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Ulangan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">890 mahsulot sinxron qilindi</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs py-2">
                  Sozlamalar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-xs py-2"
                >
                  Uzish
                </Button>
              </div>
            </div>

            {/* Telegram Shop Card */}
            <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md flex items-center justify-center text-white font-bold text-lg mb-3">
                    T
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Telegram Shop</h3>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Telegram orqali bevosita savdo qilish
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Kutilumoqda</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Ulanishni yakunlash kerak</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs py-2">
                  Ulash
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-xs py-2"
                >
                  Batafsil
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Status Table */}
        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Sinxronizatsiya holati</h2>
            <Button
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Hozir sinxron qilish
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Oxirgi sinxron
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Sinxronlangan mahsulotlar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody>
                {syncStatuses.map((sync) => (
                  <tr key={sync.id}>
                    <td className="px-6 py-4 text-sm font-medium">
                      {sync.platform}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(
                          sync.status
                        )}`}
                      >
                        {getStatusIcon(sync.status)}
                        {sync.status === "connected"
                          ? "Ulangan"
                          : sync.status === "pending"
                          ? "Kutilumoqda"
                          : "Xato"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-gray-300">
                      {sync.lastSync}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {sync.synced}
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-xs gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Sinxron
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-xs"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connection Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Ulangan platformalar</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">2</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Shopify va WooCommerce faol</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Jami sinxronlangan</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">2,140</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Barcha platformalardan mahsulotlar</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Kutilumoqda</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">1</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Telegram Shop ulanishni yakunlash</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Ecommerce;
