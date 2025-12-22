import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User } from "lucide-react";
import MerchantsSection from "../sections/MerchantsSection";
import TradersSection from "../sections/TradersSection";
import { TrafficData, TrafficRecord, TraderTraffic } from "../types";

// В TrafficTab.tsx обновить интерфейс:
interface TrafficTabProps {
  data: TrafficData;
  actionLoading: string | null;
  fetchData: () => Promise<void>;
  fetchAntiFraudData: () => Promise<void>;
  copyToClipboard: (text: string, field: string) => Promise<void>;
  renderUserInfo: (user: any) => JSX.Element;
  
  // Callbacks для мерчантов
  onOpenMerchantSettings: (merchant: any) => void;
  onToggleMerchant: (merchant: any) => void;
  onDeleteMerchant: (merchant: any) => void;
  onOpenSingleConnection: (connection: TrafficRecord) => void;
  
  // Callbacks для трейдеров
  onOpenTraderSettings: (trader: TraderTraffic) => void;
  onCheckTrader: (traderId: string) => void;
  onViewAuditHistory: (traderId: string) => void;
  onManualUnlock: (trader: TraderTraffic) => void;
  onDeleteTrader: (trader: TraderTraffic) => void;
  
  checkingTrader: string | null;
}

export default function TrafficTab({
  data,
  actionLoading,
  renderUserInfo,
  
  onOpenMerchantSettings,
  onToggleMerchant,
  onDeleteMerchant,
  onOpenSingleConnection,
  
  onOpenTraderSettings,
  onCheckTrader,
  onViewAuditHistory,
  onManualUnlock,
  onDeleteTrader,
  
  checkingTrader
}: TrafficTabProps) {
  return (
    <div className="space-y-6">
      {/* Merchants Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Мерчанты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantsSection
            merchants={data.merchantTraffic}
            trafficRecords={data.trafficRecords}
            traders={data.traders}
            actionLoading={actionLoading}
            renderUserInfo={renderUserInfo}
            onOpenMerchantSettings={onOpenMerchantSettings}
            onToggleMerchant={onToggleMerchant}
            onDeleteMerchant={onDeleteMerchant}
            onOpenSingleConnection={onOpenSingleConnection}
          />
        </CardContent>
      </Card>

      {/* Traders Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Трейдеры и Тимлиды
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TradersSection
            traders={data.traderTraffic}
            actionLoading={actionLoading}
            renderUserInfo={renderUserInfo}
            onOpenTraderSettings={onOpenTraderSettings}
            onCheckTrader={onCheckTrader}
            onViewAuditHistory={onViewAuditHistory}
            onManualUnlock={onManualUnlock}
            onDeleteTrader={onDeleteTrader}
            checkingTrader={checkingTrader}
          />
        </CardContent>
      </Card>
    </div>
  );
}