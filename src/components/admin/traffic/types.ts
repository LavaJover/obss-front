export interface User {
    id: string;
    username: string;
    login: string;
    role: string;
  }
  
  export interface UnlockHistoryItem {
    id: string;
    trader_id: string;
    admin_id: string;
    reason: string;
    grace_period_hours: number;
    unlocked_at: string;
    created_at: string;
  }
  
  export interface ActivityParams {
    merchant_unlocked: boolean;
    trader_unlocked: boolean;
    antifraud_unlocked: boolean;
    manually_unlocked: boolean;
  }
  
  export interface AntifraudParams {
    antifraud_required: boolean;
  }
  
  export interface BusinessParams {
    merchant_deals_duration: string;
  }
  
  export interface TrafficRecord {
    id: string;
    trader_id: string;
    merchant_id: string;
    trader_reward_percent: number;
    trader_priority: number;
    platform_fee: number;
    Enabled: boolean;
    name: string;
    activity_params: ActivityParams;
    antifraud_params: AntifraudParams;
    business_params: BusinessParams;
  }
  
  export interface MerchantTraffic {
    merchant: User;
    platform_fee: number;
    merchant_unlocked: boolean;
    connections_count: number;
    connected_traders: User[];
  }
  
  export interface TraderTraffic {
    trader: User;
    trader_unlocked: boolean;
    connections: TrafficRecord[];
    grace_period_until?: string;
  }
  
  export interface MerchantSettingsForm {
    merchant_id: string;
    platform_fee: string;
  }
  
  export interface TraderConnectionForm {
    merchant_id: string;
    trader_reward: string;
    trader_priority: string;
    name: string;
    activity_params: ActivityParams;
    antifraud_params: AntifraudParams;
    business_params: BusinessParams;
    merchant_deals_duration_minutes: string;
  }
  
  export interface TraderSettingsForm {
    trader_id: string;
    connections: TraderConnectionForm[];
  }
  
  export interface SingleConnectionForm {
    connection_id: string;
    merchant_id: string;
    trader_id: string;
    trader_reward: string;
    trader_priority: string;
    name: string;
    activity_params: ActivityParams;
    antifraud_params: AntifraudParams;
    business_params: BusinessParams;
    merchant_deals_duration_minutes: string;
  }
  
  export interface AntiFraudRule {
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface CheckResult {
    rule_name: string;
    passed: boolean;
    message: string;
    details?: Record<string, any>;
  }
  
  export interface AuditLog {
    id: string;
    trader_id: string;
    checked_at: string;
    all_passed: boolean;
    results: CheckResult[];
    created_at: string;
  }
  
  export interface TrafficData {
    merchants: User[];
    traders: User[];
    trafficRecords: TrafficRecord[];
    antiFraudRules: AntiFraudRule[];
    auditLogs: AuditLog[];
    merchantTraffic: MerchantTraffic[];
    traderTraffic: TraderTraffic[];
}