import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TelegramProvider, useTelegramModal } from "@/contexts/TelegramContext";
import { TelegramModal } from "@/components/TelegramModal";
import { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Auth pages
const Login = lazy(() => import("./pages/Login"));
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
const OrderDetail = lazy(() => import("./pages/purchases/OrderDetail"));
const ReceiptDetail = lazy(() => import("./pages/purchases/ReceiptDetail"));
const ReceivedInvoiceDetail = lazy(() => import("./pages/purchases/ReceivedInvoiceDetail"));
const PurchaseReturnDetail = lazy(() => import("./pages/purchases/ReturnDetail"));

// Sales pages
const CustomerOrders = lazy(() => import("./pages/sales/CustomerOrders"));
const CustomerInvoices = lazy(() => import("./pages/sales/CustomerInvoices"));
const PendingInvoices = lazy(() => import("./pages/sales/PendingInvoices"));
const CorrectedInvoices = lazy(() => import("./pages/sales/CorrectedInvoices"));
const Shipments = lazy(() => import("./pages/sales/Shipments"));
const TaxInvoices = lazy(() => import("./pages/sales/TaxInvoices"));
const CustomerDebts = lazy(() => import("./pages/sales/CustomerDebts"));
const SalesReturns = lazy(() => import("./pages/sales/Returns"));
const ReturnsReport = lazy(() => import("./pages/sales/ReturnsReport"));
const Profitability = lazy(() => import("./pages/sales/Profitability"));
const SalesFunnel = lazy(() => import("./pages/sales/SalesFunnel"));
const UnitEconomics = lazy(() => import("./pages/sales/UnitEconomics"));
const CustomerOrderDetail = lazy(() => import("./pages/sales/CustomerOrderDetail"));
const CustomerInvoiceDetail = lazy(() => import("./pages/sales/CustomerInvoiceDetail"));
const ShipmentDetail = lazy(() => import("./pages/sales/ShipmentDetail"));
const ReturnDetail = lazy(() => import("./pages/sales/ReturnDetail"));
const TaxInvoiceDetail = lazy(() => import("./pages/sales/TaxInvoiceDetail"));

// Product pages
const ProductsList = lazy(() => import("./pages/products/ProductsList"));
const ProductHistory = lazy(() => import("./pages/products/ProductHistory"));
const ProductDetail = lazy(() => import("./pages/products/ProductDetail"));
const Services = lazy(() => import("./pages/products/Services"));
const PriceLists = lazy(() => import("./pages/products/PriceLists"));
const SerialNumbers = lazy(() => import("./pages/products/SerialNumbers"));

// Contact pages
const Partners = lazy(() => import("./pages/contacts/Partners"));
const PartnerDetail = lazy(() => import("./pages/contacts/PartnerDetail"));
const Contracts = lazy(() => import("./pages/contacts/Contracts"));
const ContractDetail = lazy(() => import("./pages/contacts/ContractDetail"));
const TelegramPage = lazy(() => import("./pages/contacts/Telegram"));

// Warehouse pages
const Receipt = lazy(() => import("./pages/warehouse/Receipt"));
const Expense = lazy(() => import("./pages/warehouse/Expense"));
const Transfer = lazy(() => import("./pages/warehouse/Transfer"));
const Writeoff = lazy(() => import("./pages/warehouse/Writeoff"));
const InternalOrder = lazy(() => import("./pages/warehouse/InternalOrder"));
const Inventory = lazy(() => import("./pages/warehouse/Inventory"));
const Balance = lazy(() => import("./pages/warehouse/Balance"));
const Turnover = lazy(() => import("./pages/warehouse/Turnover"));
const Warehouses = lazy(() => import("./pages/warehouse/Warehouses"));
const WarehouseReceiptDetail = lazy(() => import("./pages/warehouse/ReceiptDetail"));
const WarehouseTransferDetail = lazy(() => import("./pages/warehouse/TransferDetail"));
const WriteoffDetail = lazy(() => import("./pages/warehouse/WriteoffDetail"));
const InternalOrderDetail = lazy(() => import("./pages/warehouse/InternalOrderDetail"));
const InventoryDetail = lazy(() => import("./pages/warehouse/InventoryDetail"));
const ExpenseDetail = lazy(() => import("./pages/warehouse/ExpenseDetail"));

// Dashboard pages
const Indicators = lazy(() => import("./pages/dashboard/Indicators"));
const Documents = lazy(() => import("./pages/dashboard/Documents"));
const Cart = lazy(() => import("./pages/dashboard/Cart"));
const Audit = lazy(() => import("./pages/dashboard/Audit"));
const Files = lazy(() => import("./pages/dashboard/Files"));

// Finance pages
const Payments = lazy(() => import("./pages/finance/Payments"));
const PaymentDetail = lazy(() => import("./pages/finance/PaymentDetail"));
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
      staleTime: 1000 * 60 * 30, // 30 minutes - data stays fresh, no refetch spinners
      gcTime: 1000 * 60 * 60, // 1 hour garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch if data is fresh
      refetchOnReconnect: false,
    },
  },
});

