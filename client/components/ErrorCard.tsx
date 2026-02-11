import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { memo } from "react";

interface ErrorCardProps {
  title?: string;
  message: string;
}

const ErrorCard = memo(({ title = "Xatolik yuz berdi", message }: ErrorCardProps) => {
  return (
    <Card className="p-6 bg-red-50 border-red-200">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <div>
          <h3 className="font-semibold text-red-900">{title}</h3>
          <p className="text-red-700">{message}</p>
        </div>
      </div>
    </Card>
  );
});

ErrorCard.displayName = 'ErrorCard';

export default ErrorCard;