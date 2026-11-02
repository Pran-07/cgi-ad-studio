import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, RotateCcw, Film, AlertCircle, LogOut, Home, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const START_URL = "https://pjj07.app.n8n.cloud/webhook/adcreator.in";
const STATUS_URL = "https://pjj07.app.n8n.cloud/webhook/adcraftor-status";
const POLL_INTERVAL = 5000;
const TIMEOUT_MS = 10 * 60 * 1000;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function isUrl(value: string): boolean {
  try { new URL(value); return true; } catch { return false; }
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.includes("video");
}

const Index = () => {
  const { user, signOut } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const handleFileSelection = (selected: File | null): boolean => {
    setFileError(null);
    if (!selected) return false;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError("Unsupported file type. Please upload a JPG, PNG or WEBP image.");
      return false;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError("File is too large. Maximum size is 10MB.");
      return false;
    }
    setFile(selected);
    return true;
  };

  const handleInputChange = (files: FileList | null) => {
    handleFileSelection(files?.[0] || null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelection(e.dataTransfer.files?.[0] || null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);

      const res = await fetch(START_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: urlData.publicUrl }),
      });

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const data = await res.json();
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
    setFile(null);
    setFileError(null);
    setResult(null);
    setError(null);
    setJobId(null);
    setElapsedSec(0);
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
            <h2 className="text-lg font-semibold text-foreground">Upload Your Product</h2>
            <p className="text-sm text-muted-foreground">
              Upload a clear photo of your product. Our AI will pick the perfect model, pose and background automatically.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_image" className="text-sm font-medium text-foreground">
              Product Image <span className="text-destructive">*</span>
            </Label>
            <div
              className={`flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                fileError ? "border-destructive"
                : dragActive ? "border-primary bg-primary/10"
                : file ? "border-primary/30 bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                id="product_image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleInputChange(e.target.files)}
              />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Product preview"
                    className="max-h-56 w-auto rounded-xl border border-border object-contain shadow-sm"
                  />
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      <Upload className="mr-1 h-4 w-4" />Change image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Remove image"
                      onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-base font-medium text-foreground">Drag & drop your image here</p>
                  <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
                  <p className="mt-3 text-xs text-muted-foreground/80">JPG, PNG or WEBP • Max 10MB</p>
                </>
              )}
            </div>
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">AI auto-casting:</span>{" "}
              gender, age, skin tone, hair, pose and background are chosen to match your product.
            </p>
          </div>

          <div className="space-y-1 rounded-lg p-3">
            <p className="text-sm font-medium text-muted-foreground">Tips for best results</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground/80">
              <li>Use a plain or clean background</li>
              <li>Show the full product, well lit</li>
              <li>One product per image</li>
            </ul>
          </div>

          <Button
            type="button"
            disabled={loading || !file}
            className="w-full"
            size="lg"
            onClick={handleSubmit}
          >
            {loading ? <><Loader2 className="animate-spin" />Uploading…</> : "Generate CGI Ad Video"}
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
