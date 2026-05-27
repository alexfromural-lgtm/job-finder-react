import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Role } from '../../types';
import { useAppSelector } from '../../store/hooks';
import {
  selectIsAuthenticated,
  selectIsLoading,
  selectHasRole,
} from '../../store/selectors/authSelectors';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const hasRole = useAppSelector(requiredRole ? selectHasRole(requiredRole) : () => true);

  if (isLoading) {
    return (
      <div className="spinner-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && !hasRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
