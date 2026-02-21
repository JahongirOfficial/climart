import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Minus, X, CreditCard, QrCode, DollarSign, Search, ShoppingCart, Package } from "lucide-react";
import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@shared/api";

/** Format monetary value in UZS */
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("uz-UZ") + " so'm";
};

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

const Retail = () => {
  const { products, loading } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">("cash");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item._id === product._id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          _id: product._id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
          sku: product.sku || "-",
        },
      ]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item._id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  const handleCheckout = () => {
    setCart([]);
    setPaymentMethod("cash");
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 h-[calc(100vh-4rem)] max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chakana savdo kassasi</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">POS tizimi - Tez va oson savdo</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-4 py-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">Mahsulotlar</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{products.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-120px)]">
          {/* Left: Product Grid */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full">
            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Mahsulot nomi, SKU yoki shtrix-kod bo'yicha qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-visible:ring-blue-500 dark:text-white"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto pr-2">
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-md h-32 p-3 flex flex-col items-center justify-center gap-2">
                        <Skeleton className="w-10 h-10 rounded-md" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mahsulotlar topilmadi</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredProducts.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => addToCart(product)}
                        className="border border-gray-200 dark:border-gray-700 rounded-md h-32 flex flex-col items-center justify-center gap-2 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left"
                      >
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center rounded-md">
                          <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="w-full">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate text-center">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{product.sku || "-"}</p>
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 text-center mt-1">
                            {formatCurrency(product.sellingPrice)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Cart and Payment */}
          <div className="flex flex-col gap-4 h-full">
            {/* Cart Items */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Savatcha
                </h2>
                <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">
                  {cart.length} mahsulot
                </span>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-2" style={{ maxHeight: "calc(2 * 120px)" }}>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 rounded-md">
                      <ShoppingCart className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Savatchada mahsulot yo'q</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Mahsulot qo'shish uchun chapdan tanlang</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item._id}
                      className="border border-gray-200 dark:border-gray-700 p-3 rounded-md flex items-start justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.sku}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {formatCurrency(item.price)} x {item.quantity} ={" "}
                          <span className="font-semibold text-gray-900 dark:text-white ml-1">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-l-md"
                          >
                            <Minus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                          <span className="text-sm font-medium w-8 text-center text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-r-md"
                          >
                            <Plus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="h-7 w-7 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-md border border-red-200 dark:border-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Jami:</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Panel */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <Button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 text-white font-bold text-base py-6 mb-2"
              >
                {cart.length > 0 ? `Sotuvni yakunlash - ${formatCurrency(total)}` : "Savatcha bo'sh"}
              </Button>

              {cart.length > 0 && (
                <Button
                  onClick={() => setCart([])}
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Savatni tozalash
                </Button>
              )}
            </div>

            {/* Payment Method Selection */}
            {cart.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">To'lov usuli</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all rounded-md border ${
                      paymentMethod === "cash"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400"
                    }`}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="font-medium">Naqd pul</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all rounded-md border ${
                      paymentMethod === "card"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400"
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Karta</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod("qr")}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all rounded-md border ${
                      paymentMethod === "qr"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400"
                    }`}
                  >
                    <QrCode className="h-5 w-5" />
                    <span className="font-medium">QR kod</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Retail;
