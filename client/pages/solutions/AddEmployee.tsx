import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const permissionGroups = [
  {
    id: "dashboard",
    label: "Ko'rsatkichlar",
    items: [
      { id: "dashboard.indicators", label: "Ko'rsatkichlar" },
      { id: "dashboard.documents", label: "Hujjatlar" },
      { id: "dashboard.cart", label: "Korzina" },
      { id: "dashboard.audit", label: "Audit" },
      { id: "dashboard.files", label: "Fayllar" },
    ],
  },
  {
    id: "purchases",
    label: "Xaridlar",
    items: [
      { id: "purchases.orders", label: "Ta'minotchiga buyurtma" },
      { id: "purchases.suppliers-accounts", label: "Ta'minotchiga to'lov" },
      { id: "purchases.receipts", label: "Kirimlar" },
      { id: "purchases.returns", label: "Qaytarishlar" },
    ],
  },
  {
    id: "sales",
    label: "Sotuvlar",
    items: [
      { id: "sales.orders", label: "Buyurtmalar" },
      { id: "sales.invoices", label: "Hisob-fakturalar" },
      { id: "sales.shipments", label: "Jo'natmalar" },
      { id: "sales.returns", label: "Qaytarishlar" },
      { id: "sales.debts", label: "Qarzlar" },
    ],
  },
  {
    id: "warehouse",
    label: "Ombor",
    items: [
      { id: "warehouse.balance", label: "Qoldiqlar" },
      { id: "warehouse.transfers", label: "O'tkazmalar" },
      { id: "warehouse.receipts", label: "Kirim orderlari" },
      { id: "warehouse.writeoffs", label: "Hisobdan chiqarish" },
    ],
  },
  {
    id: "finance",
    label: "Moliya",
    items: [
      { id: "finance.payments", label: "To'lovlar" },
      { id: "finance.cashflow", label: "Pul oqimi" },
      { id: "finance.profitloss", label: "Foyda/Zarar" },
    ],
  },
];

const AddEmployee = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    permissions: [] as string[],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post<{ employee: { username: string }; password: string }>("/api/employees", data),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.phoneNumber.trim()) {
      toast({
        title: "Xatolik",
        description: "Ism, familiya va telefon raqamni kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createMutation.mutateAsync(form);
      setCredentials({
        username: result.employee.username,
        password: result.password,
      });
    } catch (err: any) {
      toast({
        title: "Xatolik",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const togglePermission = (permId: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const toggleGroup = (groupId: string, items: { id: string }[]) => {
    const allIds = items.map((i) => i.id);
    const allSelected = allIds.every((id) => form.permissions.includes(id));
    setForm((prev) => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter((p) => !allIds.includes(p))
        : [...new Set([...prev.permissions, ...allIds])],
    }));
  };

  const handleCopyCredentials = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(
      `Login: ${credentials.username}\nParol: ${credentials.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yangi xodim qo'shish</h1>
            <p className="text-gray-600 mt-1">Xodim ma'lumotlari va ruxsatlarni kiriting</p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ism *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Ism"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Familiya *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Familiya"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon raqam *</Label>
                <Input
                  id="phone"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Manzil</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Manzil"
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label className="text-base">Ruxsatlar</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionGroups.map((group) => (
                  <Card key={group.id} className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={group.items.every((i) =>
                          form.permissions.includes(i.id)
                        )}
                        onCheckedChange={() => toggleGroup(group.id, group.items)}
                      />
                      <span className="font-medium text-sm">{group.label}</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={form.permissions.includes(item.id)}
                            onCheckedChange={() => togglePermission(item.id)}
                          />
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate("/employees")}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Xodim yaratish
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Credentials Dialog */}
      <AlertDialog open={!!credentials} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xodim yaratildi!</AlertDialogTitle>
            <AlertDialogDescription>
              Quyidagi ma'lumotlarni xodimga yuboring. Parol faqat bir marta ko'rsatiladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {credentials && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-sm">
              <div>
                <span className="text-gray-500">Login: </span>
                <span className="font-semibold">{credentials.username}</span>
              </div>
              <div>
                <span className="text-gray-500">Parol: </span>
                <span className="font-semibold">{credentials.password}</span>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleCopyCredentials}>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? "Nusxalandi" : "Nusxalash"}
            </Button>
            <AlertDialogAction onClick={() => navigate("/employees")}>
              Tayyor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default AddEmployee;
