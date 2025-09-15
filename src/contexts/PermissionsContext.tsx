// src/contexts/PermissionsContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { useAuth } from "./AuthContext";

interface PermissionsContextType {
  checkPermission: (action: string, object: string) => Promise<boolean>;
  isAdmin: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userID, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Проверка прав на "админку"
  useEffect(() => {
    const verifyAdmin = async () => {
      if (!userID || !isAuthenticated) {
        setIsAdmin(false);
        return;
      }

      try {
        const res = await apiClient.post("/rbac/permissions", {
          action: "*",
          object: "*",
          user_id: userID,
        });
        setIsAdmin(res.data.allowed);
      } catch (err) {
        console.error("Ошибка при проверке админских прав:", err);
        setIsAdmin(false);
      }
    };

    verifyAdmin();
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
    <PermissionsContext.Provider value={{ checkPermission, isAdmin }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions должен использоваться внутри PermissionsProvider");
  return ctx;
};
