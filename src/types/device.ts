export interface Device {
    device_id: string;
    device_name: string;
    trader_id: string;
    enabled: boolean;
    online?: boolean;
    last_ping?: number;
    status?: string;
    created_at?: string;
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
  