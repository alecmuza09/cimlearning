import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Placeholder - Implementar lógica de autenticación real aquí
const useAuth = () => ({ isAuthenticated: true });

const ProtectedRoute: React.FC<{children?: React.ReactNode}> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/login" replace />;
  }

  // Si se pasan children directamente (menos común con <Outlet />), renderizarlos
  // Si no, renderizar <Outlet /> para que las rutas anidadas se muestren
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute; 