import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Lock, 
  Users, 
  Building2, 
  TrendingUp, 
  Wallet, 
  MessageSquare, 
  Handshake, 
  Settings, 
  Command, 
  BarChart3, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

import TradersTab from "@/components/admin/Traders";
import MerchantsTab from "@/components/admin/Merchants";
import TrafficTab from "@/components/admin/Traffic";
import WalletsTab from "@/components/admin/Wallets";
import DisputesTab from "@/components/admin/Disputes";
import DealsTab from "@/components/admin/Deals";
import TelegramTab from "@/components/admin/Telegram";
import SettleSettingsTab from "@/components/admin/SettleSettings";
import TeamsTab from "@/components/admin/Teams";
import TraderStatsTab from "@/components/admin/TraderStats";
import PaymentDetailsTab from "@/components/admin/PaymentDetails";


export default function Admin() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-8 w-8 text-destructive" />
          Админ-панель
        </h1>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="traders" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 gap-0.5 sm:gap-1 h-auto p-1">
          <TabsTrigger value="traders" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <Users className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Трейдеры</span>
          </TabsTrigger>
          <TabsTrigger value="merchants" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <Building2 className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Мерчанты</span>
          </TabsTrigger>
          <TabsTrigger value="traffic" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <TrendingUp className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Трафик</span>
          </TabsTrigger>
          <TabsTrigger value="wallets" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <Wallet className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Кошельки</span>
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <MessageSquare className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Диспуты</span>
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <Handshake className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Сделки</span>
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <MessageSquare className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Телеграм</span>
          </TabsTrigger>
          <TabsTrigger value="settle-settings" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <Settings className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Settle</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <Command className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Команды</span>
          </TabsTrigger>
          <TabsTrigger value="trader-stats" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <BarChart3 className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Статистика</span>
          </TabsTrigger>
          <TabsTrigger value="payment-details" className="flex flex-col sm:flex-row items-center gap-1 text-xs px-1 sm:px-3 py-2 min-h-[60px] sm:min-h-[40px]">
            <CreditCard className="h-4 w-4 sm:h-3 sm:w-3" />
            <span className="text-[10px] sm:text-xs sm:hidden lg:inline">Реквизиты</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="traders" className="mt-6">
          <TradersTab />
        </TabsContent>

        <TabsContent value="merchants" className="mt-6">
          <MerchantsTab />
        </TabsContent>

        <TabsContent value="traffic" className="mt-6">
          <TrafficTab />
        </TabsContent>

        <TabsContent value="wallets" className="mt-6">
          <WalletsTab />
        </TabsContent>

        <TabsContent value="disputes" className="mt-6">
          <DisputesTab />
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <DealsTab />
        </TabsContent>

        <TabsContent value="telegram" className="mt-6">
          <TelegramTab />
        </TabsContent>

        <TabsContent value="settle-settings" className="mt-6">
          <SettleSettingsTab />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="trader-stats" className="mt-6">
          <TraderStatsTab />
        </TabsContent>

        <TabsContent value="payment-details" className="mt-6">
          <PaymentDetailsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}