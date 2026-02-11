import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, X, CreditCard, QrCode, DollarSign, Search, ShoppingCart, Package } from "lucide-react";
import { useState } from "react";

// Sample products for POS
const posProducts = [
  { id: 1, name: "Noutbuk Pro", price: 1200, sku: "PROD-001", category: "Elektronika" },
  { id: 2, name: "Monitor 24\"", price: 350, sku: "PROD-002", category: "Elektronika" },
  { id: 3, name: "Klaviatura", price: 180, sku: "PROD-003", category: "Aksessuarlar" },
  { id: 4, name: "Sichqoncha", price: 45, sku: "PROD-004", category: "Aksessuarlar" },
  { id: 5, name: "USB Hub", price: 65, sku: "PROD-005", category: "Aksessuarlar" },
  { id: 6, name: "Printer", price: 550, sku: "PROD-006", category: "Elektronika" },
  { id: 7, name: "Monitor Stand", price: 40, sku: "PROD-007", category: "Aksessuarlar" },
  { id: 8, name: "Kabel HDMI", price: 15, sku: "PROD-008", category: "Aksessuarlar" },
  { id: 9, name: "Power Bank", price: 120, sku: "PROD-009", category: "Elektronika" },
  { id: 10, name: "Headphones", price: 95, sku: "PROD-010", category: "Elektronika" },
  { id: 11, name: "Webcam", price: 85, sku: "PROD-011", category: "Elektronika" },
  { id: 12, name: "Speaker", price: 75, sku: "PROD-012", category: "Elektronika" },
];

const Retail = () => {
  const [cart, setCart] = useState<
    Array<{ id: number; name: string; price: number; quantity: number; sku: string }>
  >([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">("cash");
  const [searchTerm, setSearchTerm] = useState("");

  const addToCart = (product: (typeof posProducts)[0]) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        { id: product.id, name: product.name, price: product.price, quantity: 1, sku: product.sku },
      ]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.15; // 15% tax
  const total = subtotal + tax;

  const filteredProducts = posProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckout = () => {
    // Process payment
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
              <h1 className="text-2xl font-bold text-gray-900">Chakana savdo kassasi</h1>
              <p className="text-sm text-gray-500 mt-1">POS tizimi - Tez va oson savdo</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="erp-card px-4 py-2 no-scale">
                <div className="text-xs text-gray-500">Bugungi savdo</div>
                <div className="text-lg font-bold text-gray-900">$12,450</div>
              </div>
              <div className="erp-card px-4 py-2 no-scale">
                <div className="text-xs text-gray-500">Tranzaksiyalar</div>
                <div className="text-lg font-bold text-gray-900">47</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-120px)]">
          {/* Left: Product Grid */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full">
            {/* Search Bar */}
            <div className="erp-card p-4 no-scale">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Mahsulot nomi yoki SKU kodi bo'yicha qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 bg-white focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="erp-card p-4 flex-1 overflow-hidden no-scale">
              <div className="h-full overflow-y-auto pr-2">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="erp-card h-32 flex flex-col items-center justify-center gap-2 p-3 cursor-pointer hover:bg-[#F3F6FA] hover:border-blue-400 transition-all duration-150 ease-in-out no-scale text-left"
                    >
                      <div className="w-10 h-10 bg-blue-50 flex items-center justify-center" style={{ borderRadius: "3px" }}>
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="w-full">
                        <p className="text-sm font-semibold text-gray-900 truncate text-center">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 text-center">{product.sku}</p>
                        <p className="text-lg font-bold text-primary text-center mt-1">
                          ${product.price.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Cart and Payment */}
          <div className="flex flex-col gap-4 h-full">
            {/* Cart Items */}
            <div className="erp-card p-4 flex-1 flex flex-col overflow-hidden no-scale">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Savatcha
                </h2>
                <span className="text-xs bg-blue-50 text-primary px-2 py-1" style={{ borderRadius: "3px" }}>
                  {cart.length} mahsulot
                </span>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-2" style={{ maxHeight: "calc(2 * 120px)" }}>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mb-3" style={{ borderRadius: "4px" }}>
                      <ShoppingCart className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">Savatchada mahsulot yo'q</p>
                    <p className="text-xs text-gray-400 mt-1">Mahsulot qo'shish uchun chapdan tanlang</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 p-3 flex items-start justify-between gap-2 hover:bg-gray-50 transition-colors duration-150"
                      style={{ borderRadius: "3px" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.sku}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          ${item.price.toLocaleString()} × {item.quantity} = 
                          <span className="font-semibold text-gray-900 ml-1">
                            ${(item.price * item.quantity).toLocaleString()}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 border border-gray-300" style={{ borderRadius: "3px" }}>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 transition-colors duration-150 no-scale"
                          >
                            <Minus className="h-3 w-3 text-gray-600" />
                          </button>
                          <span className="text-sm font-medium w-8 text-center text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 transition-colors duration-150 no-scale"
                          >
                            <Plus className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="h-7 w-7 flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors duration-150 no-scale border border-red-200"
                          style={{ borderRadius: "3px" }}
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
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Qo'shimcha:</span>
                    <span className="text-gray-900 font-medium">
                      ${subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Soliq (15%):</span>
                    <span className="text-gray-900 font-medium">
                      ${tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-900">Jami:</span>
                    <span className="text-primary">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Panel - Only Checkout Button */}
            <div className="erp-card p-4 no-scale">
              {/* Checkout Button */}
              <Button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold text-base py-6 mb-2"
              >
                {cart.length > 0 ? `Sotuvni yakunlash - $${total.toFixed(2)}` : "Savatcha bo'sh"}
              </Button>

              {/* Clear Cart */}
              {cart.length > 0 && (
                <Button
                  onClick={() => setCart([])}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Savatni tozalash
                </Button>
              )}
            </div>

            {/* Payment Method Selection */}
            {cart.length > 0 && (
              <div className="erp-card p-4 no-scale">
                <h3 className="text-sm font-bold text-gray-900 mb-3">To'lov usuli</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-150 ease-in-out no-scale border ${
                      paymentMethod === "cash"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-[#F3F6FA] hover:border-blue-400"
                    }`}
                    style={{ borderRadius: "3px" }}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="font-medium">Naqd pul</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-150 ease-in-out no-scale border ${
                      paymentMethod === "card"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-[#F3F6FA] hover:border-blue-400"
                    }`}
                    style={{ borderRadius: "3px" }}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Karta</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod("qr")}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-150 ease-in-out no-scale border ${
                      paymentMethod === "qr"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-[#F3F6FA] hover:border-blue-400"
                    }`}
                    style={{ borderRadius: "3px" }}
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
