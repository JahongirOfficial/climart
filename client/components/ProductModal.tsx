import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Product } from "@shared/api";
import { Loader2, Upload, X } from "lucide-react";

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  product?: Product | null;
}

export const ProductModal = ({ open, onClose, onSave, product }: ProductModalProps) => {
  const { showWarning, showError } = useModal();
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    minQuantity: 0,
    unit: "dona",
    unitType: "count" as "count" | "uncount",
    weight: 0,
    weightUnit: "kg",
    description: "",
    image: ""
  });

  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showWarning("Rasm hajmi 2MB dan oshmasligi kerak!");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      reader.onloadend = () => {
        setUploadProgress(100);
        setTimeout(() => {
          setFormData(prev => ({ ...prev, image: reader.result as string }));
          setIsUploading(false);
          setUploadProgress(null);
        }, 500); // Small delay to show 100%
      };

      reader.onerror = () => {
        showError("Rasmni o'qishda xatolik yuz berdi");
        setIsUploading(false);
        setUploadProgress(null);
      };

      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: "" }));
  };

  const generateSKU = () => {
    return `PRD-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku || "",
        category: product.category || "",
        quantity: product.quantity,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        minQuantity: product.minQuantity || 0,
        unit: product.unit || "dona",
        unitType: product.unitType || "count",
        weight: product.weight || 0,
        weightUnit: product.weightUnit || "kg",
        description: product.description || "",
        image: product.image || ""
      });
    } else if (open) {
      setFormData({
        name: "",
        sku: generateSKU(),
        category: "",
        quantity: 0,
        costPrice: 0,
        sellingPrice: 0,
        minQuantity: 0,
        unit: "dona",
        unitType: "count" as "count" | "uncount",
        weight: 0,
        weightUnit: "kg",
        description: "",
        image: ""
      });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.costPrice <= 0 || formData.sellingPrice <= 0) {
      showWarning("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
          </DialogTitle>
          <DialogDescription>
            {product ? "Mahsulot ma'lumotlarini o'zgartiring" : "Yangi mahsulot qo'shing va zaxirani boshqaring"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Mahsulot nomi *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masalan: Kran Grohe Eurosmart"
                required
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="GRH-KRN-001"
              />
            </div>

            <div>
              <Label htmlFor="category">Kategoriya</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Kranlar"
              />
            </div>

            <div>
              <Label htmlFor="quantity">Zaxira miqdori *</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="minQuantity">Minimal miqdor</Label>
              <Input
                id="minQuantity"
                type="number"
                step="any"
                min="0"
                value={formData.minQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="costPrice">Tan narx (so'm) *</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="sellingPrice">Sotuv narxi (so'm) *</Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="unitType">Hisoblash turi</Label>
              <select
                id="unitType"
                value={formData.unitType}
                onChange={(e) => {
                  const newType = e.target.value as 'count' | 'uncount';
                  setFormData(prev => ({
                    ...prev,
                    unitType: newType,
                    unit: newType === 'count' ? 'dona' : prev.weightUnit || 'kg',
                    weight: newType === 'count' ? 0 : prev.weight,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="count">Sanaladigan (dona/ta)</option>
                <option value="uncount">O'lchanadigan (kg/litr...)</option>
              </select>
            </div>

            {formData.unitType === 'count' ? (
              <div>
                <Label htmlFor="unit">O'lchov birligi</Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="dona">dona (ta)</option>
                  <option value="to'plam">to'plam</option>
                </select>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="weightUnit">O'lchov birligi</Label>
                  <select
                    id="weightUnit"
                    value={formData.weightUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, weightUnit: e.target.value, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="kg">kg (kilogramm)</option>
                    <option value="litr">litr</option>
                    <option value="metr">metr</option>
                    <option value="boshqa">boshqa</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="weight">Har bir dona uchun ({formData.weightUnit})</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="any"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    placeholder={`Masalan: 50 ${formData.weightUnit}`}
                  />
                  {formData.weight > 0 && formData.quantity > 0 && (
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      Jami: {formData.quantity} dona × {formData.weight} {formData.weightUnit} = {(formData.quantity * formData.weight).toFixed(2)} {formData.weightUnit}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="col-span-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mahsulot haqida qo'shimcha ma'lumot..."
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="image">Mahsulot rasmi</Label>
              <div className="mt-1 flex items-center gap-4">
                <div
                  className={`flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer text-center relative ${isUploading ? 'bg-gray-50' : ''}`}
                  onClick={() => !isUploading && document.getElementById('image-upload')?.click()}
                >
                  {isUploading ? (
                    <div className="space-y-2">
                      <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin" />
                      <p className="text-sm font-medium text-primary">Yuklanmoqda: {uploadProgress}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[200px] mx-auto overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Rasm yuklash uchun bosing</p>
                    </>
                  )}
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </div>
                {formData.image && (
                  <div className="relative w-20 h-20 border rounded-lg overflow-hidden group">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {product?.qrCode && (
              <div className="p-2 border rounded bg-white">
                <p className="text-[10px] text-gray-400 mb-1">QR Kod</p>
                <img src={product.qrCode} alt="QR Code" className="w-24 h-24" />
              </div>
            )}

            {formData.costPrice > 0 && formData.sellingPrice > 0 && (
              <div className="flex-1 p-3 bg-blue-50 rounded-lg self-end">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Foyda:</span>
                  <span className="font-semibold text-blue-700">
                    {new Intl.NumberFormat('uz-UZ').format(formData.sellingPrice - formData.costPrice)} so'm
                    ({((formData.sellingPrice - formData.costPrice) / formData.costPrice * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving || isUploading}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yuklanmoqda...
                </>
              ) : (
                product ? "Saqlash" : "Qo'shish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
