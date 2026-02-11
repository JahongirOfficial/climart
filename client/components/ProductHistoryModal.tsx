import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowUpRight, ArrowDownLeft, History } from "lucide-react";
import { useProductHistory } from "@/hooks/useProductHistory";

interface ProductHistoryModalProps {
    open: boolean;
    onClose: () => void;
    productId: string | null;
    productName: string;
}

export const ProductHistoryModal = ({ open, onClose, productId, productName }: ProductHistoryModalProps) => {
    const { history, loading } = useProductHistory(open ? productId : null);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        {productName} - Harakatlar tarixi
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Ushbu mahsulot bo'yicha harakatlar topilmadi.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-50 border-y">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sana</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tur</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hujjat</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">O'zgarish</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qoldiq</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Izoh</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {history.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                                                {new Date(item.date).toLocaleString('uz-UZ')}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <span className={`inline-flex items-center gap-1 font-medium ${item.change > 0 ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                    {item.change > 0 ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-blue-600">
                                                {item.documentNumber}
                                            </td>
                                            <td className={`px-4 py-4 text-sm text-right font-bold ${item.change > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {item.change > 0 ? '+' : ''}{item.change}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-right font-semibold">
                                                {item.balance}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 italic max-w-xs truncate">
                                                {item.note}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
