import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CreditCard,
  Truck,
  Calculator,
  MessageSquare,
  BarChart3,
  Lock,
  Cloud,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Integration {
  id: number;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  rating: number;
  reviews: number;
  isConnected: boolean;
  featured: boolean;
}

const integrations: Integration[] = [
  // Payment Systems
  {
    id: 1,
    name: "Stripe",
    category: "To'lov tizimi",
    description: "Hush hamar onlayn to'lovlarni qabul qilish",
    icon: <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
    rating: 4.8,
    reviews: 1250,
    isConnected: true,
    featured: true,
  },
  {
    id: 2,
    name: "PayPal",
    category: "To'lov tizimi",
    description: "Dunyo bo'ylab to'lovlarni qabul qilish",
    icon: <CreditCard className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />,
    rating: 4.6,
    reviews: 980,
    isConnected: false,
    featured: false,
  },
  {
    id: 3,
    name: "Uz-Card",
    category: "To'lov tizimi",
    description: "O'zbekistonda karta orqali to'lovlar",
    icon: <CreditCard className="h-8 w-8 text-purple-600 dark:text-purple-400" />,
    rating: 4.4,
    reviews: 650,
    isConnected: true,
    featured: true,
  },

  // Delivery Services
  {
    id: 4,
    name: "EasyWay",
    category: "Yetkazib berish",
    description: "Tezkor va ishonchli yetkazib berish xizmati",
    icon: <Truck className="h-8 w-8 text-green-600 dark:text-green-400" />,
    rating: 4.7,
    reviews: 1100,
    isConnected: true,
    featured: true,
  },
  {
    id: 5,
    name: "SpeedEx",
    category: "Yetkazib berish",
    description: "24 soat ichida yetkazib berish",
    icon: <Truck className="h-8 w-8 text-red-600 dark:text-red-400" />,
    rating: 4.5,
    reviews: 820,
    isConnected: false,
    featured: false,
  },

  // Accounting Tools
  {
    id: 6,
    name: "1C Enterprise",
    category: "Hisobchi vositalari",
    description: "Komprehensiv hisobchilik va CRM",
    icon: <Calculator className="h-8 w-8 text-orange-600 dark:text-orange-400" />,
    rating: 4.6,
    reviews: 750,
    isConnected: false,
    featured: false,
  },
  {
    id: 7,
    name: "QuickBooks",
    category: "Hisobchi vositalari",
    description: "Kichik va o'rta biznes uchun akaunt",
    icon: <Calculator className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />,
    rating: 4.7,
    reviews: 920,
    isConnected: false,
    featured: true,
  },

  // Communication
  {
    id: 8,
    name: "Telegram Bot",
    category: "Aloqa",
    description: "Telegram orqali ham xabarlar va xabarnomalar",
    icon: <MessageSquare className="h-8 w-8 text-blue-400" />,
    rating: 4.9,
    reviews: 1500,
    isConnected: true,
    featured: true,
  },
  {
    id: 9,
    name: "SendGrid",
    category: "Aloqa",
    description: "Ishonchli email yetkazib berish xizmati",
    icon: <Mail className="h-8 w-8 text-red-500 dark:text-red-400" />,
    rating: 4.6,
    reviews: 850,
    isConnected: false,
    featured: false,
  },

  // Analytics & Reporting
  {
    id: 10,
    name: "Google Analytics",
    category: "Tahlil",
    description: "Saytingiz trafikini tahlil qilish",
    icon: <BarChart3 className="h-8 w-8 text-red-600 dark:text-red-400" />,
    rating: 4.8,
    reviews: 2000,
    isConnected: true,
    featured: true,
  },

  // Security
  {
    id: 11,
    name: "SSL Certificate",
    category: "Xavfsizlik",
    description: "HTTPS enkriptsiya va xavfsizlik",
    icon: <Lock className="h-8 w-8 text-green-600 dark:text-green-400" />,
    rating: 4.9,
    reviews: 1800,
    isConnected: true,
    featured: false,
  },

  // Cloud Storage
  {
    id: 12,
    name: "Amazon S3",
    category: "Bulutli saqlash",
    description: "Masshtablanuvchi bulutli saqlash xizmati",
    icon: <Cloud className="h-8 w-8 text-orange-500 dark:text-orange-400" />,
    rating: 4.7,
    reviews: 1600,
    isConnected: false,
    featured: true,
  },
];

const IntegrationCard = ({ integration }: { integration: Integration }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0">{integration.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {integration.name}
              </h3>
              {integration.featured && (
                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs">
                  Popular
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{integration.category}</p>
          </div>
        </div>
        {integration.isConnected && (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-xs">
            Ulangan
          </Badge>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
        {integration.description}
      </p>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className="text-yellow-500 dark:text-yellow-400 font-bold">{integration.rating}</span>
        <span className="text-gray-500 dark:text-gray-400">
          ({integration.reviews.toLocaleString()} review)
        </span>
      </div>

      {/* Action Button */}
      {integration.isConnected ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-sm"
          >
            Sozlamalar
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-sm"
          >
            Uzish
          </Button>
        </div>
      ) : (
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm gap-2">
          <ExternalLink className="h-4 w-4" />
          Ulash
        </Button>
      )}
    </div>
  );
};

const Solutions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = Array.from(
    new Set(integrations.map((i) => i.category))
  );

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      !searchTerm ||
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter(
    (i) => i.isConnected
  ).length;

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integratsiyalar</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Sizning ERP tizimingizni boshqa ilovalarga ulang
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              Mavjud integratsiyalar
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {integrations.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Turli xil xizmatlar</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              Ulangan integratsiyalar
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{connectedCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Faol ulanishlar</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              Mavjud kategoriyalar
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {categories.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Turli xil xizmatlari
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="search"
                placeholder="Integratsiyani qidiring..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-visible:ring-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Barcha kategoriyalar</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
            />
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Hech bir integratsiya topilmadi</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Solutions;
