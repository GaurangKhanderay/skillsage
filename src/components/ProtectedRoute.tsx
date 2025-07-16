
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("User not authenticated, redirecting to login");
    }
  }, [user, isLoading]);

  if (isLoading) {
    // You could replace this with a loading spinner
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-placement-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If the user doesn't have the required role, redirect to their dashboard
    switch (user.role) {
      case UserRole.STUDENT:
        return <Navigate to="/student/dashboard" replace />;
      case UserRole.PLACEMENT:
        return <Navigate to="/placement/dashboard" replace />;
      case UserRole.ALUMNI:
        return <Navigate to="/alumni/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
