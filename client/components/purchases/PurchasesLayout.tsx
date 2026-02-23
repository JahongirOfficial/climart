import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";

const TABS = [
  { id: "orders",             label: "Buyurtmalar",              path: "/purchases/orders" },
  { id: "receipts",           label: "Qabullar",                 path: "/purchases/receipts" },
  { id: "suppliers-accounts", label: "Schot-fakturalar",         path: "/purchases/suppliers-accounts" },
  { id: "returns",            label: "Qaytarishlar",             path: "/purchases/returns" },
  { id: "received-invoices",  label: "Qabul qilingan fakturalar", path: "/purchases/received-invoices" },
  { id: "procurement",        label: "Boshqaruv",                path: "/purchases/procurement" },
  { id: "my-debts",           label: "Qarzlarim",               path: "/purchases/my-debts" },
];

interface PurchasesLayoutProps {
  children: ReactNode;
}

export const PurchasesLayout = ({ children }: PurchasesLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = TABS.find(tab => location.pathname.startsWith(tab.path));

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Tab bar */}
        <div className="bg-white border-b border-gray-200 px-6">
          <nav className="flex gap-0 overflow-x-auto">
            {TABS.map(tab => {
              const isActive = activeTab?.id === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`
                    px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150
                    ${isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </Layout>
  );
};
