import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PartnerWithStats } from "@shared/api";
import { FileDown, Download } from "lucide-react";

interface PartnerExportModalProps {
    open: boolean;
    onClose: () => void;
    partners: PartnerWithStats[];
}

export const PartnerExportModal = ({ open, onClose, partners }: PartnerExportModalProps) => {
    const [selectedFields, setSelectedFields] = useState<string[]>([
        "code", "name", "phone", "balance", "totalSales"
    ]);

    const fields = [
        { id: "code", label: "Kod" },
        { id: "name", label: "Nomi" },
        { id: "type", label: "Turi" },
        { id: "status", label: "Status" },
        { id: "phone", label: "Telefon" },
        { id: "email", label: "Email" },
        { id: "legalAddress", label: "Yuridik manzili" },
        { id: "balance", label: "Balans" },
        { id: "totalSales", label: "Jami sotuvlar" },
        { id: "averageCheck", label: "O'rtacha chek" },
        { id: "lastPurchaseDate", label: "Oxirgi xarid" },
    ];

    const toggleField = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleExport = () => {
        if (selectedFields.length === 0) return;

        // Create CSV header
        const header = selectedFields.map(id => fields.find(f => f.id === id)?.label).join(",");

        // Create CSV rows
        const rows = partners.map(p => {
            return selectedFields.map(id => {
                let value = (p as any)[id] || "";
                // Format specific values
                if (id === 'lastPurchaseDate' && value) {
                    value = new Date(value).toLocaleDateString('uz-UZ');
                }
                // Escape commas for CSV
                if (typeof value === 'string' && value.includes(",")) {
                    value = `"${value}"`;
                }
                return value;
            }).join(",");
        });

        const csvContent = [header, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `hamkorlar_eksport_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Eksport sozlamalari</DialogTitle>
                    <DialogDescription>
                        Eksport qilinadigan ustunlarni tanlang
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {fields.map(field => (
                        <div key={field.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`field-${field.id}`}
                                checked={selectedFields.includes(field.id)}
                                onCheckedChange={() => toggleField(field.id)}
                            />
                            <Label htmlFor={`field-${field.id}`}>{field.label}</Label>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
                    <Button onClick={handleExport} disabled={selectedFields.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        CSV yuklab olish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
