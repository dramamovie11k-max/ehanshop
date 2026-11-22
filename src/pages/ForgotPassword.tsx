import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // ইমেইল সার্ভিস যুক্ত না থাকলে রিসেট লিঙ্কটি সরাসরি দেখানো হয়
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("ইমেইল দিন");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message || "সমস্যা হয়েছে, আবার চেষ্টা করুন");
    } else {
      setSent(true);
      setResetLink(
        data?.reset_token
          ? `${window.location.origin}/reset-password?token=${data.reset_token}`
          : null,
      );
      toast.success("পাসওয়ার্ড রিসেট লিঙ্ক তৈরি হয়েছে");
    }

    setLoading(false);
  };


  return (
    <div className="min-h-screen flex flex-col">
      
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-secondary/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">পাসওয়ার্ড ভুলে গেছেন?</CardTitle>
            <CardDescription>
              {sent
                ? "আপনার ইমেইলে রিসেট লিঙ্ক পাঠানো হয়েছে"
                : "আপনার ইমেইল দিন, আমরা রিসেট লিঙ্ক পাঠাবো"}
            </CardDescription>
          </CardHeader>
          {sent ? (
            <CardContent className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-muted-foreground">
                <strong>{email}</strong> অ্যাকাউন্টের জন্য রিসেট লিঙ্ক তৈরি হয়েছে।
              </p>
              {resetLink && (
                <div className="space-y-2">
                  <a
                    href={resetLink}
                    className="text-primary text-sm break-all hover:underline block"
                  >
                    {resetLink}
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(resetLink);
                      toast.success("লিঙ্ক কপি হয়েছে");
                    }}
                  >
                    লিঙ্ক কপি করুন
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={() => setSent(false)} className="mt-4">
                আবার পাঠান
              </Button>
            </CardContent>
          ) : (

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ইমেইল</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-brand hover:opacity-90"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  রিসেট লিঙ্ক পাঠান
                </Button>
              </CardFooter>
            </form>
          )}
          <div className="pb-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              লগইনে ফিরে যান
            </Link>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
