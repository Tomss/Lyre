// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import UserEvents from './pages/UserEvents'; // Importer la page des événements utilisateur
import AdminMedia from './pages/AdminMedia'; // Importer la import AdminCarousel from './pages/AdminCarousel';
import AdminTheme from './pages/AdminTheme';
import AdminPartners from './pages/AdminPartners'; // Importer la page d'administration du thème
import AdminMorceaux from './pages/AdminMorceaux'; // Importer la page d'administration des morceaux

import AdminPartitions from './pages/AdminPartitions';
import AdminNews from './pages/AdminNews';

import NewsArchive from './pages/NewsArchive';

function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
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
          <Route path="/connexion" element={<Connexion />} /> {/* Route pour la connexion */}
          <Route path="/activer-compte" element={<Activation />} />
          <Route path="/dashboard" element={<Dashboard />} /> {/* Route (non protégée pour l'instant) */}
          <Route path="/admin/users" element={<AdminUsers />} /> {/* Route pour l'administration des utilisateurs */}
          <Route path="/admin/instruments" element={<AdminInstruments />} /> {/* Route pour l'administration des instruments */}
          <Route path="/admin/orchestras" element={<AdminOrchestras />} /> {/* Route pour l'administration des orchestres */}
          <Route path="/admin/events" element={<AdminEvents />} /> {/* Route pour l'administration des événements */}
          <Route path="/user/events" element={<UserEvents />} /> {/* Route pour les événements utilisateur */}
          <Route path="/admin/media" element={<AdminMedia />} /> {/* Route pour l'administration des médias */}
          <Route path="/admin/theme" element={<AdminTheme />} /> {/* Route pour l'administration du thème */}
          <Route path="/admin/partners" element={<AdminPartners />} /> {/* Route pour l'administration des partenaires */}
          <Route path="/admin/morceaux" element={<AdminMorceaux />} /> {/* Route pour l'administration des morceaux */}

          <Route path="/admin/partitions" element={<AdminPartitions />} />
          <Route path="/admin/news" element={<AdminNews />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;