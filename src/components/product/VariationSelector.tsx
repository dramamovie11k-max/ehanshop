import { cn } from "@/lib/utils";
import { ProductVariation } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface VariationSelectorProps {
  variations: ProductVariation[];
  variationType: string;
  selectedVariationId: string | null;
  onSelect: (variation: ProductVariation) => void;
}

const VariationSelector = ({
  variations,
  variationType,
  selectedVariationId,
  onSelect,
}: VariationSelectorProps) => {
  const { t } = useLanguage();

  const VARIATION_TYPE_LABELS: Record<string, string> = {
    size: t('card.select_size'),
    color: t('card.select_color'),
    pack: t('card.select_pack'),
    custom: t('card.select_option'),
  };

  if (variations.length === 0) return null;

  const selectedVariation = variations.find(v => v.id === selectedVariationId);

  return (
    <div className="space-y-2">
      <p className="text-base md:text-lg font-semibold text-foreground" style={{ fontSize: '17px' }}>
        {VARIATION_TYPE_LABELS[variationType] || t('card.select_option')}:
      </p>
      <div className="flex flex-wrap gap-2">
        {variations.map((variation) => {
          const isSelected = selectedVariationId === variation.id;
          return (
            <button
              key={variation.id}
              type="button"
              onClick={() => onSelect(variation)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 border-border text-foreground hover:bg-secondary hover:border-primary/50"
              )}
            >
              {variation.variation_name}
            </button>
          );
        })}
      </div>
      
      {/* Selected Variation Price & Stock */}
      {selectedVariation && (
        <div className="flex items-center gap-3 text-sm mt-2 p-2 bg-secondary/30 rounded-md">
          <span className="font-semibold text-primary">
            ৳{selectedVariation.price.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            {t('product.stock')}: {selectedVariation.stock ?? 0}
          </span>
        </div>
      )}
    </div>
  );
};

export default VariationSelector;
