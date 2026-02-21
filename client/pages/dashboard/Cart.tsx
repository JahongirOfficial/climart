import { Layout } from "@/components/Layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Barcode,
  CreditCard,
  Banknote,
  UserCircle,
  Warehouse,
  X,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { usePartners } from "@/hooks/usePartners";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { useToast } from "@/hooks/use-toast";
import { printCustomerReceipt } from "@/utils/print";

interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  discount: number;
  total: number;
  availableQty: number;
}

const Cart = () => {
  const { products } = useProducts();
  const { partners } = usePartners("customer");
  const { warehouses } = useWarehouses();
  const { createInvoice } = useCustomerInvoices();
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount
  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  // Set default warehouse
  useEffect(() => {
    if (warehouses.length > 0 && !warehouseId) {
      setWarehouseId(warehouses[0]._id);
    }
  }, [warehouses, warehouseId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(Math.round(amount)) + " so'm";
  };

  // Search products by name/sku/barcode
  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term)
    );
  });

  const addToCart = useCallback(
    (product: any) => {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.productId === product._id);
        if (existing) {
          return prev.map((item) =>
            item.productId === product._id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  total: (item.quantity + 1) * item.sellingPrice * (1 - item.discount / 100),
                }
              : item
          );
        }

        // Get available quantity from warehouse
        const warehouseStock = product.stockByWarehouse?.find(
          (sw: any) => sw.warehouse?.toString() === warehouseId || sw.warehouse?._id?.toString() === warehouseId
        );
        const availableQty = warehouseStock ? warehouseStock.quantity : product.quantity;

        return [
          ...prev,
          {
            productId: product._id,
            productName: product.name,
            sku: product.sku || "",
            unit: product.unit || "dona",
            quantity: 1,
            costPrice: product.costPrice || 0,
            sellingPrice: product.sellingPrice || 0,
            discount: 0,
            total: product.sellingPrice || 0,
            availableQty,
          },
        ];
      });
      setSearchTerm("");
      setShowSearch(false);
      barcodeRef.current?.focus();
    },
    [warehouseId]
  );

  // Handle barcode scan (Enter key)
  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim();
    // Search locally first
    const found = products.find(
      (p) => p.barcode === code || p.sku === code
    );

    if (found) {
      addToCart(found);
      setBarcodeInput("");
    } else {
      // Try API search
      try {
        const product = await api.get(`/api/products/search/barcode/${encodeURIComponent(code)}`);
        addToCart(product as any);
        setBarcodeInput("");
      } catch {
        toast({
          title: "Topilmadi",
          description: `"${code}" bilan mahsulot topilmadi`,
          variant: "destructive",
        });
        setBarcodeInput("");
      }
    }
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQty,
              total: newQty * item.sellingPrice * (1 - item.discount / 100),
            }
          : item
      )
    );
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              discount,
              total: item.quantity * item.sellingPrice * (1 - discount / 100),
            }
          : item
      )
    );
  };

  const updatePrice = (productId: string, price: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              sellingPrice: price,
              total: item.quantity * price * (1 - item.discount / 100),
            }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setCustomerId("");
    setCustomerName("");
    barcodeRef.current?.focus();
  };

  // Totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.sellingPrice,
    0
  );
  const discountTotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.sellingPrice * (item.discount / 100),
    0
  );
  const grandTotal = subtotal - discountTotal;

  // Handle sale
  const handleSale = async (withPayment: boolean) => {
    if (cartItems.length === 0) {
      toast({ title: "Xatolik", description: "Savat bo'sh", variant: "destructive" });
      return;
    }

    if (!warehouseId) {
      toast({ title: "Xatolik", description: "Ombor tanlang", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const invoiceData = {
        customer: customerId || undefined,
        customerName: customerName || "Naqd mijoz",
        warehouse: warehouseId,
        invoiceDate: new Date().toISOString(),
        items: cartItems.map((item) => ({
          product: item.productId,
          productName: item.productName,
          warehouse: warehouseId,
          quantity: item.quantity,
          unit: item.unit,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          discount: item.discount,
          discountAmount: Math.round(item.quantity * item.sellingPrice * (item.discount / 100)),
          total: Math.round(item.total),
        })),
        totalAmount: Math.round(subtotal),
        discountTotal: Math.round(discountTotal),
        finalAmount: Math.round(grandTotal),
        paidAmount: withPayment ? Math.round(grandTotal) : 0,
        status: withPayment ? "paid" : "unpaid",
        paymentMethod: withPayment ? paymentMethod : undefined,
      };

      const result: any = await createInvoice(invoiceData as any);
      const invoice = result?.invoice || result;

      toast({
        title: "Muvaffaqiyatli",
        description: `Sotuv amalga oshirildi: ${invoice?.invoiceNumber || ""}`,
      });

      // Print receipt
      if (invoice) {
        try {
          printCustomerReceipt(invoice);
        } catch {
          // Silent fail for print
        }
      }

      // Show warnings if any
      if (result?.warnings && result.warnings.length > 0) {
        result.warnings.forEach((w: string) => {
          toast({ title: "Ogohlantirish", description: w, variant: "destructive" });
        });
      }

      clearCart();
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error?.message || "Sotuv amalga oshirilmadi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Side - Product Search & Cart */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner Input */}
            <Card className="p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    ref={barcodeRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBarcodeScan();
                      }
                    }}
                    placeholder="Barcode yoki SKU skanerlang..."
                    className="pl-10 text-lg h-12"
                  />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12"
                  onClick={() => {
                    setShowSearch(!showSearch);
                    setTimeout(() => searchRef.current?.focus(), 100);
                  }}
                >
                  <Search className="h-5 w-5 mr-2" />
                  Qidirish
                </Button>
              </div>

              {/* Product Search Dropdown */}
              {showSearch && (
                <div className="mt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      ref={searchRef}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Mahsulot nomi, SKU yoki barcode bo'yicha qidiring..."
                      className="pl-9"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => { setSearchTerm(""); setShowSearch(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                  {searchTerm && (
                    <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Mahsulot topilmadi
                        </div>
                      ) : (
                        filteredProducts.slice(0, 20).map((product) => (
                          <button
                            key={product._id}
                            onClick={() => addToCart(product)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-0 text-left"
                          >
                            <div>
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">
                                {product.sku && `SKU: ${product.sku}`}
                                {product.barcode && ` | Barcode: ${product.barcode}`}
                                {` | Qoldiq: ${product.quantity} ${product.unit}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm text-blue-600">
                                {formatCurrency(product.sellingPrice)}
                              </div>
                              <Plus className="h-4 w-4 text-green-600 ml-auto" />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Cart Items Table */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-gray-600" />
                  <h2 className="font-semibold text-gray-900">
                    Savat ({cartItems.length} ta mahsulot)
                  </h2>
                </div>
                {cartItems.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Tozalash
                  </Button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Savat bo'sh</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Barcode skanerlang yoki mahsulot qidiring
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Mahsulot
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Miqdor
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Narx
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Chegirma %
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Jami
                        </th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, index) => (
                        <tr key={item.productId} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                            <div className="text-xs text-gray-500">
                              {item.sku && `SKU: ${item.sku} | `}
                              Qoldiq: {item.availableQty} {item.unit}
                            </div>
                            {item.quantity > item.availableQty && (
                              <span className="text-xs text-red-600 font-medium">
                                Yetarli emas!
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(item.productId, Number(e.target.value) || 0)
                                }
                                className="w-16 h-7 text-center text-sm"
                                min={0}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={item.sellingPrice}
                              onChange={(e) =>
                                updatePrice(item.productId, Number(e.target.value) || 0)
                              }
                              className="w-28 h-7 text-right text-sm"
                              min={0}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) =>
                                updateDiscount(
                                  item.productId,
                                  Math.min(100, Math.max(0, Number(e.target.value) || 0))
                                )
                              }
                              className="w-16 h-7 text-center text-sm"
                              min={0}
                              max={100}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-bold">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700"
                              onClick={() => removeItem(item.productId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right Side - Payment Panel */}
          <div className="space-y-4">
            {/* Customer Selection */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <UserCircle className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Mijoz</h3>
              </div>
              <Select
                value={customerId}
                onValueChange={(val) => {
                  setCustomerId(val);
                  const partner = partners.find((p: any) => p._id === val);
                  setCustomerName(partner?.name || "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mijoz tanlang (ixtiyoriy)" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner: any) => (
                    <SelectItem key={partner._id} value={partner._id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!customerId && (
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Yoki mijoz ismini kiriting..."
                  className="text-sm"
                />
              )}
            </Card>

            {/* Warehouse Selection */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Warehouse className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Ombor</h3>
              </div>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Ombor tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh._id} value={wh._id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {/* Payment Method */}
            <Card className="p-4 space-y-3">
              <Label className="font-semibold text-gray-900">To'lov usuli</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote className="h-5 w-5" />
                  <span className="text-xs">Naqd</span>
                </Button>
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setPaymentMethod("card")}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Karta</span>
                </Button>
                <Button
                  variant={paymentMethod === "transfer" ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setPaymentMethod("transfer")}
                >
                  <Banknote className="h-5 w-5" />
                  <span className="text-xs">O'tkazma</span>
                </Button>
              </div>
            </Card>

            {/* Totals */}
            <Card className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Mahsulotlar ({cartItems.length}):</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Chegirma:</span>
                    <span>-{formatCurrency(discountTotal)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-xl font-bold">
                  <span>Jami:</span>
                  <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
                disabled={cartItems.length === 0 || isSubmitting}
                onClick={() => handleSale(true)}
              >
                <Banknote className="h-6 w-6 mr-2" />
                Sotish va to'lov qabul qilish
              </Button>
              <Button
                variant="outline"
                className="w-full h-12"
                disabled={cartItems.length === 0 || isSubmitting}
                onClick={() => handleSale(false)}
              >
                Qarzga sotish
              </Button>
            </div>

            {/* Keyboard Shortcuts Info */}
            <Card className="p-3 bg-gray-50">
              <p className="text-xs text-gray-500 font-medium mb-1">Tezkor tugmalar:</p>
              <div className="space-y-0.5 text-xs text-gray-400">
                <p><kbd className="px-1 bg-white border rounded text-gray-600">Enter</kbd> — Barcode qidirish</p>
                <p><kbd className="px-1 bg-white border rounded text-gray-600">F2</kbd> — Qidirish oynasi</p>
                <p><kbd className="px-1 bg-white border rounded text-gray-600">F8</kbd> — Sotish</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Global keyboard shortcuts */}
      <KeyboardShortcuts
        onSearch={() => {
          setShowSearch(true);
          setTimeout(() => searchRef.current?.focus(), 100);
        }}
        onSale={() => {
          if (cartItems.length > 0 && !isSubmitting) handleSale(true);
        }}
      />
    </Layout>
  );
};

// Keyboard shortcuts component
function KeyboardShortcuts({
  onSearch,
  onSale,
}: {
  onSearch: () => void;
  onSale: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        onSearch();
      }
      if (e.key === "F8") {
        e.preventDefault();
        onSale();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSearch, onSale]);

  return null;
}

export default Cart;
