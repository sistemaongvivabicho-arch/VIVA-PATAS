import { useEffect } from 'react';
import { DONATION_AMOUNTS, formatBRL } from '../data';

interface DonationModalProps {
  isOpen: boolean;
  selectedAmount: number;
  onSelectAmount: (cents: number) => void;
  onClose: () => void;
  onProceedToPayment: (cents: number) => void;
}

export function DonationModal({
  isOpen,
  selectedAmount,
  onSelectAmount,
  onClose,
  onProceedToPayment,
}: DonationModalProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="donation-modal-overlay"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 sm:items-center sm:p-4"
    >
      <div
        id="donation-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Apoio aos Animais Resgatados"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-base font-extrabold tracking-tight text-foreground">
            ❤️ Apoio aos Animais Resgatados
          </h2>
          <button
            id="close-donation-modal-btn"
            onClick={onClose}
            aria-label="Fechar"
            className="-mt-1 rounded-full px-2 py-1 text-lg leading-none text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Quanto você gostaria de contribuir para apoiar os animais?
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {DONATION_AMOUNTS.map((cents) => {
            const isSelected = selectedAmount === cents;
            return (
              <button
                key={cents}
                id={`modal-amount-btn-${cents}`}
                type="button"
                onClick={() => onSelectAmount(cents)}
                aria-pressed={isSelected}
                className={`rounded-xl border py-3.5 text-sm font-bold transition-colors ${
                  isSelected
                    ? 'border-brand bg-brand text-brand-foreground'
                    : 'border-border bg-card text-foreground hover:border-brand'
                }`}
              >
                {formatBRL(cents)}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Sua contribuição será destinada à alimentação, medicamentos e atendimento veterinário dos
          animais acolhidos pelo Abrigo Viva Patas.
        </p>

        <button
          id="proceed-donation-btn"
          type="button"
          onClick={() => onProceedToPayment(selectedAmount)}
          className="mt-4 w-full rounded-xl bg-brand py-4 text-sm font-bold uppercase tracking-wide text-brand-foreground transition-colors hover:bg-brand-strong"
        >
          QUERO AJUDAR COM {formatBRL(selectedAmount)} ❤️
        </button>
      </div>
    </div>
  );
}
