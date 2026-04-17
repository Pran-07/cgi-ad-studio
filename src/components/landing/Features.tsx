import { Wand2, Users, Zap, Shield, Image, Globe } from "lucide-react";

const features = [
  { icon: Wand2, title: "AI model generation", desc: "Choose gender, body type, hair, pose. The AI builds a realistic model around your product." },
  { icon: Image, title: "One image input", desc: "Upload a single product photo. We handle lighting, composition, and motion." },
  { icon: Zap, title: "Minutes, not weeks", desc: "Skip the studio. High-quality CGI ads delivered in under 10 minutes per video." },
  { icon: Users, title: "Endless variations", desc: "A/B test models, poses, and skin tones to find what converts best." },
  { icon: Shield, title: "Commercially safe", desc: "All outputs are royalty-free and ready for paid ad campaigns." },
  { icon: Globe, title: "Built for performance", desc: "Optimized aspect ratios for Meta, TikTok, YouTube Shorts, and more." },
];

export const Features = () => {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to ship ads faster</h2>
          <p className="mt-4 text-muted-foreground">Production-grade video generation, without the production team.</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-border/60 bg-gradient-card p-6 transition-all hover:border-primary/40 hover:shadow-glow"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
