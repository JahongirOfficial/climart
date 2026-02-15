import { useState } from "react";
import { useModal } from "@/contexts/ModalContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportPaymentsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportPaymentsModal({ open, onClose, onSuccess }: ImportPaymentsModalProps) {
  const { showWarning, showError } = useModal();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      showWarning("Faqat CSV yoki Excel fayllarini yuklash mumkin");
      return;
    }

    setFile(selectedFile);

    // Parse CSV for preview
    if (selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv') {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      const data = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        return headers.reduce((obj: any, header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
          return obj;
        }, {});
      });
      setPreview(data);
    }
  };

  const handleImport = async () => {
    if (!file) {
      showWarning("Faylni tanlang");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/payments/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const result = await response.json();

      toast({
        title: "Import muvaffaqiyatli",
        description: `${result.imported} ta to'lov import qilindi`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Import xatolik');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `Sana,Turi,Summa,Kontragent,Hisob,To'lov usuli,Maqsad,Kategoriya,Izoh
2024-01-15,incoming,1000000,Mijoz 1,bank,bank_transfer,Tovar sotish,,
2024-01-16,outgoing,500000,Yetkazib beruvchi,cash,cash,Xarid,purchases,
2024-01-17,transfer,200000,,,cash to bank,,,Kassadan bankga`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'payments-template.csv';
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bank ko'chirmalarini import qilish</DialogTitle>
          <DialogDescription>
            CSV yoki Excel fayldan to'lovlarni import qiling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-900">Import qoidalari:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Fayl CSV yoki Excel formatida bo'lishi kerak</li>
                  <li>Birinchi qator ustun nomlari bo'lishi kerak</li>
                  <li>Majburiy ustunlar: Sana, Turi, Summa, Maqsad</li>
                  <li>Turi: incoming (kirim), outgoing (chiqim), transfer (o'tkazma)</li>
                  <li>Hisob: cash (kassa), bank (bank)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">Namuna faylni yuklab oling</p>
                <p className="text-sm text-muted-foreground">
                  To'g'ri formatda CSV fayl
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              Yuklab olish
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Faylni tanlang</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Tanlangan: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Ko'rib chiqish (birinchi 5 qator)</Label>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="p-2 text-left font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-t">
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="p-2">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Bekor qilish
            </Button>
            <Button onClick={handleImport} disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import qilinmoqda...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import qilish
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