// TelegramModal wrapper component
const TelegramModalWrapper = () => {
  const { isTelegramOpen, closeTelegram } = useTelegramModal();
  return <TelegramModal isOpen={isTelegramOpen} onClose={closeTelegram} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SidebarProvider>
          <ModalProvider>
            <TelegramProvider>
              <Toaster />
              <Sonner />
              <TelegramModalWrapper />
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
                  <Route path="/employees" element={<ProtectedRoute requireAdmin><Employees /></ProtectedRoute>} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={<ProtectedRoute><Indicators /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Indicators /></ProtectedRoute>} />
                <Route path="/dashboard/indicators" element={<ProtectedRoute><Indicators /></ProtectedRoute>} />
                <Route path="/dashboard/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                <Route path="/dashboard/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/dashboard/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
                <Route path="/dashboard/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
                <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
                <Route path="/purchases/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/purchases/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                <Route path="/purchases/suppliers-accounts" element={<ProtectedRoute><SuppliersAccounts /></ProtectedRoute>} />
                <Route path="/purchases/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
                <Route path="/purchases/receipts/:id" element={<ProtectedRoute><ReceiptDetail /></ProtectedRoute>} />
                <Route path="/purchases/returns" element={<ProtectedRoute><PurchaseReturns /></ProtectedRoute>} />
                <Route path="/purchases/returns/:id" element={<ProtectedRoute><PurchaseReturnDetail /></ProtectedRoute>} />
                <Route path="/purchases/received-invoices" element={<ProtectedRoute><ReceivedInvoices /></ProtectedRoute>} />
                <Route path="/purchases/received-invoices/:id" element={<ProtectedRoute><ReceivedInvoiceDetail /></ProtectedRoute>} />
                <Route path="/purchases/procurement" element={<ProtectedRoute><Procurement /></ProtectedRoute>} />
                <Route path="/purchases/my-debts" element={<ProtectedRoute><MyDebts /></ProtectedRoute>} />
                {/* Sales — nested routes: Layout bir marta renderlanadi, faqat ichki kontent o'zgaradi */}
                <Route path="/sales" element={<ProtectedRoute><Layout><Suspense fallback={<LoadingSpinner />}><Outlet /></Suspense></Layout></ProtectedRoute>}>
                  <Route index element={<Sales />} />
                  <Route path="customer-orders" element={<CustomerOrders />} />
                  <Route path="customer-orders/:id" element={<CustomerOrderDetail />} />
                  <Route path="customer-invoices" element={<CustomerInvoices />} />
                  <Route path="customer-invoices/:id" element={<CustomerInvoiceDetail />} />
                  <Route path="pending-invoices" element={<PendingInvoices />} />
                  <Route path="corrected-invoices" element={<CorrectedInvoices />} />
                  <Route path="shipments" element={<Shipments />} />
                  <Route path="shipments/:id" element={<ShipmentDetail />} />
                  <Route path="tax-invoices" element={<TaxInvoices />} />
                  <Route path="tax-invoices/:id" element={<TaxInvoiceDetail />} />
                  <Route path="customer-debts" element={<CustomerDebts />} />
                  <Route path="returns" element={<SalesReturns />} />
                  <Route path="returns/:id" element={<ReturnDetail />} />
                  <Route path="returns-report" element={<ReturnsReport />} />
                  <Route path="profitability" element={<Profitability />} />
                  <Route path="sales-funnel" element={<SalesFunnel />} />
                  <Route path="unit-economics" element={<UnitEconomics />} />
                </Route>
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/products/list" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
                <Route path="/products/list/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                <Route path="/products/history/:id" element={<ProtectedRoute><ProductHistory /></ProtectedRoute>} />
                <Route path="/products/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
                <Route path="/products/price-lists" element={<ProtectedRoute><PriceLists /></ProtectedRoute>} />
                <Route path="/products/serial-numbers" element={<ProtectedRoute><SerialNumbers /></ProtectedRoute>} />
                <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
                <Route path="/contacts/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
                <Route path="/contacts/partners/:id" element={<ProtectedRoute><PartnerDetail /></ProtectedRoute>} />
                <Route path="/contacts/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
                <Route path="/contacts/contracts/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
                <Route path="/contacts/telegram" element={<ProtectedRoute><TelegramPage /></ProtectedRoute>} />
                <Route path="/warehouse" element={<ProtectedRoute><Warehouse /></ProtectedRoute>} />
                <Route path="/warehouse/receipt" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
                <Route path="/warehouse/receipt/:id" element={<ProtectedRoute><WarehouseReceiptDetail /></ProtectedRoute>} />
                <Route path="/warehouse/expense" element={<ProtectedRoute><Expense /></ProtectedRoute>} />
                <Route path="/warehouse/expense/:id" element={<ProtectedRoute><ExpenseDetail /></ProtectedRoute>} />
                <Route path="/warehouse/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
                <Route path="/warehouse/transfer/:id" element={<ProtectedRoute><WarehouseTransferDetail /></ProtectedRoute>} />
                <Route path="/warehouse/writeoff" element={<ProtectedRoute><Writeoff /></ProtectedRoute>} />
                <Route path="/warehouse/writeoff/:id" element={<ProtectedRoute><WriteoffDetail /></ProtectedRoute>} />
                <Route path="/warehouse/internal-order" element={<ProtectedRoute><InternalOrder /></ProtectedRoute>} />
                <Route path="/warehouse/internal-order/:id" element={<ProtectedRoute><InternalOrderDetail /></ProtectedRoute>} />
                <Route path="/warehouse/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/warehouse/inventory/:id" element={<ProtectedRoute><InventoryDetail /></ProtectedRoute>} />
                <Route path="/warehouse/balance" element={<ProtectedRoute><Balance /></ProtectedRoute>} />
                <Route path="/warehouse/turnover" element={<ProtectedRoute><Turnover /></ProtectedRoute>} />
                <Route path="/warehouse/warehouses" element={<ProtectedRoute><Warehouses /></ProtectedRoute>} />
                <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
                <Route path="/finance/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                <Route path="/finance/payments/:id" element={<ProtectedRoute><PaymentDetail /></ProtectedRoute>} />
                <Route path="/finance/cashflow" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
                <Route path="/finance/profit-loss" element={<ProtectedRoute><ProfitLoss /></ProtectedRoute>} />
                <Route path="/finance/mutual-settlements" element={<ProtectedRoute><MutualSettlements /></ProtectedRoute>} />
                <Route path="/retail" element={<ProtectedRoute><Retail /></ProtectedRoute>} />
                <Route path="/retail/channels" element={<ProtectedRoute><Channels /></ProtectedRoute>} />
                <Route path="/retail/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
                <Route path="/ecommerce" element={<ProtectedRoute><Ecommerce /></ProtectedRoute>} />
                <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/tasks/add" element={<ProtectedRoute><AddTask /></ProtectedRoute>} />
                <Route path="/tasks/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
                <Route path="/solutions" element={<ProtectedRoute><Solutions /></ProtectedRoute>} />
                <Route path="/solutions/add-employee" element={<ProtectedRoute><AddEmployee /></ProtectedRoute>} />
                <Route path="/solutions/employee-performance" element={<ProtectedRoute><EmployeePerformance /></ProtectedRoute>} />
                <Route path="/solutions/kpi" element={<ProtectedRoute><KPI /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TelegramProvider>
      </ModalProvider>
      </SidebarProvider>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
