import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  BarChart3,
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  Warehouse,
  Banknote,
  CheckSquare,
} from "lucide-react";

const modules = [
  { id: "dashboard", name: "Ko'rsatkichlar", icon: BarChart3, path: "/", hasSubmenu: true },
  { id: "purchases", name: "Xaridlar", icon: ShoppingCart, path: "/purchases", hasSubmenu: true },
  { id: "sales", name: "Savdo", icon: TrendingUp, path: "/sales", hasSubmenu: true },
  { id: "products", name: "Tovarlar", icon: Package, path: "/products", hasSubmenu: true },
  { id: "contacts", name: "Kontragentlar", icon: Users, path: "/contacts", hasSubmenu: true },
  { id: "warehouse", name: "Ombor", icon: Warehouse, path: "/warehouse", hasSubmenu: true },
  { id: "finance", name: "Pul", icon: Banknote, path: "/finance", hasSubmenu: true },
  { id: "tasks", name: "Vazifalar", icon: CheckSquare, path: "/tasks", hasSubmenu: true },
];

const dashboardSubMenu = [
  { id: "indicators", name: "Ko'rsatkichlar", path: "/dashboard/indicators" },
  { id: "documents", name: "Hujjatlar", path: "/dashboard/documents" },
  { id: "cart", name: "Korzina", path: "/dashboard/cart" },
  { id: "audit", name: "Audit", path: "/dashboard/audit" },
  { id: "files", name: "Fayllar", path: "/dashboard/files" },
];

const purchasesSubMenu = [
  { id: "orders", name: "Ta'minotchiga buyurtma yaratish", path: "/purchases/orders" },
  { id: "suppliers-accounts", name: "Taminotchiga to'lov qilish", path: "/purchases/suppliers-accounts" },
  { id: "receipts", name: "Qabul qilish", path: "/purchases/receipts" },
  { id: "returns", name: "Tovar qaytarish", path: "/purchases/returns" },
  { id: "received-invoices", name: "Qabul qilingan schot fakturalar", path: "/purchases/received-invoices" },
  { id: "procurement", name: "Zakazlar bilan ishlash", path: "/purchases/procurement" },
  { id: "my-debts", name: "Mening qarzlarim", path: "/purchases/my-debts" },
];

const salesSubMenu = [
  { id: "customer-orders", name: "Mijozlarning buyurtmalari", path: "/sales/customer-orders" },
  { id: "customer-invoices", name: "Xaridorlarning to'lov fakturalari", path: "/sales/customer-invoices" },
  { id: "shipments", name: "Yuklab yuborish", path: "/sales/shipments" },
  { id: "tax-invoices", name: "Berilgan hisob-fakturalar", path: "/sales/tax-invoices" },
  { id: "customer-debts", name: "Mendan qarzdorlar", path: "/sales/customer-debts" },
  { id: "returns", name: "Tovarni qaytarib olish", path: "/sales/returns" },
  { id: "returns-report", name: "Qaytarilgan mahsulot hisboti", path: "/sales/returns-report" },
  { id: "profitability", name: "Foydalilik", path: "/sales/profitability" },
];

const productsSubMenu = [
  { id: "products-list", name: "Mahsulotlar", path: "/products/list" },
  { id: "services", name: "Xizmatlar", path: "/products/services" },
  { id: "price-lists", name: "Narxlar ro'yhati", path: "/products/price-lists" },
  { id: "serial-numbers", name: "Seriya raqamlar", path: "/products/serial-numbers" },
];

const contactsSubMenu = [
  { id: "partners", name: "Hamkorlar", path: "/contacts/partners" },
  { id: "contracts", name: "Shartnomalar", path: "/contacts/contracts" },
  { id: "telegram", name: "Telegram", path: "/contacts/telegram" },
];

const warehouseSubMenu = [
  { id: "receipt", name: "Kirim qilish", path: "/warehouse/receipt" },
  { id: "expense", name: "Chiqim qilish", path: "/warehouse/expense" },
  { id: "transfer", name: "Ko'chirish", path: "/warehouse/transfer" },
  { id: "writeoff", name: "Xatlov", path: "/warehouse/writeoff" },
  { id: "internal-order", name: "Ichki zakaz", path: "/warehouse/internal-order" },
  { id: "balance", name: "Qoldiq", path: "/warehouse/balance" },
  { id: "turnover", name: "Aylanma", path: "/warehouse/turnover" },
  { id: "warehouses", name: "Omborlar", path: "/warehouse/warehouses" },
];

const financeSubMenu = [
  { id: "payments", name: "To'lovlar", path: "/finance/payments" },
  { id: "cashflow", name: "Pul Aylanmasi", path: "/finance/cashflow" },
  { id: "profit-loss", name: "Foyda va zarar", path: "/finance/profit-loss" },
  { id: "mutual-settlements", name: "O'zaro hisob kitob", path: "/finance/mutual-settlements" },
];

