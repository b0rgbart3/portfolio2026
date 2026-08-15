import React, { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import cvPdf from "../../assets/BartDorityCV.pdf";
import { playNavClick } from "../../utils/sounds";
import { useTheme } from "../../utils/useTheme";
import IconLink from "../sharedLibrary/IconLink/IconLink";
import LargePillButton from "../sharedLibrary/LargePillButton/LargePillButton";
import GithubIcon from "../sharedLibrary/icons/GithubIcon";
import LinkedInIcon from "../sharedLibrary/icons/LinkedInIcon";
import MailIcon from "../sharedLibrary/icons/MailIcon";

interface NavbarProps {
  onOpenAI: () => void;
}

const NAV_LINK_CLASS =
  "text-[0.9rem] text-nav-link-color font-semibold cursor-pointer transition-colors duration-200 hover:text-text-primary [[data-theme=light]_&]:hover:font-black";

const MOBILE_LINK_CLASS =
  "text-xl text-text-primary font-medium cursor-pointer py-2.5 border-b border-surface-faint last:border-b-0";

const Navbar: React.FC<NavbarProps> = ({ onOpenAI }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const scrollToSection = (id: string) => {
    playNavClick();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      history.pushState(null, "", "#" + id);
      setIsMenuOpen(false);
    }
  };

  const showChrome = isScrolled || isMenuOpen;

  return (
    <nav
      className={`fixed top-0 left-0 w-full h-20 z-[1000] transition-all duration-300 ease-in-out
        [[data-theme=light]_&]:shadow-[inset_0_-12px_12px_-6px_#beced7]
        ${showChrome ? "bg-nav-bg backdrop-blur-[10px] border-b border-border-color [[data-theme=light]_&]:border-b-0" : "bg-transparent"}`}
    >
      <div className="max-w-[1200px] mx-auto h-full flex justify-between items-center pt-3.5 px-6 pb-0 md:px-10 lg:pt-0">
        <div className="flex items-center gap-3 z-[1001]">
          <div
            className="font-serif text-2xl font-bold text-text-primary z-[1001] cursor-pointer pr-3.5"
            onClick={() => scrollToSection("hero")}
          >
            BD
          </div>
          <IconLink
            href="https://github.com/b0rgbart3/"
            icon={GithubIcon}
            label="GitHub"
            external
          />
          <IconLink
            href="https://www.linkedin.com/in/bart-dority/"
            icon={LinkedInIcon}
            label="LinkedIn"
            external
          />
          <IconLink
            href="mailto:jobs4bart@gmail.com"
            icon={MailIcon}
            label="Email"
          />
        </div>

        <div className="flex items-center gap-10">
          <div className="hidden md:flex items-center gap-8">
            <a className={NAV_LINK_CLASS} onClick={() => scrollToSection("experience")}>Experience</a>
            <a className={NAV_LINK_CLASS} onClick={() => scrollToSection("skills")}>Skills</a>
            <a className={NAV_LINK_CLASS} onClick={() => scrollToSection("projects")}>Projects</a>
            <a className={NAV_LINK_CLASS} onClick={() => scrollToSection("fit-check")}>Fit Check</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="bg-transparent border border-border-color text-text-secondary cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all duration-200 hover:text-text-primary hover:border-accent-blue"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <LargePillButton onClick={onOpenAI}>Ask AI</LargePillButton>
            <button
              className="flex items-center justify-center md:hidden bg-transparent border-0 text-text-primary cursor-pointer p-2 z-[1001] transition-transform duration-200 active:scale-90"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`absolute top-20 left-0 w-full bg-nav-bg backdrop-blur-[15px] border-b border-border-color flex flex-col pt-5 px-6 pb-10 md:px-10 md:pb-5 gap-5 z-[999] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isMenuOpen ? "translate-y-0 opacity-100 visible" : "-translate-y-full opacity-0 invisible"}`}
      >
        <a className={MOBILE_LINK_CLASS} onClick={() => scrollToSection("experience")}>Experience</a>
        <a className={MOBILE_LINK_CLASS} onClick={() => scrollToSection("skills")}>Skills</a>
        <a className={MOBILE_LINK_CLASS} onClick={() => scrollToSection("projects")}>Projects</a>
        <a className={MOBILE_LINK_CLASS} onClick={() => scrollToSection("fit-check")}>Fit Check</a>
        <a
          className={MOBILE_LINK_CLASS}
          href={cvPdf}
          target="_blank"
          rel="noopener noreferrer"
        >
          CV
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
