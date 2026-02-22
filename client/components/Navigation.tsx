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
  Moon,
  Sun,
  LogOut,
  CircleUser,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTelegramModal } from "@/contexts/TelegramContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const allModules = [
  { id: "dashboard", name: "Ko'rsatkichlar", icon: BarChart3, path: "/", hasSubmenu: true, adminOnly: false },
  { id: "purchases", name: "Xaridlar", icon: ShoppingCart, path: "/purchases", hasSubmenu: true, adminOnly: false },
  { id: "sales", name: "Savdo", icon: TrendingUp, path: "/sales", hasSubmenu: true, adminOnly: false },
  { id: "products", name: "Tovarlar", icon: Package, path: "/products", hasSubmenu: true, adminOnly: false },
  { id: "contacts", name: "Kontragentlar", icon: Users, path: "/contacts", hasSubmenu: true, adminOnly: false },
  { id: "warehouse", name: "Ombor", icon: Warehouse, path: "/warehouse", hasSubmenu: true, adminOnly: false },
  { id: "finance", name: "Pul", icon: Banknote, path: "/finance", hasSubmenu: true, adminOnly: false },
  { id: "retail", name: "Chakana", icon: Store, path: "/retail", hasSubmenu: true, adminOnly: false },
  { id: "tasks", name: "Vazifalar", icon: CheckSquare, path: "/tasks", hasSubmenu: true, adminOnly: false },
  { id: "employees", name: "Xodimlar", icon: UserCog, path: "/employees", hasSubmenu: true, adminOnly: true },
];

const dashboardSubMenu = [
  { id: "indicators", name: "Ko'rsatkichlar", path: "/dashboard/indicators" },
  { id: "documents", name: "Hujjatlar", path: "/dashboard/documents" },
  { id: "cart", name: "Korzina", path: "/dashboard/cart" },
  { id: "audit", name: "Audit", path: "/dashboard/audit" },
  { id: "files", name: "Fayllar", path: "/dashboard/files" },
  { id: "currencies", name: "Valyutalar", path: "/dashboard/currencies" },
];

const purchasesSubMenu = [
  { id: "orders", name: "Buyurtmalar", path: "/purchases/orders" },
  { id: "suppliers-accounts", name: "To'lovlar", path: "/purchases/suppliers-accounts" },
  { id: "receipts", name: "Qabul qilish", path: "/purchases/receipts" },
  { id: "returns", name: "Qaytarish", path: "/purchases/returns" },
  { id: "received-invoices", name: "Schot-fakturalar", path: "/purchases/received-invoices" },
  { id: "procurement", name: "Zakazlar", path: "/purchases/procurement" },
  { id: "my-debts", name: "Qarzlarim", path: "/purchases/my-debts" },
];

const salesSubMenu = [
  { id: "customer-orders", name: "Mijoz buyurtmalari", path: "/sales/customer-orders" },
  { id: "customer-invoices", name: "Hisob-fakturalar", path: "/sales/customer-invoices" },
  { id: "shipments", name: "Otgruzka", path: "/sales/shipments" },
  { id: "tax-invoices", name: "Schot-fakturalar", path: "/sales/tax-invoices" },
  { id: "customer-debts", name: "Qarzdorlar", path: "/sales/customer-debts" },
  { id: "returns", name: "Qaytarishlar", path: "/sales/returns" },
  { id: "profitability", name: "Foydalilik", path: "/sales/profitability" },
  { id: "pending-invoices", name: "Kutilayotgan", path: "/sales/pending-invoices" },
  { id: "corrected-invoices", name: "Tuzatilgan", path: "/sales/corrected-invoices" },
  { id: "sales-funnel", name: "Voronka", path: "/sales/sales-funnel" },
  { id: "unit-economics", name: "Unit-ekonomika", path: "/sales/unit-economics" },
];

const productsSubMenu = [
  { id: "products-list", name: "Mahsulotlar", path: "/products/list" },
  { id: "services", name: "Xizmatlar", path: "/products/services" },
  { id: "price-lists", name: "Narxlar", path: "/products/price-lists" },
  { id: "serial-numbers", name: "Seriya raqamlar", path: "/products/serial-numbers" },
];

const contactsSubMenu = [
  { id: "partners", name: "Hamkorlar", path: "/contacts/partners" },
  { id: "contracts", name: "Shartnomalar", path: "/contacts/contracts" },
  { id: "telegram", name: "Telegram", path: "/contacts/telegram" },
];

const warehouseSubMenu = [
  { id: "receipt", name: "Kirim", path: "/warehouse/receipt" },
  { id: "writeoff", name: "Chiqim", path: "/warehouse/writeoff" },
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
  { id: "cashflow", name: "Pul aylanmasi", path: "/finance/cashflow" },
  { id: "profit-loss", name: "Foyda va zarar", path: "/finance/profit-loss" },
  { id: "mutual-settlements", name: "Hisob-kitob", path: "/finance/mutual-settlements" },
];

const tasksSubMenu = [
  { id: "my-tasks", name: "Vazifalarim", path: "/tasks/my-tasks" },
];

const retailSubMenu = [
  { id: "channels", name: "Savdo kanallari", path: "/retail/channels" },
  { id: "statistics", name: "Statistika", path: "/retail/statistics" },
];

