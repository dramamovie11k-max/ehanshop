import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface CourierData {
  name: string;
  logo: string;
  total_parcel: number;
  success_parcel: number | string;
  cancelled_parcel: number | string;
  success_ratio: number;
}

interface CourierRatioData {
  couriers: CourierData[];
  summary: {
    total_parcel: number;
    success_parcel: number;
    cancelled_parcel: number;
    success_ratio: number;
  };
  checked_at?: string;
}

interface CourierRatioCheckerProps {
  phone: string;
  orderId?: string;
  cachedData?: any;
  saveToDb?: boolean;
}

const CourierRatioChecker = ({ phone, orderId, cachedData, saveToDb = true }: CourierRatioCheckerProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CourierRatioData | null>(
    cachedData?.summary ? cachedData : null
  );
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasFetched = useRef(!!cachedData?.summary);

  // If cachedData arrives later (e.g. async query), use it
  useEffect(() => {
    if (!hasFetched.current && !data && cachedData?.summary) {
      setData(cachedData);
      hasFetched.current = true;
    }
  }, [cachedData]);

  // Load saved result for this phone from the shared cache (no API call)
  useEffect(() => {
    let cancelled = false;
    if (data || !phone) return;

    (async () => {
      const { data: row } = await supabase
        .from("courier_ratio_cache")
        .select("data, checked_at")
        .eq("phone", phone)
        .maybeSingle();

      if (cancelled || !row?.data) return;
      const cached = row.data as any;
      if (cached?.summary) {
        setData({ ...cached, checked_at: cached.checked_at || row.checked_at });
        hasFetched.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phone, data]);

  const fetchRatio = async (forceRefresh = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    hasFetched.current = true;
    
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('check-courier-ratio', {
        body: { phone },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      const apiData = result.data;
      
      // Parse courier-wise data
      const courierKeys = ['pathao', 'steadfast', 'parceldex', 'redx', 'paperfly', 'carrybee'];
      const couriers: CourierData[] = courierKeys
        .filter(key => apiData[key])
        .map(key => ({
          name: apiData[key].name,
          logo: apiData[key].logo,
          total_parcel: Number(apiData[key].total_parcel) || 0,
          success_parcel: Number(apiData[key].success_parcel) || 0,
          cancelled_parcel: Number(apiData[key].cancelled_parcel) || 0,
          success_ratio: Number(apiData[key].success_ratio) || 0,
        }));

      const summary = apiData.summary || {
        total_parcel: 0,
        success_parcel: 0,
        cancelled_parcel: 0,
        success_ratio: 0,
      };

      const ratioData: CourierRatioData = {
        couriers,
        summary: {
          total_parcel: Number(summary.total_parcel) || 0,
          success_parcel: Number(summary.success_parcel) || 0,
          cancelled_parcel: Number(summary.cancelled_parcel) || 0,
          success_ratio: Number(summary.success_ratio) || 0,
        },
        checked_at: new Date().toISOString(),
      };

      setData(ratioData);

      // Save to shared phone-level cache so it never needs re-checking
      if (phone) {
        await supabase
          .from("courier_ratio_cache")
          .upsert(
            { phone, data: ratioData as any, checked_at: ratioData.checked_at },
            { onConflict: "phone" }
          );
      }

      // Also store on the order row for quick listing
      if (saveToDb && orderId) {
        await supabase
          .from("orders")
          .update({ courier_ratio_data: ratioData as any })
          .eq("id", orderId);
      }

    } catch (err: any) {
      console.error('Error checking courier ratio:', err);
      setError(err.message || 'চেক করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // Determine color based on success ratio
  const getColor = (ratio: number, total: number) => {
    if (total === 0) return "text-muted-foreground";
    if (ratio >= 70) return "text-green-600";
    if (ratio >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">চেক হচ্ছে...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="flex items-center gap-1 text-xs text-destructive" title={error}>
          <AlertCircle className="h-3 w-3" />
          Error
        </span>
        <button 
          onClick={() => fetchRatio(true)}
          className="text-[10px] text-primary hover:underline"
        >
          আবার চেষ্টা
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <button
        onClick={() => fetchRatio()}
        className="text-xs text-primary hover:underline whitespace-nowrap"
      >
        চেক করুন
      </button>
    );
  }

  // পুরনো/অসম্পূর্ণ ক্যাশে summary বা couriers নাও থাকতে পারে — নিরাপদ ডিফল্ট
  const summary = data.summary ?? { success_ratio: 0, total_parcel: 0, success_parcel: 0, cancelled_parcel: 0 };
  const couriers = Array.isArray(data.couriers) ? data.couriers : [];
  const successRatio = summary.success_ratio;
  const total = summary.total_parcel;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <div className="flex flex-col items-center gap-0.5">
        <span className={`text-sm font-bold ${getColor(successRatio, total)}`}>
          {total === 0 ? "নতুন" : `${Math.round(successRatio)}%`}
        </span>
        <DialogTrigger asChild>
          <button className="text-[10px] text-primary hover:underline cursor-pointer">
            ডিটেইলস দেখুন
          </button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            কুরিয়ার রেসিও
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchRatio(true)}
              disabled={loading}
              className="h-6 w-6 p-0"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                <TableHead className="text-primary-foreground font-semibold">COURIER</TableHead>
                <TableHead className="text-center text-primary-foreground font-semibold">TOTAL</TableHead>
                <TableHead className="text-center text-primary-foreground font-semibold">SUCCESS</TableHead>
                <TableHead className="text-center text-primary-foreground font-semibold">CANCEL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couriers.map((courier, index) => (
                <TableRow key={index}>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <img 
                        src={courier.logo} 
                        alt={courier.name} 
                        className="h-6 w-auto object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{courier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{courier.total_parcel}</TableCell>
                  <TableCell className="text-center font-medium text-green-600">{courier.success_parcel}</TableCell>
                  <TableCell className="text-center font-medium text-red-600">{courier.cancelled_parcel}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted font-bold">
                <TableCell className="py-2">
                  <span className="font-semibold">Total</span>
                </TableCell>
                <TableCell className="text-center font-bold">{summary.total_parcel}</TableCell>
                <TableCell className="text-center font-bold text-green-600">{summary.success_parcel}</TableCell>
                <TableCell className="text-center font-bold text-red-600">{summary.cancelled_parcel}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {data.checked_at && (
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              শেষ চেক: {new Date(data.checked_at).toLocaleString("bn-BD")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourierRatioChecker;