const tasksSubMenu = [
  { id: "add-task", name: "Vazifa qo'shish", path: "/tasks/add" },
  { id: "my-tasks", name: "Mening vazifalarim", path: "/tasks/my-tasks" },
];

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Sync activeSubmenu with current route - only update if section changes
  useEffect(() => {
    let newActiveSubmenu: string | null = null;

    if (location.pathname === "/" || location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard")) {
      newActiveSubmenu = "dashboard";
    } else if (location.pathname.startsWith("/purchases")) {
      newActiveSubmenu = "purchases";
    } else if (location.pathname.startsWith("/sales")) {
      newActiveSubmenu = "sales";
    } else if (location.pathname.startsWith("/products")) {
      newActiveSubmenu = "products";
    } else if (location.pathname.startsWith("/contacts")) {
      newActiveSubmenu = "contacts";
    } else if (location.pathname.startsWith("/warehouse")) {
      newActiveSubmenu = "warehouse";
    } else if (location.pathname.startsWith("/finance")) {
      newActiveSubmenu = "finance";
    } else if (location.pathname.startsWith("/tasks")) {
      newActiveSubmenu = "tasks";
    }

    // Only update if the section actually changed
    if (newActiveSubmenu !== activeSubmenu) {
      setActiveSubmenu(newActiveSubmenu);
    }
  }, [location.pathname]); // Remove activeSubmenu from dependencies

  const handleModuleHover = (moduleId: string, hasSubmenu: boolean) => {
    if (hasSubmenu) {
      setActiveSubmenu(moduleId);
    }
  };

  const handleModuleClick = (moduleId: string, hasSubmenu: boolean, path: string) => {
    if (!hasSubmenu) {
      // Navigate directly for modules without submenu
      setActiveSubmenu(null);
      navigate(path);
    }
  };

  const handleNavLeave = () => {
    // Keep submenu open if we're on a page within that section
    if (location.pathname !== "/" &&
      location.pathname !== "/dashboard" &&
      !location.pathname.startsWith("/dashboard") &&
      !location.pathname.startsWith("/purchases") &&
      !location.pathname.startsWith("/sales") &&
      !location.pathname.startsWith("/products") &&
      !location.pathname.startsWith("/contacts") &&
      !location.pathname.startsWith("/warehouse") &&
      !location.pathname.startsWith("/finance") &&
      !location.pathname.startsWith("/tasks")) {
      setActiveSubmenu(null);
    }
  };

  return (
    <nav className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-colors duration-1000" onMouseLeave={handleNavLeave}>
      <div className="overflow-x-auto">
        <div className="flex gap-1 px-4 py-2 min-w-min">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive =
              (module.id === "dashboard" && activeSubmenu === "dashboard") ||
              (module.id === "purchases" && activeSubmenu === "purchases") ||
              (module.id === "sales" && activeSubmenu === "sales") ||
              (module.id === "products" && activeSubmenu === "products") ||
              (module.id === "contacts" && activeSubmenu === "contacts") ||
              (module.id === "warehouse" && activeSubmenu === "warehouse") ||
              (module.id === "finance" && activeSubmenu === "finance") ||
              (module.id === "tasks" && activeSubmenu === "tasks") ||
              (!module.hasSubmenu && location.pathname === module.path);

            return (
              <button
                key={module.id}
                type="button"
                onMouseEnter={() => handleModuleHover(module.id, module.hasSubmenu)}
                onClick={() => handleModuleClick(module.id, module.hasSubmenu, module.path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap",
                  "border-b-2 border-transparent",
                  isActive
                    ? "border-primary text-primary bg-blue-50 dark:bg-blue-950"
                    : "text-foreground hover:bg-secondary hover:border-gray-300 dark:hover:border-gray-700"
                )}
              >
                <Icon className="h-5 w-5" />
                <div className="text-xs font-medium text-center">
                  {module.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard Submenu */}
      {activeSubmenu === "dashboard" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {dashboardSubMenu.map((item) => {
                const isSubActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded transition-all duration-200 whitespace-nowrap",
                      isSubActive
                        ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Purchases Submenu */}
      {activeSubmenu === "purchases" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {purchasesSubMenu.map((item) => {
                const isSubActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded transition-all duration-200 whitespace-nowrap",
                      isSubActive
                        ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sales Submenu */}
      {activeSubmenu === "sales" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {salesSubMenu.map((item) => {
                const isSubActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded transition-all duration-200 whitespace-nowrap",
                      isSubActive
                        ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Products Submenu */}
      {activeSubmenu === "products" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {productsSubMenu.map((item) => {
                const isSubActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded transition-all duration-200 whitespace-nowrap",
                      isSubActive
                        ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Contacts Submenu */}
      {activeSubmenu === "contacts" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {contactsSubMenu.map((item) => {
                const isSubActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded transition-all duration-200 whitespace-nowrap",
                      isSubActive
                        ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Submenu */}
      {activeSubmenu === "warehouse" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {warehouseSubMenu.map((item) => {
                const isSubActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded transition-all duration-200 whitespace-nowrap",
                      isSubActive
                        ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Finance Submenu */}
      {activeSubmenu === "finance" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {financeSubMenu.map((item) => {
                const isSubActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded transition-all duration-200 whitespace-nowrap",
                      isSubActive
                        ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* Tasks Submenu */}
      {activeSubmenu === "tasks" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {tasksSubMenu.map((item) => {
                const isSubActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded transition-all duration-200 whitespace-nowrap",
                      isSubActive
                        ? "bg-white dark:bg-gray-800 text-primary shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
