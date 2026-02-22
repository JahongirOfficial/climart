import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Grid3x3, List, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

// Sample products data
const productsData = [
  {
    id: 1,
    sku: "PROD-001",
    name: "Noutbuk Pro 15",
    price: 1200,
    stock: 45,
    barcode: "8901234567890",
    category: "Elektronika",
  },
  {
    id: 2,
    sku: "PROD-002",
    name: "Monitor LED 24\"",
    price: 350,
    stock: 120,
    barcode: "8901234567891",
    category: "Aksessuarlar",
  },
  {
    id: 3,
    sku: "PROD-003",
    name: "Mechanik Klaviatura",
    price: 180,
    stock: 0,
    barcode: "8901234567892",
    category: "Aksessuarlar",
  },
  {
    id: 4,
    sku: "PROD-004",
    name: "Optik Sichqoncha",
    price: 45,
    stock: 350,
    barcode: "8901234567893",
    category: "Aksessuarlar",
  },
  {
    id: 5,
    sku: "PROD-005",
    name: "USB Hub 7-port",
    price: 65,
    stock: 200,
    barcode: "8901234567894",
    category: "Aksessuarlar",
  },
  {
    id: 6,
    sku: "PROD-006",
    name: "Wireless Printer",
    price: 550,
    stock: 18,
    barcode: "8901234567895",
    category: "Printerlar",
  },
];

const getStockStatus = (stock: number) => {
  if (stock === 0) return { color: "bg-red-50 text-red-700", text: "Mavjud emas" };
  if (stock < 50) return { color: "bg-yellow-50 text-yellow-700", text: "Kam" };
  return { color: "bg-green-50 text-green-700", text: "Yetarli" };
};

const Products = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = Array.from(new Set(productsData.map((p) => p.category)));

  const filteredData = productsData.filter((product) => {
    const matchesSearch =
      !debouncedSearch ||
      product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.sku.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tovarlar</h1>
            <p className="text-sm text-gray-600 mt-1">
              Mahsulot katalogini boshqaring
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-2">
            <Plus className="h-4 w-4" />
            Yangi mahsulot
          </Button>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-md border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Mahsulot nomini yoki SKU ni qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 bg-white focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="">Barcha kategoriyalar</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex gap-2 border border-gray-300 rounded-md p-1 bg-gray-50">
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setViewMode("table")}
                className={`rounded-sm flex-1 ${
                  viewMode === "table"
                    ? "bg-white border border-gray-300"
                    : "bg-transparent"
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                onClick={() => setViewMode("grid")}
                className={`rounded-sm flex-1 ${
                  viewMode === "grid"
                    ? "bg-white border border-gray-300"
                    : "bg-transparent"
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Nomi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Narx
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Qoldiq
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Barcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ${product.price}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-md text-xs font-medium border ${stockStatus.color}`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {product.barcode}
                        </td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-md border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        {product.sku}
                      </p>
                      <h3 className="text-sm font-bold text-gray-900">
                        {product.name}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium border ${stockStatus.color}`}
                    >
                      {product.stock}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Narx:</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${product.price}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono border-t border-gray-200 pt-3">
                      {product.barcode}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Tahrir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
