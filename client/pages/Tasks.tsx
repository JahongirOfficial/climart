import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, User, Calendar, AlertCircle, Trash2, Pencil } from "lucide-react";
import { useState, useMemo } from "react";
import { AddTaskModal } from "@/components/AddTaskModal";
import { useTasks, type Task } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

/** Returns Tailwind classes for the priority badge */
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800";
    case "urgent":
      return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700";
    case "medium":
      return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800";
    case "low":
      return "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800";
    default:
      return "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
  }
};

/** Returns the Uzbek label for a priority level */
const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high":
      return "Yuqori";
    case "urgent":
      return "Shoshilinch";
    case "medium":
      return "O'rta";
    case "low":
      return "Past";
    default:
      return priority;
  }
};

/** Formats a date string as dd.MM.yyyy, returns empty string if no date */
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "dd.MM.yyyy");
  } catch {
    return "";
  }
};

/** Single task card used in kanban columns */
const TaskCard = ({
  task,
  onSelect,
}: {
  task: Task;
  onSelect: (task: Task) => void;
}) => {
  const isOverdue =
    task.dueDate &&
    task.status !== "completed" &&
    new Date(task.dueDate) < new Date();

  return (
    <button
      onClick={() => onSelect(task)}
      className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-4 text-left hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all w-full"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title}
      </h3>

      <div className="space-y-2 mb-3">
        {/* Mas'ul shaxs */}
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {task.assignedToName || "Belgilanmagan"}
          </span>
        </div>

        {/* Muddat */}
        {task.dueDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            <span
              className={`text-xs ${
                isOverdue
                  ? "text-red-600 dark:text-red-400 font-medium"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {formatDate(task.dueDate)}
            </span>
            {isOverdue && (
              <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            )}
          </div>
        )}
      </div>

      <span
        className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(task.priority)}`}
      >
        {getPriorityLabel(task.priority)}
      </span>
    </button>
  );
};

/** Skeleton placeholder for a single task card while loading */
const TaskCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-4 space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-5 w-16 rounded-md" />
  </div>
);

/** Skeleton placeholder for an entire kanban column while loading */
const ColumnSkeleton = ({
  title,
  bgClass,
  borderClass,
}: {
  title: string;
  bgClass: string;
  borderClass: string;
}) => (
  <div className={`${bgClass} rounded-md border ${borderClass} p-4`}>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white">
        {title}
        <span className="ml-2 inline-block bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-2 py-1 rounded-md text-xs font-medium">
          <Skeleton className="h-3 w-4 inline-block" />
        </span>
      </h2>
    </div>
    <div className="space-y-3">
      <TaskCardSkeleton />
      <TaskCardSkeleton />
    </div>
  </div>
);

