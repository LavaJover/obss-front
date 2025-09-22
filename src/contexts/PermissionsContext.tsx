import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { useAuth } from "./AuthContext";

interface PermissionsContextType {
  checkPermission: (action: string, object: string) => Promise<boolean>;
  isAdmin: boolean;
  isTeamLead: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userID, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamLead, setIsTeamLead] = useState(false);

  // Проверка прав на "админку" и "тимлид"
  useEffect(() => {
    const verifyPermissions = async () => {
      if (!userID || !isAuthenticated) {
        setIsAdmin(false);
        setIsTeamLead(false);
        return;
      }

      try {
        // Проверка админских прав
        const adminRes = await apiClient.post("/rbac/permissions", {
          action: "*",
          object: "*",
          user_id: userID,
        });
        setIsAdmin(adminRes.data.allowed);

        // Проверка прав тимлида
        const teamLeadRes = await apiClient.post("/rbac/permissions", {
          action: "read",
          object: "team_lead_dashboard",
          user_id: userID,
        });
        setIsTeamLead(teamLeadRes.data.allowed);
      } catch (err) {
        console.error("Ошибка при проверке прав:", err);
        setIsAdmin(false);
        setIsTeamLead(false);
      }
    };

    verifyPermissions();
  }, [userID, isAuthenticated]);

  // Общая функция проверки любых прав
  const checkPermission = async (action: string, object: string) => {
    if (!userID) return false;
    try {
      const res = await apiClient.post("/rbac/permissions", {
        action,
        object,
        user_id: userID,
      });
      return res.data.allowed;
    } catch (err) {
      console.error("Ошибка при проверке прав:", err);
      return false;
    }
  };

  return (
    <PermissionsContext.Provider value={{ checkPermission, isAdmin, isTeamLead }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions должен использоваться внутри PermissionsProvider");
  return ctx;
};