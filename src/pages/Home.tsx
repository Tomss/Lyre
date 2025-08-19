import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Music, School, Users, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Données pour le carrousel avec les nouvelles images thématiques
const carouselImages = [
  {
    src: 'http://googleusercontent.com/image_collection/image_retrieval/2364047792205623215_0',
    alt: 'Orchestre de la Lyre en concert',
    title: 'Bienvenue à La Lyre',
    description: 'Découvrez notre passion pour la musique et nos formations pour tous âges.',
  },
  {
    src: 'http://googleusercontent.com/image_collection/image_retrieval/3935817365921246945_0',
    alt: 'Section des cuivres',
    title: 'La Chaleur des Cuivres',
    description: 'Trompettes, trombones, tubas... La puissance et la brillance de notre orchestre.',
  },
  {
    src: 'http://googleusercontent.com/image_collection/image_retrieval/1761852498186410258_0',
    alt: 'Instruments à vent de la famille des bois',
    title: 'L\'Élégance des Bois',
    description: 'Clarinettes, flûtes et saxophones au cœur de nos mélodies.',
  },
  {
    src: 'http://googleusercontent.com/image_collection/image_retrieval/13124435704199168576_0',
    alt: 'Section des percussions',
    title: 'Le Rythme des Percussions',
    description: 'La force motrice de notre harmonie, des timbales à la caisse claire.',
  },
];

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    const timer = setInterval(nextImage, 5000); // Change d'image toutes les 5 secondes
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="font-inter">
      {/* Section Carrousel */}
      <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden">
        {carouselImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white p-4 animate-fade-in-up">
                <h1 className="font-poppins font-bold text-4xl md:text-6xl mb-4">{image.title}</h1>
                <p className="text-lg md:text-xl max-w-2xl">{image.description}</p>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={prevImage}
          className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white bg-black bg-opacity-30 p-2 rounded-full hover:bg-opacity-50 transition-all"
          aria-label="Image précédente"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={nextImage}
          className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white bg-black bg-opacity-30 p-2 rounded-full hover:bg-opacity-50 transition-all"
          aria-label="Image suivante"
        >
          <ChevronRight size={32} />
        </button>
      </section>

      {/* Section de présentation */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-poppins font-bold text-3xl text-dark mb-6">
            L'Harmonie au cœur de la ville
          </h2>
          <p className="max-w-3xl mx-auto text-gray-600 text-lg leading-relaxed">
            Depuis plus d'un siècle, La Lyre Cheminote et Municipale de Chalindrey fait vibrer la musique au sein de notre communauté. Nous sommes une école et un orchestre ouverts à tous, des débutants aux musiciens confirmés.
          </p>
        </div>
      </section>

      {/* Section des piliers */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <School size={32} />
            </div>
            <h3 className="font-poppins font-semibold text-xl text-dark mb-2">Notre École</h3>
            <p className="text-gray-600">Un enseignement de qualité pour tous les instruments de l'harmonie, dispensé par des professeurs passionnés.</p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="font-poppins font-semibold text-xl text-dark mb-2">Nos Orchestres</h3>
            <p className="text-gray-600">Du plaisir de jouer ensemble dans nos formations juniors et seniors, pour un répertoire riche et varié.</p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} />
            </div>
            <h3 className="font-poppins font-semibold text-xl text-dark mb-2">Nos Événements</h3>
            <p className="text-gray-600">Partagez avec nous des moments musicaux inoubliables lors de nos concerts, défilés et auditions.</p>
          </div>
        </div>
      </section>
      
      {/* Section "Rejoignez-nous" */}
      <section className="py-20 bg-gradient-to-r from-primary to-orange-400 text-white">
        <div className="container mx-auto px-6 text-center">
            <Music size={48} className="mx-auto mb-4" />
            <h2 className="font-poppins font-bold text-3xl mb-4">
                Prêt à rejoindre l'aventure musicale ?
            </h2>
            <p className="max-w-2xl mx-auto text-lg mb-8">
                Que vous soyez musicien ou simplement passionné, il y a une place pour vous à La Lyre.
            </p>
            <Link 
                to="/contact" 
                className="inline-flex items-center bg-white text-primary font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-105"
            >
                Contactez-nous
                <ArrowRight className="ml-2" size={20} />
            </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;