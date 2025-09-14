import apiClient from '@/lib/api-client';

export interface WalletBalance {
  balance: number;
  frozen: number;
}

export interface WalletAddress {
  address: string;
}

export const walletService = {
  async getWalletAddress(userID: string): Promise<WalletAddress> {
    const response = await apiClient.get<WalletAddress>(`/wallets/${userID}/address`);
    return response.data;
  },

  async getWalletBalance(userID: string): Promise<WalletBalance> {
    const response = await apiClient.get<WalletBalance>(`/wallets/${userID}/balance`);
    return response.data;
  },
};