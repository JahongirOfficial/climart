import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const Payments = () => {
  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1920px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">To'lovlar</h1>
          <p className="text-gray-600 mt-1">Kiruvchi va chiquvchi to'lovlarni boshqaring</p>
        </div>

        <Card className="p-12 text-center">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">To'lovlar moduli tez orada</p>
        </Card>
      </div>
    </Layout>
  );
};

export default Payments;
