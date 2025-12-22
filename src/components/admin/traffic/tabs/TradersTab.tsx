import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import TradersSection from "../sections/TradersSection";
import { TraderTraffic, User as UserType } from "../types";

interface TradersTabProps {
  traders: TraderTraffic[];
  actionLoading: string | null;
  renderUserInfo: (user: UserType) => JSX.Element;
  onOpenTraderSettings: (trader: TraderTraffic) => void;
  onCheckTrader: (traderId: string) => void;
  onViewAuditHistory: (traderId: string) => void;
  onManualUnlock: (trader: TraderTraffic) => void;
  onDeleteTrader: (trader: TraderTraffic) => void;
  checkingTrader: string | null;
}

export default function TradersTab({
  traders,
  actionLoading,
  renderUserInfo,
  onOpenTraderSettings,
  onCheckTrader,
  onViewAuditHistory,
  onManualUnlock,
  onDeleteTrader,
  checkingTrader
}: TradersTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Трейдеры и Тимлиды
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TradersSection
            traders={traders}
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