import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Mail, Phone, MapPin, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { usePartners } from "@/hooks/usePartners";
import { PartnerModal } from "@/components/PartnerModal";
import { PartnerWithStats } from "@shared/api";
import { useDebounce } from "@/hooks/useDebounce";

/** Map partner.type to Uzbek display label */
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    customer: "Mijoz",
    supplier: "Yetkazib beruvchi",
    both: "Mijoz / Yetkazib beruvchi",
    worker: "Ishchi",
  };
  return labels[type] || type;
};

/** Format monetary value in UZS with so'm suffix */
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("uz-UZ") + " so'm";
};

const Contacts = () => {
  const { partners, loading, refetch } = usePartners();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedContact, setSelectedContact] = useState<PartnerWithStats | null>(null);
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<PartnerWithStats | undefined>();

  // Select the first partner when data loads or changes
  useEffect(() => {
    if (partners.length > 0 && !selectedContact) {
      setSelectedContact(partners[0]);
    }
  }, [partners, selectedContact]);

  const filteredContacts = partners.filter((partner) => {
    const matchesSearch =
      !debouncedSearch ||
      partner.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (partner.email && partner.email.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
      (partner.phone && partner.phone.toLowerCase().includes(debouncedSearch.toLowerCase()));

    const matchesType =
      !filterType ||
      partner.type === filterType ||
      (filterType !== "worker" && partner.type === "both");

    return matchesSearch && matchesType;
  });

  const handleNewPartner = () => {
    setEditPartner(undefined);
    setModalOpen(true);
  };

  const handleEditPartner = () => {
    if (!selectedContact) return;
    setEditPartner(selectedContact);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditPartner(undefined);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  // Loading skeleton state
  if (loading && partners.length === 0) {
    return (
      <Layout>
        <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-44" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left list skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 rounded-md border border-gray-200 dark:border-gray-700">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right detail skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-6" />
                <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-28 w-full rounded-md" />
                <Skeleton className="h-28 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kontragentlar
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Mijozlar va yetkazib beruvchilarni boshqaring
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-2"
            onClick={handleNewPartner}
          >
            <Plus className="h-4 w-4" />
            Yangi kontragent
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Contacts List */}
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Nomi yoki emailni qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-visible:ring-blue-500 dark:text-white"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Barcha turlari</option>
                <option value="customer">Mijozlar</option>
                <option value="supplier">Yetkazib beruvchilar</option>
              </select>
            </div>

            {/* Contacts List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Kontragentlar topilmadi
                </div>
              ) : (
                filteredContacts.map((partner) => (
                  <button
                    key={partner._id}
                    onClick={() => setSelectedContact(partner)}
                    className={`w-full text-left p-4 rounded-md border transition-all ${
                      selectedContact?._id === partner._id
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 shadow-sm"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                      {partner.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {getTypeLabel(partner.type)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {partner.email || partner.phone || "-"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Contact Details Panel */}
          <div className="lg:col-span-2">
            {selectedContact ? (
              <div className="space-y-6">
                {/* Main Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {selectedContact.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getTypeLabel(selectedContact.type)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 rounded-md"
                      onClick={handleEditPartner}
                    >
                      Tahrir
                    </Button>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Email
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedContact.email || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Telefon
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedContact.phone || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Manzil
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedContact.physicalAddress || selectedContact.legalAddress || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Balance */}
                  <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Balans
                      </span>
                      <Wallet className="h-4 w-4 text-gray-400" />
                    </div>
                    <p
                      className={`text-xl font-bold ${
                        (selectedContact.balance ?? 0) >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(selectedContact.balance ?? 0)}
                    </p>
                  </div>

                  {/* Orders Count */}
                  <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Buyurtmalar
                      </span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedContact.totalOrders ?? 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Jami buyurtmalar soni
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                    Yangi buyurtma
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 dark:border-gray-600 rounded-md"
                  >
                    To'lov qabul qilish
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Kontragentni tanlang
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Partner create/edit modal */}
      <PartnerModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        partner={editPartner}
      />
    </Layout>
  );
};

export default Contacts;
