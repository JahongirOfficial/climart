import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Auth pages
const Login = lazy(() => import("./pages/Login"));

// Employee pages
const Employees = lazy(() => import("./pages/Employees"));

// Lazy load all pages for better performance
const Purchases = lazy(() => import("./pages/Purchases"));
const Sales = lazy(() => import("./pages/Sales"));
const Products = lazy(() => import("./pages/Products"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Warehouse = lazy(() => import("./pages/Warehouse"));
const Finance = lazy(() => import("./pages/Finance"));
const Retail = lazy(() => import("./pages/Retail"));
const Ecommerce = lazy(() => import("./pages/Ecommerce"));
const Production = lazy(() => import("./pages/Production"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Solutions = lazy(() => import("./pages/Solutions"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Purchase pages
const Orders = lazy(() => import("./pages/purchases/Orders"));
const SuppliersAccounts = lazy(() => import("./pages/purchases/SuppliersAccounts"));
const Receipts = lazy(() => import("./pages/purchases/Receipts"));
const PurchaseReturns = lazy(() => import("./pages/purchases/Returns"));
const ReceivedInvoices = lazy(() => import("./pages/purchases/ReceivedInvoices"));
const Procurement = lazy(() => import("./pages/purchases/Procurement"));
const MyDebts = lazy(() => import("./pages/purchases/MyDebts"));

// Sales pages
const CustomerOrders = lazy(() => import("./pages/sales/CustomerOrders"));
const CustomerInvoices = lazy(() => import("./pages/sales/CustomerInvoices"));
const Shipments = lazy(() => import("./pages/sales/Shipments"));
const TaxInvoices = lazy(() => import("./pages/sales/TaxInvoices"));
const CustomerDebts = lazy(() => import("./pages/sales/CustomerDebts"));
const SalesReturns = lazy(() => import("./pages/sales/Returns"));
const ReturnsReport = lazy(() => import("./pages/sales/ReturnsReport"));
const Profitability = lazy(() => import("./pages/sales/Profitability"));

// Product pages
const ProductsList = lazy(() => import("./pages/products/ProductsList"));
const ProductHistory = lazy(() => import("./pages/products/ProductHistory"));
const Services = lazy(() => import("./pages/products/Services"));
const PriceLists = lazy(() => import("./pages/products/PriceLists"));
const SerialNumbers = lazy(() => import("./pages/products/SerialNumbers"));

// Contact pages
const Partners = lazy(() => import("./pages/contacts/Partners"));
const Contracts = lazy(() => import("./pages/contacts/Contracts"));
const TelegramPage = lazy(() => import("./pages/contacts/Telegram"));

// Warehouse pages
const Receipt = lazy(() => import("./pages/warehouse/Receipt"));
const Expense = lazy(() => import("./pages/warehouse/Expense"));
const Transfer = lazy(() => import("./pages/warehouse/Transfer"));
const Writeoff = lazy(() => import("./pages/warehouse/Writeoff"));
const InternalOrder = lazy(() => import("./pages/warehouse/InternalOrder"));
const Balance = lazy(() => import("./pages/warehouse/Balance"));
const Turnover = lazy(() => import("./pages/warehouse/Turnover"));
const Warehouses = lazy(() => import("./pages/warehouse/Warehouses"));

// Dashboard pages
const Indicators = lazy(() => import("./pages/dashboard/Indicators"));
const Documents = lazy(() => import("./pages/dashboard/Documents"));
const Cart = lazy(() => import("./pages/dashboard/Cart"));
const Audit = lazy(() => import("./pages/dashboard/Audit"));
const Files = lazy(() => import("./pages/dashboard/Files"));

// Finance pages
const Payments = lazy(() => import("./pages/finance/Payments"));
const CashFlow = lazy(() => import("./pages/finance/CashFlow"));
const ProfitLoss = lazy(() => import("./pages/finance/ProfitLoss"));
const MutualSettlements = lazy(() => import("./pages/finance/MutualSettlements"));

// Retail pages
const Channels = lazy(() => import("./pages/retail/Channels"));
const Statistics = lazy(() => import("./pages/retail/Statistics"));

// Task pages
const AddTask = lazy(() => import("./pages/tasks/AddTask"));
const MyTasks = lazy(() => import("./pages/tasks/MyTasks"));

// Solution pages
const AddEmployee = lazy(() => import("./pages/solutions/AddEmployee"));
const EmployeePerformance = lazy(() => import("./pages/solutions/EmployeePerformance"));
const KPI = lazy(() => import("./pages/solutions/KPI"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SidebarProvider>
          <ModalProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Public route */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Admin only routes */}
                  <Route path="/employees" element={<Employees />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={<Indicators />} />
                <Route path="/dashboard" element={<Indicators />} />
                <Route path="/dashboard/indicators" element={<Indicators />} />
                <Route path="/dashboard/documents" element={<Documents />} />
                <Route path="/dashboard/cart" element={<Cart />} />
                <Route path="/dashboard/audit" element={<Audit />} />
                <Route path="/dashboard/files" element={<Files />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/purchases/orders" element={<Orders />} />
                <Route path="/purchases/suppliers-accounts" element={<SuppliersAccounts />} />
                <Route path="/purchases/receipts" element={<Receipts />} />
                <Route path="/purchases/returns" element={<PurchaseReturns />} />
                <Route path="/purchases/received-invoices" element={<ReceivedInvoices />} />
                <Route path="/purchases/procurement" element={<Procurement />} />
                <Route path="/purchases/my-debts" element={<MyDebts />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/sales/customer-orders" element={<CustomerOrders />} />
                <Route path="/sales/customer-invoices" element={<CustomerInvoices />} />
                <Route path="/sales/shipments" element={<Shipments />} />
                <Route path="/sales/tax-invoices" element={<TaxInvoices />} />
                <Route path="/sales/customer-debts" element={<CustomerDebts />} />
                <Route path="/sales/returns" element={<SalesReturns />} />
                <Route path="/sales/returns-report" element={<ReturnsReport />} />
                <Route path="/sales/profitability" element={<Profitability />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/list" element={<ProductsList />} />
                <Route path="/products/history/:id" element={<ProductHistory />} />
                <Route path="/products/services" element={<Services />} />
                <Route path="/products/price-lists" element={<PriceLists />} />
                <Route path="/products/serial-numbers" element={<SerialNumbers />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/contacts/partners" element={<Partners />} />
                <Route path="/contacts/contracts" element={<Contracts />} />
                <Route path="/contacts/telegram" element={<TelegramPage />} />
                <Route path="/warehouse" element={<Warehouse />} />
                <Route path="/warehouse/receipt" element={<Receipt />} />
                <Route path="/warehouse/expense" element={<Expense />} />
                <Route path="/warehouse/transfer" element={<Transfer />} />
                <Route path="/warehouse/writeoff" element={<Writeoff />} />
                <Route path="/warehouse/internal-order" element={<InternalOrder />} />
                <Route path="/warehouse/balance" element={<Balance />} />
                <Route path="/warehouse/turnover" element={<Turnover />} />
                <Route path="/warehouse/warehouses" element={<Warehouses />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/finance/payments" element={<Payments />} />
                <Route path="/finance/cashflow" element={<CashFlow />} />
                <Route path="/finance/profit-loss" element={<ProfitLoss />} />
                <Route path="/finance/mutual-settlements" element={<MutualSettlements />} />
                <Route path="/retail" element={<Retail />} />
                <Route path="/retail/channels" element={<Channels />} />
                <Route path="/retail/statistics" element={<Statistics />} />
                <Route path="/ecommerce" element={<Ecommerce />} />
                <Route path="/production" element={<Production />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/add" element={<AddTask />} />
                <Route path="/tasks/my-tasks" element={<MyTasks />} />
                <Route path="/solutions" element={<Solutions />} />
                <Route path="/solutions/add-employee" element={<AddEmployee />} />
                <Route path="/solutions/employee-performance" element={<EmployeePerformance />} />
                <Route path="/solutions/kpi" element={<KPI />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ModalProvider>
      </SidebarProvider>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
