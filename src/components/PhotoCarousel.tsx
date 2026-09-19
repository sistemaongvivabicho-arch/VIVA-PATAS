import { useState, useRef, useEffect, TouchEvent } from 'react';
import { CarouselImage } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoCarouselProps {
  images: CarouselImage[];
}

export function PhotoCarousel({ images }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const prev = () => {
    setCurrentIndex((curr) => (curr === 0 ? images.length - 1 : curr - 1));
  };

  const next = () => {
    setCurrentIndex((curr) => (curr === images.length - 1 ? 0 : curr + 1));
  };

  // Keyboard navigation when visible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      next();
    } else if (diff < -40) {
      prev();
    }
    touchStartX.current = null;
  };

  if (!images || images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <div
      id="photo-carousel"
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image Display */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <img
          key={current.id}
          src={current.url}
          alt={current.title}
          loading="lazy"
          className="h-full w-full object-cover transition-opacity duration-300"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-sm font-bold sm:text-base">{current.title}</p>
          <p className="mt-0.5 text-xs text-white/80 sm:text-xs">{current.caption}</p>
        </div>

        {/* Navigation Buttons */}
        <button
          type="button"
          aria-label="Foto anterior"
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70 focus:outline-none"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="Próxima foto"
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70 focus:outline-none"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Indicators */}
      <div className="flex items-center justify-center gap-1.5 p-3">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            aria-label={`Ir para foto ${idx + 1}`}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex ? 'w-6 bg-brand' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
