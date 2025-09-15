// src/hooks/useBankDetails.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bankService, BankDetail, BankDetailStats } from "@/services/bankService";

export const useBankDetails = () => {
  const { userID } = useAuth();
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [stats, setStats] = useState<BankDetailStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userID) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [detailsData, statsData] = await Promise.all([
        bankService.getTraderBankDetails(userID),
        bankService.getBankDetailsStats(userID)
      ]);
      
      setBankDetails(detailsData);
      setStats(statsData);
    } catch (err: any) {
      console.error("Ошибка при загрузке реквизитов:", err);
      setError(err.response?.data?.message || "Не удалось загрузить реквизиты");
    } finally {
      setLoading(false);
    }
  }, [userID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    bankDetails,
    stats,
    loading,
    error,
    refetch: fetchData
  };
};