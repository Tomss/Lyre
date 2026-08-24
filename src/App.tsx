// src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Lenis from 'lenis';

// Direct import for the critical landing page for instant first paint
import Home from './pages/Home';

// Lazy loading for all other pages to achieve massive bundle reduction and 0-delay load
const NewsArchive = lazy(() => import('./pages/NewsArchive'));
const School = lazy(() => import('./pages/School'));
const Orchestras = lazy(() => import('./pages/Orchestras'));
const Media = lazy(() => import('./pages/Media'));
const Contact = lazy(() => import('./pages/Contact'));
const Connexion = lazy(() => import('./pages/Connexion'));
const Activation = lazy(() => import('./pages/Activation'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Lazy loading for all heavy Admin panels
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminInstruments = lazy(() => import('./pages/AdminInstruments'));
const AdminOrchestras = lazy(() => import('./pages/AdminOrchestras'));
const AdminEvents = lazy(() => import('./pages/AdminEvents'));
const AdminMedia = lazy(() => import('./pages/AdminMedia'));
const AdminTheme = lazy(() => import('./pages/AdminTheme'));
const AdminPartners = lazy(() => import('./pages/AdminPartners'));
const AdminMorceaux = lazy(() => import('./pages/AdminMorceaux'));
const AdminPartitions = lazy(() => import('./pages/AdminPartitions'));
const AdminNews = lazy(() => import('./pages/AdminNews'));
const AdminCommunication = lazy(() => import('./pages/AdminCommunication'));

// Minimal elegant page loader
const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  const location = useLocation();
  const isAdminOrDashboard = location.pathname.startsWith('/admin') || location.pathname === '/dashboard';
  const isFullWidthPage = isAdminOrDashboard || location.pathname === '/connexion' || location.pathname === '/activer-compte';
  const wrapperClass = isFullWidthPage ? "max-w-none" : "max-w-[2560px]";

  // Global Cinematic Smooth Scrolling for ALL pages (Front Office & Back Office)
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.0,
      autoResize: true,
    });

    (window as any).__lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      (window as any).__lenis = null;
    };
  }, []);

  // Sync scroll and bounds on every route change
  useEffect(() => {
    if ((window as any).__lenis) {
      (window as any).__lenis.scrollTo(0, { immediate: true });
      setTimeout(() => {
        if ((window as any).__lenis) (window as any).__lenis.resize();
      }, 100);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white">
      {/* Global Wrapper for Ultra-Wide Resolutions - Conditional Limit */}
      <div className={`${wrapperClass} mx-auto bg-white flex flex-col min-h-screen relative`}>
        <ScrollToTop />
        <Header />
        <main className="flex-grow">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/toutes-les-actualites" element={<NewsArchive />} />
              <Route path="/school" element={<School />} />
              <Route path="/orchestres" element={<Orchestras />} />
              <Route path="/media" element={<Media />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/connexion" element={<Connexion />} />
              <Route path="/activer-compte" element={<Activation />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/instruments" element={<AdminInstruments />} />
              <Route path="/admin/orchestras" element={<AdminOrchestras />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/media" element={<AdminMedia />} />
              <Route path="/admin/theme" element={<AdminTheme />} />
              <Route path="/admin/partners" element={<AdminPartners />} />
              <Route path="/admin/morceaux" element={<AdminMorceaux />} />
              <Route path="/admin/partitions" element={<AdminPartitions />} />
              <Route path="/admin/news" element={<AdminNews />} />
              <Route path="/admin/communication" element={<AdminCommunication />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
