import { useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Contact } from "@/components/landing/Contact";
import { Footer } from "@/components/landing/Footer";

const Landing = () => {
  useEffect(() => {
    document.title = "AdCraftor — AI CGI ad video generator";
    const desc = "Turn product photos into cinematic CGI ad videos in minutes. AI models, no studio, no crew.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
