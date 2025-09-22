// tabs/SettleSettingsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function SettleSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Настройки Settle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="user-select">Выберите пользователя</Label>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите пользователя" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user1">Пользователь 1</SelectItem>
              <SelectItem value="user2">Пользователь 2</SelectItem>
              <SelectItem value="user3">Пользователь 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="fixed-fee">Fixed Fee:</Label>
            <Input
              id="fixed-fee"
              type="number"
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="min-amount">Min Amount:</Label>
            <Input
              id="min-amount"
              type="number"
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="cooldown-seconds">Cooldown Seconds:</Label>
            <Input
              id="cooldown-seconds"
              type="number"
              placeholder="0"
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full md:w-auto">
          Создать / Обновить правило
        </Button>
      </CardContent>
    </Card>
  );
}