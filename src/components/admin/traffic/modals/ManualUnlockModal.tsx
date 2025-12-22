import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Unlock, User as UserIcon, Clock, AlertTriangle } from "lucide-react";

interface ManualUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traderId: string;
  traderName: string;
  form: {
    reason: string;
    grace_period_minutes: number;
    admin_id: string;
  };
  setForm: (form: any) => void;
  actionLoading: boolean;
  onSave: () => void;
}

export default function ManualUnlockModal({
  open,
  onOpenChange,
  traderId,
  traderName,
  form,
  setForm,
  actionLoading,
  onSave
}: ManualUnlockModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5" />
            Ручная разблокировка трейдера
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Информация о трейдере */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <UserIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-orange-900">{traderName}</p>
                <p className="text-sm text-orange-700 mt-1">
                  <span className="font-mono">{traderId}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Предупреждение */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Внимание!</p>
              <p>
                После разблокировки трейдер не будет проверяться антифродом в течение грейс-периода. 
                Убедитесь, что причина разблокировки обоснована.
              </p>
            </div>
          </div>
          
          {/* Форма */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-red-500">*</span>
                Причина разблокировки
              </Label>
              <Textarea
                className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={form.reason}
                onChange={(e) => setForm({...form, reason: e.target.value})}
                placeholder="Например: Подтверждено, что отмены были по техническим причинам..."
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Обязательное поле. Будет сохранено в логах.
                </p>
                <p className="text-xs text-muted-foreground">
                  {form.reason.length}/500
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Грейс-период (минуты)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={10080}
                  value={form.grace_period_minutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 30;
                    setForm({...form, grace_period_minutes: Math.min(Math.max(value, 1), 10080)});
                  }}
                  className="flex-1"
                />
                <Select
                  value={form.grace_period_minutes.toString()}
                  onValueChange={(value) => setForm({...form, grace_period_minutes: parseInt(value)})}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 минут</SelectItem>
                    <SelectItem value="60">1 час</SelectItem>
                    <SelectItem value="120">2 часа</SelectItem>
                    <SelectItem value="360">6 часов</SelectItem>
                    <SelectItem value="720">12 часов</SelectItem>
                    <SelectItem value="1440">1 день</SelectItem>
                    <SelectItem value="2880">2 дня</SelectItem>
                    <SelectItem value="10080">1 неделя</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                В течение этого времени трейдер не будет проверяться антифродом. 
                После окончания проверки возобновятся автоматически.
              </p>
            </div>
                
            {/* Предпросмотр */}
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">Предпросмотр:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  • Трейдер будет разблокирован немедленно
                </p>
                <p>
                  • Грейс-период: <span className="font-medium text-foreground">
                    {form.grace_period_minutes} минут 
                    ({Math.floor(form.grace_period_minutes / 60)}ч {form.grace_period_minutes % 60}м)
                  </span>
                </p>
                <p>
                  • Грейс-период до: <span className="font-medium text-foreground">
                    {new Date(Date.now() + form.grace_period_minutes * 60000).toLocaleString('ru-RU')}
                  </span>
                </p>
                <p>
                  • Причина будет записана в аудит-лог
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={actionLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={onSave}
            disabled={actionLoading || !form.reason.trim()}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Разблокировка...
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Разблокировать
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}