// src/hooks/useTransactions.ts
import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export interface Transaction {
  id: number;
  amount: string;
  traderId: string;
  currency: string;
  type: string;
  status: string;
  createdAt: string;
  txHash: string;
  orderId: string;
}

export const useTransactions = () => {
  const { userID } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userID) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(`/wallets/${userID}/history`);
        setTransactions(response.data.history || []);
        console.log(response.data.history)
      } catch (err: any) {
        console.error("Ошибка загрузки истории операций:", err);
        setError(err.response?.data?.message || "Не удалось загрузить историю операций");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userID]);

  return { transactions, loading, error };
};