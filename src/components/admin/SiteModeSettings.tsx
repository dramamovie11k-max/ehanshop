import { getSiteMode, type SiteMode } from '@/lib/siteMode';

export default function SiteModeSettings({ value, onChange }: { value: string; onChange: (mode: SiteMode) => void }) {
  return (
    <fieldset className="space-y-3 rounded-xl border p-4">
      <legend className="px-2 text-lg font-semibold">ওয়েবসাইটের মোড</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          ['landing', 'ল্যান্ডিং পেজ মোড', 'Sales Pages থেকে বেছে নেওয়া পেজটি হোমপেজে দেখাবে। পেজ বেছে না নিলে সক্রিয় সেলস পেজের তালিকা দেখাবে।'],
          ['website', 'ওয়েবসাইট মোড', 'হোমপেজে প্রোডাক্ট ও ক্যাটেগরি দেখাবে। শপ, প্রোডাক্ট, কার্ট ও চেকআউট পেজ থাকবে।'],
        ] as const).map(([mode, title, description]) => (
          <label key={mode} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${getSiteMode(value) === mode ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <input type="radio" name="site_mode" value={mode} checked={getSiteMode(value) === mode} onChange={() => onChange(mode)} className="mt-1 accent-primary" />
            <span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm text-muted-foreground">{description}</span></span>
          </label>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">মোড নির্বাচন করে নিচের “সেটিংস সেভ করুন” বোতামে চাপুন।</p>
    </fieldset>
  );
}
