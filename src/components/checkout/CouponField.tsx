import { useState } from "react";
import { ChevronDown, ChevronUp, Tag, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/apiClient";

interface CouponResult {
  couponCode: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  offerText: string;
}

interface CouponFieldProps {
  cartTotal: number;
  onApply: (result: CouponResult | null) => void;
  appliedCoupon: CouponResult | null;
  accentColor: string;
}

const CouponField = ({ cartTotal, onApply, appliedCoupon, accentColor }: CouponFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<any>(`/spin/entries?coupon=${encodeURIComponent(code.trim().toUpperCase())}`);
      if (!data || data.is_used) {
        setError("কুপন কোডটি অবৈধ বা ইতিমধ্যে ব্যবহৃত");
        onApply(null);
        return;
      }

      let discountAmount = 0;
      if (data.discount_type === "free_shipping") {
        discountAmount = 0;
      } else if (data.discount_type === "percentage") {
        discountAmount = Math.round(cartTotal * (Number(data.discount_value) / 100));
      } else {
        discountAmount = Number(data.discount_value) || 0;
      }

      onApply({
        couponCode: data.coupon_code,
        discountType: data.discount_type,
        discountValue: Number(data.discount_value) || 0,
        discountAmount: Math.min(discountAmount, cartTotal),
        offerText: data.offer_text || "",
      });
      setError("");
    } catch {
      setError("কুপন কোডটি অবৈধ বা ইতিমধ্যে ব্যবহৃত");
      onApply(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onApply(null);
    setCode("");
    setError("");
  };

  return (
    <div className="rounded-xl overflow-hidden bg-slate-50 border-2 border-slate-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Tag className="h-4 w-4" style={{ color: accentColor }} />
          কুপন কোড আছে?
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-300">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <div>
                  <span className="text-sm font-semibold text-emerald-700">{appliedCoupon.couponCode}</span>
                  <p className="text-xs text-emerald-600">
                    {appliedCoupon.discountType === "free_shipping" 
                      ? "ফ্রি শিপিং! 🚚" 
                      : `ছাড়: ৳${appliedCoupon.discountAmount}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="কুপন কোড লিখুন"
                className="h-11 bg-white border-2 border-slate-200 text-slate-800 placeholder:text-slate-400 text-base flex-1 rounded-lg px-3 focus:border-emerald-500"
              />
              <Button
                type="button"
                onClick={handleApply}
                disabled={loading || !code.trim()}
                className="h-11 px-5 text-sm font-semibold text-white rounded-lg"
                style={{ background: accentColor }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "প্রয়োগ"}
              </Button>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default CouponField;
