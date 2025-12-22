import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AntiFraudRule } from "../types";

interface RuleDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: AntiFraudRule | null;
}

export default function RuleDetailsModal({
  open,
  onOpenChange,
  rule
}: RuleDetailsModalProps) {
  if (!rule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Детали правила</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium">Название</Label>
            <p className="mt-1">{rule.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Тип</Label>
            <p className="mt-1">
              <Badge variant="outline">{rule.type}</Badge>
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Конфигурация</Label>
            <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto">
              {JSON.stringify(rule.config, null, 2)}
            </pre>
          </div>
          <div>
            <Label className="text-sm font-medium">Приоритет</Label>
            <p className="mt-1">{rule.priority}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Статус</Label>
            <p className="mt-1">
              <Badge variant={rule.is_active ? "default" : "secondary"}>
                {rule.is_active ? "Активно" : "Неактивно"}
              </Badge>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}