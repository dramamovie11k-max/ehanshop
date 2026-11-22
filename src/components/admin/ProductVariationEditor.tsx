 import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, ImagePlus, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { Switch } from "@/components/ui/switch";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { useProductVariations, useSaveVariations } from "@/hooks/useProductVariations";
import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
interface VariationItem {
  id?: string;
  variation_name: string;
  price: number;
  stock: number;
  is_default: boolean;
  image_url?: string | null;
  shipping_inside_dhaka?: number | null;
  shipping_outside_dhaka?: number | null;
  free_shipping?: boolean;
}
 
 interface ProductVariationEditorProps {
   productId: string | null;
   basePrice: number;
   onSave?: () => void;
 }
 
 const VARIATION_TYPES = [
   { value: "size", label: "সাইজ", placeholder: "S, M, L, XL" },
   { value: "color", label: "রঙ", placeholder: "লাল, নীল, সবুজ" },
   { value: "pack", label: "প্যাক", placeholder: "১ পিস, ২ পিস, ৩ পিস" },
   { value: "custom", label: "কাস্টম", placeholder: "অপশন নাম" },
 ];
 
 const ProductVariationEditor = ({ productId, basePrice, onSave }: ProductVariationEditorProps) => {
   const { data: existingVariations = [], isLoading } = useProductVariations(productId);
   const saveVariations = useSaveVariations();
   
   const [hasVariations, setHasVariations] = useState(false);
   const [variationType, setVariationType] = useState("size");
   const [variations, setVariations] = useState<VariationItem[]>([]);
 
   useEffect(() => {
     if (existingVariations.length > 0) {
       setHasVariations(true);
       setVariationType(existingVariations[0].variation_type);
       setVariations(
         existingVariations.map((v) => ({
           id: v.id,
           variation_name: v.variation_name,
           price: v.price,
           stock: v.stock || 0,
           is_default: v.is_default,
          image_url: v.image_url || null,
          shipping_inside_dhaka: v.shipping_inside_dhaka ?? null,
          shipping_outside_dhaka: v.shipping_outside_dhaka ?? null,
          free_shipping: v.free_shipping ?? false,
         }))
       );
     }
   }, [existingVariations]);
 
   const addVariation = () => {
     setVariations([
       ...variations,
       {
         variation_name: "",
         price: basePrice,
         stock: 0,
         is_default: variations.length === 0,
        image_url: null,
        shipping_inside_dhaka: null,
        shipping_outside_dhaka: null,
        free_shipping: false,
       },
     ]);
   };
 
   const removeVariation = (index: number) => {
     const newVariations = variations.filter((_, i) => i !== index);
     if (newVariations.length > 0 && !newVariations.some((v) => v.is_default)) {
       newVariations[0].is_default = true;
     }
     setVariations(newVariations);
   };
 
   const updateVariation = (index: number, field: keyof VariationItem, value: any) => {
     const newVariations = [...variations];
     newVariations[index] = { ...newVariations[index], [field]: value };
     
     if (field === "is_default" && value) {
       newVariations.forEach((v, i) => {
         if (i !== index) v.is_default = false;
       });
     }
     
     setVariations(newVariations);
   };
 
   const handleSave = async () => {
     if (!productId) {
       toast.error("প্রথমে প্রোডাক্ট সেভ করুন");
       return;
     }
 
     if (hasVariations && variations.length === 0) {
       toast.error("অন্তত একটি ভেরিয়েশন যোগ করুন");
       return;
     }
 
     if (hasVariations && variations.some((v) => !v.variation_name.trim())) {
       toast.error("সব ভেরিয়েশনের নাম দিন");
       return;
     }
 
     try {
       await saveVariations.mutateAsync({
         productId,
         variations: hasVariations ? variations : [],
         variationType,
       });
       toast.success("ভেরিয়েশন সেভ হয়েছে");
       onSave?.();
     } catch (error: any) {
       toast.error(error.message || "সমস্যা হয়েছে");
     }
   };
 
   const currentType = VARIATION_TYPES.find((t) => t.value === variationType);

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const ext = file.name.split(".").pop();
      const filePath = `variations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("products").upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from("products").getPublicUrl(filePath);
      updateVariation(index, "image_url", data.publicUrl);
      toast.success("ইমেজ আপলোড হয়েছে");
    } catch (e: any) {
      toast.error(e.message || "ইমেজ আপলোডে সমস্যা");
    }
  };
 
   if (isLoading) {
     return (
       <Card className="border-dashed">
         <CardContent className="py-6">
           <div className="flex items-center justify-center text-muted-foreground">
             লোড হচ্ছে...
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="border-dashed">
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="text-base flex items-center gap-2">
             ভেরিয়েশন সেটআপ
             {hasVariations && variations.length > 0 && (
               <Badge variant="secondary" className="text-xs">
                 {variations.length}টি
               </Badge>
             )}
           </CardTitle>
           <div className="flex items-center gap-2">
             <Label className="text-sm text-muted-foreground">সক্রিয়</Label>
             <Switch
               checked={hasVariations}
               onCheckedChange={setHasVariations}
             />
           </div>
         </div>
       </CardHeader>
 
       {hasVariations && (
         <CardContent className="space-y-4">
           {/* Variation Type Selection */}
           <div className="space-y-2">
             <Label className="text-sm">ভেরিয়েশন টাইপ</Label>
             <RadioGroup
               value={variationType}
               onValueChange={setVariationType}
               className="flex flex-wrap gap-3"
             >
               {VARIATION_TYPES.map((type) => (
                 <div key={type.value} className="flex items-center space-x-2">
                   <RadioGroupItem value={type.value} id={type.value} />
                   <Label htmlFor={type.value} className="text-sm cursor-pointer">
                     {type.label}
                   </Label>
                 </div>
               ))}
             </RadioGroup>
           </div>
 
           {/* Variations List */}
           <div className="space-y-2">
             {variations.map((variation, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-secondary/50 border space-y-2"
                >
                 <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

                {/* Image picker */}
                <div className="relative shrink-0">
                  <label
                    htmlFor={`var-img-${index}`}
                    className="flex items-center justify-center h-12 w-12 rounded-md border border-dashed bg-background cursor-pointer overflow-hidden hover:border-primary"
                    title="ভেরিয়েশন ইমেজ"
                  >
                    {variation.image_url ? (
                      <img src={variation.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </label>
                  <input
                    id={`var-img-${index}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(index, f);
                      e.target.value = "";
                    }}
                  />
                  {variation.image_url && (
                    <button
                      type="button"
                      onClick={() => updateVariation(index, "image_url", null)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                 <div className="flex-1 grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground leading-none">ভেরিয়েশন</Label>
                    <Input
                      placeholder={currentType?.placeholder || "নাম"}
                      value={variation.variation_name}
                      onChange={(e) => updateVariation(index, "variation_name", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground leading-none">প্রাইস</Label>
                    <Input
                      type="number"
                      placeholder="দাম"
                      value={variation.price}
                      onChange={(e) => updateVariation(index, "price", parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground leading-none">স্টক</Label>
                    <Input
                      type="number"
                      placeholder="স্টক"
                      value={variation.stock}
                      onChange={(e) => updateVariation(index, "stock", parseInt(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                 </div>
 
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={variation.is_default}
                        onCheckedChange={(checked) => updateVariation(index, "is_default", checked)}
                        className="scale-75"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">ডিফল্ট</span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeVariation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                 </div>

                 {/* Custom shipping per variation */}
                 <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-border/60">
                   <div className="flex items-center gap-1 h-9">
                     <Switch
                       checked={variation.free_shipping ?? false}
                       onCheckedChange={(checked) => updateVariation(index, "free_shipping", checked)}
                       className="scale-75"
                     />
                     <span className="text-xs text-muted-foreground whitespace-nowrap">ফ্রি ডেলিভারি</span>
                   </div>
                   {!variation.free_shipping && (
                     <>
                       <div className="space-y-0.5">
                         <Label className="text-[10px] text-muted-foreground leading-none">ঢাকার ভিতরে (৳)</Label>
                         <Input
                           type="number"
                           placeholder="ডিফল্ট"
                           value={variation.shipping_inside_dhaka ?? ""}
                           onChange={(e) =>
                             updateVariation(index, "shipping_inside_dhaka", e.target.value === "" ? null : parseFloat(e.target.value))
                           }
                           className="h-9 w-28"
                         />
                       </div>
                       <div className="space-y-0.5">
                         <Label className="text-[10px] text-muted-foreground leading-none">ঢাকার বাইরে (৳)</Label>
                         <Input
                           type="number"
                           placeholder="ডিফল্ট"
                           value={variation.shipping_outside_dhaka ?? ""}
                           onChange={(e) =>
                             updateVariation(index, "shipping_outside_dhaka", e.target.value === "" ? null : parseFloat(e.target.value))
                           }
                           className="h-9 w-28"
                         />
                       </div>
                     </>
                   )}
                 </div>
                </div>
              ))}
 
             <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={addVariation}
               className="w-full border-dashed"
             >
               <Plus className="h-4 w-4 mr-2" />
               ভেরিয়েশন যোগ করুন
             </Button>
           </div>
 
           {/* Save Button */}
           {productId && (
             <Button
               type="button"
               onClick={handleSave}
               disabled={saveVariations.isPending}
               className="w-full"
             >
               {saveVariations.isPending ? "সেভ হচ্ছে..." : "ভেরিয়েশন সেভ করুন"}
             </Button>
           )}
           
           {!productId && (
             <p className="text-xs text-muted-foreground text-center">
               ⚠️ প্রথমে প্রোডাক্ট সেভ করুন, তারপর ভেরিয়েশন যোগ করতে পারবেন
             </p>
           )}
         </CardContent>
       )}
     </Card>
   );
 };
 
 export default ProductVariationEditor;