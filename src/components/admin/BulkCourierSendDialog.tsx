import { useState } from "react";
import { Loader2, Truck, Package, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface BulkOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  total_amount: number;
  notes?: string | null;
  courier_id?: string | null;
}

interface BulkCourierSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: BulkOrder[];
}

type ResultItem = { id: string; ok: boolean; message: string };

const BulkCourierSendDialog = ({ open, onOpenChange, orders }: BulkCourierSendDialogProps) => {
  const [sending, setSending] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const queryClient = useQueryClient();

  const pending = orders.filter((o) => !o.courier_id);
  const alreadySent = orders.length - pending.length;

  const handleBulkSend = async (courier: "steadfast" | "pathao") => {
    if (pending.length === 0) return;
    setSending(courier);
    setResults([]);
    setProgress(0);

    const collected: ResultItem[] = [];

    for (const order of pending) {
      try {
        const { data, error } = await supabase.functions.invoke("send-to-courier", {
          body: {
            orderId: order.id,
            courier,
            recipientName: order.customer_name,
            recipientPhone: order.customer_phone,
            recipientAddress: order.customer_address,
            recipientCity: order.customer_city,
            codAmount: order.total_amount,
            note: order.notes || "",
          },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "কুরিয়ারে পাঠাতে ব্যর্থ");
        collected.push({ id: order.id, ok: true, message: data.trackingCode || "সফল" });
      } catch (err) {
        collected.push({
          id: order.id,
          ok: false,
          message: err instanceof Error ? err.message : "সমস্যা হয়েছে",
        });
      }
      setProgress((p) => p + 1);
      setResults([...collected]);
    }

    const okCount = collected.filter((r) => r.ok).length;
    const failCount = collected.length - okCount;
    queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
    setSending(null);

    if (okCount > 0) toast.success(`${okCount} টি অর্ডার ${courier.toUpperCase()}-এ পাঠানো হয়েছে`);
    if (failCount > 0) toast.error(`${failCount} টি অর্ডার পাঠানো যায়নি`);
  };

  const busy = sending !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            বাল্ক কুরিয়ারে পাঠান
          </DialogTitle>
          <DialogDescription>
            {orders.length} টি অর্ডার সিলেক্ট করা হয়েছে
            {alreadySent > 0 && ` (${alreadySent} টি আগেই পাঠানো হয়েছে, বাদ যাবে)`}। কুরিয়ার বেছে নিন।
          </DialogDescription>
        </DialogHeader>

        {pending.length === 0 ? (
          <div className="bg-muted p-4 rounded-lg text-center text-muted-foreground">
            সিলেক্ট করা সব অর্ডার ইতিমধ্যে কুরিয়ারে পাঠানো হয়েছে।
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p><strong>পাঠানো হবে:</strong> {pending.length} টি অর্ডার</p>
              <p>
                <strong>মোট COD:</strong> ৳
                {pending.reduce((s, o) => s + Number(o.total_amount || 0), 0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleBulkSend("steadfast")}
                disabled={busy}
                className="h-auto py-4 flex flex-col gap-2 bg-orange-500 hover:bg-orange-600"
              >
                {sending === "steadfast" ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Package className="h-6 w-6" />
                )}
                <span className="font-bold">স্টেডফাস্ট</span>
                <span className="text-xs opacity-80">Steadfast Courier</span>
              </Button>

              <Button
                onClick={() => handleBulkSend("pathao")}
                disabled={busy}
                className="h-auto py-4 flex flex-col gap-2 bg-red-500 hover:bg-red-600"
              >
                {sending === "pathao" ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Truck className="h-6 w-6" />
                )}
                <span className="font-bold">পাঠাও</span>
                <span className="text-xs opacity-80">Pathao Courier</span>
              </Button>
            </div>

            {(busy || results.length > 0) && (
              <div className="space-y-2">
                <p className="text-sm text-center text-muted-foreground">
                  {progress} / {pending.length} প্রসেস হয়েছে
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                  {results.map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      {r.ok ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive shrink-0" />
                      )}
                      <span className="font-mono">#{r.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-muted-foreground truncate">{r.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkCourierSendDialog;
