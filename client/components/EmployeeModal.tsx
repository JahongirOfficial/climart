import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Copy, Check } from 'lucide-react';
import type { UserProfile } from '@shared/api';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: UserProfile | null;
}

interface EmployeeCredentials {
  username: string;
  password: string;
  phoneNumber: string;
}

const availablePermissions = [
  { 
    id: 'dashboard', 
    label: 'Ko\'rsatkichlar',
    subPermissions: [
      { id: 'dashboard.indicators', label: 'Ko\'rsatkichlar' },
      { id: 'dashboard.documents', label: 'Hujjatlar' },
      { id: 'dashboard.cart', label: 'Korzina' },
      { id: 'dashboard.audit', label: 'Audit' },
      { id: 'dashboard.files', label: 'Fayllar' },
    ]
  },
  { 
    id: 'purchases', 
    label: 'Xaridlar',
    subPermissions: [
      { id: 'purchases.orders', label: 'Ta\'minotchiga buyurtma' },
      { id: 'purchases.suppliers-accounts', label: 'Taminotchiga to\'lov' },
      { id: 'purchases.receipts', label: 'Qabul qilish' },
      { id: 'purchases.returns', label: 'Tovar qaytarish' },
      { id: 'purchases.received-invoices', label: 'Qabul qilingan schot fakturalar' },
      { id: 'purchases.procurement', label: 'Zakazlar bilan ishlash' },
      { id: 'purchases.my-debts', label: 'Mening qarzlarim' },
    ]
  },
  { 
    id: 'sales', 
    label: 'Savdo',
    subPermissions: [
      { id: 'sales.customer-orders', label: 'Mijozlarning buyurtmalari' },
      { id: 'sales.customer-invoices', label: 'Xaridorlarning to\'lov fakturalari' },
      { id: 'sales.shipments', label: 'Yuklab yuborish' },
      { id: 'sales.tax-invoices', label: 'Berilgan hisob-fakturalar' },
      { id: 'sales.customer-debts', label: 'Mendan qarzdorlar' },
      { id: 'sales.returns', label: 'Tovarni qaytarib olish' },
      { id: 'sales.returns-report', label: 'Qaytarilgan mahsulot hisboti' },
      { id: 'sales.profitability', label: 'Foydalilik' },
    ]
  },
  { 
    id: 'products', 
    label: 'Tovarlar',
    subPermissions: [
      { id: 'products.list', label: 'Mahsulotlar' },
      { id: 'products.services', label: 'Xizmatlar' },
      { id: 'products.price-lists', label: 'Narxlar ro\'yhati' },
      { id: 'products.serial-numbers', label: 'Seriya raqamlar' },
    ]
  },
  { 
    id: 'contacts', 
    label: 'Kontragentlar',
    subPermissions: [
      { id: 'contacts.partners', label: 'Hamkorlar' },
      { id: 'contacts.contracts', label: 'Shartnomalar' },
      { id: 'contacts.telegram', label: 'Telegram' },
    ]
  },
  { 
    id: 'warehouse', 
    label: 'Ombor',
    subPermissions: [
      { id: 'warehouse.receipt', label: 'Kirim qilish' },
      { id: 'warehouse.expense', label: 'Chiqim qilish' },
      { id: 'warehouse.transfer', label: 'Ko\'chirish' },
      { id: 'warehouse.writeoff', label: 'Xatlov' },
      { id: 'warehouse.internal-order', label: 'Ichki zakaz' },
      { id: 'warehouse.balance', label: 'Qoldiq' },
      { id: 'warehouse.turnover', label: 'Aylanma' },
      { id: 'warehouse.warehouses', label: 'Omborlar' },
    ]
  },
  { 
    id: 'finance', 
    label: 'Pul',
    subPermissions: [
      { id: 'finance.payments', label: 'To\'lovlar' },
      { id: 'finance.cashflow', label: 'Pul Aylanmasi' },
      { id: 'finance.profit-loss', label: 'Foyda va zarar' },
      { id: 'finance.mutual-settlements', label: 'O\'zaro hisob kitob' },
    ]
  },
  { 
    id: 'tasks', 
    label: 'Vazifalar',
    subPermissions: [
      { id: 'tasks.add', label: 'Vazifa qo\'shish' },
      { id: 'tasks.my-tasks', label: 'Mening vazifalarim' },
    ]
  },
];

