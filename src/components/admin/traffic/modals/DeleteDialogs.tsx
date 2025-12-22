import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { MerchantTraffic, TrafficRecord, TraderTraffic } from "../types";

interface DeleteDialogsProps {
  deleteMerchantDialog: { open: boolean; merchant: MerchantTraffic | null };
  setDeleteMerchantDialog: (dialog: { open: boolean; merchant: MerchantTraffic | null }) => void;
  deleteTraderDialog: { open: boolean; trader: TraderTraffic | null };
  setDeleteTraderDialog: (dialog: { open: boolean; trader: TraderTraffic | null }) => void;
  deleteConnectionDialog: { open: boolean; connection: TrafficRecord | null };
  setDeleteConnectionDialog: (dialog: { open: boolean; connection: TrafficRecord | null }) => void;
  actionLoading: string | null;
  onDeleteMerchant: () => Promise<void>;
  onDeleteTrader: () => Promise<void>;
  onDeleteConnection: () => Promise<void>;
}

export default function DeleteDialogs({
  deleteMerchantDialog,
  setDeleteMerchantDialog,
  deleteTraderDialog,
  setDeleteTraderDialog,
  deleteConnectionDialog,
  setDeleteConnectionDialog,
  actionLoading,
  onDeleteMerchant,
  onDeleteTrader,
  onDeleteConnection
}: DeleteDialogsProps) {
  return (
    <>
      {/* Delete Merchant Dialog */}
      <AlertDialog open={deleteMerchantDialog.open} onOpenChange={(open) => setDeleteMerchantDialog({open, merchant: null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить все записи трафика?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие удалит все записи трафика для мерчанта {deleteMerchantDialog.merchant?.merchant.username}. 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteMerchant}
              disabled={actionLoading !== null}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading === `merchant-delete-${deleteMerchantDialog.merchant?.merchant.id}` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Trader Dialog */}
      <AlertDialog open={deleteTraderDialog.open} onOpenChange={(open) => setDeleteTraderDialog({open, trader: null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить все записи трафика?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие удалит все записи трафика для трейдера {deleteTraderDialog.trader?.trader.username}. 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteTrader}
              disabled={actionLoading !== null}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading === `trader-delete-${deleteTraderDialog.trader?.trader.id}` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Connection Dialog */}
      <AlertDialog open={deleteConnectionDialog.open} onOpenChange={(open) => setDeleteConnectionDialog({open, connection: null})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить подключение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие удалит запись трафика. 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteConnection}
              disabled={actionLoading !== null}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading === `connection-delete-${deleteConnectionDialog.connection?.id}` ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}