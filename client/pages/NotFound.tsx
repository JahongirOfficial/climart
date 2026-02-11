import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
            <p className="text-2xl font-bold text-foreground">Sahifa topilmadi</p>
          </div>
          <p className="text-muted-foreground mb-8">
            Afsuski, siz qidirgan sahifa mavjud emas.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="gap-2 bg-primary hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Bosh sahifaga qaytish
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
