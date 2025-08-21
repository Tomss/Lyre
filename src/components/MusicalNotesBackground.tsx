import React from 'react';

const MusicalNotesBackground = () => {
  const notes = ['♪', '♫', '♬', '♩', '♭', '♯'];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Notes de musique animées */}
      {[...Array(12)].map((_, i) => {
        const note = notes[Math.floor(Math.random() * notes.length)];
        const delay = Math.random() * 10;
        const duration = 15 + Math.random() * 10;
        const size = 16 + Math.random() * 8;
        const opacity = 0.05 + Math.random() * 0.1;
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() - 0.5) * 30;
        
        return (
          <div
            key={i}
            className="absolute text-orange-400/30 select-none"
            style={{
              fontSize: `${size}px`,
              left: `${startX}%`,
              opacity: opacity,
              animation: `floatNote ${duration}s linear infinite`,
              animationDelay: `${delay}s`,
              '--start-x': `${startX}%`,
              '--end-x': `${Math.max(0, Math.min(100, endX))}%`,
            } as React.CSSProperties}
          >
            {note}
          </div>
        );
      })}
      
      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes floatNote {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--opacity, 0.1);
          }
          90% {
            opacity: var(--opacity, 0.1);
          }
          100% {
            transform: translateY(-100px) translateX(var(--drift, 20px)) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MusicalNotesBackground;