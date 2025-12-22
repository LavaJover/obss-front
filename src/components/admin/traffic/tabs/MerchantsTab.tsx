import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import MerchantsSection from "../sections/MerchantsSection";
import { MerchantTraffic, TrafficRecord, User } from "../types";

interface MerchantsTabProps {
  merchants: MerchantTraffic[];
  trafficRecords: TrafficRecord[];
  traders: User[];
  actionLoading: string | null;
  renderUserInfo: (user: User) => JSX.Element;
  onOpenMerchantSettings: (merchant: MerchantTraffic) => void;
  onToggleMerchant: (merchant: MerchantTraffic) => void;
  onDeleteMerchant: (merchant: MerchantTraffic) => void;
  onOpenSingleConnection: (connection: TrafficRecord) => void;
}

export default function MerchantsTab({
  merchants,
  trafficRecords,
  traders,
  actionLoading,
  renderUserInfo,
  onOpenMerchantSettings,
  onToggleMerchant,
  onDeleteMerchant,
  onOpenSingleConnection
}: MerchantsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Мерчанты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantsSection
            merchants={merchants}
            trafficRecords={trafficRecords}
            traders={traders}
            actionLoading={actionLoading}
            renderUserInfo={renderUserInfo}
            onOpenMerchantSettings={onOpenMerchantSettings}
            onToggleMerchant={onToggleMerchant}
            onDeleteMerchant={onDeleteMerchant}
            onOpenSingleConnection={onOpenSingleConnection}
          />
        </CardContent>
      </Card>
    </div>
  );
}