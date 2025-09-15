// src/hooks/useBankDetails.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bankService, BankDetail, BankDetailStats } from "@/services/bankService";
import { deviceService, Device } from "@/services/deviceService";

export const useBankDetails = () => {
  const { userID } = useAuth();
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [stats, setStats] = useState<BankDetailStats[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userID) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [detailsData, statsData, devicesData] = await Promise.all([
        bankService.getTraderBankDetails(userID),
        bankService.getBankDetailsStats(userID),
        deviceService.getUserDevices(userID)
      ]);
      
      setBankDetails(detailsData);
      setStats(statsData);
      setDevices(devicesData);
    } catch (err: any) {
      console.error("Ошибка при загрузке данных:", err);
      setError(err.response?.data?.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [userID]);

  // Функция для загрузки только устройств
  const fetchDevices = useCallback(async () => {
    if (!userID) return;
    
    try {
      const devicesData = await deviceService.getUserDevices(userID);
      setDevices(devicesData);
    } catch (err: any) {
      console.error("Ошибка при загрузке устройств:", err);
      setError(err.response?.data?.message || "Не удалось загрузить устройства");
    }
  }, [userID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Функция для добавления устройства
  const addDevice = async (deviceData: {
    deviceName: string;
    enabled: boolean;
  }) => {
    if (!userID) return;
    
    try {
      await deviceService.createDevice({
        ...deviceData,
        traderId: userID
      });
      
      // После успешного создания, загружаем актуальный список устройств
      await fetchDevices();
    } catch (error: any) {
      console.error("Ошибка при создании устройства:", error);
      throw error;
    }
  };

  // Функция для обновления устройства
  const updateDevice = async (
    deviceId: string,
    updateData: {
      deviceName?: string;
      enabled?: boolean;
    }
  ) => {
    try {
      await deviceService.updateDevice(deviceId, updateData);
      
      // После успешного обновления, загружаем актуальный список устройств
      await fetchDevices();
    } catch (error: any) {
      console.error("Ошибка при обновлении устройства:", error);
      throw error;
    }
  };

  // Функция для удаления устройства
  const deleteDevice = async (deviceId: string) => {
    try {
      await deviceService.deleteDevice(deviceId);
      
      // После успешного удаления, загружаем актуальный список устройств
      await fetchDevices();
    } catch (error: any) {
      console.error("Ошибка при удалении устройства:", error);
      throw error;
    }
  };

  return {
    bankDetails,
    stats,
    devices,
    loading,
    error,
    refetch: fetchData,
    addDevice,
    updateDevice,
    deleteDevice,
    fetchDevices // Добавляем функцию для ручной загрузки устройств
  };
};