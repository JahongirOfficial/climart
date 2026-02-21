import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SupplierReturn } from "@shared/api";
import { Package, Calendar, User, FileText, AlertCircle, Warehouse } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

interface ViewReturnModalProps {
    open: boolean;
    onClose: () => void;
    returnData: SupplierReturn | null;
}

export const ViewReturnModal = ({ open, onClose, returnData }: ViewReturnModalProps) => {
    if (!returnData) return null;

    const formatFullDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            'brak': 'Brak (ishlamaydi)',
            'nuqson': 'Nuqson (yoriq, singan)',
            'noto\'g\'ri_model': 'Noto\'g\'ri model',
            'boshqa': 'Boshqa sabab'
        };
        return labels[reason] || reason;
    };

    const getReasonColor = (reason: string) => {
        const colors: Record<string, string> = {
            'brak': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
            'nuqson': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
            'noto\'g\'ri_model': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
            'boshqa': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
        };
        return colors[reason] || colors['boshqa'];
    };

    const supplierName = typeof returnData.supplier === 'string'
        ? returnData.supplierName
        : (returnData.supplier?.name || returnData.supplierName || 'Noma\'lum');

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Qaytarish tafsilotlari</DialogTitle>
                    <DialogDescription>
                        Yetkazib beruvchiga qaytarilgan tovarlar haqida to'liq ma'lumot
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qaytarish raqami</p>
                            <p className="text-lg font-bold text-red-700 dark:text-red-400">{returnData.returnNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sabab</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium border rounded ${getReasonColor(returnData.reason)}`}>
                                <AlertCircle className="h-4 w-4" />
                                {getReasonLabel(returnData.reason)}
                            </span>
                        </div>
                    </div>

                    {/* Supplier, Warehouse, Date and Receipt */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-start gap-3 p-4 border dark:border-gray-700 rounded-lg">
                            <User className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Yetkazib beruvchi</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{supplierName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 border dark:border-gray-700 rounded-lg">
                            <Warehouse className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Ombor</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{returnData.warehouseName || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 border dark:border-gray-700 rounded-lg">
                            <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Qaytarish sanasi</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{formatFullDate(returnData.returnDate)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 border dark:border-gray-700 rounded-lg">
                            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Qabul hujjati</p>
                                <p className="font-semibold text-blue-600 dark:text-blue-400">{returnData.receiptNumber || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Qaytarilgan tovarlar</h3>
                        </div>

                        <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">№</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Mahsulot</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Miqdor</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Tan narx</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Jami</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {returnData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.productName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 text-right">{formatCurrency(item.costPrice)}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                            Jami summa:
                                        </td>
                                        <td className="px-4 py-3 text-right text-lg font-bold text-red-600 dark:text-red-400">
                                            {formatCurrency(returnData.totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    {returnData.notes && (
                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Izoh</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{returnData.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Warning Info */}
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            <strong>Eslatma:</strong> Ushbu tovarlar ombor zaxirasidan chiqarilgan va yetkazib beruvchining balansidan kamaytirilgan.
                        </p>
                    </div>

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Yaratilgan</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{formatFullDate(returnData.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
