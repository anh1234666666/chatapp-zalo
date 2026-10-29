import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { AIPromoSection } from './AIPromoSection';
import { FaqSection } from './FaqSection';
import { Footer } from './Footer';
import { AuthModal } from '../auth/AuthModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleOpenAuth = (mode: 'login' | 'register') => {
    if (profile) {
      navigate('/chat');
    } else {
      setAuthMode(mode);
      setAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    navigate('/chat');
  };

  const handleExploreFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Navigation Bar */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* Hero Section */}
      <HeroSection
        onGetStarted={() => handleOpenAuth('register')}
        onExploreFeatures={handleExploreFeatures}
      />

      {/* Features Grid */}
      <FeaturesSection />

      {/* AI Assistant Section */}
      <AIPromoSection onTryAI={() => handleOpenAuth('register')} />

      {/* FAQ Section */}
      <FaqSection />

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
