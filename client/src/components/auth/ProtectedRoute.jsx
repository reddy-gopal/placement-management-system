import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccessDenied from '../../pages/AccessDenied';

/**
 * Renders child routes only for a signed-in user with one of `roles`.
 * Not signed in → /login (remembering where to return). Wrong role → the 403 screen.
 */
export default function ProtectedRoute({ roles }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <p role="status" className="grid min-h-screen place-items-center text-sm text-muted">
        Checking your session…
      </p>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <AccessDenied requiredRoles={roles} />;
  return <Outlet />;
}
