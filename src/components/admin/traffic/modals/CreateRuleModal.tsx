import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CreateRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    name: string;
    type: string;
    config: string;
    priority: number;
  };
  setForm: (form: any) => void;
  actionLoading: boolean;
  onCreate: () => void;
}

export default function CreateRuleModal({
  open,
  onOpenChange,
  form,
  setForm,
  actionLoading,
  onCreate
}: CreateRuleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Создать правило антифрода</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="Название правила"
            />
          </div>
          <div className="space-y-2">
            <Label>Тип</Label>
            <Select
              value={form.type}
              onValueChange={(value) => setForm({...form, type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consecutive_orders">Последовательные заказы</SelectItem>
                <SelectItem value="canceled_orders">Отмененные заказы</SelectItem>
                <SelectItem value="order_amount">Сумма заказов</SelectItem>
                <SelectItem value="time_pattern">Временной паттерн</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Конфигурация (JSON)</Label>
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md font-mono text-sm"
              value={form.config}
              onChange={(e) => setForm({...form, config: e.target.value})}
              placeholder='{"max_consecutive": 5, "time_window_minutes": 60}'
            />
          </div>
          <div className="space-y-2">
            <Label>Приоритет</Label>
            <Input
              type="number"
              value={form.priority}
              onChange={(e) => setForm({...form, priority: parseInt(e.target.value) || 1})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={onCreate}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание...
              </>
            ) : (
              "Создать"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}