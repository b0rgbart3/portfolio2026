import "./styles/main.scss";
import { useState, useEffect } from "react";
import { playPanelOpen } from "./utils/sounds";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Experience from "./components/Experience/Experience";
import Projects from "./components/Projects/Projects";
import FitCheck from "./components/FitCheck/FitCheck";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import AIPanel from "./components/AIPanel/AIPanel";
import Footer from "./components/Footer/Footer";
import Skills from "./components/Skills/Skills";

function App() {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [openToBuildInfo, setOpenToBuildInfo] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "page_view", data: { referrer: document.referrer || "direct" } }),
    }).catch(() => {});
  }, []);

  const handleOpenAI = () => {
    playPanelOpen();
    setOpenToBuildInfo(false);
    setIsAIPanelOpen(true);
    gtag("event", "ai_chat_opened");
  };

  const handleOpenAIBuildInfo = () => {
    playPanelOpen();
    setOpenToBuildInfo(true);
    setIsAIPanelOpen(true);
  };

  const handleClose = () => {
    setIsAIPanelOpen(false);
    setOpenToBuildInfo(false);
  };

  return (
    <main>
      <Navbar onOpenAI={handleOpenAI} />
      <Hero onOpenAI={handleOpenAI} />
      <Experience />
      <Skills />
      <Projects />
      <FitCheck />
      <Footer onOpenAIBuildInfo={handleOpenAIBuildInfo} />
      <ScrollToTop />

      <AIPanel
        isOpen={isAIPanelOpen}
        onClose={handleClose}
        openToBuildInfo={openToBuildInfo}
      />
    </main>
  );
}

export default App;
