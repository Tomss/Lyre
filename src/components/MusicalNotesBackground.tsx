import React from 'react';

const MusicalNotesBackground = () => {
  const notes = ['♪', '♫', '♬', '♩', '♭', '♯'];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Notes de musique animées */}
      {[...Array(8)].map((_, i) => {
        const note = notes[Math.floor(Math.random() * notes.length)];
        const delay = Math.random() * 15;
        const duration = 20 + Math.random() * 10;
        const size = 24 + Math.random() * 16;
        const opacity = 0.15 + Math.random() * 0.2;
        const startX = Math.random() * 100;
        const drift = (Math.random() - 0.5) * 40;
        
        return (
          <div
            key={i}
            className="absolute text-orange-400 select-none animate-float-note"
            style={{
              fontSize: `${size}px`,
              left: `${startX}%`,
              opacity: opacity,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              '--drift': `${drift}px`,
            } as React.CSSProperties & { '--drift': string }}
          >
            {note}
          </div>
        );
      })}
    </div>
  );
};

export default MusicalNotesBackground;