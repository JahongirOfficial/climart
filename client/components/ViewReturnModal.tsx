import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SupplierReturn } from "@shared/api";
import { Package, Calendar, User, FileText, AlertCircle, TrendingDown } from "lucide-react";

interface ViewReturnModalProps {
    open: boolean;
    onClose: () => void;
    returnData: SupplierReturn | null;
}

export const ViewReturnModal = ({ open, onClose, returnData }: ViewReturnModalProps) => {
    if (!returnData) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
    };

    const formatDate = (dateString: string) => {
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
            'brak': 'bg-red-100 text-red-800 border-red-200',
            'nuqson': 'bg-orange-100 text-orange-800 border-orange-200',
            'noto\'g\'ri_model': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'boshqa': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[reason] || colors['boshqa'];
    };

    const supplierName = typeof returnData.supplier === 'string' ? returnData.supplierName : returnData.supplier.name;

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
                    <div className="grid grid-cols-2 gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Qaytarish raqami</p>
                            <p className="text-lg font-bold text-red-700">{returnData.returnNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Sabab</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium border rounded ${getReasonColor(returnData.reason)}`}>
                                <AlertCircle className="h-4 w-4" />
                                {getReasonLabel(returnData.reason)}
                            </span>
                        </div>
                    </div>

                    {/* Supplier, Date and Receipt */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-start gap-3 p-4 border rounded-lg">
                            <User className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">Yetkazib beruvchi</p>
                                <p className="font-semibold text-gray-900">{supplierName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 border rounded-lg">
                            <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">Qaytarish sanasi</p>
                                <p className="font-semibold text-gray-900">{formatDate(returnData.returnDate)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 border rounded-lg">
                            <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">Qabul hujjati</p>
                                <p className="font-semibold text-blue-600">{returnData.receiptNumber || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="h-5 w-5 text-gray-700" />
                            <h3 className="font-semibold text-gray-900">Qaytarilgan tovarlar</h3>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">№</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Mahsulot</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Miqdor</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Tan narx</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Jami</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {returnData.items.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.productName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.costPrice)}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                            Jami summa:
                                        </td>
                                        <td className="px-4 py-3 text-right text-lg font-bold text-red-600">
                                            {formatCurrency(returnData.totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    {returnData.notes && (
                        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">Izoh</p>
                                <p className="text-sm text-gray-700">{returnData.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Warning Info */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                            <strong>Eslatma:</strong> Ushbu tovarlar ombor zaxirasidan chiqarilgan va yetkazib beruvchining balansidan kamaytirilgan.
                        </p>
                    </div>

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <p className="text-xs text-gray-500">Yaratilgan</p>
                            <p className="text-sm text-gray-700">{formatDate(returnData.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
