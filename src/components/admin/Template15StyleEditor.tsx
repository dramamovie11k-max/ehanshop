import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

// Default styles matching Template15Universal.tsx
const defaultStyles: Record<string, Record<string, string>> = {
  global: {
    backgroundColor: "#f4f4f4",
    maxWidth: "650",
    sectionGap: "5",
    fontFamily: "'Hind Siliguri', sans-serif",
  },
  hero: {
    backgroundColor: "#f0fdf4",
    headerBgColor: "#065f46",
    headerTextColor: "#ffffff",
    subheadlineColor: "#16a34a",
    borderRadius: "15",
    videoBorderColor: "#4ade80",
    videoBorderWidth: "4",
    offerTextColor: "#16a34a",
    ctaBgColor: "#064e3b",
    ctaTextColor: "#ffffff",
    ctaBorderRadius: "50",
    ctaFontSize: "20",
  },
  features: {
    backgroundColor: "#065f46",
    borderRadius: "15",
    headingColor: "#ffffff",
    subheadingColor: "rgba(255,255,255,0.7)",
    itemBgColor: "rgba(255,255,255,0.1)",
    itemTextColor: "#ffffff",
    checkBgColor: "#4ade80",
    checkIconColor: "#065f46",
    ctaBgColor: "#064e3b",
    ctaTextColor: "#ffffff",
    ctaBorderRadius: "50",
  },
  reviews: {
    backgroundColor: "#065f46",
    borderRadius: "15",
    headingColor: "#ffffff",
    subheadingColor: "rgba(255,255,255,0.7)",
    imageBorderColor: "#4ade80",
    imageBorderWidth: "3",
  },
  contact: {
    borderRadius: "15",
  },
  checkout: {
    borderRadius: "15",
  },
  extra: {
    backgroundColor: "#065f46",
    borderRadius: "15",
    headingColor: "#ffffff",
    itemBgColor: "rgba(255,255,255,0.1)",
    itemTextColor: "#ffffff",
    checkBgColor: "#4ade80",
    checkIconColor: "#065f46",
    ctaBgColor: "#064e3b",
    ctaTextColor: "#ffffff",
    ctaBorderRadius: "50",
  },
  gallery: {
    borderRadius: "15",
  },
  video: {
    backgroundColor: "#065f46",
    borderRadius: "15",
    headingColor: "#ffffff",
    subheadingColor: "rgba(255,255,255,0.7)",
    videoBorderColor: "#4ade80",
    videoBorderWidth: "3",
  },
  countdown: {
    backgroundColor: "#064e3b",
    borderRadius: "15",
    textColor: "#ffffff",
    numberBgColor: "rgba(255,255,255,0.15)",
    numberColor: "#ffffff",
    labelColor: "rgba(255,255,255,0.7)",
  },
  footer: {
    backgroundColor: "#065f46",
    textColor: "#ffffff",
  },
};

interface Template15StyleEditorProps {
  templateStyles: Record<string, Record<string, string>>;
  onChange: (styles: Record<string, Record<string, string>>) => void;
}

