import { useState } from "react";
import { useCurrencies } from "@/hooks/useCurrencies";
import { Currency } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";

const numberFmt = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function CurrenciesPage() {
  const { currencies, loading, syncCbu, syncing, setRate, create, remove, update } =
    useCurrencies();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    symbol: "",
    nominal: "1",
    exchangeRate: "",
  });

  const handleSyncCbu = async () => {
    try {
      const result = await syncCbu();
      toast({
        title: "CBU kurslari yangilandi",
        description: `${result.updatedCount} ta valyuta kursi yangilandi`,
      });
    } catch {
      toast({ title: "Xatolik", description: "CBU dan kurslarni olishda xatolik", variant: "destructive" });
    }
  };

  const handleSetRate = async (id: string) => {
    const rate = parseFloat(editRate);
    if (!rate || rate <= 0) {
      toast({ title: "Xatolik", description: "Kurs musbat son bo'lishi kerak", variant: "destructive" });
      return;
    }
    try {
      await setRate(id, rate);
      setEditingId(null);
      setEditRate("");
      toast({ title: "Kurs yangilandi" });
    } catch {
      toast({ title: "Xatolik", description: "Kursni saqlashda xatolik", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    try {
      await create({
        code: createForm.code.toUpperCase(),
        name: createForm.name,
        symbol: createForm.symbol,
        nominal: parseFloat(createForm.nominal) || 1,
        exchangeRate: parseFloat(createForm.exchangeRate),
      });
      setShowCreateDialog(false);
      setCreateForm({ code: "", name: "", symbol: "", nominal: "1", exchangeRate: "" });
      toast({ title: "Valyuta qo'shildi" });
    } catch {
      toast({ title: "Xatolik", description: "Valyutani qo'shishda xatolik", variant: "destructive" });
    }
  };

  const handleDelete = async (currency: Currency) => {
    if (!confirm(`${currency.code} valyutasini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await remove(currency._id);
      toast({ title: "Valyuta o'chirildi" });
    } catch {
      toast({ title: "Xatolik", description: "Valyutani o'chirishda xatolik", variant: "destructive" });
    }
  };

  const handleToggleActive = async (currency: Currency) => {
    try {
      await update(currency._id, { isActive: !currency.isActive });
      toast({ title: currency.isActive ? "Valyuta o'chirildi" : "Valyuta faollashtirildi" });
    } catch {
      toast({ title: "Xatolik", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Valyutalar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Asosiy valyuta: <span className="font-medium text-green-600">UZS (so'm)</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSyncCbu} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
            CBU kurslarini yangilash
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Yangi valyuta
          </Button>
        </div>
      </div>

      {/* Currencies Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableHead className="w-20">Kod</TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead className="w-16">Belgi</TableHead>
              <TableHead className="w-40">Kurs (1 = ? so'm)</TableHead>
              <TableHead className="w-40">Oxirgi yangilangan</TableHead>
              <TableHead className="w-24">Holat</TableHead>
              <TableHead className="w-32 text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Valyutalar topilmadi
                </TableCell>
              </TableRow>
            ) : (
              currencies.map((currency) => (
                <TableRow key={currency._id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-blue-600">{currency.code}</span>
                  </TableCell>
                  <TableCell>
                    {currency.name}
                    {currency.isBase && (
                      <Badge variant="outline" className="ml-2 text-xs text-green-600 border-green-300">
                        Asosiy
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-medium">{currency.symbol}</TableCell>
                  <TableCell>
                    {editingId === currency._id ? (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="h-7 text-sm w-28"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSetRate(currency._id);
                            if (e.key === "Escape") { setEditingId(null); setEditRate(""); }
                          }}
                        />
                        <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleSetRate(currency._id)}>
                          OK
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setEditingId(null); setEditRate(""); }}>
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={`${currency.isBase ? "text-muted-foreground" : "cursor-pointer hover:text-blue-600"}`}
                        onClick={() => {
                          if (!currency.isBase) {
                            setEditingId(currency._id);
                            setEditRate(String(currency.exchangeRate));
                          }
                        }}
                        title={currency.isBase ? undefined : "Kursni tahrirlash uchun bosing"}
                      >
                        {numberFmt.format(currency.exchangeRate)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {currency.lastUpdated
                      ? new Date(currency.lastUpdated).toLocaleString("uz-UZ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={currency.isActive ? "default" : "secondary"}
                      className={`text-xs cursor-pointer ${
                        currency.isBase ? "cursor-default" : ""
                      }`}
                      onClick={() => !currency.isBase && handleToggleActive(currency)}
                    >
                      {currency.isActive ? "Faol" : "Nofaol"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!currency.isBase && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditingId(currency._id);
                              setEditRate(String(currency.exchangeRate));
                            }}
                            title="Kursni tahrirlash"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(currency)}
                            title="O'chirish"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Kurslar O'zbekiston Markaziy Banki (CBU) dan avtomatik yangilanadi.
        Kursni qo'lda o'zgartirish uchun jadvalda kurs qiymatiga bosing.
      </p>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi valyuta qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Kod (ISO 4217) *</Label>
                <Input
                  value={createForm.code}
                  onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="USD"
                  maxLength={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Belgi *</Label>
                <Input
                  value={createForm.symbol}
                  onChange={(e) => setCreateForm((p) => ({ ...p, symbol: e.target.value }))}
                  placeholder="$"
                  maxLength={5}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Nomi *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="AQSH dollari"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nominal</Label>
                <Input
                  type="number"
                  value={createForm.nominal}
                  onChange={(e) => setCreateForm((p) => ({ ...p, nominal: e.target.value }))}
                  placeholder="1"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Kurs (so'mda) *</Label>
                <Input
                  type="number"
                  value={createForm.exchangeRate}
                  onChange={(e) => setCreateForm((p) => ({ ...p, exchangeRate: e.target.value }))}
                  placeholder="12850"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createForm.code || !createForm.name || !createForm.symbol || !createForm.exchangeRate}
            >
              Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
