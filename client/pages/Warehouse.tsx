import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Plus, Clock } from "lucide-react";
import { useState } from "react";

// Sample warehouse stock data
const stockData = [
  {
    id: 1,
    product: "Noutbuk Pro 15",
    warehouse: "Tashkent",
    stock: 45,
    reserved: 10,
    available: 35,
  },
  {
    id: 2,
    product: "Monitor LED 24\"",
    warehouse: "Tashkent",
    stock: 120,
    reserved: 20,
    available: 100,
  },
  {
    id: 3,
    product: "Mechanik Klaviatura",
    warehouse: "Samarkand",
    stock: 0,
    reserved: 0,
    available: 0,
  },
  {
    id: 4,
    product: "Optik Sichqoncha",
    warehouse: "Tashkent",
    stock: 350,
    reserved: 50,
    available: 300,
  },
  {
    id: 5,
    product: "USB Hub 7-port",
    warehouse: "Bukhara",
    stock: 200,
    reserved: 30,
    available: 170,
  },
  {
    id: 6,
    product: "Wireless Printer",
    warehouse: "Tashkent",
    stock: 18,
    reserved: 5,
    available: 13,
  },
];

// Inventory movement log
const movementLog = [
  {
    id: 1,
    date: "2024-12-15 14:30",
    product: "Noutbuk Pro 15",
    type: "Kirim",
    quantity: 20,
    from: "Supplier",
    to: "Tashkent",
  },
  {
    id: 2,
    date: "2024-12-15 10:15",
    product: "Monitor LED 24\"",
    type: "Chiqim",
    quantity: 5,
    from: "Tashkent",
    to: "Customer",
  },
  {
    id: 3,
    date: "2024-12-14 16:45",
    product: "USB Hub 7-port",
    type: "Ko'chirish",
    quantity: 30,
    from: "Tashkent",
    to: "Bukhara",
  },
  {
    id: 4,
    date: "2024-12-14 11:20",
    product: "Optik Sichqoncha",
    type: "Inventarizatsiya",
    quantity: 5,
    from: "Tashkent",
    to: "Tashkent",
  },
  {
    id: 5,
    date: "2024-12-13 09:00",
    product: "Wireless Printer",
    type: "Kirim",
    quantity: 10,
    from: "Supplier",
    to: "Tashkent",
  },
];

const getStockColor = (stock: number) => {
  if (stock === 0) return "text-red-600 bg-red-50";
  if (stock < 50) return "text-yellow-600 bg-yellow-50";
  return "text-green-600 bg-green-50";
};

const getMovementTypeColor = (type: string) => {
  switch (type) {
    case "Kirim":
      return "bg-green-50 text-green-700 border border-green-200";
    case "Chiqim":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "Ko'chirish":
      return "bg-purple-50 text-purple-700 border border-purple-200";
    case "Inventarizatsiya":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200";
  }
};

const Warehouse = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState("Tashkent");

  const warehouses = Array.from(new Set(stockData.map((s) => s.warehouse)));
  const filteredStock = stockData.filter((s) => s.warehouse === selectedWarehouse);

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ombor</h1>
            <p className="text-sm text-gray-600 mt-1">
              Omborlarni va qoldiqlarni boshqaring
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Ko'chirish
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md gap-2"
            >
              <Plus className="h-4 w-4" />
              Inventarizatsiya
            </Button>
          </div>
        </div>

        {/* Warehouse Selector */}
        <div className="flex gap-2 flex-wrap">
          {warehouses.map((warehouse) => (
            <Button
              key={warehouse}
              onClick={() => setSelectedWarehouse(warehouse)}
              variant={
                selectedWarehouse === warehouse ? "default" : "outline"
              }
              className={`rounded-md ${selectedWarehouse === warehouse
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
            >
              {warehouse}
            </Button>
          ))}
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mahsulot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Ombor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Qoldiq
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Rezerv
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mavjud
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 wrap-text">
                      {item.product}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.warehouse}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${getStockColor(
                          item.stock
                        )}`}
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-orange-600 font-medium">
                      {item.reserved}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600 font-medium">
                      {item.available}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Movement Log */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Inventar harakatlari
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Sana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Mahsulot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Turi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Miqdor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Manba
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Maqsad
                  </th>
                </tr>
              </thead>
              <tbody>
                {movementLog.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movement.date}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {movement.product}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${getMovementTypeColor(
                          movement.type
                        )}`}
                      >
                        {movement.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {movement.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movement.from}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movement.to}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Warehouse;
