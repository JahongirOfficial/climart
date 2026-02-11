import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ExportButton } from "@/components/ExportButton";

// Sample financial data
const financeData = [
  { month: "Yan", income: 45000, expense: 32000 },
  { month: "Fev", income: 52000, expense: 38000 },
  { month: "Mar", income: 48000, expense: 35000 },
  { month: "Apr", income: 61000, expense: 42000 },
  { month: "May", income: 72000, expense: 48000 },
  { month: "Jun", income: 68000, expense: 45000 },
];

const transactions = [
  {
    id: 1,
    date: "2024-12-15",
    description: "Savdo kirimlar",
    type: "income",
    amount: 15000,
  },
  {
    id: 2,
    date: "2024-12-14",
    description: "Omborchi oylik maoshi",
    type: "expense",
    amount: 5000,
  },
  {
    id: 3,
    date: "2024-12-13",
    description: "Xarid to'lovlari",
    type: "expense",
    amount: 28900,
  },
  {
    id: 4,
    date: "2024-12-12",
    description: "Savdo kirimlar",
    type: "income",
    amount: 12300,
  },
  {
    id: 5,
    date: "2024-12-11",
    description: "Renta to'lovi",
    type: "expense",
    amount: 3000,
  },
  {
    id: 6,
    date: "2024-12-10",
    description: "Savdo kirimlar",
    type: "income",
    amount: 19800,
  },
];

const Finance = () => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pul</h1>
            <p className="text-sm text-gray-600 mt-1">
              Moliyaviy operatsiyalar va balanslari boshqaring
            </p>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cash Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Kassa balansi
              </span>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$125,450</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Naqd pul qoldiqlar</p>
            </div>
          </div>

          {/* Bank Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bank balansi
              </span>
              <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-md">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$342,890</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bank hisoblari</p>
            </div>
          </div>

          {/* Daily Income */}
          <div className="bg-white dark:bg-gray-800 rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Kunlik tushum
              </span>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded-md">
                <ArrowUpRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$47,100</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">+12.5% kemchiligi</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart and Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Income vs Expense Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Tushum vs Xarajatlar
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="income" fill="#2ECC71" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#E74C3C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tranzaksiyalar
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                  <ExportButton 
                    data={transactions} 
                    filename="moliya-hisoboti"
                    fieldsToInclude={['date', 'description', 'type', 'amount']}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Sana
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Ta'rif
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Turi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Summa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {transaction.date}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium border ${
                              transaction.type === "income"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {transaction.type === "income" ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                            {transaction.type === "income"
                              ? "Tushum"
                              : "Xarajat"}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 text-sm font-medium ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}$
                          {transaction.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Income Summary */}
            <div className="bg-green-50 rounded-md border border-green-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-md">
                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Jami tushum</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-2">
                ${totalIncome.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.type === "income").length} ta tushum
              </p>
            </div>

            {/* Expense Summary */}
            <div className="bg-red-50 rounded-md border border-red-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-md">
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Jami xarajat
                </span>
              </div>
              <p className="text-2xl font-bold text-red-600 mb-2">
                ${totalExpense.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.type === "expense").length} ta xarajat
              </p>
            </div>

            {/* Net Profit */}
            <div className="bg-blue-50 rounded-md border border-blue-200 p-6 shadow-sm">
              <span className="text-sm font-medium text-gray-600 block mb-4">
                Sof daromad
              </span>
              <p
                className={`text-2xl font-bold mb-2 ${
                  totalIncome - totalExpense >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ${(totalIncome - totalExpense).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {totalIncome - totalExpense >= 0 ? "Foydali" : "Zararli"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Finance;
