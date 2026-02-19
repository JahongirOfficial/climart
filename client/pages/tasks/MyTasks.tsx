import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Plus,
  Search,
  Play,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const priorityLabels: Record<string, string> = {
  low: "Past",
  medium: "O'rta",
  high: "Yuqori",
  urgent: "Shoshilinch",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const MyTasks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const { tasks, total, pages, stats, loading, updateStatus, deleteTask } = useTasks({
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    page,
    limit: 30,
  });

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedToName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateStatus(taskId, newStatus);
      toast({ title: "Muvaffaqiyatli", description: "Vazifa holati yangilandi" });
    } catch {
      toast({ title: "Xatolik", description: "Vazifa holatini yangilab bo'lmadi", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete);
      toast({ title: "Muvaffaqiyatli", description: "Vazifa o'chirildi" });
    } catch {
      toast({ title: "Xatolik", description: "Vazifani o'chirib bo'lmadi", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("uz-UZ");
  };

  const isOverdue = (task: Task) => {
    return (
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "completed" &&
      task.status !== "cancelled"
    );
  };

  if (loading && tasks.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mening vazifalarim</h1>
            <p className="text-gray-600 mt-1">Barcha vazifalar va topshiriqlar</p>
          </div>
          <Button onClick={() => navigate("/tasks/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi vazifa
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kutilmoqda</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jarayonda</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
              </div>
              <Play className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bajarildi</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Muddati o'tgan</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Qidirish..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="in_progress">Jarayonda</SelectItem>
                <SelectItem value="completed">Bajarildi</SelectItem>
                <SelectItem value="cancelled">Bekor qilindi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Muhimlik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="urgent">Shoshilinch</SelectItem>
                <SelectItem value="high">Yuqori</SelectItem>
                <SelectItem value="medium">O'rta</SelectItem>
                <SelectItem value="low">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Tasks Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vazifa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mas'ul</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Muhimlik</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Holat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Muddat</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      Vazifalar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task._id}
                      className={`border-b hover:bg-gray-50 ${isOverdue(task) ? "bg-red-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</div>
                        )}
                        {task.category && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">{task.category}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{task.assignedToName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${priorityColors[task.priority]}`}>
                          {priorityLabels[task.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Select
                          value={task.status}
                          onValueChange={(v) => handleStatusChange(task._id, v)}
                        >
                          <SelectTrigger className={`h-7 text-xs w-[130px] mx-auto ${statusColors[task.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Kutilmoqda</SelectItem>
                            <SelectItem value="in_progress">Jarayonda</SelectItem>
                            <SelectItem value="completed">Bajarildi</SelectItem>
                            <SelectItem value="cancelled">Bekor qilindi</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {task.dueDate ? (
                          <span className={isOverdue(task) ? "text-red-600 font-medium" : "text-gray-600"}>
                            {formatDate(task.dueDate)}
                            {isOverdue(task) && " (kechikdi!)"}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => {
                            setTaskToDelete(task._id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-sm text-gray-600">
                Sahifa {page} / {pages} (jami {total})
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vazifani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu vazifani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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

export default MyTasks;
