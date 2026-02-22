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
  UserCog,
  Store,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTelegramModal } from "@/contexts/TelegramContext";

const allModules = [
  { id: "dashboard", name: "Ko'rsatkichlar", icon: BarChart3, path: "/", hasSubmenu: true, adminOnly: false },
  { id: "purchases", name: "Xaridlar", icon: ShoppingCart, path: "/purchases", hasSubmenu: true, adminOnly: false },
  { id: "sales", name: "Savdo", icon: TrendingUp, path: "/sales", hasSubmenu: true, adminOnly: false },
  { id: "products", name: "Tovarlar", icon: Package, path: "/products", hasSubmenu: true, adminOnly: false },
  { id: "contacts", name: "Kontragentlar", icon: Users, path: "/contacts", hasSubmenu: true, adminOnly: false },
  { id: "warehouse", name: "Ombor", icon: Warehouse, path: "/warehouse", hasSubmenu: true, adminOnly: false },
  { id: "finance", name: "Pul", icon: Banknote, path: "/finance", hasSubmenu: true, adminOnly: false },
  { id: "tasks", name: "Vazifalar", icon: CheckSquare, path: "/tasks", hasSubmenu: true, adminOnly: false },
  { id: "retail", name: "Chakana savdo", icon: Store, path: "/retail", hasSubmenu: true, adminOnly: false },
  { id: "employees", name: "Xodimlar", icon: UserCog, path: "/employees", hasSubmenu: true, adminOnly: true },
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
  { id: "pending-invoices", name: "Kutilayotgan fakturalar", path: "/sales/pending-invoices" },
  { id: "corrected-invoices", name: "Tuzatilgan fakturalar", path: "/sales/corrected-invoices" },
  { id: "sales-funnel", name: "Savdo voronkasi", path: "/sales/sales-funnel" },
  { id: "unit-economics", name: "Unit ekonomika", path: "/sales/unit-economics" },
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
  { id: "writeoff", name: "Chiqim qilish", path: "/warehouse/writeoff" },
  { id: "transfer", name: "Ko'chirish", path: "/warehouse/transfer" },
  { id: "expense", name: "Xatlov", path: "/warehouse/expense" },
  { id: "internal-order", name: "Ichki zakaz", path: "/warehouse/internal-order" },
  { id: "inventory", name: "Inventarizatsiya", path: "/warehouse/inventory" },
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
  { id: "my-tasks", name: "Mening vazifalarim", path: "/tasks/my-tasks" },
];

const retailSubMenu = [
  { id: "channels", name: "Savdo kanallari", path: "/retail/channels" },
  { id: "statistics", name: "Statistika", path: "/retail/statistics" },
];

const employeesSubMenu = [
  { id: "list", name: "Xodimlar ro'yxati", path: "/employees" },
  { id: "performance", name: "Samaradorlik", path: "/solutions/employee-performance" },
  { id: "kpi", name: "KPI", path: "/solutions/kpi" },
];

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, hasPermission, user } = useAuth();
  const { openTelegram } = useTelegramModal();
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Filter modules based on user role and permissions
  const modules = allModules.filter(module => {
    // Admin only modules
    if (module.adminOnly && !isAdmin) return false;
    
    // Dashboard is always visible
    if (module.id === 'dashboard') return true;
    
    // Check if user has permission for this module (parent or any sub-permission)
    if (!module.adminOnly && module.id !== 'dashboard') {
      if (isAdmin) return true;
      
      // Check if user has parent permission or any sub-permission
      const hasParent = user?.permissions.includes(module.id);
      const hasAnySub = user?.permissions.some(p => p.startsWith(module.id + '.'));
      
      return hasParent || hasAnySub;
    }
    
    return true;
  });

  // Filter submenu items based on permissions
  const filterSubmenuItems = (items: any[], moduleId: string) => {
    if (isAdmin) return items;
    
    return items.filter(item => {
      const permissionKey = `${moduleId}.${item.id}`;
      return hasPermission(permissionKey);
    });
  };

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
    } else if (location.pathname.startsWith("/retail")) {
      newActiveSubmenu = "retail";
    } else if (location.pathname.startsWith("/employees") || location.pathname.startsWith("/solutions")) {
      newActiveSubmenu = "employees";
    }

    // Only update if the section actually changed
    if (newActiveSubmenu !== activeSubmenu) {
      setActiveSubmenu(newActiveSubmenu);
    }
  }, [location.pathname]); // Remove activeSubmenu from dependencies

  const handleModuleClick = (moduleId: string, hasSubmenu: boolean, path: string) => {
    if (hasSubmenu) {
      setActiveSubmenu(moduleId);
    } else {
      // Navigate directly for modules without submenu
      setActiveSubmenu(null);
      navigate(path);
    }
  };



  return (
    <nav className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-colors duration-1000">
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
              (module.id === "retail" && activeSubmenu === "retail") ||
              (module.id === "employees" && activeSubmenu === "employees") ||
              (!module.hasSubmenu && location.pathname === module.path);

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => handleModuleClick(module.id, module.hasSubmenu, module.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[88px] h-[54px] rounded-lg transition-all duration-200 whitespace-nowrap",
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
              {filterSubmenuItems(dashboardSubMenu, 'dashboard').map((item) => {
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
              {filterSubmenuItems(purchasesSubMenu, 'purchases').map((item) => {
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
              {filterSubmenuItems(salesSubMenu, 'sales').map((item) => {
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
              {filterSubmenuItems(productsSubMenu, 'products').map((item) => {
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
              {filterSubmenuItems(contactsSubMenu, 'contacts').map((item) => {
                const isSubActive = location.pathname === item.path;

                // Telegram uchun maxsus handler
                if (item.id === 'telegram') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => openTelegram()}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded transition-all duration-200 whitespace-nowrap",
                        "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                      )}
                    >
                      {item.name}
                    </button>
                  );
                }

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
              {filterSubmenuItems(warehouseSubMenu, 'warehouse').map((item) => {
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
              {filterSubmenuItems(financeSubMenu, 'finance').map((item) => {
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
              {filterSubmenuItems(tasksSubMenu, 'tasks').map((item) => {
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

      {/* Retail Submenu */}
      {activeSubmenu === "retail" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {filterSubmenuItems(retailSubMenu, 'retail').map((item) => {
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

      {/* Employees Submenu */}
      {activeSubmenu === "employees" && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000">
          <div className="overflow-x-auto">
            <div className="flex gap-1 px-4 py-2 min-w-min">
              {employeesSubMenu.map((item) => {
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
