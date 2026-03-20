// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import School from './pages/School';
import Orchestras from './pages/Orchestras';
import Media from './pages/Media';
import Contact from './pages/Contact';
import Connexion from './pages/Connexion'; // Importer la page de connexion
import Dashboard from './pages/Dashboard'; // Importer le dashboard
import Activation from './pages/Activation';
import AdminUsers from './pages/AdminUsers'; // Importer la page d'administration des utilisateurs
import AdminInstruments from './pages/AdminInstruments'; // Importer la page d'administration des instruments
import AdminOrchestras from './pages/AdminOrchestras'; // Importer la page d'administration des orchestres
import AdminEvents from './pages/AdminEvents'; // Importer la page d'administration des événements
import AdminMedia from './pages/AdminMedia'; // Importer la import AdminCarousel from './pages/AdminCarousel';
import AdminTheme from './pages/AdminTheme';
import AdminPartners from './pages/AdminPartners'; // Importer la page d'administration du thème
import AdminMorceaux from './pages/AdminMorceaux'; // Importer la page d'administration des morceaux

import AdminPartitions from './pages/AdminPartitions';
import AdminNews from './pages/AdminNews';

import NewsArchive from './pages/NewsArchive';

function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* Global Wrapper for Ultra-Wide Resolutions */}
      <div className="max-w-[2560px] mx-auto bg-white flex flex-col min-h-screen relative">
        <ScrollToTop />
        <Header />
        <main className="flex-grow">
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
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;