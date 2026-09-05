import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, RotateCcw, Film, AlertCircle, LogOut, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const START_URL = "https://ganaya.app.n8n.cloud/webhook/adcreator.in";
const STATUS_URL = "https://ganaya.app.n8n.cloud/webhook/adcraftor-status";
const POLL_INTERVAL = 5000;
const TIMEOUT_MS = 10 * 60 * 1000;

interface FormData {
  age: string;
  gender: string;
  ethnicity: string;
  skin_tone: string;
  hair_length: string;
  body_type: string;
  model_position: string;
  background: string;
}

const selectFields = [
  { label: "Model Gender", name: "gender" as const, options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }] },
  { label: "Ethnicity", name: "ethnicity" as const, options: [{ label: "Asian", value: "asian" }, { label: "American", value: "american" }, { label: "European", value: "european" }, { label: "African", value: "african" }, { label: "Middle Eastern", value: "middle_eastern" }] },
  { label: "Skin Tone", name: "skin_tone" as const, options: [{ label: "Light", value: "light" }, { label: "Medium", value: "medium" }, { label: "Dark", value: "dark" }] },
  { label: "Hair Length", name: "hair_length" as const, options: [{ label: "Short", value: "short" }, { label: "Medium", value: "medium" }, { label: "Long", value: "long" }] },
  { label: "Body Type", name: "body_type" as const, options: [{ label: "Slim", value: "slim" }, { label: "Average", value: "average" }, { label: "Athletic", value: "athletic" }] },
  { label: "Model Position", name: "model_position" as const, options: [{ label: "Standing", value: "standing" }, { label: "Sitting", value: "sitting" }, { label: "Holding Product", value: "holding_product" }] },
  { label: "Background", name: "background" as const, options: [{ label: "Outdoor Street", value: "outdoor_street" }, { label: "Indoor Studio", value: "indoor_studio" }, { label: "Nature / Park", value: "nature_park" }, { label: "Office / Workspace", value: "office_workspace" }, { label: "Minimal Plain", value: "minimal_plain" }] },
];

function isUrl(value: string): boolean {
  try { new URL(value); return true; } catch { return false; }
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.includes("video");
}

