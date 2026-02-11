import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlaceholderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

const Placeholder = ({ title, subtitle, icon }: PlaceholderProps) => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            {icon ? (
              <div className="text-6xl">{icon}</div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          <p className="text-sm text-gray-500 mb-8">
            Ushbu bo'lim hozircha mavjud emas. Davom etish uchun bizga kontakt qiling yoki boshqa bo'limlarni ko'ring.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Bosh sahifaga qaytish
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Placeholder;
