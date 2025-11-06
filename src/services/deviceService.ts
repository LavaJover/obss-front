import apiClient from "@/lib/api-client";

export interface Device {
  deviceId: string;
  deviceName: string;
  traderId: string;
  enabled: boolean;
}

export interface TraderDevicesStatus {
  trader_id: string;
  devices: DeviceStatus[];
  online_count: number;
  total_count: number;
  summary: {
    all_online: boolean;
    any_online: boolean;
  };
}

export interface DeviceStatus {
  device_id: string;
  device_name: string;
  online: boolean;
  last_ping: number;
  enabled: boolean;
  status: string;
  last_ping_formatted: string;
}

export const deviceService = {
  // Получить все устройства трейдера
  async getTraderDevices(traderId: string): Promise<Device[]> {
    try {
      const response = await apiClient.get(`/devices/${traderId}`);
      return response.data.devices || [];
    } catch (error) {
      console.error("Error fetching trader devices:", error);
      throw error;
    }
  },

  // Получить статусы всех устройств трейдера (онлайн/оффлайн)
  async getTraderDevicesStatus(traderId: string): Promise<TraderDevicesStatus> {
    try {
      const response = await apiClient.get(
        `/automatic/trader-devices-status?trader_id=${traderId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching trader devices status:", error);
      throw error;
    }
  },

  // Получить статус конкретного устройства
  async getDeviceStatus(deviceId: string): Promise<any> {
    try {
      const response = await apiClient.get(
        `/automatic/device-status?device_id=${deviceId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching device status:", error);
      throw error;
    }
  },

  // Создать новое устройство
  async createDevice(traderId: string, deviceName: string): Promise<Device> {
    try {
      const response = await apiClient.post("/devices", {
        deviceName,
        traderId,
        enabled: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating device:", error);
      throw error;
    }
  },

  // Обновить устройство
  async updateDevice(
    deviceId: string,
    data: {
      deviceName?: string;
      enabled?: boolean;
    }
  ): Promise<Device> {
    try {
      const response = await apiClient.patch(`/devices/${deviceId}/edit`, {
        editDeviceParams: {
          deviceName: data.deviceName,
          enabled: data.enabled,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating device:", error);
      throw error;
    }
  },

  // Удалить устройство
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      await apiClient.delete(`/devices/${deviceId}`);
    } catch (error) {
      console.error("Error deleting device:", error);
      throw error;
    }
  },
};

export default deviceService;
