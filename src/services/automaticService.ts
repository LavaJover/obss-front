import apiClient from "@/lib/api-client";

export interface AutomaticStats {
  trader_id: string;
  period_days: number;
  overview: {
    total_attempts: number;
    successful_attempts: number;
    success_rate: number;
    approved_orders: number;
    not_found_count: number;
    failed_count: number;
    avg_processing_time_ms: number;
  };
  device_stats: {
    [deviceId: string]: {
      total_attempts: number;
      success_count: number;
      success_rate: number;
    };
  };
}

export interface AutomaticLog {
  id: string;
  device_id: string;
  trader_id: string;
  order_id: string;
  amount: number;
  payment_system: string;
  direction: string;
  methods: string[];
  received_at: number;
  text: string;
  action: string;
  success: boolean;
  orders_found: number;
  error_message: string;
  processing_time: number;
  bank_name: string;
  card_number: string;
  created_at: number;
  status_icon?: string;
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

export interface RecentActivity {
  trader_id: string;
  activities: AutomaticLog[];
  count: number;
}

export const automaticService = {
  // Получение статистики
  getStats: async (traderId: string, days: number = 7): Promise<AutomaticStats> => {
    const response = await apiClient.get(`/automatic/stats?trader_id=${traderId}&days=${days}`);
    return response.data;
  },

  // Получение логов
  getLogs: async (filters: {
    trader_id?: string;
    device_id?: string;
    action?: string;
    success?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: AutomaticLog[]; total: number; limit: number; offset: number }> => {
    const params = new URLSearchParams();
    
    if (filters.trader_id) params.append('trader_id', filters.trader_id);
    if (filters.device_id) params.append('device_id', filters.device_id);
    if (filters.action) params.append('action', filters.action);
    if (filters.success !== undefined) params.append('success', filters.success.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    
    const response = await apiClient.get(`/automatic/logs?${params}`);
    return response.data;
  },

  // Получение статуса устройства
  getDeviceStatus: async (deviceId: string) => {
    const response = await apiClient.get(`/automatic/device-status?device_id=${deviceId}`);
    return response.data;
  },

  // Получение статусов всех устройств трейдера
  getTraderDevicesStatus: async (traderId: string) => {
    const response = await apiClient.get(`/automatic/trader-devices-status?trader_id=${traderId}`);
    return response.data;
  },

  // Получение последней активности
  getRecentActivity: async (traderId: string, limit: number = 10): Promise<RecentActivity> => {
    const response = await apiClient.get(`/automatic/recent-activity?trader_id=${traderId}&limit=${limit}`);
    return response.data;
  },
};