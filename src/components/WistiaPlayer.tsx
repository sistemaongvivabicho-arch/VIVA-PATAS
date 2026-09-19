import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface WistiaPlayerProps {
  videoId?: string;
  videoSrc?: string;
  posterUrl?: string;
  className?: string;
  aspectRatio?: 'video' | 'story' | 'portrait';
}

/**
 * Player de Vídeo Responsivo & Inteligente:
 * - Sem logo do Wistia (renderização nativa limpa em HTML5 sem marcas d'água de terceiros)
 * - Autoplay inteligente: despausa automaticamente ao entrar na tela (IntersectionObserver) com áudio em 50%
 * - Autopause ao rolar: pausa instantaneamente quando o usuário rola para fora da tela
 * - Controles discretos e elegantes (Play/Pause, Mute/Unmute, Barra de Progresso, Tela Cheia)
 */
export function WistiaPlayer({
  videoId,
  videoSrc,
  posterUrl,
  className = '',
  aspectRatio = 'story',
}: WistiaPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const effectiveSrc =
    videoSrc ||
    (videoId === 'pmsoemmlzp' || videoId === 'c6ucgjfb497hg33'
      ? '/videos/domigou.mp4'
      : '/videos/resgate.mp4');

  const effectivePoster =
    posterUrl ||
    (videoId === 'pmsoemmlzp' || videoId === 'c6ucgjfb497hg33'
      ? '/images/domigou-poster.jpg'
      : 'https://embed-ssl.wistia.com/deliveries/9e9fa70973b5b5585030b45c486a6c81be026ecd.jpg');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Proporção de exibição
  const aspectClass =
    aspectRatio === 'story'
      ? 'aspect-[9/16]'
      : aspectRatio === 'portrait'
        ? 'aspect-[4/5]'
        : 'aspect-video';

  // Configuração inicial de volume para 50% (0.5)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.5;
    }
  }, []);

  // IntersectionObserver para Play/Pause automático na visualização
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Em tela: despausa automaticamente com volume 50%
            video.volume = 0.5;
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsPlaying(true);
                })
                .catch(() => {
                  // Caso política do navegador exija mudo inicial para autoplay
                  video.muted = true;
                  setIsMuted(true);
                  video.play().then(() => setIsPlaying(true)).catch(() => {});
                });
            }
          } else {
            // Saiu da tela: pausa automaticamente
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0.1, 0.5, 0.8],
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Atualização de tempo e progresso
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      // Se estava com mudo do navegador e o usuário clicou, desmuta com áudio a 50%
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = 0.5;
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    if (!nextMuted) {
      videoRef.current.volume = 0.5;
    }
    setIsMuted(nextMuted);
  };

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = newProgress * (videoRef.current.duration || 0);
    videoRef.current.currentTime = newTime;
    setProgress(newProgress * 100);
  };

  const toggleFullScreen = (e: MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className={`relative mx-auto w-full max-w-[340px] sm:max-w-[360px] overflow-hidden rounded-2xl border border-border bg-black shadow-xl select-none ${className}`}
    >
      <div className={`relative ${aspectClass} w-full overflow-hidden bg-black`}>
        <video
          ref={videoRef}
          src={effectiveSrc}
          poster={effectivePoster}
          playsInline
          loop
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className="h-full w-full object-cover cursor-pointer"
        />

        {/* Botão Play Central quando pausado ou antes da interação */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Reproduzir vídeo"
            className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-all duration-200 hover:scale-110 hover:bg-brand active:scale-95"
          >
            <Play className="h-7 w-7 fill-white translate-x-0.5" />
          </button>
        )}

        {/* Notificação sutil se o áudio estiver no mudo por política do navegador */}
        {isPlaying && isMuted && (
          <button
            type="button"
            onClick={toggleMute}
            className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-black"
          >
            <VolumeX className="h-3.5 w-3.5 text-amber-400" />
            <span>Toque p/ ativar som</span>
          </button>
        )}

        {/* Barra de Controles Customizada (Sem logo Wistia) */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Barra de Progresso Interativa */}
          <div
            onClick={handleSeek}
            className="group relative mb-2.5 h-1.5 w-full cursor-pointer rounded-full bg-white/30"
          >
            <div
              className="h-full rounded-full bg-brand transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white opacity-0 shadow group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>

          {/* Botões de Ação na base */}
          <div className="flex items-center justify-between text-white text-xs font-medium">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                className="hover:text-brand transition"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
                className="hover:text-brand transition"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              <span className="text-[11px] text-white/80 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded bg-brand/30 px-1.5 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                Resgate
              </span>
              <button
                type="button"
                onClick={toggleFullScreen}
                aria-label="Tela cheia"
                className="hover:text-brand transition ml-1"
              >
                <Maximize className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