const Template15StyleEditor = ({ templateStyles, onChange }: Template15StyleEditorProps) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Merge with defaults
  const getVal = (section: string, key: string): string => {
    return templateStyles?.[section]?.[key] ?? defaultStyles[section]?.[key] ?? "";
  };

  const setVal = (section: string, key: string, value: string) => {
    const updated = { ...templateStyles };
    if (!updated[section]) updated[section] = {};
    updated[section] = { ...updated[section], [key]: value };
    onChange(updated);
  };

  const ColorField = ({ section, field, label }: { section: string; field: string; label: string }) => (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="flex gap-1">
        <input
          type="color"
          value={getVal(section, field)}
          onChange={(e) => setVal(section, field, e.target.value)}
          className="w-7 h-7 rounded border cursor-pointer flex-shrink-0"
        />
        <Input
          value={getVal(section, field)}
          onChange={(e) => setVal(section, field, e.target.value)}
          className="h-7 text-[10px] flex-1"
        />
      </div>
    </div>
  );

  const RadiusSlider = ({ section, field, label, max = 50 }: { section: string; field: string; label: string; max?: number }) => (
    <div>
      <div className="flex justify-between items-center">
        <Label className="text-[10px] text-muted-foreground">{label}</Label>
        <span className="text-[10px] text-muted-foreground">{getVal(section, field)}px</span>
      </div>
      <Slider
        value={[parseInt(getVal(section, field)) || 0]}
        onValueChange={([v]) => setVal(section, field, String(v))}
        max={max}
        min={0}
        step={1}
        className="mt-1"
      />
    </div>
  );

  const FontSizeSlider = ({ section, field, label }: { section: string; field: string; label: string }) => (
    <div>
      <div className="flex justify-between items-center">
        <Label className="text-[10px] text-muted-foreground">{label}</Label>
        <span className="text-[10px] text-muted-foreground">{getVal(section, field)}px</span>
      </div>
      <Slider
        value={[parseInt(getVal(section, field)) || 16]}
        onValueChange={([v]) => setVal(section, field, String(v))}
        max={48}
        min={10}
        step={1}
        className="mt-1"
      />
    </div>
  );

  const SectionGroup = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-1.5 bg-muted/40 cursor-pointer"
        onClick={() => setExpandedGroup(expandedGroup === id ? null : id)}
      >
        <span className="text-xs font-medium">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedGroup === id ? 'rotate-180' : ''}`} />
      </div>
      {expandedGroup === id && (
        <div className="p-3 border-t space-y-3 bg-background">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-2 pt-2 border-t mt-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        🎨 Template 15 স্টাইল কাস্টমাইজ
      </Label>

      {/* Global */}
      <SectionGroup id="global" label="🌐 গ্লোবাল সেটিংস">
        <ColorField section="global" field="backgroundColor" label="পেজ ব্যাকগ্রাউন্ড" />
        <div>
          <Label className="text-[10px] text-muted-foreground">ম্যাক্স-উইথ</Label>
          <Select value={getVal("global", "maxWidth")} onValueChange={(v) => setVal("global", "maxWidth", v)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="480">৪৮০px (মোবাইল)</SelectItem>
              <SelectItem value="550">৫৫০px (কম্প্যাক্ট)</SelectItem>
              <SelectItem value="650">৬৫০px (ডিফল্ট)</SelectItem>
              <SelectItem value="800">৮০০px (ওয়াইড)</SelectItem>
              <SelectItem value="1024">১০২৪px (ডেস্কটপ)</SelectItem>
              <SelectItem value="1200">১২০০px (ফুল-উইথ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex justify-between items-center">
            <Label className="text-[10px] text-muted-foreground">সেকশন গ্যাপ</Label>
            <span className="text-[10px] text-muted-foreground">{getVal("global", "sectionGap")}px</span>
          </div>
          <Slider
            value={[parseInt(getVal("global", "sectionGap")) || 5]}
            onValueChange={([v]) => setVal("global", "sectionGap", String(v))}
            max={30}
            min={0}
            step={1}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">ফন্ট ফ্যামিলি</Label>
          <Select value={getVal("global", "fontFamily")} onValueChange={(v) => setVal("global", "fontFamily", v)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="'Hind Siliguri', sans-serif">Hind Siliguri</SelectItem>
              <SelectItem value="'Noto Sans Bengali', sans-serif">Noto Sans Bengali</SelectItem>
              <SelectItem value="'Tiro Bangla', serif">Tiro Bangla (সেরিফ)</SelectItem>
              <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
              <SelectItem value="system-ui, sans-serif">সিস্টেম ডিফল্ট</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionGroup>

      {/* Hero */}
      <SectionGroup id="hero" label="🖼️ হিরো সেকশন">
        <div className="grid grid-cols-2 gap-2">
          <ColorField section="hero" field="backgroundColor" label="ব্যাকগ্রাউন্ড" />
          <ColorField section="hero" field="headerBgColor" label="হেডার ব্যাকগ্রাউন্ড" />
          <ColorField section="hero" field="headerTextColor" label="হেডার টেক্সট" />
          <ColorField section="hero" field="subheadlineColor" label="সাব-হেডলাইন" />
          <ColorField section="hero" field="offerTextColor" label="অফার টেক্সট" />
          <ColorField section="hero" field="videoBorderColor" label="ভিডিও বর্ডার" />
        </div>
        <RadiusSlider section="hero" field="borderRadius" label="বর্ডার রেডিয়াস" />
        <div className="grid grid-cols-2 gap-2">
          <ColorField section="hero" field="ctaBgColor" label="CTA ব্যাকগ্রাউন্ড" />
          <ColorField section="hero" field="ctaTextColor" label="CTA টেক্সট" />
        </div>
        <RadiusSlider section="hero" field="ctaBorderRadius" label="CTA বর্ডার রেডিয়াস" />
        <FontSizeSlider section="hero" field="ctaFontSize" label="CTA ফন্ট সাইজ" />
      </SectionGroup>

      {/* Features */}
      <SectionGroup id="features" label="✅ ফিচার সেকশন">
        <div className="grid grid-cols-2 gap-2">
          <ColorField section="features" field="backgroundColor" label="ব্যাকগ্রাউন্ড" />
          <ColorField section="features" field="headingColor" label="হেডিং" />
          <ColorField section="features" field="itemBgColor" label="আইটেম ব্যাকগ্রাউন্ড" />
          <ColorField section="features" field="itemTextColor" label="আইটেম টেক্সট" />
          <ColorField section="features" field="checkBgColor" label="চেক আইকন BG" />
          <ColorField section="features" field="checkIconColor" label="চেক আইকন" />
        </div>
        <RadiusSlider section="features" field="borderRadius" label="বর্ডার রেডিয়াস" />
        <div className="grid grid-cols-2 gap-2">
          <ColorField section="features" field="ctaBgColor" label="CTA ব্যাকগ্রাউন্ড" />
          <ColorField section="features" field="ctaTextColor" label="CTA টেক্সট" />
        </div>
        <RadiusSlider section="features" field="ctaBorderRadius" label="CTA বর্ডার রেডিয়াস" />
      </SectionGroup>

      {/* Reviews */}
      <SectionGroup id="reviews" label="⭐ রিভিউ সেকশন">
        <div className="grid grid-cols-2 gap-2">
          <ColorField section="reviews" field="backgroundColor" label="ব্যাকগ্রাউন্ড" />
          <ColorField section="reviews" field="headingColor" label="হেডিং" />
          <ColorField section="reviews" field="imageBorderColor" label="ইমেজ বর্ডার" />
        </div>
        <RadiusSlider section="reviews" field="borderRadius" label="বর্ডার রেডিয়াস" />
        <div>
          <div className="flex justify-between items-center">
            <Label className="text-[10px] text-muted-foreground">ইমেজ বর্ডার উইথ</Label>
            <span className="text-[10px] text-muted-foreground">{getVal("reviews", "imageBorderWidth")}px</span>
          </div>
          <Slider
            value={[parseInt(getVal("reviews", "imageBorderWidth")) || 3]}
            onValueChange={([v]) => setVal("reviews", "imageBorderWidth", String(v))}
            max={8}
            min={0}
            step={1}
            className="mt-1"
          />
        </div>
      </SectionGroup>

      {/* Gallery */}
      <SectionGroup id="gallery" label="🖼 গ্যালারি সেকশন">
        <RadiusSlider section="gallery" field="borderRadius" label="বর্ডার রেডিয়াস" />
      </SectionGroup>

      {/* Video */}
      <SectionGroup id="video" label="▶️ ভিডিও সেকশন">
        <div className="grid grid-cols-2 gap-2">
          <ColorField section="video" field="backgroundColor" label="ব্যাকগ্রাউন্ড" />
          <ColorField section="video" field="headingColor" label="হেডিং" />
          <ColorField section="video" field="videoBorderColor" label="ভিডিও বর্ডার" />
        </div>
        <RadiusSlider section="video" field="borderRadius" label="বর্ডার রেডিয়াস" />
      </SectionGroup>

      {/* Countdown */}
      <SectionGroup id="countdown" label="⏱️ কাউন্টডাউন সেকশন">
        <div className="grid grid-cols-2 gap-2">
          <ColorField section="countdown" field="backgroundColor" label="ব্যাকগ্রাউন্ড" />
          <ColorField section="countdown" field="numberBgColor" label="নাম্বার BG" />
          <ColorField section="countdown" field="numberColor" label="নাম্বার কালার" />
          <ColorField section="countdown" field="labelColor" label="লেবেল কালার" />
        </div>
        <RadiusSlider section="countdown" field="borderRadius" label="বর্ডার রেডিয়াস" />
      </SectionGroup>

      {/* Extra Sections */}
      <SectionGroup id="extra" label="📦 এক্সট্রা সেকশন (১-৩)">
        <div className="grid grid-cols-2 gap-2">
          <ColorField section="extra" field="backgroundColor" label="ব্যাকগ্রাউন্ড" />
          <ColorField section="extra" field="headingColor" label="হেডিং" />
          <ColorField section="extra" field="itemBgColor" label="আইটেম BG" />
          <ColorField section="extra" field="itemTextColor" label="আইটেম টেক্সট" />
          <ColorField section="extra" field="checkBgColor" label="চেক আইকন BG" />
          <ColorField section="extra" field="ctaBgColor" label="CTA ব্যাকগ্রাউন্ড" />
        </div>
        <RadiusSlider section="extra" field="borderRadius" label="বর্ডার রেডিয়াস" />
        <RadiusSlider section="extra" field="ctaBorderRadius" label="CTA বর্ডার রেডিয়াস" />
      </SectionGroup>

      {/* Contact & Checkout */}
      <SectionGroup id="contact-checkout" label="📞 কন্টাক্ট ও চেকআউট">
        <RadiusSlider section="contact" field="borderRadius" label="কন্টাক্ট বর্ডার রেডিয়াস" />
        <RadiusSlider section="checkout" field="borderRadius" label="চেকআউট বর্ডার রেডিয়াস" />
      </SectionGroup>

      {/* Footer */}
      <SectionGroup id="footer" label="📄 ফুটার">
        <div className="grid grid-cols-2 gap-2">
          <ColorField section="footer" field="backgroundColor" label="ব্যাকগ্রাউন্ড" />
          <ColorField section="footer" field="textColor" label="টেক্সট কালার" />
        </div>
      </SectionGroup>
    </div>
  );
};

export default Template15StyleEditor;
