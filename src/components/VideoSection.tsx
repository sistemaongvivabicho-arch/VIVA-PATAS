import { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoSectionProps {
  videoUrl?: string; // Optional URL for embed or video file
}

export function VideoSection({ videoUrl }: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="secao-video" className="bg-surface-cream px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Cotidiano do Abrigo
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Veja de perto o trabalho do abrigo
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Mais do que imagens, o dia a dia do abrigo é feito de pequenos momentos: alimentação,
            cuidados, brincadeiras, tratamentos e muita dedicação.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {videoUrl && isPlaying ? (
            <div className="aspect-video w-full bg-black">
              {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                <iframe
                  src={videoUrl}
                  title="Vídeo do Abrigo Viva Patas"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ) : (
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              {/* Poster Image */}
              <img
                src="/images/image-10.png"
                alt="Acolhimento e carinho com os animais no Abrigo Viva Patas"
                loading="lazy"
                className="h-full w-full object-cover"
              />

              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

              {/* Play Button */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <button
                  type="button"
                  id="play-video-btn"
                  aria-label="Reproduzir vídeo do abrigo"
                  onClick={() => {
                    if (videoUrl) {
                      setIsPlaying(true);
                    }
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <Play className="ml-1 h-6 w-6 fill-current" />
                </button>
                <p className="mt-3 text-sm font-bold text-white drop-shadow-sm">
                  Rotina de acolhimento e cuidados
                </p>
                <p className="mt-0.5 text-xs text-white/80">
                  {videoUrl ? 'Clique para assistir' : 'Vídeo institucional em produção'}
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-border bg-card p-3.5 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Acompanhe nossa rotina:</span> Os registros mostram como os recursos de cada doação são aplicados no bem-estar, na higiene e na alimentação diária dos acolhidos.
          </div>
        </div>
      </div>
    </section>
  );
}
