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
import TradersTab from "./Traders";
import MerchantsTab from "./Merchants";

export default function UsersMainTab() {
    return (
      <Tabs defaultValue="traders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-2 mb-6">
          <TabsTrigger value="traders" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Трейдеры
          </TabsTrigger>
          <TabsTrigger value="merchants" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Мерчанты
          </TabsTrigger>
        </TabsList>
  
        <TabsContent value="traders" className="m-0">
          <TradersTab />
        </TabsContent>
  
        <TabsContent value="merchants" className="m-0">
          <MerchantsTab />
        </TabsContent>
      </Tabs>
    );
  }