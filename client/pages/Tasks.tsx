import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus, User, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Task {
  id: number;
  title: string;
  assignee: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  description: string;
}

const initialTasks = {
  new: [
    {
      id: 1,
      title: "Yangi mahsulot katalogini yaratish",
      assignee: "Alisher Karimov",
      dueDate: "2024-12-20",
      priority: "high" as const,
      description: "3 ta yangi elektronikasotuv katalogi yaratish kerak",
    },
    {
      id: 2,
      title: "Muddat davomida savdo strategiyasi",
      assignee: "Gulnoza Xaitova",
      dueDate: "2024-12-25",
      priority: "medium" as const,
      description: "Yanvar uchun savdo strategiyasini ishlab chiqish",
    },
  ],
  inProgress: [
    {
      id: 3,
      title: "Database optimallashtirish",
      assignee: "Sardor Ubaydulloyev",
      dueDate: "2024-12-18",
      priority: "high" as const,
      description: "Server performansini 30% ga oshirish",
    },
    {
      id: 4,
      title: "Mijoz interfeysi yangilash",
      assignee: "Dilfuza Muratova",
      dueDate: "2024-12-22",
      priority: "medium" as const,
      description: "Mobil interfeysi responsive qilish",
    },
  ],
  completed: [
    {
      id: 5,
      title: "Reporting sistema tayyorla",
      assignee: "Javohir Abdulloyev",
      dueDate: "2024-12-15",
      priority: "high" as const,
      description: "Kunlik hisobotlar avtomatlashtirilgan",
    },
    {
      id: 6,
      title: "Backup tizimini sozla",
      assignee: "Raxmon Karimov",
      dueDate: "2024-12-14",
      priority: "low" as const,
      description: "Kunlik avtomatik zaxira nusxalarini sozla",
    },
  ],
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800";
    case "medium":
      return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800";
    case "low":
      return "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800";
    default:
      return "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high":
      return "Yuqori";
    case "medium":
      return "O'rta";
    case "low":
      return "Past";
    default:
      return priority;
  }
};

const TaskCard = ({
  task,
  onSelect,
}: {
  task: Task;
  onSelect: (task: Task) => void;
}) => {
  const isOverdue = new Date(task.dueDate) < new Date();

  return (
    <button
      onClick={() => onSelect(task)}
      className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-4 text-left hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all w-full"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title}
      </h3>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{task.assignee}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          <span className={`text-xs ${isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
            {task.dueDate}
          </span>
          {isOverdue && <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />}
        </div>
      </div>

      <span
        className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(
          task.priority
        )}`}
      >
        {getPriorityLabel(task.priority)}
      </span>
    </button>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vazifalar</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Loyihalar va topshiriqlarni boshqaring
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-2">
            <Plus className="h-4 w-4" />
            Yangi topshiriq
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Yangi Column */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Yangi
                <span className="ml-2 inline-block bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 px-2 py-1 rounded-md text-xs font-medium">
                  {tasks.new.length}
                </span>
              </h2>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-md h-6 w-6 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {tasks.new.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelect={setSelectedTask}
                />
              ))}
            </div>
          </div>

          {/* Jarayonda Column */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Jarayonda
                <span className="ml-2 inline-block bg-blue-300 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-2 py-1 rounded-md text-xs font-medium">
                  {tasks.inProgress.length}
                </span>
              </h2>
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-gray-700 rounded-md h-6 w-6 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {tasks.inProgress.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelect={setSelectedTask}
                />
              ))}
            </div>
          </div>

          {/* Tugallangan Column */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Tugallangan
                <span className="ml-2 inline-block bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100 px-2 py-1 rounded-md text-xs font-medium">
                  {tasks.completed.length}
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
              {tasks.completed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelect={setSelectedTask}
                />
              ))}
            </div>
          </div>
        </div>

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
                      {selectedTask.description}
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
                  {/* Assignee */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Mas'ul shaxs
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                        {selectedTask.assignee.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedTask.assignee}
                      </span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Muddat
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTask.dueDate}
                    </p>
                  </div>

                  {/* Priority */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Muhimlik
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${getPriorityColor(
                        selectedTask.priority
                      )}`}
                    >
                      {getPriorityLabel(selectedTask.priority)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase">
                      Amallar
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs"
                      >
                        Tahrir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-xs"
                      >
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
    </Layout>
  );
};

export default Tasks;
