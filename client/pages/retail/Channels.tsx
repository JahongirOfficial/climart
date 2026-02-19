import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Store,
  Globe,
  Truck,
  Plus,
  Pencil,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SalesChannel {
  id: string;
  name: string;
  type: "store" | "online" | "wholesale" | "marketplace";
  status: "active" | "inactive";
  address?: string;
  contactPerson?: string;
  phone?: string;
  description?: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  store: "Do'kon",
  online: "Online",
  wholesale: "Ulgurji",
  marketplace: "Marketplace",
};

const typeIcons: Record<string, typeof Store> = {
  store: Store,
  online: Globe,
  wholesale: Truck,
  marketplace: ShoppingBag,
};

const typeColors: Record<string, string> = {
  store: "bg-blue-100 text-blue-700",
  online: "bg-purple-100 text-purple-700",
  wholesale: "bg-orange-100 text-orange-700",
  marketplace: "bg-green-100 text-green-700",
};

const Channels = () => {
  const { toast } = useToast();
  const [channels, setChannels] = useState<SalesChannel[]>(() => {
    try {
      const saved = localStorage.getItem("sales_channels");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<SalesChannel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");

  const [form, setForm] = useState({
    name: "",
    type: "store" as SalesChannel["type"],
    address: "",
    contactPerson: "",
    phone: "",
    description: "",
  });

  const save = (data: SalesChannel[]) => {
    setChannels(data);
    localStorage.setItem("sales_channels", JSON.stringify(data));
  };

  const resetForm = () => {
    setForm({ name: "", type: "store", address: "", contactPerson: "", phone: "", description: "" });
    setEditingChannel(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Xatolik", description: "Kanal nomini kiriting", variant: "destructive" });
      return;
    }

    if (editingChannel) {
      save(
        channels.map((c) =>
          c.id === editingChannel.id ? { ...c, ...form } : c
        )
      );
      toast({ title: "Muvaffaqiyatli", description: "Kanal yangilandi" });
    } else {
      const newChannel: SalesChannel = {
        id: Date.now().toString(),
        ...form,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      save([...channels, newChannel]);
      toast({ title: "Muvaffaqiyatli", description: "Yangi kanal qo'shildi" });
    }
    resetForm();
  };

  const handleEdit = (channel: SalesChannel) => {
    setForm({
      name: channel.name,
      type: channel.type,
      address: channel.address || "",
      contactPerson: channel.contactPerson || "",
      phone: channel.phone || "",
      description: channel.description || "",
    });
    setEditingChannel(channel);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    save(channels.filter((c) => c.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Muvaffaqiyatli", description: "Kanal o'chirildi" });
  };

  const toggleStatus = (id: string) => {
    save(
      channels.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "active" ? "inactive" : "active" }
          : c
      )
    );
  };

  const filtered =
    filterType === "all"
      ? channels
      : channels.filter((c) => c.type === filterType);

  const stats = {
    total: channels.length,
    active: channels.filter((c) => c.status === "active").length,
    store: channels.filter((c) => c.type === "store").length,
    online: channels.filter((c) => c.type === "online" || c.type === "marketplace").length,
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Savdo kanallari</h1>
            <p className="text-gray-600 mt-1">Do'kon, online va ulgurji savdo kanallari</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Kanal qo'shish
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jami kanallar</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faol</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <Store className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Do'konlar</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.store}</p>
              </div>
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.online}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Filter */}
        <Card className="p-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Turi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="store">Do'kon</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="wholesale">Ulgurji</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Channel Cards */}
        {filtered.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">
            Savdo kanallari topilmadi. Yuqoridagi tugma orqali qo'shing.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((channel) => {
              const Icon = typeIcons[channel.type] || Store;
              return (
                <Card key={channel.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${typeColors[channel.type]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{channel.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${typeColors[channel.type]}`}>
                          {typeLabels[channel.type]}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={channel.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(channel.id)}
                    >
                      {channel.status === "active" ? "Faol" : "Nofaol"}
                    </Badge>
                  </div>

                  {channel.address && (
                    <p className="text-sm text-gray-500">{channel.address}</p>
                  )}
                  {channel.contactPerson && (
                    <p className="text-sm text-gray-600">
                      Mas'ul: {channel.contactPerson}
                      {channel.phone && ` | ${channel.phone}`}
                    </p>
                  )}
                  {channel.description && (
                    <p className="text-xs text-gray-400">{channel.description}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(channel)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500"
                      onClick={() => setDeleteId(channel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Form Dialog */}
      <AlertDialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingChannel ? "Kanalni tahrirlash" : "Yangi kanal"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kanal nomi *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Masalan: Asosiy do'kon"
              />
            </div>
            <div className="space-y-2">
              <Label>Turi</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((p) => ({ ...p, type: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">Do'kon</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="wholesale">Ulgurji</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Manzil</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Manzil"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mas'ul shaxs</Label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Izoh</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              {editingChannel ? "Saqlash" : "Qo'shish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kanalni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kanalni o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Channels;
