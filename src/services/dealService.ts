import apiClient from '@/lib/api-client';

export interface Deal {
  id: string;
  device: string;
  paymentMethod: string;
  bank: string;
  paymentDetails: string;
  ownerName: string;
  amount: string;
  amountUSDT: string;
  exchangeRate: string;
  traderReward: string;
  createdAt: string;
  completedAt: string | null;
  status: string;
  // Добавляем поля из старого API
  order_id?: string;
  bank_detail?: {
    bank_name: string;
    payment_system: string;
    card_number?: string;
    phone?: string;
    owner: string;
    currency: string;
  };
  amount_fiat?: number;
  amount_crypto?: number;
  crypto_rub_rate?: number;
  trader_reward?: number;
  expires_at?: string;
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
      if (filters.searchId) params.search = filters.searchId;
      if (filters.minAmount) params.min_amount = filters.minAmount;
      if (filters.maxAmount) params.max_amount = filters.maxAmount;
      if (filters.dateFrom) params.date_from = filters.dateFrom.toISOString();
      if (filters.dateTo) params.dateTo = filters.dateTo.toISOString();
  
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