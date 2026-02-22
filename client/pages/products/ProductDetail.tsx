import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useModal } from "@/contexts/ModalContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { useProductDetail } from "@/hooks/useProductDetail";
import { useDocumentNavigation } from "@/hooks/useDocumentNavigation";
import { Trash2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DocumentDetailLayout } from "@/components/shared/DocumentDetailLayout";
import { formatCurrency } from "@/lib/format";
import type { StatusConfig } from "@/components/shared/StatusBadge";

// Mahsulot status konfiguratsiyasi
const PRODUCT_STATUS_CONFIG: Record<string, StatusConfig> = {
  active:       { label: "Faol",          color: "text-green-800",  bg: "bg-green-100" },
  inactive:     { label: "Nofaol",        color: "text-gray-800",   bg: "bg-gray-100" },
  discontinued: { label: "To'xtatilgan",  color: "text-red-800",    bg: "bg-red-100" },
};

// O'lchov birligi opsiyalari
const unitOptions: ComboboxOption[] = [
  { value: "dona", label: "dona" },
  { value: "kg", label: "kg" },
  { value: "litr", label: "litr" },
  { value: "metr", label: "metr" },
  { value: "m2", label: "m2" },
  { value: "m3", label: "m3" },
  { value: "qadoq", label: "qadoq" },
  { value: "komplekt", label: "komplekt" },
];

// Turi opsiyalari
const unitTypeOptions: ComboboxOption[] = [
  { value: "count", label: "Sanaladigan" },
  { value: "uncount", label: "Sanalmaydigan" },
];

