import "./styles/main.scss";
import { useState } from "react";
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

  const handleOpenAI = () => {
    setOpenToBuildInfo(false);
    setIsAIPanelOpen(true);
  };

  const handleOpenAIBuildInfo = () => {
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
