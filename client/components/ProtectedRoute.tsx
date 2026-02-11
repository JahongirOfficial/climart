import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requirePermission?: string;
}

export function ProtectedRoute({ children, requireAdmin, requirePermission }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, hasPermission, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ruxsat yo'q</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bu sahifaga faqat administratorlar kirishi mumkin
          </p>
        </div>
      </div>
    );
  }

  // Check permission requirement
  if (requirePermission && !hasPermission(requirePermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ruxsat yo'q</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bu bo'limga kirish uchun sizda ruxsat yo'q
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