const Index = () => {
  const { user, signOut } = useAuth();
  const [formData, setFormData] = useState<FormData>({ age: "", gender: "", ethnicity: "", skin_tone: "", hair_length: "", body_type: "", model_position: "", background: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setPolling(false);
  }, []);

  const saveVideoToCloud = async (videoUrl: string): Promise<string> => {
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error("Failed to download generated video");
    const videoBlob = await videoRes.blob();
    const videoExt = videoUrl.split(".").pop()?.split("?")[0] || "mp4";
    const videoFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${videoExt}`;
    const { error: uploadErr } = await supabase.storage
      .from("generated-videos")
      .upload(videoFileName, videoBlob, { contentType: videoBlob.type || "video/mp4" });
    if (uploadErr) throw new Error(`Video save failed: ${uploadErr.message}`);
    const { data } = supabase.storage.from("generated-videos").getPublicUrl(videoFileName);
    return data.publicUrl;
  };

  const startPolling = useCallback((id: string) => {
    setPolling(true);
    setElapsedSec(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    pollingRef.current = setInterval(async () => {
      try {
        if (Date.now() - startTimeRef.current > TIMEOUT_MS) {
          stopPolling();
          setLoading(false);
          setError("Generation timed out after 10 minutes. Please try again.");
          return;
        }

        const res = await fetch(`${STATUS_URL}?jobId=${encodeURIComponent(id)}`);
        if (!res.ok) return; // retry on next tick

        const data = await res.json();

        if (data.status === "done" && data.video_url) {
          stopPolling();
          let finalUrl = data.video_url;
          if (isUrl(finalUrl)) {
            try { finalUrl = await saveVideoToCloud(finalUrl); } catch { /* use original */ }
          }
          setResult({ video_url: finalUrl, ...data });
          setLoading(false);
        } else if (data.status === "error") {
          stopPolling();
          setError(data.message || "Video generation failed.");
          setLoading(false);
        }
      } catch {
        // network blip – keep polling
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!file) errors.product_image = "Please upload a product image";
    const ageNum = Number(formData.age);
    if (!formData.age) errors.age = "Age is required";
    else if (!Number.isInteger(ageNum) || ageNum <= 0) errors.age = "Age must be a positive whole number";
    for (const field of selectFields) {
      if (!formData[field.name]) errors[field.name] = `${field.label} is required`;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    console.log("clicked");
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fileExt = file!.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file!);
      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);

      console.log("Sending POST to", START_URL);
      const res = await fetch(START_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: urlData.publicUrl, ...formData }),
      });

      console.log("Response status:", res.status);
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const data = await res.json();
      console.log("Response data:", data);
      if (!data.jobId) throw new Error("No jobId received from server");

      setJobId(data.jobId);
      startPolling(data.jobId);
    } catch (err: unknown) {
      console.error("handleSubmit error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setFormData({ age: "", gender: "", ethnicity: "", skin_tone: "", hair_length: "", body_type: "", model_position: "", background: "" });
    setFile(null);
    setResult(null);
    setError(null);
    setJobId(null);
    setElapsedSec(0);
    setValidationErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const progressPercent = Math.min((elapsedSec / 600) * 100, 99);
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Film className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AdCraftor</h1>
              <p className="text-sm text-muted-foreground">AI-powered CGI ad video generator</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/"><Home className="h-4 w-4" /></Link></Button>
            {user && <Button onClick={signOut} variant="outline" size="sm"><LogOut className="mr-1 h-4 w-4" />Logout</Button>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Product & Model Details</h2>
            <p className="text-sm text-muted-foreground">Upload your product image and configure the AI model.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_image" className="text-sm font-medium text-foreground">
              Product Image <span className="text-destructive">*</span>
            </Label>
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-muted/50 ${
                validationErrors.product_image ? "border-destructive" : file ? "border-primary/30 bg-primary/5" : "border-border"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              {file ? (
                <p className="text-sm font-medium text-foreground">{file.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Click to upload product image</p>
              )}
              <input ref={fileInputRef} id="product_image" type="file" accept="image/*" className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] || null); setValidationErrors((prev) => ({ ...prev, product_image: "" })); }}
              />
            </div>
            {validationErrors.product_image && <p className="text-xs text-destructive">{validationErrors.product_image}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {selectFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label className="text-sm font-medium text-foreground">{field.label} <span className="text-destructive">*</span></Label>
                <Select value={formData[field.name]} onValueChange={(val) => { setFormData((prev) => ({ ...prev, [field.name]: val })); setValidationErrors((prev) => ({ ...prev, [field.name]: "" })); }}>
                  <SelectTrigger className={validationErrors[field.name] ? "border-destructive" : ""}><SelectValue placeholder={`Select ${field.label.toLowerCase()}`} /></SelectTrigger>
                  <SelectContent>{field.options.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
                {validationErrors[field.name] && <p className="text-xs text-destructive">{validationErrors[field.name]}</p>}
              </div>
            ))}
          </div>

          <Button type="button" disabled={loading} className="w-full" size="lg" onClick={handleSubmit}>
            {loading ? <><Loader2 className="animate-spin" />Generating Video…</> : "Generate CGI Ad Video"}
          </Button>
        </div>

        {/* Polling Status */}
        {polling && (
          <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium text-foreground">Generating your video…</p>
                <p className="text-sm text-muted-foreground">
                  Elapsed: {minutes}:{seconds.toString().padStart(2, "0")} • Polling every 5s
                  {jobId && <span className="ml-2 text-xs text-muted-foreground/60">Job: {jobId.slice(0, 8)}…</span>}
                </p>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-2">
                <p className="font-medium text-destructive">Something went wrong</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={handleReset}>Try Again</Button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Result</h2>
              <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="mr-1 h-4 w-4" />Run Again</Button>
            </div>
            <div className="space-y-4">
              {Object.entries(result).map(([key, value]) => {
                const strValue = String(value);
                if (key === "status") return null;
                const url = isUrl(strValue);
                const video = url && isVideoUrl(strValue);
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{key.replace(/_/g, " ")}</p>
                    {video ? (
                      <video src={strValue} controls className="w-full rounded-xl border border-border" preload="metadata" />
                    ) : url ? (
                      <a href={strValue} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline underline-offset-2 break-all">{strValue}</a>
                    ) : (
                      <p className="text-sm text-foreground">{strValue}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
