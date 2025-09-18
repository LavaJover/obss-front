import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

const TeamLeadRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isTeamLead } = usePermissions();

  if (isLoading) return <div>Загрузка...</div>;

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isTeamLead) return <Navigate to="/" />;

  return <>{children}</>;
};

export default TeamLeadRoute;