const Tasks = () => {
  const {
    tasks,
    stats,
    loading,
    error,
    updateTask,
    deleteTask,
    refetch,
  } = useTasks({ limit: 200 });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const { toast } = useToast();

  // Group tasks by status for kanban columns
  const groupedTasks = useMemo(() => {
    const pending: Task[] = [];
    const inProgress: Task[] = [];
    const completed: Task[] = [];

    for (const task of tasks) {
      switch (task.status) {
        case "pending":
          pending.push(task);
          break;
        case "in_progress":
          inProgress.push(task);
          break;
        case "completed":
          completed.push(task);
          break;
        default:
          // cancelled and other statuses are not shown on the kanban board
          break;
      }
    }

    return { pending, inProgress, completed };
  }, [tasks]);

  /** Handle task deletion with confirmation */
  const handleDelete = async (task: Task) => {
    try {
      await deleteTask(task._id);
      toast({ title: "Muvaffaqiyatli", description: "Vazifa o'chirildi" });
      setSelectedTask(null);
    } catch {
      toast({
        title: "Xatolik",
        description: "Vazifani o'chirib bo'lmadi",
        variant: "destructive",
      });
    }
  };

  /** Handle opening task for editing via modal (placeholder - reuses AddTaskModal close/open) */
  const handleEdit = (task: Task) => {
    // For now, we allow inline status changes as the primary edit action
    // A full edit modal can be added in the future
    toast({
      title: "Tahrirlash",
      description: `"${task.title}" vazifasini tahrirlash imkoniyati tez orada qo'shiladi`,
    });
  };

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vazifalar
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Loyihalar va topshiriqlarni boshqaring
            </p>
          </div>
          <Button
            onClick={() => setIsAddTaskOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-2"
          >
            <Plus className="h-4 w-4" />
            Yangi topshiriq
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">
              Vazifalarni yuklashda xatolik yuz berdi: {error}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
            >
              Qayta yuklash
            </Button>
          </div>
        )}

        {/* Kanban Board */}
        {loading ? (
          /* Loading skeleton */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ColumnSkeleton
              title="Yangi"
              bgClass="bg-gray-50 dark:bg-gray-800"
              borderClass="border-gray-200 dark:border-gray-700"
            />
            <ColumnSkeleton
              title="Jarayonda"
              bgClass="bg-blue-50 dark:bg-blue-900/20"
              borderClass="border-blue-200 dark:border-blue-800"
            />
            <ColumnSkeleton
              title="Tugallangan"
              bgClass="bg-green-50 dark:bg-green-900/20"
              borderClass="border-green-200 dark:border-green-800"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Yangi (pending) Column */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Yangi
                  <span className="ml-2 inline-block bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-2 py-1 rounded-md text-xs font-medium">
                    {stats.pending}
                  </span>
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddTaskOpen(true)}
                  className="text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-md h-6 w-6 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {groupedTasks.pending.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                    Yangi vazifalar yo'q
                  </p>
                ) : (
                  groupedTasks.pending.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onSelect={setSelectedTask}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Jarayonda (in_progress) Column */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Jarayonda
                  <span className="ml-2 inline-block bg-blue-300 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-2 py-1 rounded-md text-xs font-medium">
                    {stats.inProgress}
                  </span>
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddTaskOpen(true)}
                  className="text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-gray-700 rounded-md h-6 w-6 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {groupedTasks.inProgress.length === 0 ? (
                  <p className="text-xs text-blue-400 dark:text-blue-500 text-center py-4">
                    Jarayondagi vazifalar yo'q
                  </p>
                ) : (
                  groupedTasks.inProgress.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onSelect={setSelectedTask}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Tugallangan (completed) Column */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Tugallangan
                  <span className="ml-2 inline-block bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100 px-2 py-1 rounded-md text-xs font-medium">
                    {stats.completed}
                  </span>
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-600 dark:text-green-400 hover:bg-white dark:hover:bg-gray-700 rounded-md h-6 w-6 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {groupedTasks.completed.length === 0 ? (
                  <p className="text-xs text-green-400 dark:text-green-500 text-center py-4">
                    Tugallangan vazifalar yo'q
                  </p>
                ) : (
                  groupedTasks.completed.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onSelect={setSelectedTask}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Task Details Panel */}
        {selectedTask && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedTask.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTask.description || "Tavsif kiritilmagan"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                  {/* Mas'ul shaxs */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Mas'ul shaxs
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                        {selectedTask.assignedToName
                          ? selectedTask.assignedToName.charAt(0)
                          : "?"}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedTask.assignedToName || "Belgilanmagan"}
                      </span>
                    </div>
                  </div>

                  {/* Muddat */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Muddat
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedTask.dueDate) || "Belgilanmagan"}
                    </p>
                  </div>

                  {/* Muhimlik */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Muhimlik
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}
                    >
                      {getPriorityLabel(selectedTask.priority)}
                    </span>
                  </div>

                  {/* Amallar */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Amallar
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs gap-1"
                        onClick={() => handleEdit(selectedTask)}
                      >
                        <Pencil className="h-3 w-3" />
                        Tahrir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-xs gap-1"
                        onClick={() => handleDelete(selectedTask)}
                      >
                        <Trash2 className="h-3 w-3" />
                        O'chirish
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
      />
    </Layout>
  );
};

export default Tasks;
