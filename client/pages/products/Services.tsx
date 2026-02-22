import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Briefcase,
  Clock,
  DollarSign,
  Loader2,
  XCircle,
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useServices } from "@/hooks/useServices";
import { ServiceModal } from "@/components/ServiceModal";
import { Service } from "@shared/api";
import { formatCurrency } from "@/lib/format";
import { useDebounce } from "@/hooks/useDebounce";

const Services = () => {
  const { services, loading, error, refetch, createService, updateService, deleteService } = useServices();
  const { showSuccess, showError } = useModal();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<string | null>(null);



  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} daqiqa`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} soat ${mins} daqiqa` : `${hours} soat`;
  };

  const handleCreateService = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleSaveService = async (serviceData: Partial<Service>) => {
    if (editingService) {
      await updateService(editingService._id, serviceData);
    } else {
      await createService(serviceData);
    }
    refetch();
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Xizmatni o\'chirmoqchimisiz?')) return;

    try {
      setDeletingService(serviceId);
      await deleteService(serviceId);
      showSuccess('Xizmat o\'chirildi');
      refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Noma\'lum xatolik');
    } finally {
      setDeletingService(null);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    service.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    service.category?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const activeServices = services.filter(s => s.isActive);
  const totalRevenue = services.reduce((sum, s) => sum + s.price, 0);

  if (loading && services.length === 0) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Ma'lumotlar yuklanmoqda...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Xatolik yuz berdi</h3>
                <p className="text-red-700">{error}</p>
                <Button
                  onClick={() => refetch()}
                  className="mt-3 bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  Qayta urinish
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Xizmatlar</h1>
              <p className="text-sm text-gray-500 mt-1">
                Xizmatlar ro'yxati va boshqaruvi
              </p>
            </div>
            <Button
              onClick={handleCreateService}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Yangi xizmat
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Jami xizmatlar</span>
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              <p className="text-xs text-gray-500 mt-1">Barcha xizmatlar</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Faol xizmatlar</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{activeServices.length}</p>
              <p className="text-xs text-gray-500 mt-1">Sotuvda</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">O'rtacha narx</span>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(services.length > 0 ? totalRevenue / services.length : 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Xizmat uchun</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Xizmat nomi, kod yoki kategoriyani qidiring..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Services Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Xizmat nomi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Kod
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Kategoriya
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Narx
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Davomiyligi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredServices.map((service) => (
                  <tr key={service._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {service.code || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {service.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(service.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {service.duration ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {formatDuration(service.duration)}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded ${service.isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                        {service.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Faol
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Nofaol
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditService(service)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service._id)}
                          disabled={deletingService === service._id}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="O'chirish"
                        >
                          {deletingService === service._id ? (
                            <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Xizmatlar topilmadi</p>
              <p className="text-sm text-gray-500 mt-1">
                {services.length === 0 ? "Yangi xizmat qo'shing" : "Qidiruv shartini o'zgartiring"}
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Jami {filteredServices.length} ta xizmat
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Oldingi
              </Button>
              <Button variant="outline" size="sm">
                Keyingi
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Xizmatlar haqida ma'lumot
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Xizmat turlari</strong> - Montaj, ta'mirlash, konsultatsiya va boshqa xizmatlar</li>
                <li>• <strong>Narx belgilash</strong> - Har bir xizmat uchun alohida narx</li>
                <li>• <strong>Davomiyligi</strong> - Xizmat bajarish vaqtini belgilang</li>
                <li>• <strong>Status</strong> - Faol/nofaol xizmatlarni boshqaring</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Service Modal */}
        <ServiceModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingService(null);
          }}
          onSave={handleSaveService}
          service={editingService}
        />
      </div>
    </Layout>
  );
};

export default Services;
