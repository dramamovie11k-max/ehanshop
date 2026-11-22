import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { MultiProductItem } from "@/types/salesPage";

interface ProductOption {
  id: string;
  name: string;
  name_bn?: string | null;
  price: number;
  image_url?: string | null;
}

interface MultiProductPickerProps {
  items: MultiProductItem[];
  products?: ProductOption[];
  onChange: (items: MultiProductItem[]) => void;
}

const MultiProductPicker = ({ items, products, onChange }: MultiProductPickerProps) => {
  const available = useMemo(
    () => (products || []).filter((p) => !items.some((i) => i.product_id === p.id)),
    [products, items]
  );

  const addProduct = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;
    onChange([
      ...items,
      {
        product_id: product.id,
        name: product.name_bn || product.name,
        price: product.price,
        image_url: product.image_url || null,
        is_active: true,
        is_default: items.length === 0,
      },
    ]);
  };

  const update = (index: number, patch: Partial<MultiProductItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const setDefault = (index: number) => {
    onChange(items.map((item, i) => ({ ...item, is_default: i === index })));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">একাধিক প্রোডাক্ট (কাস্টমার বেছে নেবে)</Label>
        <span className="text-[10px] text-muted-foreground">{items.length} টি</span>
      </div>

      <Select value="" onValueChange={addProduct}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder="+ প্রোডাক্ট যোগ করুন" />
        </SelectTrigger>
        <SelectContent>
          {available.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">সব প্রোডাক্ট যোগ করা হয়েছে</div>
          ) : (
            available.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name_bn || product.name} — ৳{product.price}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {items.length > 0 && (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {items.map((item, index) => (
            <div
              key={`${item.product_id}-${index}`}
              className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-9 h-9 rounded object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-9 h-9 rounded bg-muted flex-shrink-0" />
              )}

              <Input
                value={item.name}
                onChange={(e) => update(index, { name: e.target.value })}
                className="h-8 text-xs flex-1"
                placeholder="প্রোডাক্টের নাম"
              />

              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">৳{item.price}</span>
              </div>

              <div className="flex flex-col items-center flex-shrink-0">
                <Switch
                  checked={item.is_active !== false}
                  onCheckedChange={(checked) => update(index, { is_active: checked })}
                  className="scale-75"
                />
              </div>

              <button
                type="button"
                onClick={() => setDefault(index)}
                className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                  item.is_default
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                title="ডিফল্ট সিলেক্ট"
              >
                ডিফল্ট
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive flex-shrink-0"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Plus className="h-3 w-3" /> উপরের ড্রপডাউন থেকে প্রোডাক্ট যোগ করুন
        </p>
      )}
    </div>
  );
};

export default MultiProductPicker;