export function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<EmployeeCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFirstName(employee.firstName);
      setLastName(employee.lastName);
      setPhoneNumber(employee.phoneNumber);
      setAddress('');
      setPermissions(employee.permissions);
    } else {
      setFirstName('');
      setLastName('');
      setPhoneNumber('+998');
      setAddress('');
      setPermissions([]);
    }
    setError('');
    setCredentials(null);
    setCopiedField(null);
  }, [employee, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = employee 
        ? `/api/employees/${employee._id}` 
        : '/api/employees';
      const method = employee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save employee');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      // If creating new employee, show credentials
      if (!employee && data.credentials) {
        setCredentials({
          username: data.credentials.username,
          password: data.credentials.password,
          phoneNumber: data.credentials.phoneNumber,
        });
      } else {
        onClose();
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.startsWith('998')) {
      const number = digits.slice(3);
      if (number.length === 0) return '+998';
      if (number.length <= 2) return `+998 ${number}`;
      if (number.length <= 5) return `+998 ${number.slice(0, 2)} ${number.slice(2)}`;
      if (number.length <= 7) return `+998 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
      return `+998 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`;
    } else if (digits.length > 0) {
      if (digits.length <= 2) return `+998 ${digits}`;
      if (digits.length <= 5) return `+998 ${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 7) return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    }
    
    return '+998';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handlePermissionToggle = (permissionId: string, subPermissions?: Array<{id: string; label: string}>) => {
    setPermissions(prev => {
      const hasParent = prev.includes(permissionId);
      
      if (hasParent) {
        // Remove parent and all its sub-permissions
        return prev.filter(p => p !== permissionId && !p.startsWith(permissionId + '.'));
      } else {
        // Add parent and ALL sub-permissions automatically
        const newPerms = [permissionId];
        if (subPermissions) {
          subPermissions.forEach(sub => {
            newPerms.push(sub.id);
          });
        }
        return [...prev, ...newPerms];
      }
    });
  };

  const handleSubPermissionToggle = (parentId: string, subPermissionId: string) => {
    setPermissions(prev => {
      if (prev.includes(subPermissionId)) {
        // Remove sub-permission
        const newPerms = prev.filter(p => p !== subPermissionId);
        
        // Check if parent should be removed (no more sub-permissions)
        const hasOtherSubPerms = newPerms.some(p => p.startsWith(parentId + '.'));
        if (!hasOtherSubPerms) {
          return newPerms.filter(p => p !== parentId);
        }
        return newPerms;
      } else {
        // Add sub-permission and parent if not exists
        const newPerms = prev.includes(parentId) ? prev : [...prev, parentId];
        return [...newPerms, subPermissionId];
      }
    });
  };

  const isParentChecked = (parentId: string) => {
    // Parent is checked if it exists in permissions
    return permissions.includes(parentId);
  };

  const isSubPermissionChecked = (subPermissionId: string) => {
    return permissions.includes(subPermissionId);
  };

  const hasAnySubPermission = (parentId: string) => {
    return permissions.some(p => p.startsWith(parentId + '.'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !phoneNumber) {
      setError('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s/g, '');

    mutation.mutate({
      firstName,
      lastName,
      phoneNumber: cleanPhone,
      address: address || undefined,
      permissions,
    });
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCredentialsClose = () => {
    setCredentials(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !credentials} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {employee ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ism *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ism"
                  disabled={mutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Familya *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Familya"
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telefon raqam *</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onFocus={(e) => {
                  if (!e.target.value || e.target.value === '+998') {
                    setPhoneNumber('+998');
                  }
                }}
                placeholder="+998 91 234 56 78"
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Manzil</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Manzil"
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Ruxsatlar</Label>
              <div className="space-y-4 p-4 border rounded-lg max-h-96 overflow-y-auto">
                {availablePermissions.map((perm) => (
                  <div key={perm.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.id}
                        checked={isParentChecked(perm.id) || hasAnySubPermission(perm.id)}
                        onCheckedChange={() => handlePermissionToggle(perm.id, perm.subPermissions)}
                        disabled={mutation.isPending}
                      />
                      <label
                        htmlFor={perm.id}
                        className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {perm.label}
                      </label>
                    </div>
                    
                    {/* Sub-permissions - always show if parent is checked or has any sub-permission */}
                    {perm.subPermissions && (isParentChecked(perm.id) || hasAnySubPermission(perm.id)) && (
                      <div className="ml-6 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        {perm.subPermissions.map((subPerm) => (
                          <div key={subPerm.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={subPerm.id}
                              checked={isSubPermissionChecked(subPerm.id)}
                              onCheckedChange={() => handleSubPermissionToggle(perm.id, subPerm.id)}
                              disabled={mutation.isPending}
                            />
                            <label
                              htmlFor={subPerm.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {subPerm.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {!employee && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  💡 Login va parol avtomatik yaratiladi
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  employee ? 'Saqlash' : 'Qo\'shish'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <AlertDialog open={!!credentials} onOpenChange={handleCredentialsClose}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Xodim muvaffaqiyatli qo'shildi! 🎉</AlertDialogTitle>
            <AlertDialogDescription>
              Quyidagi ma'lumotlarni xodimga bering. Parol avtomatik yaratildi va xavfsiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {credentials && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Telefon raqam</Label>
                <div className="flex gap-2">
                  <Input
                    value={credentials.phoneNumber}
                    readOnly
                    className="font-mono bg-secondary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(credentials.phoneNumber, 'phone')}
                  >
                    {copiedField === 'phone' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Login</Label>
                <div className="flex gap-2">
                  <Input
                    value={credentials.username}
                    readOnly
                    className="font-mono bg-secondary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(credentials.username, 'username')}
                  >
                    {copiedField === 'username' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Parol</Label>
                <div className="flex gap-2">
                  <Input
                    value={credentials.password}
                    readOnly
                    className="font-mono bg-secondary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(credentials.password, 'password')}
                  >
                    {copiedField === 'password' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                  ⚠️ Muhim eslatma
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Bu ma'lumotlarni xavfsiz joyda saqlang! Ularni keyinroq ko'ra olmaysiz.
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCredentialsClose} className="w-full">
              Tushunarli, saqladim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
