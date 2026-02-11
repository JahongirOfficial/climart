import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, History, Package } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductHistory } from "@/hooks/useProductHistory";
import { useProducts } from "@/hooks/useProducts";
import { useMemo } from "react";

const ProductHistory = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { history, loading } = useProductHistory(id || null);
    const { products } = useProducts();

    const product = useMemo(() => products.find(p => p._id === id), [products, id]);

    // Calculate running balance
    const historyWithBalance = useMemo(() => {
        if (!history.length) return [];
        const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let balance = 0;
        const withBalance = sorted.map(item => {
            balance += item.change;
            return { ...item, balance };
        });
        return withBalance.reverse();
    }, [history]);

    // Stats
    const stats = useMemo(() => {
        const totalIn = history.filter(h => h.change > 0).reduce((s, h) => s + h.change, 0);
        const totalOut = history.filter(h => h.change < 0).reduce((s, h) => s + Math.abs(h.change), 0);
        return { totalIn, totalOut, totalMovements: history.length };
    }, [history]);

    if (loading) {
        return (
            <Layout>
                <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div><Skeleton className="h-7 w-64 mb-2" /><Skeleton className="h-4 w-40" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <Card key={i} className="p-5"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-28" /></Card>)}
                    </div>
                    <Card>
                        <div className="p-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
                                    <Skeleton className="h-4 w-28" /><Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-12 ml-auto" />
                                    <Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-32" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <History className="h-6 w-6 text-primary" />
                            {product?.name || "Mahsulot"} — Harakatlar tarixi
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            SKU: {product?.sku || "—"} | Hozirgi qoldiq: {product?.quantity || 0} {product?.unit || 'dona'}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Jami kirim</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">+{stats.totalIn}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <ArrowDownLeft className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Jami chiqim</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">-{stats.totalOut}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <ArrowUpRight className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Jami harakatlar</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMovements}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Package className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* History Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tur</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hujjat</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">O'zgarish</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qoldiq</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Izoh</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {historyWithBalance.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                            <p className="font-medium">Harakatlar topilmadi</p>
                                            <p className="text-sm mt-1">Bu mahsulot bo'yicha hali hech qanday harakat qayd etilmagan</p>
                                        </td>
                                    </tr>
                                ) : (
                                    historyWithBalance.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                                {new Date(item.date).toLocaleDateString('uz-UZ')}{' '}
                                                <span className="text-gray-400">{new Date(item.date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${item.change > 0
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {item.change > 0 ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">
                                                {item.documentNumber}
                                            </td>
                                            <td className={`px-6 py-4 text-sm text-right font-bold whitespace-nowrap ${item.change > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {item.change > 0 ? '+' : ''}{item.change}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                                                {item.balance}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate">
                                                {item.note}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default ProductHistory;
