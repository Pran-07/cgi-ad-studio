import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Reset password — AdCraftor";
    // Supabase auto-handles the recovery token in the URL hash via onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also handle direct visits where session is already set
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated! You're signed in.");
    navigate("/app", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Film className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">AdCraftor</span>
        </Link>

        <div className="rounded-2xl border border-border/60 bg-gradient-card p-8 shadow-elegant">
          <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a strong password you haven't used before.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading || !ready} className="w-full bg-gradient-primary shadow-glow hover:opacity-90">
              {loading ? <Loader2 className="animate-spin" /> : ready ? "Update password" : "Waiting for recovery link…"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
