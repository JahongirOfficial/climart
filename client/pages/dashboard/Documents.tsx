import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { useReceipts } from "@/hooks/useReceipts";
import { usePayments } from "@/hooks/usePayments";
import { useShipments } from "@/hooks/useShipments";

interface DocumentItem {
  id: string;
  number: string;
  type: string;
  typeLabel: string;
  date: string;
  partner?: string;
  amount?: number;
  status?: string;
}

const typeLabels: Record<string, string> = {
  invoice: "Hisob-faktura",
  receipt: "Kirim",
  payment: "To'lov",
  shipment: "Jo'natma",
};

const typeColors: Record<string, string> = {
  invoice: "bg-blue-100 text-blue-700",
  receipt: "bg-green-100 text-green-700",
  payment: "bg-purple-100 text-purple-700",
  shipment: "bg-orange-100 text-orange-700",
};

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { invoices, loading: loadingInvoices } = useCustomerInvoices();
  const { receipts, loading: loadingReceipts } = useReceipts();
  const { payments, loading: loadingPayments } = usePayments();
  const { shipments, loading: loadingShipments } = useShipments();

  const loading = loadingInvoices || loadingReceipts || loadingPayments || loadingShipments;

  const documents: DocumentItem[] = useMemo(() => {
    const docs: DocumentItem[] = [];

    invoices.forEach((inv: any) => {
      docs.push({
        id: inv._id,
        number: inv.invoiceNumber || "-",
        type: "invoice",
        typeLabel: typeLabels.invoice,
        date: inv.invoiceDate || inv.createdAt,
        partner: inv.customerName,
        amount: inv.finalAmount || inv.totalAmount,
        status: inv.status,
      });
    });

    receipts.forEach((r: any) => {
      docs.push({
        id: r._id,
        number: r.receiptNumber || "-",
        type: "receipt",
        typeLabel: typeLabels.receipt,
        date: r.receiptDate || r.createdAt,
        partner: r.supplierName,
        amount: r.totalAmount,
      });
    });

    payments.forEach((p: any) => {
      docs.push({
        id: p._id,
        number: p.paymentNumber || "-",
        type: "payment",
        typeLabel: typeLabels.payment,
        date: p.paymentDate || p.createdAt,
        partner: p.partnerName,
        amount: p.amount,
        status: p.status,
      });
    });

    shipments.forEach((s: any) => {
      docs.push({
        id: s._id,
        number: s.shipmentNumber || "-",
        type: "shipment",
        typeLabel: typeLabels.shipment,
        date: s.shipmentDate || s.createdAt,
        partner: s.customerName || (s.customer as any)?.name,
        amount: s.totalAmount,
        status: s.status,
      });
    });

    docs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return docs;
  }, [invoices, receipts, payments, shipments]);

  const filtered = documents.filter((doc) => {
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesSearch =
      doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.partner || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = useMemo(() => ({
    total: documents.length,
    invoices: documents.filter((d) => d.type === "invoice").length,
    receipts: documents.filter((d) => d.type === "receipt").length,
    payments: documents.filter((d) => d.type === "payment").length,
  }), [documents]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("uz-UZ");
  };

  const formatCurrency = (n?: number) => {
    if (!n) return "-";
    return n.toLocaleString("uz-UZ") + " so'm";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hujjatlar</h1>
          <p className="text-gray-600 mt-1">Barcha tijorat hujjatlari bir joyda</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Jami hujjatlar</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Hisob-fakturalar</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.invoices}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Kirimlar</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.receipts}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">To'lovlar</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.payments}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Hujjat raqami yoki kontragent..."
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Turi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="invoice">Hisob-faktura</SelectItem>
                <SelectItem value="receipt">Kirim</SelectItem>
                <SelectItem value="payment">To'lov</SelectItem>
                <SelectItem value="shipment">Jo'natma</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Documents Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hujjat raqami
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Turi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kontragent
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Summa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sana
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Holat
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      Hujjatlar topilmadi
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 100).map((doc) => (
                    <tr key={`${doc.type}-${doc.id}`} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {doc.number}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            typeColors[doc.type]
                          }`}
                        >
                          {doc.typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {doc.partner || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(doc.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(doc.date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc.status ? (
                          <span className="text-xs text-gray-500">{doc.status}</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 100 && (
            <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-500 text-center">
              Birinchi 100 ta hujjat ko'rsatilmoqda (jami {filtered.length})
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Documents;
