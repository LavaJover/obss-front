import apiClient from '@/lib/api-client';

// services/dealService.ts
// services/dealService.ts
export interface Deal {
  id: string;
  // Старые поля (для совместимости)
  device?: string;
  paymentMethod?: string;
  bank?: string;
  paymentDetails?: string;
  ownerName?: string;
  amount?: string;
  amountUSDT?: string;
  exchangeRate?: number;
  traderReward?: string;
  createdAt?: string | Date; // Изменено на string | Date
  completedAt?: string | Date | null; // Изменено на string | Date | null
  status?: string;
  
  // Новые поля из API
  order_id: string;
  merchant_order_id: string;
  merchant_id: string;
  amount_fiat: number;
  amount_crypto: number;
  crypto_rub_rate: number;
  trader_reward: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  
  bank_detail?: {
    bank_name: string;
    payment_system: string;
    card_number?: string;
    phone?: string;
    owner: string;
    currency: string;
    trader_id: string;
    min_amount?: number;
    max_amount?: number;
  };
}

export interface DealsResponse {
  orders: Deal[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

export interface DealsFilters {
  page?: number;
  limit?: number;
  status?: string;
  searchId?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export const dealService = {
    async getDeals(userID: string, filters: DealsFilters): Promise<DealsResponse> {
      const params: any = {
        page: filters.page || 1,
        limit: filters.limit || 10,
      };
  
      if (filters.status) params.status = filters.status;
      if (filters.searchId) params.order_id = filters.searchId;
      if (filters.minAmount) params.min_amount = filters.minAmount;
      if (filters.maxAmount) params.max_amount = filters.maxAmount;
      if (filters.dateFrom) params.date_from = filters.dateFrom.toISOString();
      if (filters.dateTo) params.date_to = filters.dateTo.toISOString();
  
      const response = await apiClient.get<DealsResponse>(`/orders/trader/${userID}`, { params });
      return response.data;
    },
  
    // Измененные методы для передачи order_id в теле запроса
    async approveDeal(orderId: string): Promise<void> {
        await apiClient.post(`/orders/approve`, { order_id: orderId });
      },
    
      async cancelDeal(orderId: string): Promise<void> {
        await apiClient.post(`/orders/cancel`, { order_id: orderId });
      },
    
      async disputeDeal(orderId: string): Promise<void> {
        await apiClient.post(`/orders/dispute`, { order_id: orderId });
    },
  };