const employeesSubMenu = [
  { id: "list", name: "Ro'yxat", path: "/employees" },
  { id: "performance", name: "Samaradorlik", path: "/solutions/employee-performance" },
  { id: "kpi", name: "KPI", path: "/solutions/kpi" },
];

// Modulga qarab submenu
const SUBMENU_MAP: Record<string, any[]> = {
  dashboard: dashboardSubMenu,
  purchases: purchasesSubMenu,
  sales: salesSubMenu,
  products: productsSubMenu,
  contacts: contactsSubMenu,
  warehouse: warehouseSubMenu,
  finance: financeSubMenu,
  tasks: tasksSubMenu,
  retail: retailSubMenu,
  employees: employeesSubMenu,
};

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, hasPermission, user, logout, isAuthenticated } = useAuth();
  const { openTelegram } = useTelegramModal();
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Ruxsat etilgan modullar
  const modules = allModules.filter(module => {
    if (module.adminOnly && !isAdmin) return false;
    if (module.id === 'dashboard') return true;
    if (!module.adminOnly && module.id !== 'dashboard') {
      if (isAdmin) return true;
      const hasParent = user?.permissions.includes(module.id);
      const hasAnySub = user?.permissions.some(p => p.startsWith(module.id + '.'));
      return hasParent || hasAnySub;
    }
    return true;
  });

  const filterSubmenuItems = (items: any[], moduleId: string) => {
    if (isAdmin) return items;
    return items.filter(item => {
      const permissionKey = `${moduleId}.${item.id}`;
      return hasPermission(permissionKey);
    });
  };

  // Route ga qarab active submenu ni sinxronlash
  useEffect(() => {
    let newActive: string | null = null;

    if (location.pathname === "/" || location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard")) {
      newActive = "dashboard";
    } else if (location.pathname.startsWith("/purchases")) {
      newActive = "purchases";
    } else if (location.pathname.startsWith("/sales")) {
      newActive = "sales";
    } else if (location.pathname.startsWith("/products")) {
      newActive = "products";
    } else if (location.pathname.startsWith("/contacts")) {
      newActive = "contacts";
    } else if (location.pathname.startsWith("/warehouse")) {
      newActive = "warehouse";
    } else if (location.pathname.startsWith("/finance")) {
      newActive = "finance";
    } else if (location.pathname.startsWith("/tasks")) {
      newActive = "tasks";
    } else if (location.pathname.startsWith("/retail")) {
      newActive = "retail";
    } else if (location.pathname.startsWith("/employees") || location.pathname.startsWith("/solutions")) {
      newActive = "employees";
    }

    if (newActive !== activeSubmenu) {
      setActiveSubmenu(newActive);
    }
  }, [location.pathname]);

  const handleModuleClick = (moduleId: string, hasSubmenu: boolean, path: string) => {
    if (hasSubmenu) {
      setActiveSubmenu(moduleId);
    } else {
      setActiveSubmenu(null);
      navigate(path);
    }
  };

  const submenuItems = activeSubmenu ? SUBMENU_MAP[activeSubmenu] || [] : [];
  const filteredSubmenu = activeSubmenu ? filterSubmenuItems(submenuItems, activeSubmenu) : [];

  return (
    <nav className="sticky top-0 z-50 w-full">
      {/* ===== ASOSIY BAR — MoySklad uslubida ko'k fon ===== */}
      <div className="bg-[#1a6fc4] dark:bg-gray-950">
        <div className="flex items-center h-12 px-2 gap-0.5 overflow-x-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 px-2 mr-1 shrink-0">
            <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-xs">CE</span>
            </div>
          </Link>

          {/* Module tugmalari */}
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = module.id === activeSubmenu;

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => handleModuleClick(module.id, module.hasSubmenu, module.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-[64px] h-11 rounded transition-all shrink-0",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                <span className="text-[10px] font-medium leading-tight whitespace-nowrap">{module.name}</span>
              </button>
            );
          })}

          {/* O'ng tomon — user info */}
          <div className="flex-1" />

          <div className="flex items-center gap-1 shrink-0">
            {/* Help */}
            <button className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10" title="Yordam">
              <HelpCircle style={{ width: 16, height: 16 }} />
            </button>

            {/* Dark mode */}
            <button
              className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10"
              onClick={toggleDarkMode}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
            </button>

            {/* User */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 text-white">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-medium leading-tight">{user.firstName}</div>
                      <div className="text-[10px] text-white/60 leading-tight">
                        {user.role === 'admin' ? 'admin' : 'xodim'}@{user.username}
                      </div>
                    </div>
                    <CircleUser style={{ width: 22, height: 22 }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.phoneNumber}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <CircleUser style={{ width: 22, height: 22 }} className="text-white/60" />
            )}
          </div>
        </div>
      </div>

      {/* ===== SUB-MENYU — tablar + doimiy filtr ===== */}
      {activeSubmenu && filteredSubmenu.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center px-2">
            {/* Tablar — chap tomon, skroll */}
            <div className="overflow-x-auto flex-1">
              <div className="flex gap-0 min-w-min">
                {filteredSubmenu.map((item: any) => {
                  const isSubActive = location.pathname === item.path;

                  // Telegram maxsus handler
                  if (activeSubmenu === 'contacts' && item.id === 'telegram') {
                    return (
                      <button
                        key={item.id}
                        onClick={() => openTelegram()}
                        className="px-3 py-2 text-sm font-medium whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent transition-colors"
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
                        "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                        isSubActive
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </nav>
  );
};
