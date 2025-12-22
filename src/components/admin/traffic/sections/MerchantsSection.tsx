import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Settings, Trash2 } from "lucide-react";
import { MerchantTraffic, TrafficRecord, User } from "../types";
import { formatDecimal } from "../utils";

interface MerchantsSectionProps {
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

export default function MerchantsSection({
  merchants,
  trafficRecords,
  traders,
  actionLoading,
  renderUserInfo,
  onOpenMerchantSettings,
  onToggleMerchant,
  onDeleteMerchant,
  onOpenSingleConnection
}: MerchantsSectionProps) {
  if (merchants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет мерчантов для отображения
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Мерчант</TableHead>
          <TableHead>Комиссия платформы</TableHead>
          <TableHead>Подключения</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {merchants.map((merchant) => (
          <TableRow key={merchant.merchant.id}>
            <TableCell>{renderUserInfo(merchant.merchant)}</TableCell>
            <TableCell className="font-mono">{formatDecimal(merchant.platform_fee)}%</TableCell>
            <TableCell>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {merchant.connected_traders.length > 0 
                      ? `Выбрать трейдера (${merchant.connected_traders.length})`
                      : "Нет подключений"
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Поиск по имени, логину или ID..." />
                    <CommandList>
                      <CommandEmpty>Трейдеры не найдены</CommandEmpty>
                      <CommandGroup>
                        {merchant.connected_traders.map((trader) => {
                          const connection = trafficRecords.find(record => 
                            record.merchant_id === merchant.merchant.id && 
                            record.trader_id === trader.id
                          );
                          
                          return (
                            <CommandItem
                              key={trader.id}
                              value={`${trader.username} ${trader.login} ${trader.id}`}
                              onSelect={() => {
                                if (connection) {
                                  onOpenSingleConnection(connection);
                                }
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{trader.username} (@{trader.login})</span>
                                <span className="text-xs text-muted-foreground">
                                  Награда: {connection ? formatDecimal(connection.trader_reward_percent) : '0.000'}%, 
                                  Приоритет: {connection?.trader_priority || 0}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </TableCell>
            <TableCell>
              <Badge variant={merchant.merchant_unlocked ? "default" : "secondary"}>
                {merchant.merchant_unlocked ? "Разблокирован" : "Заблокирован"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Switch
                  checked={merchant.merchant_unlocked}
                  onCheckedChange={() => onToggleMerchant(merchant)}
                  disabled={actionLoading === `merchant-toggle-${merchant.merchant.id}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenMerchantSettings(merchant)}
                  disabled={actionLoading !== null}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteMerchant(merchant)}
                  disabled={actionLoading !== null}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}