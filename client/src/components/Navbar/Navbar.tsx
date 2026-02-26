import React, { useState, useEffect } from 'react';
import { Menu, X, Mail } from 'lucide-react';
import styles from './Navbar.module.scss';

interface NavbarProps {
  onOpenAI: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenAI }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''} ${isMenuOpen ? styles['menu-open'] : ''}`}>
      <div className={styles.wrapper}>
        <div className={styles['logo-group']}>
          <div className={styles.logo} onClick={() => scrollToSection('hero')}>BD</div>
          <a href="mailto:jobs4bart@gmail.com" className={styles['email-btn']} aria-label="Email">
            <Mail size={18} />
          </a>
        </div>
        
        <div className={styles['nav-content']}>
          <div className={`${styles['nav-links']} ${isMenuOpen ? styles.active : ''}`}>
            <a onClick={() => scrollToSection('experience')}>Experience</a>
            <a onClick={() => scrollToSection('projects')}>Projects</a>
            <a onClick={() => scrollToSection('fit-check')}>Fit Check</a>
          </div>
          
          <div className={styles.actions}>
            <button className={styles['ask-ai-btn']} onClick={onOpenAI}>Ask AI</button>
            <button className={styles['menu-toggle']} onClick={toggleMenu} aria-label="Toggle menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div className={`${styles['mobile-menu']} ${isMenuOpen ? styles.active : ''}`}>
        <a onClick={() => scrollToSection('experience')}>Experience</a>
        <a onClick={() => scrollToSection('projects')}>Projects</a>
        <a onClick={() => scrollToSection('fit-check')}>Fit Check</a>
      </div>
    </nav>
  );
};

export default Navbar;
