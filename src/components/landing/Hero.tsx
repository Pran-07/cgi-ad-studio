import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(243_75%_45%/0.3),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
            AI-powered CGI video generation
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Turn product photos into{" "}
            <span className="text-gradient">cinematic ads</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Upload a single image. Pick a model. Get a high-converting CGI ad video in minutes — no studio, no crew, no editing.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-gradient-primary shadow-glow hover:opacity-90">
              <Link to="/auth?mode=signup">
                Start creating free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border/60 bg-card/30 backdrop-blur">
              <a href="#features">See how it works</a>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">No credit card required · Generate your first video in under 5 minutes</p>
        </div>

        {/* Decorative preview card */}
        <div className="relative mx-auto mt-20 max-w-5xl animate-fade-up [animation-delay:0.2s]">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-20 blur-3xl" />
          <div className="relative rounded-2xl border border-border/60 bg-gradient-card p-2 shadow-elegant">
            <div className="aspect-video rounded-xl bg-[linear-gradient(135deg,hsl(243_75%_15%),hsl(250_60%_20%))] flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow animate-float">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Your ad preview lives here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
