import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, Plus, Package, Warehouse as WarehouseIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Link } from "react-router-dom";

// Stock quantity color logic: 0 = red, < 50 = yellow, >= 50 = green
const getStockColor = (quantity: number) => {
  if (quantity === 0) return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
  if (quantity < 50) return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
  return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
};

const Warehouse = () => {
  const { products, loading: productsLoading } = useProducts();
  const { warehouses, loading: warehousesLoading } = useWarehouses();

  // "all" means show global stock across all warehouses
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");

  const loading = productsLoading || warehousesLoading;

  // Filter products based on selected warehouse
  const filteredProducts = useMemo(() => {
    if (selectedWarehouseId === "all") {
      return products;
    }

    // Filter products that have stock entry for the selected warehouse
    return products
      .map((product) => {
        const warehouseStock = product.stockByWarehouse?.find(
          (sw) => sw.warehouse === selectedWarehouseId
        );
        if (!warehouseStock) return null;
        return {
          ...product,
          // Override global quantities with warehouse-specific ones
          quantity: warehouseStock.quantity,
          reserved: warehouseStock.reserved || 0,
        };
      })
      .filter(Boolean) as typeof products;
  }, [products, selectedWarehouseId]);

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ombor</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Omborlarni va qoldiqlarni boshqaring
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/warehouse/transfer">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Ko'chirish
              </Button>
            </Link>
            <Link to="/warehouse/inventory">
              <Button
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md gap-2"
              >
                <Plus className="h-4 w-4" />
                Inventarizatsiya
              </Button>
            </Link>
          </div>
        </div>

        {/* Warehouse Selector */}
        <div className="flex gap-2 flex-wrap">
          {warehousesLoading ? (
            // Loading skeletons for warehouse buttons
            <>
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </>
          ) : warehouses.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Omborlar topilmadi. Avval ombor yarating.
            </p>
          ) : (
            <>
              {/* "All warehouses" button */}
              <Button
                onClick={() => setSelectedWarehouseId("all")}
                variant={selectedWarehouseId === "all" ? "default" : "outline"}
                className={`rounded-md ${
                  selectedWarehouseId === "all"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                Barcha omborlar
              </Button>
              {warehouses.map((warehouse) => (
                <Button
                  key={warehouse._id}
                  onClick={() => setSelectedWarehouseId(warehouse._id)}
                  variant={selectedWarehouseId === warehouse._id ? "default" : "outline"}
                  className={`rounded-md ${
                    selectedWarehouseId === warehouse._id
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {warehouse.name}
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Stock Table */}
        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                    Mahsulot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                    Qoldiq
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                    Rezerv
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">
                    Mavjud
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-6 w-16 rounded-md" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p>Mahsulotlar topilmadi</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const available = product.quantity - (product.reserved || 0);
                    return (
                      <tr
                        key={product._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white wrap-text">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {product.sku || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${getStockColor(
                              product.quantity
                            )}`}
                          >
                            {product.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-orange-600 dark:text-orange-400 font-medium">
                          {product.reserved || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400 font-medium">
                          {available}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operations Navigation Section (replaces movement log) */}
        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <WarehouseIcon className="h-4 w-4" />
              Ombor operatsiyalari
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ombor operatsiyalarini ko'rish uchun tegishli bo'limga o'ting
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/warehouse/receipt">
                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Kirimlar
                </Button>
              </Link>
              <Link to="/warehouse/transfer">
                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Ko'chirishlar
                </Button>
              </Link>
              <Link to="/warehouse/writeoff">
                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Hisobdan chiqarish
                </Button>
              </Link>
              <Link to="/warehouse/inventory">
                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Inventarizatsiya
                </Button>
              </Link>
              <Link to="/warehouse/balance">
                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Qoldiqlar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Warehouse;
