import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Eye, Users, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorCard from '@/components/ErrorCard';
import { Layout } from '@/components/Layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EmployeeModal } from '@/components/EmployeeModal';
import type { UserProfile } from '@shared/api';

export default function Employees() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [viewEmployee, setViewEmployee] = useState<UserProfile | null>(null);

  // Fetch employees
  const { data: employeesData, isLoading, error } = useQuery<{ employees: UserProfile[] }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  const employees = employeesData?.employees || [];

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.isActive).length;
  const inactiveEmployees = totalEmployees - activeEmployees;

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete employee');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteEmployeeId(null);
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error('Failed to update employee');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: UserProfile) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteEmployeeId(id);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (deleteEmployeeId) {
      deleteMutation.mutate(deleteEmployeeId);
    }
  };

  const handleToggleActive = (employee: UserProfile) => {
    toggleActiveMutation.mutate({
      id: employee._id,
      isActive: !employee.isActive,
    });
  };

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;
  if (error) return <Layout><ErrorCard message="Xodimlarni yuklashda xatolik" /></Layout>;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Xodimlar</h1>
            <p className="text-muted-foreground mt-1">Xodimlarni boshqarish va ruxsatlarni sozlash</p>
          </div>
          <Button onClick={handleAddEmployee} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Xodim qo'shish
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami xodimlar</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalEmployees}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faol xodimlar</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{activeEmployees}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nofaol xodimlar</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{inactiveEmployees}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Employees Table */}
        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Xodim</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Xodimlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {employee.permissions.length} ta ruxsat
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-secondary px-2 py-1 rounded">
                        @{employee.username}
                      </code>
                    </TableCell>
                    <TableCell>{employee.phoneNumber}</TableCell>
                    <TableCell>
                      <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                        {employee.role === 'admin' ? 'Administrator' : 'Xodim'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? 'default' : 'destructive'}>
                        {employee.isActive ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {employee.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(employee)}
                            title={employee.isActive ? 'Nofaollashtirish' : 'Faollashtirish'}
                          >
                            {employee.isActive ? (
                              <UserX className="h-4 w-4 text-orange-600" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewEmployee(employee)}
                          title="Ko'rish"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEmployee(employee)}
                          title="Tahrirlash"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {employee.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(employee._id)}
                            title="O'chirish"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
      />

      {/* View Employee Dialog */}
      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xodim ma'lumotlari</DialogTitle>
          </DialogHeader>

          {viewEmployee && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {viewEmployee.firstName[0]}{viewEmployee.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {viewEmployee.firstName} {viewEmployee.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">@{viewEmployee.username}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Telefon raqam</p>
                  <p className="text-base font-medium text-foreground">{viewEmployee.phoneNumber}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Login</p>
                  <code className="text-base font-medium bg-secondary px-2 py-1 rounded">
                    @{viewEmployee.username}
                  </code>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Rol</p>
                  <Badge variant={viewEmployee.role === 'admin' ? 'default' : 'secondary'}>
                    {viewEmployee.role === 'admin' ? 'Administrator' : 'Xodim'}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Holat</p>
                  <Badge variant={viewEmployee.isActive ? 'default' : 'destructive'}>
                    {viewEmployee.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Ruxsatlar</p>
                {viewEmployee.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewEmployee.permissions.map((permission) => (
                      <Badge key={permission} variant="outline">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ruxsatlar berilmagan</p>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Yaratilgan</p>
                  <p className="text-sm text-foreground">
                    {new Date(viewEmployee.createdAt).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Yangilangan</p>
                  <p className="text-sm text-foreground">
                    {new Date(viewEmployee.updatedAt).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewEmployee(null)}>
                  Yopish
                </Button>
                <Button onClick={() => {
                  setViewEmployee(null);
                  handleEditEmployee(viewEmployee);
                }}>
                  Tahrirlash
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEmployeeId} onOpenChange={() => setDeleteEmployeeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xodimni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Haqiqatan ham bu xodimni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </Layout>
  );
}
