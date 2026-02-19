import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const AddTask = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createTask } = useTasks();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    assignedToName: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    dueDate: "",
    category: "",
  });

  // Xodimlar ro'yxatini olish
  const { data: employeesData } = useQuery<{ employees: any[] }>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
  });

  const employees = employeesData?.employees || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast({ title: "Xatolik", description: "Vazifa nomini kiriting", variant: "destructive" });
      return;
    }

    if (!form.assignedToName.trim()) {
      toast({ title: "Xatolik", description: "Mas'ul shaxsni tanlang", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await createTask({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assignedTo: form.assignedTo || undefined,
        assignedToName: form.assignedToName,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        category: form.category.trim() || undefined,
      });
      toast({ title: "Muvaffaqiyatli", description: "Vazifa yaratildi" });
      navigate("/tasks/my-tasks");
    } catch {
      toast({ title: "Xatolik", description: "Vazifa yaratib bo'lmadi", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find((e: any) => e._id === employeeId);
    if (emp) {
      setForm((prev) => ({
        ...prev,
        assignedTo: emp._id,
        assignedToName: `${emp.firstName} ${emp.lastName}`.trim() || emp.username,
      }));
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tasks/my-tasks")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yangi vazifa</h1>
            <p className="text-gray-600 mt-1">Yangi vazifa yaratish va xodimga topshirish</p>
          </div>
        </div>

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Vazifa nomi */}
            <div className="space-y-2">
              <Label htmlFor="title">Vazifa nomi *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Masalan: Mahsulotlarni inventarizatsiya qilish"
              />
            </div>

            {/* Tavsif */}
            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Vazifa haqida batafsil ma'lumot..."
                rows={4}
              />
            </div>

            {/* Mas'ul va Muhimlik */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mas'ul shaxs *</Label>
                <Select value={form.assignedTo} onValueChange={handleEmployeeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Xodimni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Muhimlik darajasi</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, priority: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Past</SelectItem>
                    <SelectItem value="medium">O'rta</SelectItem>
                    <SelectItem value="high">Yuqori</SelectItem>
                    <SelectItem value="urgent">Shoshilinch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Muddat va Kategoriya */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Muddat</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategoriya</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Masalan: Ombor, Savdo, Moliya"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/tasks/my-tasks")}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Vazifa yaratish
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default AddTask;
