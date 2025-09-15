// src/services/deviceService.ts
import apiClient from '@/lib/api-client';

export interface Device {
  deviceId: string;
  deviceName: string;
  enabled: boolean;
  traderId: string;
  // Дополнительные поля, если они есть в ответе API
  lastLogin?: string;
  qrCode?: string;
}

export const deviceService = {
  // Получение списка устройств пользователя
  async getUserDevices(traderId: string): Promise<Device[]> {
    const response = await apiClient.get(`/devices/${traderId}`);
    return response.data.devices || [];
  },

  // Создание нового устройства
  async createDevice(deviceData: {
    deviceName: string;
    enabled: boolean;
    traderId: string;
  }): Promise<Device> {
    const response = await apiClient.post('/devices', deviceData);
    return response.data;
  },

  // Редактирование устройства
  async updateDevice(
    deviceId: string,
    updateData: {
      deviceName?: string;
      enabled?: boolean;
    }
  ): Promise<Device> {
    const response = await apiClient.patch(`/devices/${deviceId}/edit`, {
      editDeviceParams: updateData
    });
    return response.data;
  },

  // Удаление устройства
  async deleteDevice(deviceId: string): Promise<void> {
    await apiClient.delete(`/devices/${deviceId}`);
  }
};