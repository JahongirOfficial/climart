import { Loader2 } from "lucide-react";
import { memo } from "react";

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner = memo(({ message = "Ma'lumotlar yuklanmoqda...", size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <span className="ml-2 text-gray-600 dark:text-gray-400">{message}</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;