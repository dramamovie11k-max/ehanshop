 import { useState, useEffect } from "react";
 import { cn } from "@/lib/utils";
 import { ProductVariation } from "@/types";
 
 interface VariationSelectorProps {
   variations: ProductVariation[];
   variationType: string;
   selectedVariationId: string | null;
   onSelect: (variation: ProductVariation) => void;
   primaryColor: string;
   accentColor: string;
   priceUnit: string;
 }
 
 const VARIATION_TYPE_LABELS: Record<string, string> = {
   size: "সাইজ বাছুন",
   color: "রঙ বাছুন",
   pack: "প্যাক বাছুন",
   custom: "অপশন বাছুন",
 };
 
 const VariationSelector = ({
   variations,
   variationType,
   selectedVariationId,
   onSelect,
   primaryColor,
   accentColor,
   priceUnit,
 }: VariationSelectorProps) => {
   const [selected, setSelected] = useState<string | null>(selectedVariationId);
 
   useEffect(() => {
     if (!selected && variations.length > 0) {
       const defaultVariation = variations.find((v) => v.is_default) || variations[0];
       setSelected(defaultVariation.id);
       onSelect(defaultVariation);
     }
   }, [variations, selected, onSelect]);
 
   const handleSelect = (variation: ProductVariation) => {
     setSelected(variation.id);
     onSelect(variation);
   };
 
   if (variations.length === 0) return null;
 
   return (
     <div className="space-y-2">
       <p className="text-white/80 text-xs font-medium">
         {VARIATION_TYPE_LABELS[variationType] || "অপশন বাছুন"}:
       </p>
       <div className="flex flex-wrap gap-2">
         {variations.map((variation) => {
           const isSelected = selected === variation.id;
           return (
             <button
               key={variation.id}
               type="button"
               onClick={() => handleSelect(variation)}
               className={cn(
                 "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex flex-col items-center min-w-[60px]",
                 isSelected
                   ? "text-white scale-105"
                   : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
               )}
               style={
                 isSelected
                   ? {
                       background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                       borderColor: "transparent",
                       boxShadow: `0 4px 15px -3px ${primaryColor}50`,
                     }
                   : {}
               }
             >
               <span className="font-semibold">{variation.variation_name}</span>
               <span className="text-xs opacity-80">
                 {priceUnit}{variation.price}
               </span>
             </button>
           );
         })}
       </div>
     </div>
   );
 };
 
 export default VariationSelector;