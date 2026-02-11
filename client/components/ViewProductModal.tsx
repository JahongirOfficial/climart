import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/api";
import { X, Package, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface ViewProductModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ViewProductModal = ({ open, onClose, product }: ViewProductModalProps) => {
  if (!product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const getStockStatus = () => {
    if (product.quantity === 0) {
      return { label: "Tugagan", color: "text-red-600", icon: <AlertTriangle className="h-5 w-5" /> };
    } else if (product.minQuantity && product.quantity <= product.minQuantity) {
      return { label: "Kam qolgan", color: "text-yellow-600", icon: <AlertTriangle className="h-5 w-5" /> };
    } else {
      return { label: "Yetarli", color: "text-green-600", icon: <CheckCircle className="h-5 w-5" /> };
    }
  };

  const stockStatus = getStockStatus();
  const profit = product.sellingPrice - product.costPrice;
  const profitMargin = ((profit / product.sellingPrice) * 100).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {product.image && (
              <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg border shadow-sm" />
            )}
            <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color} bg-opacity-10`}>
              {stockStatus.icon}
              {stockStatus.label}
            </span>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">SKU</p>
              <p className="font-semibold text-gray-900">{product.sku || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Kategoriya</p>
              <p className="font-semibold text-gray-900">{product.category || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">O'lchov birligi</p>
              <p className="font-semibold text-gray-900">{product.unit || 'dona'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Yaratilgan sana</p>
              <p className="font-semibold text-gray-900">
                {new Date(product.createdAt).toLocaleDateString('uz-UZ')}
              </p>
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-600" />
              Zaxira ma'lumotlari
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Hozirgi zaxira</p>
                <p className="text-2xl font-bold text-gray-900">
                  {product.quantity} {product.unit || 'dona'}
                </p>
              </div>

              {product.minQuantity && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Minimal miqdor</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {product.minQuantity} {product.unit || 'dona'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-600" />
              Narx ma'lumotlari
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Tan narx:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(product.costPrice)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">Sotuv narxi:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(product.sellingPrice)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                <span className="text-green-700 font-medium">Foyda (1 dona):</span>
                <span className="font-bold text-green-700">{formatCurrency(profit)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                <span className="text-blue-700 font-medium">Foyda foizi:</span>
                <span className="font-bold text-blue-700">{profitMargin}%</span>
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Ombordagi umumiy qiymat:</span>
              </div>
              <span className="text-xl font-bold text-blue-900">
                {formatCurrency(product.quantity * product.costPrice)}
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">Tan narxda hisoblangan</p>
          </div>

          {/* Description */}
          {product.description && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Ta'rif:</p>
              <p className="text-sm text-blue-800">{product.description}</p>
            </div>
          )}

          {/* Warning if low stock */}
          {product.minQuantity && product.quantity <= product.minQuantity && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Ogohlantirish</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Mahsulot zaxirasi minimal miqdordan kam yoki teng. Yangi buyurtma berish tavsiya etiladi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* QR Code */}
          {product.qrCode && (
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-white">
              <p className="text-sm font-medium text-gray-500 mb-2">Mahsulot QR Kodi</p>
              <img src={product.qrCode} alt="Product QR Code" className="w-32 h-32" />
              <p className="text-xs text-gray-400 mt-2">{product.sku}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
