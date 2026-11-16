import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import LogoCloud from './components/LogoCloud';
import FeatureSections from './components/FeatureSections';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import TermsAndConditions from './components/TermsAndConditions';
import RefundPolicy from './components/RefundPolicy';

function getNormalizedRoute(): string {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path.startsWith('/terms') || hash === '#terms') {
    return '/terms';
  }
  if (path.startsWith('/refund') || hash === '#refunds' || hash === '#refund') {
    return '/refunds';
  }
  return '/';
}

function App() {
  const [route, setRoute] = useState<string>(getNormalizedRoute);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getNormalizedRoute());
      window.scrollTo(0, 0);
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Handle internal SPA navigation for terms, refunds, and home
      if (href === '/terms' || href === '/terms-and-conditions') {
        e.preventDefault();
        window.history.pushState(null, '', '/terms');
        setRoute('/terms');
        window.scrollTo(0, 0);
      } else if (href === '/refunds' || href === '/refund-policy') {
        e.preventDefault();
        window.history.pushState(null, '', '/refunds');
        setRoute('/refunds');
        window.scrollTo(0, 0);
      } else if (href === '/') {
        if (window.location.pathname !== '/') {
          e.preventDefault();
          window.history.pushState(null, '', '/');
          setRoute('/');
          window.scrollTo(0, 0);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return (
    <div className="bg-bg-primary text-t-primary overflow-x-hidden selection:bg-primary/20 min-h-screen flex flex-col justify-between">
      <Header />
      <main className="pt-16 flex-1">
        {route === '/terms' ? (
          <TermsAndConditions />
        ) : route === '/refunds' ? (
          <RefundPolicy />
        ) : (
          <>
            <Hero />
            <LogoCloud />
            <FeatureSections />
            <Pricing />
            <FAQ />
            <FinalCTA />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
