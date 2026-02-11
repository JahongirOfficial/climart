import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone, MapPin, DollarSign } from "lucide-react";
import { useState } from "react";

// Sample contacts data
const contactsData = [
  {
    id: 1,
    name: "ACME Corporation",
    type: "Mijoz",
    email: "contact@acme.com",
    phone: "+998 91 123 45 67",
    address: "Tashkent, Uzbekistan",
    balance: 45000,
    orders: 12,
  },
  {
    id: 2,
    name: "Tech Solutions Inc",
    type: "Yetkazib beruvchi",
    email: "sales@techsol.com",
    phone: "+998 91 234 56 78",
    address: "Tashkent, Uzbekistan",
    balance: -23000,
    orders: 18,
  },
  {
    id: 3,
    name: "Global Industries",
    type: "Mijoz",
    email: "info@globalind.com",
    phone: "+998 91 345 67 89",
    address: "Samarkand, Uzbekistan",
    balance: 12500,
    orders: 5,
  },
  {
    id: 4,
    name: "Premium Solutions",
    type: "Mijoz",
    email: "hello@premium.com",
    phone: "+998 91 456 78 90",
    address: "Bukhara, Uzbekistan",
    balance: 0,
    orders: 3,
  },
  {
    id: 5,
    name: "Industrial Goods Co",
    type: "Yetkazib beruvchi",
    email: "business@indgoods.com",
    phone: "+998 91 567 89 01",
    address: "Tashkent, Uzbekistan",
    balance: -15000,
    orders: 25,
  },
];

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState(contactsData[0]);
  const [filterType, setFilterType] = useState("");

  const filteredContacts = contactsData.filter((contact) => {
    const matchesSearch =
      !searchTerm ||
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || contact.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Layout>
      <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kontragentlar</h1>
            <p className="text-sm text-gray-600 mt-1">
              Mijozlar va yetkazib beruvchilarni boshqaring
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-2">
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
                  className="pl-10 border-gray-300 bg-white focus-visible:ring-blue-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="">Barcha turlari</option>
                <option value="Mijoz">Mijozlar</option>
                <option value="Yetkazib beruvchi">Yetkazib beruvchilar</option>
              </select>
            </div>

            {/* Contacts List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full text-left p-4 rounded-md border transition-all ${
                    selectedContact.id === contact.id
                      ? "bg-blue-50 border-blue-300 shadow-sm"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    {contact.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">{contact.type}</p>
                  <p className="text-xs text-gray-600">{contact.email}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Contact Details Panel */}
          <div className="lg:col-span-2">
            {selectedContact && (
              <div className="space-y-6">
                {/* Main Info Card */}
                <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {selectedContact.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selectedContact.type}
                      </p>
                    </div>
                    <Button variant="outline" className="border-gray-300 rounded-md">
                      Tahrir
                    </Button>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm text-gray-900">
                          {selectedContact.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Telefon</p>
                        <p className="text-sm text-gray-900">
                          {selectedContact.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Manzil</p>
                        <p className="text-sm text-gray-900">
                          {selectedContact.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Balance */}
                  <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600">
                        Balans
                      </span>
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <p
                      className={`text-xl font-bold ${
                        selectedContact.balance >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${selectedContact.balance.toLocaleString()}
                    </p>
                  </div>

                  {/* Orders Count */}
                  <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600">
                        Buyurtmalar
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        {selectedContact.orders}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Jami buyurtmalar soni</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                    Yangi buyurtma
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 rounded-md"
                  >
                    To'lov qabul qilish
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contacts;
