import { useState, useRef, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, RotateCcw, Film, AlertCircle } from "lucide-react";

const WEBHOOK_URL = "https://ganesh012.app.n8n.cloud/webhook-test/adcraftor.in";

interface FormData {
  gender: string;
  skin_tone: string;
  hair_length: string;
  body_type: string;
  model_position: string;
}

const selectFields = [
  {
    label: "Model Gender",
    name: "gender" as const,
    options: [
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
    ],
  },
  {
    label: "Skin Tone",
    name: "skin_tone" as const,
    options: [
      { label: "Light", value: "light" },
      { label: "Medium", value: "medium" },
      { label: "Dark", value: "dark" },
    ],
  },
  {
    label: "Hair Length",
    name: "hair_length" as const,
    options: [
      { label: "Short", value: "short" },
      { label: "Medium", value: "medium" },
      { label: "Long", value: "long" },
    ],
  },
  {
    label: "Body Type",
    name: "body_type" as const,
    options: [
      { label: "Slim", value: "slim" },
      { label: "Average", value: "average" },
      { label: "Athletic", value: "athletic" },
    ],
  },
  {
    label: "Model Position",
    name: "model_position" as const,
    options: [
      { label: "Standing", value: "standing" },
      { label: "Sitting", value: "sitting" },
      { label: "Holding Product", value: "holding_product" },
    ],
  },
];

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.includes("video");
}

const Index = () => {
  const [formData, setFormData] = useState<FormData>({
    gender: "",
    skin_tone: "",
    hair_length: "",
    body_type: "",
    model_position: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!file) errors.product_image = "Please upload a product image";
    for (const field of selectFields) {
      if (!formData[field.name]) errors[field.name] = `${field.label} is required`;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append("image_url", file!);
      body.append("gender", formData.gender);
      body.append("skin_tone", formData.skin_tone);
      body.append("hair_length", formData.hair_length);
      body.append("body_type", formData.body_type);
      body.append("model_position", formData.model_position);

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        body,
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        // Try parsing as JSON anyway
        try {
          const data = JSON.parse(text);
          setResult(data);
        } catch {
          throw new Error(`Unexpected response format: ${text.slice(0, 200)}`);
        }
      } else {
        const data = await res.json();
        setResult(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ gender: "", skin_tone: "", hair_length: "", body_type: "", model_position: "" });
    setFile(null);
    setResult(null);
    setError(null);
    setValidationErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Film className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AdCraftor</h1>
              <p className="text-sm text-muted-foreground">AI-powered CGI ad video generator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Product & Model Details</h2>
            <p className="text-sm text-muted-foreground">Upload your product image and configure the AI model.</p>
          </div>

          {/* File Upload */}
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
              <input
                ref={fileInputRef}
                id="product_image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setValidationErrors((prev) => ({ ...prev, product_image: "" }));
                }}
              />
            </div>
            {validationErrors.product_image && (
              <p className="text-xs text-destructive">{validationErrors.product_image}</p>
            )}
          </div>

          {/* Select Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            {selectFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  {field.label} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData[field.name]}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, [field.name]: val }));
                    setValidationErrors((prev) => ({ ...prev, [field.name]: "" }));
                  }}
                >
                  <SelectTrigger className={validationErrors[field.name] ? "border-destructive" : ""}>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors[field.name] && (
                  <p className="text-xs text-destructive">{validationErrors[field.name]}</p>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Generating Video…
              </>
            ) : (
              "Generate CGI Ad Video"
            )}
          </Button>
        </form>

        {/* Error State */}
        {error && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-2">
                <p className="font-medium text-destructive">Something went wrong</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent)}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Result</h2>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Run Again
              </Button>
            </div>

            {Object.keys(result).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data returned.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(result).map(([key, value]) => {
                  const strValue = String(value);
                  const url = isUrl(strValue);
                  const video = url && isVideoUrl(strValue);

                  return (
                    <div key={key} className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {key.replace(/_/g, " ")}
                      </p>
                      {video ? (
                        <video
                          src={strValue}
                          controls
                          className="w-full rounded-xl border border-border"
                          preload="metadata"
                        />
                      ) : url ? (
                        <a
                          href={strValue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline underline-offset-2 break-all"
                        >
                          {strValue}
                        </a>
                      ) : (
                        <p className="text-sm text-foreground">{strValue}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
