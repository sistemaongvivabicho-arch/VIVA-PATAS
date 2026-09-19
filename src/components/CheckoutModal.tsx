import { useState, useEffect, useRef } from 'react';
import { formatBRL } from '../data';
import { createPixPayment, checkPixStatus, CreatePixResponse } from '../lib/supabase';
import { Check, Copy, Loader2, ExternalLink, AlertCircle, CheckCircle2, Heart } from 'lucide-react';

interface CheckoutModalProps {
  cents: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ cents, isOpen, onClose }: CheckoutModalProps) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'generating' | 'pending' | 'approved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pixData, setPixData] = useState<CreatePixResponse | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const formattedValue = formatBRL(cents);
  const numericAmount = Number((cents / 100).toFixed(2));

  // Clear polling helper
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Generate PIX via Edge Function
  const generatePix = async () => {
    stopPolling();
    setStatus('generating');
    setErrorMessage(null);
    setPixData(null);
    setCopied(false);

    if (numericAmount <= 0) {
      setStatus('error');
      setErrorMessage('Valor de contribuição inválido.');
      return;
    }

    try {
      const response = await createPixPayment(numericAmount);

      if (!isMountedRef.current) return;

      if (response.success && response.qr_code) {
        setPixData(response);
        setStatus('pending');

        // Start periodic polling for payment confirmation if payment_id is returned
        if (response.payment_id) {
          const paymentId = response.payment_id;
          pollIntervalRef.current = setInterval(async () => {
            const check = await checkPixStatus(paymentId);
            if (!isMountedRef.current) return;

            if (check.status === 'approved') {
              setStatus('approved');
              stopPolling();
            }
          }, 3500);
        }
      } else {
        setStatus('error');
        setErrorMessage(
          response.error || 'Não foi possível gerar o PIX agora. Tente novamente.'
        );
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Erro na criação do PIX:', err);
      setStatus('error');
      setErrorMessage('Não foi possível gerar o PIX agora. Tente novamente.');
    }
  };

  // Trigger PIX creation whenever the modal is opened
  useEffect(() => {
    isMountedRef.current = true;

    if (isOpen) {
      generatePix();
    } else {
      stopPolling();
      setStatus('idle');
    }

    return () => {
      stopPolling();
    };
  }, [isOpen, cents]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, []);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    if (pixData?.qr_code && navigator.clipboard) {
      navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      setTimeout(() => {
        if (isMountedRef.current) setCopied(false);
      }, 3000);
    }
  };

  return (
    <div
      id="checkout-modal-overlay"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 p-0 sm:items-center sm:p-4"
    >
      <div
        id="checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Finalize sua contribuição"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 shadow-xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Logo Abrigo Viva Patas"
              className="h-11 w-11 rounded-full object-cover shadow-xs"
            />
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">
                🔒 Pagamento 100% Seguro
              </span>
              <h2 className="mt-1 text-base font-extrabold tracking-tight text-foreground">
                Finalize sua contribuição
              </h2>
            </div>
          </div>
          <button
            id="close-checkout-modal-btn"
            onClick={onClose}
            aria-label="Fechar"
            className="-mt-1 rounded-full p-1 text-xl leading-none text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        {/* Selected Value Card */}
        <div className="mt-4 rounded-2xl border border-brand/30 bg-surface-cream p-4 text-center">
          <p className="text-xs text-muted-foreground">Valor selecionado para doar:</p>
          <p className="mt-1 text-2xl font-extrabold text-brand">{formattedValue}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Destinado ao cuidado, alimentação e atendimento dos cães resgatados
          </p>
        </div>

        {/* State: Generating PIX */}
        {status === 'generating' && (
          <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-brand" />
            <p className="mt-4 text-sm font-bold text-foreground">Gerando seu PIX...</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Aguarde um instante enquanto conectamos com o sistema de pagamentos.
            </p>
          </div>
        )}

        {/* State: Error */}
        {status === 'error' && (
          <div className="mt-6 space-y-4 text-center">
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-red-900">
              <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
              <p className="mt-2 text-xs font-semibold">
                {errorMessage || 'Não foi possível gerar o PIX agora. Tente novamente.'}
              </p>
            </div>
            <button
              id="retry-pix-btn"
              type="button"
              onClick={generatePix}
              className="w-full rounded-xl bg-brand py-3.5 text-sm font-bold uppercase tracking-wide text-brand-foreground transition-colors hover:bg-brand-strong"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* State: Approved */}
        {status === 'approved' && (
          <div className="mt-6 space-y-4 text-center">
            <div className="rounded-2xl border border-green-200 bg-green-50/80 p-5 text-green-900">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="mt-2 text-base font-extrabold text-green-900">
                Pagamento aprovado! ❤️
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-green-800">
                Sua contribuição de <strong>{formattedValue}</strong> foi confirmada com sucesso.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-green-700">
                Muito obrigado por ajudar a manter o tratamento, a alimentação e o carinho diário com
                os animais acolhidos do Abrigo Viva Patas.
              </p>
            </div>
            <button
              id="approved-close-btn"
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-brand py-3.5 text-sm font-bold uppercase tracking-wide text-brand-foreground transition-colors hover:bg-brand-strong"
            >
              Concluir
            </button>
          </div>
        )}

        {/* State: Pending / PIX Created */}
        {status === 'pending' && pixData && (
          <div className="mt-5 space-y-4">
            {/* Live Polling Indicator */}
            <div className="flex items-center justify-center gap-2 rounded-xl bg-brand-soft/70 px-3 py-2 text-center text-xs font-medium text-accent-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
              </span>
              <span>Aguardando pagamento pelo seu banco...</span>
            </div>

            {/* QR Code */}
            {pixData.qr_code_base64 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-4">
                <p className="mb-2 text-xs font-bold text-foreground">Escaneie o QR Code:</p>
                <img
                  src={
                    pixData.qr_code_base64.startsWith('data:')
                      ? pixData.qr_code_base64
                      : `data:image/png;base64,${pixData.qr_code_base64}`
                  }
                  alt="QR Code PIX para pagamento"
                  className="h-44 w-44 rounded-xl border border-border bg-white p-1 object-contain"
                />
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  Abra o aplicativo do seu banco e escolha a opção Ler QR Code
                </p>
              </div>
            )}

            {/* PIX Copia e Cola */}
            {pixData.qr_code && (
              <div>
                <label className="text-xs font-bold text-foreground">PIX Copia e Cola:</label>
                <div className="mt-1.5 flex items-center justify-between rounded-xl border border-border bg-surface-alt p-3">
                  <span className="truncate font-mono text-xs text-foreground">
                    {pixData.qr_code}
                  </span>
                  <button
                    id="copy-pix-btn"
                    type="button"
                    onClick={handleCopyPix}
                    className="ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-foreground transition-colors hover:bg-brand-strong"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        COPIAR PIX
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Open payment link / ticket_url if provided */}
            {pixData.ticket_url && (
              <a
                id="open-ticket-url-link"
                href={pixData.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground hover:bg-muted"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                Abrir link do pagamento no Mercado Pago
              </a>
            )}

            {/* Instructions */}
            <div className="rounded-xl border border-border bg-surface-alt p-3 text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Como pagar pelo app do seu banco:</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                <li>Abra o aplicativo do seu banco ou carteira digital.</li>
                <li>Escolha a opção <strong>PIX</strong> e depois <strong>Pagar com QR Code</strong> ou <strong>PIX Copia e Cola</strong>.</li>
                <li>Confirme o valor de <strong>{formattedValue}</strong> e conclua a transação.</li>
              </ol>
            </div>

            <p className="text-center text-[10px] text-muted-foreground">
              Após a confirmação no seu banco, o status desta tela será atualizado automaticamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
