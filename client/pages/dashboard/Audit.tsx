import { Layout } from "@/components/Layout";
import { useState } from "react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";

const actionLabels: Record<string, string> = {
  create: "Yaratildi",
  update: "Tahrirlandi",
  delete: "O'chirildi",
};

const actionColors: Record<string, string> = {
  create: "bg-green-50 text-green-700 border-green-200",
  update: "bg-blue-50 text-blue-700 border-blue-200",
  delete: "bg-red-50 text-red-700 border-red-200",
};

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
};

const entityLabels: Record<string, string> = {
  CustomerInvoice: "Hisob-faktura",
  Payment: "To'lov",
  Product: "Mahsulot",
  Partner: "Hamkor",
  Receipt: "Kirim",
  Shipment: "Yetkazish",
  CustomerOrder: "Buyurtma",
  CustomerReturn: "Qaytarish",
  SupplierReturn: "Yetkazuvchiga qaytarish",
  Warehouse: "Ombor",
  Contract: "Shartnoma",
  PriceList: "Narxlar ro'yxati",
};

const Audit = () => {
  const [filters, setFilters] = useState({
    entity: "",
    action: "",
    startDate: "",
    endDate: "",
    page: 1,
  });

  const { logs, total, page, pages, loading, refetch } = useAuditLog({
    ...filters,
    limit: 30,
  });

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit trail</h1>
            <p className="text-sm text-gray-600 mt-1">
              Tizimda bajarilgan barcha amallar tarixi ({total} ta yozuv)
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={logs}
              filename="audit-log"
              fieldsToInclude={["userName", "action", "entity", "entityName", "createdAt"]}
            />
            <Button variant="outline" onClick={() => refetch()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Yangilash
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-4 bg-white border rounded-lg shadow-sm">
          <select
            value={filters.entity}
            onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value, page: 1 }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          >
            <option value="">Barcha modullar</option>
            {Object.entries(entityLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          >
            <option value="">Barcha amallar</option>
            <option value="create">Yaratish</option>
            <option value="update">Tahrirlash</option>
            <option value="delete">O'chirish</option>
          </select>

          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value, page: 1 }))}
            className="w-40 text-sm"
            placeholder="Boshlanish"
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value, page: 1 }))}
            className="w-40 text-sm"
            placeholder="Tugash"
          />

          {(filters.entity || filters.action || filters.startDate || filters.endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ entity: "", action: "", startDate: "", endDate: "", page: 1 })}
            >
              Tozalash
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Foydalanuvchi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modul</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hujjat</th>
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Audit yozuvlari topilmadi
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const ActionIcon = actionIcons[log.action] || Pencil;
                    return (
                      <tr key={log._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("uz-UZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {log.userName}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${actionColors[log.action] || "bg-gray-50 text-gray-700"}`}>
                            <ActionIcon className="h-3 w-3" />
                            {actionLabels[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entityLabels[log.entity] || log.entity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {log.entityName}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-sm text-gray-600">
                Sahifa {page} / {pages} (jami {total})
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Audit;
