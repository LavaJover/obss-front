// src/services/bankService.ts
import apiClient from '@/lib/api-client';

export interface BankDetail {
  id: string;
  currency: string;
  payment_system: string;
  bank_name: string;
  bank_code: string;
  nspk_code: string;
  card_number?: string;
  phone?: string;
  owner: string;
  min_amount: number;
  max_amount: number;
  max_amount_day: number;
  max_amount_month: number;
  max_quantity_day: number;
  max_quantity_month: number;
  max_orders_simultaneosly: number;
  delay: number;
  enabled: boolean;
  trader_id: string;
  device_id?: string; // Опциональное поле для привязки устройства
}

export interface BankDetailStats {
  bank_detail_id: string;
  current_count_today: number;
  current_count_month: number;
  current_amount_today: number;
  current_amount_month: number;
}

export interface Bank {
  code: string;
  name: string;
  nspkCode?: string;
}

export const bankService = {
  // Получение реквизитов трейдера
  async getTraderBankDetails(traderID: string): Promise<BankDetail[]> {
    const response = await apiClient.get(`/banking/details?trader=${traderID}`);
    return response.data.bank_details || [];
  },

  // Получение статистики по реквизитам
  async getBankDetailsStats(traderID: string): Promise<BankDetailStats[]> {
    const response = await apiClient.get(`/banking/details/stats/${traderID}`);
    return response.data.stats || [];
  },

  // Создание реквизита
  async createBankDetail(form: any): Promise<BankDetail> {
    const formattedForm = {
      ...form,
      min_amount: parseFloat(form.min_amount),
      max_amount: parseFloat(form.max_amount),
      max_amount_day: parseFloat(form.max_amount_day),
      max_amount_month: parseFloat(form.max_amount_month),
      max_orders_simultaneosly: parseFloat(form.max_orders_simultaneosly),
      max_quantity_day: parseInt(form.max_quantity_day),
      max_quantity_month: parseInt(form.max_quantity_month),
      delay: Math.round(Number(form.delay) * 60) + "s",
    };
    
    const response = await apiClient.post('/banking/details', formattedForm);
    return response.data;
  },

  // Обновление реквизита
  async updateBankDetail(form: any): Promise<BankDetail> {
    const formattedForm = {
      ...form,
      min_amount: parseFloat(form.min_amount),
      max_amount: parseFloat(form.max_amount),
      max_amount_day: parseFloat(form.max_amount_day),
      max_amount_month: parseFloat(form.max_amount_month),
      max_orders_simultaneosly: parseFloat(form.max_orders_simultaneosly),
      max_quantity_day: parseInt(form.max_quantity_day),
      max_quantity_month: parseInt(form.max_quantity_month),
      delay: Math.round(Number(form.delay) * 60) + "s",
    };
    
    const response = await apiClient.patch('/banking/details', { bank_detail: formattedForm });
    return response.data;
  },

  // Удаление реквизита
  async deleteBankDetail(bankDetailID: string): Promise<void> {
    await apiClient.post('/banking/details/delete', { bank_detail_id: bankDetailID });
  },

  // Получение списка банков
  async getBanks(currency: string, paymentSystem: string): Promise<Bank[]> {
    const params: any = { currency };
    
    if (currency === 'RUB' && paymentSystem === 'TRANSGRAN') {
      params.is_transgran = true;
    }
    
    const response = await apiClient.get('/merchant/banks', { params });
    return response.data;
  }
};