// Holat opsiyalari
const statusOptions: ComboboxOption[] = [
  { value: "active", label: "Faol" },
  { value: "inactive", label: "Nofaol" },
  { value: "discontinued", label: "To'xtatilgan" },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const { showWarning, showError } = useModal();

  const { product, loading, save, saving, deleteProduct, refetch } = useProductDetail(id);
  const nav = useDocumentNavigation("products", "/products/list");

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    brand: "",
    unit: "dona",
    unitType: "count" as string,
    weight: 0,
    weightUnit: "kg",
    country: "",
    costPrice: 0,
    sellingPrice: 0,
    minStock: 0,
    minQuantity: 0,
    status: "active" as string,
    description: "",
  });

  // Mahsulot yuklanganida formani to'ldirish
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category: product.category || "",
        brand: product.brand || "",
        unit: product.unit || "dona",
        unitType: product.unitType || "count",
        weight: product.weight || 0,
        weightUnit: product.weightUnit || "kg",
        country: product.country || "",
        costPrice: product.costPrice || 0,
        sellingPrice: product.sellingPrice || 0,
        minStock: product.minStock || 0,
        minQuantity: product.minQuantity || 0,
        status: product.status || "active",
        description: product.description || "",
      });
    }
  }, [product]);

  // ===== SAQLASH =====
  const handleSave = async () => {
    if (!formData.name) {
      showWarning("Iltimos, mahsulot nomini kiriting!");
      return;
    }
    if (!formData.costPrice && formData.costPrice !== 0) {
      showWarning("Iltimos, tan narxni kiriting!");
      return;
    }
    if (!formData.sellingPrice && formData.sellingPrice !== 0) {
      showWarning("Iltimos, sotuv narxni kiriting!");
      return;
    }
    try {
      const result = await save(formData);

      if (isNew) {
        const newId = result._id;
        if (newId) {
          navigate(`/products/list/${newId}`, { replace: true });
        }
      } else {
        refetch();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Noma'lum xatolik");
    }
  };

  // ===== O'CHIRISH =====
  const handleDelete = async () => {
    if (!confirm("Mahsulotni o'chirishni xohlaysizmi?")) return;
    try {
      await deleteProduct();
      navigate("/products/list");
    } catch {
      showError("O'chirishda xatolik");
    }
  };

  // Yuklanmoqda
  if (loading && !isNew) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DocumentDetailLayout
      title="Mahsulot"
      documentNumber={product?.sku || product?.name}
      isNew={isNew}
      listUrl="/products/list"
      currentIndex={nav.currentIndex}
      totalCount={nav.totalCount}
      hasPrev={nav.hasPrev}
      hasNext={nav.hasNext}
      onNavigatePrev={nav.goToPrev}
      onNavigateNext={nav.goToNext}
      onSave={handleSave}
      saving={saving}
      lastModified={product?.updatedAt}

      editActions={!isNew ? [
        { label: "O'chirish", icon: <Trash2 className="h-4 w-4" />, onClick: handleDelete, destructive: true },
      ] : undefined}

      statusBadge={
        <StatusBadge status={formData.status} config={PRODUCT_STATUS_CONFIG} />
      }

      formFields={
        <div className="space-y-4">
          {/* Asosiy maydonlar - 3 ustunli grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
            {/* 1-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">* Nomi</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Mahsulot nomi"
                  className="h-9 text-sm mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                  placeholder="Artikul"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Shtrix kod</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                  placeholder="Shtrix kod"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Kategoriya</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Kategoriya"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Brend</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                  placeholder="Brend"
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            {/* 2-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">* O'lchov birligi</Label>
                <Combobox
                  options={unitOptions}
                  value={formData.unit}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                  placeholder="Birlik tanlang..."
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Turi</Label>
                <Combobox
                  options={unitTypeOptions}
                  value={formData.unitType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, unitType: value }))}
                  placeholder="Tur tanlang..."
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Og'irlik</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.weight || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Og'irlik birligi</Label>
                <Input
                  value={formData.weightUnit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, weightUnit: e.target.value }))}
                  placeholder="kg"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Mamlakat</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="Ishlab chiqaruvchi mamlakat"
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            {/* 3-ustun */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">* Tan narx</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.costPrice || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">* Sotuv narx</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.sellingPrice || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Min. qoldiq</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minStock || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Min. miqdor</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minQuantity || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, minQuantity: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Holat</Label>
                <Combobox
                  options={statusOptions}
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  placeholder="Holat tanlang..."
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>
          </div>

          {/* Tavsif - to'liq kenglik */}
          <div className="pt-2 border-t">
            <Label className="text-xs text-gray-500">Tavsif</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Mahsulot haqida qo'shimcha ma'lumot..."
              className="text-sm mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Ombor qoldiqlari (faqat mavjud mahsulot uchun) */}
          {product && product.stockByWarehouse && product.stockByWarehouse.length > 0 && (
            <div className="pt-2 border-t">
              <Label className="text-xs text-gray-500 mb-2 block">Ombor bo'yicha qoldiq</Label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ombor</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Mavjud</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Rezerv</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Erkin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {product.stockByWarehouse.map((stock, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-gray-700">{stock.warehouseName}</td>
                        <td className="px-3 py-2 text-right">{stock.quantity}</td>
                        <td className="px-3 py-2 text-right text-orange-600">{stock.reserved || 0}</td>
                        <td className="px-3 py-2 text-right text-green-600 font-medium">
                          {stock.quantity - (stock.reserved || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-medium">
                    <tr>
                      <td className="px-3 py-2">Jami</td>
                      <td className="px-3 py-2 text-right">{product.quantity}</td>
                      <td className="px-3 py-2 text-right text-orange-600">{product.reserved || 0}</td>
                      <td className="px-3 py-2 text-right text-green-600">
                        {product.quantity - (product.reserved || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Narx ma'lumoti (faqat mavjud mahsulot uchun) */}
          {product && !isNew && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>
                  Tan narx: <strong className="text-gray-700">{formatCurrency(product.costPrice)}</strong>
                </span>
                <span>
                  Sotuv narx: <strong className="text-gray-700">{formatCurrency(product.sellingPrice)}</strong>
                </span>
                <span>
                  Umumiy qoldiq: <strong className="text-gray-700">{product.quantity} {product.unit}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

export default ProductDetail;
