import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";
import {
  User,
  TrafficRecord,
  AntiFraudRule,
  AuditLog,
  TrafficData
} from "../types";

export const useTrafficData = () => {
  const [data, setData] = useState<TrafficData>({
    merchants: [],
    traders: [],
    trafficRecords: [],
    antiFraudRules: [],
    auditLogs: [],
    merchantTraffic: [],
    traderTraffic: []
  });
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [merchantRes, traderRes, teamLeadRes, trafficRes] = await Promise.all([
        apiClient.get("/admin/users?role=MERCHANT"),
        apiClient.get("/admin/users?role=TRADER"),
        apiClient.get("/admin/users?role=TEAM_LEAD"),
        apiClient.get("/admin/traffic/records?page=1&limit=100")
      ]);
      
      const allTraders = [
        ...(traderRes.data.users || []),
        ...(teamLeadRes.data.users || [])
      ];
      
      const merchants = merchantRes.data.users || [];
      const traders = allTraders;
      const trafficRecords = trafficRes.data.traffic_records || [];

      // Вычисляем производные данные
      const merchantTraffic = merchants.map(merchant => {
        const merchantRecords = trafficRecords.filter(record => record.merchant_id === merchant.id);
        const platformFee = merchantRecords.length > 0 ? merchantRecords[0].platform_fee : 0;
        const merchant_unlocked = merchantRecords.length > 0 ? merchantRecords[0].activity_params.merchant_unlocked : false;
        const connections_count = merchantRecords.length;
        
        const connectedTraders = merchantRecords.map(record => {
          const trader = traders.find(t => t.id === record.trader_id);
          return trader!;
        }).filter(trader => trader !== undefined);

        return {
          merchant,
          platform_fee: platformFee,
          merchant_unlocked,
          connections_count,
          connected_traders: connectedTraders
        };
      });

      const traderTraffic = traders.map(trader => {
        const connections = trafficRecords.filter(record => record.trader_id === trader.id);
        const trader_unlocked = connections.length > 0 ? connections[0].activity_params.trader_unlocked : false;

        return {
          trader,
          trader_unlocked,
          connections
        };
      });

      setData({
        merchants,
        traders,
        trafficRecords,
        antiFraudRules: data.antiFraudRules,
        auditLogs: data.auditLogs,
        merchantTraffic,
        traderTraffic
      });
    } catch (err: any) {
      console.error("Ошибка при загрузке данных:", err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные трафика",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAntiFraudData = useCallback(async () => {
    try {
      const [rulesRes, logsRes] = await Promise.all([
        apiClient.get("/antifraud/rules"),
        apiClient.get("/antifraud/audit-logs?limit=50")
      ]);
      
      setData(prev => ({
        ...prev,
        antiFraudRules: rulesRes.data.rules || [],
        auditLogs: logsRes.data.logs || []
      }));
    } catch (err: any) {
      console.error("Ошибка при загрузке данных антифрода:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAntiFraudData();
  }, [fetchData, fetchAntiFraudData]);

  return {
    data,
    loading,
    actionLoading,
    setActionLoading,
    fetchData,
    fetchAntiFraudData,
    setData
  };
};