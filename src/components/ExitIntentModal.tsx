import { useEffect, useState } from 'react';

interface ExitIntentModalProps {
  onOpenDonation: () => void;
}

export function ExitIntentModal({ onOpenDonation }: ExitIntentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    if (hasDismissed) return;

    let timer: NodeJS.Timeout;
    const trigger = () => {
      if (!hasDismissed) {
        setHasDismissed(true);
        setIsOpen(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) {
        trigger();
      }
    };

    const donateEl = document.getElementById('doar');
    let observer: IntersectionObserver | undefined;

    if (donateEl && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            clearTimeout(timer);
            timer = setTimeout(trigger, 25000);
          } else {
            clearTimeout(timer);
          }
        },
        { threshold: 0.4 }
      );
      observer.observe(donateEl);
    }

    document.addEventListener('mouseout', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseout', handleMouseLeave);
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [hasDismissed]);

  const handleShareWhatsApp = () => {
    const text =
      'Conheça o trabalho do Abrigo Viva Patas. Eles acolhem e cuidam de animais resgatados, garantindo alimentação, abrigo e assistência veterinária. Compartilho para que mais pessoas possam conhecer e apoiar. 🐾❤️';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${currentUrl}`)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div
      id="exit-intent-modal-overlay"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 sm:items-center sm:p-4"
    >
      <div
        id="exit-intent-modal"
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl"
      >
        <h2 className="text-base font-extrabold tracking-tight text-foreground">
          Antes de ir... ❤️
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Você conheceu um pouco do trabalho de acolhimento do Abrigo Viva Patas. Os animais
          acolhidos dependem dessa dedicação diária para ter alimentação, abrigo e cuidados veterinários.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Se você não puder contribuir agora, tudo bem. Qualquer valor ajuda — e quem não puder doar
          pode fazer a mensagem chegar a mais pessoas.
        </p>

        <button
          id="exit-intent-help-btn"
          type="button"
          onClick={() => {
            setIsOpen(false);
            onOpenDonation();
          }}
          className="mt-4 w-full rounded-xl bg-brand py-4 text-sm font-bold uppercase tracking-wide text-brand-foreground transition-colors hover:bg-brand-strong"
        >
          QUERO AJUDAR
        </button>

        <div className="mt-3 rounded-2xl border border-border bg-surface-alt p-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            Não consegue contribuir financeiramente? Compartilhe a corrente de apoio com seus amigos.
          </p>
          <button
            id="share-whatsapp-btn"
            type="button"
            onClick={handleShareWhatsApp}
            className="mt-2.5 w-full rounded-xl border border-brand bg-card py-3 text-xs font-bold uppercase tracking-wide text-accent-foreground transition-colors hover:bg-brand-soft"
          >
            Compartilhar no WhatsApp
          </button>
        </div>

        <button
          id="exit-intent-dismiss-btn"
          type="button"
          onClick={() => setIsOpen(false)}
          className="mt-4 w-full text-center text-[11px] font-semibold text-muted-foreground underline hover:text-foreground"
        >
          Não posso ajudar agora
        </button>
      </div>
    </div>
  );
}
