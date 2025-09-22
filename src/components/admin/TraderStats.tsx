// tabs/TraderStatsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, BarChart3 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function TraderStatsTab() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Статистика пользователя
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Selection */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="user-stats-select">Выберите пользователя:</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="adus20091 (TRADER)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adus20091">adus20091 (TRADER)</SelectItem>
                <SelectItem value="lightning23">Lightning's23 (TRADER)</SelectItem>
                <SelectItem value="merchant1">Merchant 1 (MERCHANT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range */}
          <div className="flex gap-2">
            <div>
              <Label>С</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy") : "11.09.2025"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>По</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy") : "12.09.2025"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Успешных сделок</div>
                <div className="text-lg font-semibold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground">Обработано заявок</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Отменённых сделок</div>
                <div className="text-lg font-semibold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground">Отклонено заявок</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">0 USD</div>
                <div className="text-xs text-muted-foreground">Сумма в крипте (обработано)</div>
                <div className="text-lg font-semibold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground">Успешные заявки</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">0 ₽</div>
                <div className="text-xs text-muted-foreground">Сумма в фиате (обработано)</div>
                <div className="text-lg font-semibold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground">Успешные заявки</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">0 USD</div>
                <div className="text-xs text-muted-foreground">Сумма в крипте (отмена)</div>
                <div className="text-lg font-semibold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground">Отклонённые заявки</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">0 ₽</div>
                <div className="text-xs text-muted-foreground">Сумма в фиате (отмена)</div>
                <div className="text-lg font-semibold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground">Отклонённые заявки</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-600">+0 USD</div>
                <div className="text-xs text-muted-foreground">Прибыль в крипте</div>
                <div className="text-lg font-semibold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground">Чистая прибыль</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Всего сделок</div>
                <div className="text-lg font-semibold text-muted-foreground">—</div>
                <div className="text-xs text-muted-foreground">За период</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}