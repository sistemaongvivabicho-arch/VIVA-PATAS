import { useState, useEffect } from 'react';
import {
  Heart,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Code,
  X,
} from 'lucide-react';

export interface PixDonationResponse {
  id?: string | number;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string | null;
      qr_code_base64?: string | null;
      ticket_url?: string | null;
    };
  };
  raw?: any;
}

export function AbrigoPatasVivasPix() {
  // Valores pré-definidos solicitados: R$ 10, R$ 25, R$ 50, R$ 100
  const PRESET_AMOUNTS = [10, 25, 50, 100];

  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    status?: number;
    message?: string;
    cause?: any;
    raw?: any;
  } | null>(null);

  const [donationData, setDonationData] = useState<PixDonationResponse | null>(null);
  const [tokenConfigured, setTokenConfigured] = useState<boolean | null>(null);

  // Estados para o botão temporário "TESTAR CONTA MERCADO PAGO"
  const [isTestingAccount, setIsTestingAccount] = useState<boolean>(false);
  const [mpUserJson, setMpUserJson] = useState<any | null>(null);
  const [mpUserError, setMpUserError] = useState<string | null>(null);
  const [copiedMpUser, setCopiedMpUser] = useState<boolean>(false);

  // Consulta temporária para /api/mp-user (que chama GET https://api.mercadopago.com/users/me)
  const handleTestMercadoPagoAccount = async () => {
    setIsTestingAccount(true);
    setMpUserError(null);
    setMpUserJson(null);
    setCopiedMpUser(false);

    try {
      const res = await fetch('/api/mp-user');
      const data = await res.json();
      if (!res.ok) {
        setMpUserError(data?.message || data?.error || `Erro HTTP ${res.status}`);
        setMpUserJson(data);
      } else {
        setMpUserJson(data);
      }
    } catch (err: any) {
      setMpUserError(err?.message || 'Falha ao conectar ao backend /api/mp-user');
    } finally {
      setIsTestingAccount(false);
    }
  };

  // Checar se o backend possui o token configurado (apenas status booleano, nunca o token)
  useEffect(() => {
    fetch('/api/pix/status-config')
      .then((res) => res.json())
      .then((data) => {
        setTokenConfigured(Boolean(data?.configured));
      })
      .catch(() => {
        // Silencioso em caso de falha de checagem
      });
  }, []);

  // Calcular valor numérico final
  const getFinalAmount = (): number => {
    if (isCustom) {
      const parsed = parseFloat(customAmountStr.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedAmount;
  };

  const handleSelectPreset = (value: number) => {
    setIsCustom(false);
    setSelectedAmount(value);
    setCustomAmountStr('');
    setError(null);
  };

  const handleCustomChange = (val: string) => {
    setIsCustom(true);
    setCustomAmountStr(val);
    setError(null);
  };

  // Gerar cobrança Pix via backend
  const handleGeneratePix = async () => {
    setError(null);
    setErrorDetails(null);
    setCopied(false);

    const amount = getFinalAmount();
    if (amount <= 0) {
      setError('Por favor, selecione um valor válido para doação (maior que R$ 0,00).');
      return;
    }

    const emailToUse = donorEmail.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setError('Por favor, informe um e-mail válido para o doador.');
      return;
    }

    setIsLoading(true);

    try {
      // POST no endpoint backend seguro que invoca POST https://api.mercadopago.com/v1/payments
      const response = await fetch('/api/pix/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_amount: amount,
          amount: amount,
          payer: {
            email: emailToUse,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Exibir erro real do Mercado Pago
        const errorMsg =
          data?.message || data?.error || `Erro retornado pelo Mercado Pago (HTTP ${response.status})`;
        setError(errorMsg);
        setErrorDetails({
          status: response.status,
          message: errorMsg,
          cause: data?.cause,
          raw: data?.raw || data,
        });
        return;
      }

      // Dados retornados do Mercado Pago
      setDonationData(data);
    } catch (err: any) {
      setError(err?.message || 'Falha de conexão com o servidor de doações.');
      setErrorDetails({
        message: err?.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Consultar status atualizado do pagamento
  const handleCheckStatus = async () => {
    if (!donationData?.id) return;
    setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/pix/payments/${encodeURIComponent(String(donationData.id))}`);
      if (res.ok) {
        const updated = await res.json();
        setDonationData((prev) => ({
          ...prev,
          status: updated.status || prev?.status,
          status_detail: updated.status_detail || prev?.status_detail,
          point_of_interaction: updated.point_of_interaction || prev?.point_of_interaction,
        }));
      }
    } catch {
      // Ignora erro momentâneo de verificação
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Copiar código Pix Copia e Cola
  const handleCopyPix = () => {
    const code = donationData?.point_of_interaction?.transaction_data?.qr_code;
    if (!code) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    } else {
      // Fallback manual para iFrames restritos
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {
        // Silêncio
      }
      document.body.removeChild(textarea);
    }
  };

  const handleReset = () => {
    setDonationData(null);
    setError(null);
    setErrorDetails(null);
    setCopied(false);
  };

  const qrCodeBase64 = donationData?.point_of_interaction?.transaction_data?.qr_code_base64;
  const qrCodeText = donationData?.point_of_interaction?.transaction_data?.qr_code;
  const ticketUrl = donationData?.point_of_interaction?.transaction_data?.ticket_url;
  const isPending = donationData?.status === 'pending' || !donationData?.status;
  const isApproved = donationData?.status === 'approved';

  return (
    <main className="min-h-[85vh] bg-surface-alt/40 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        {/* Cabeçalho Visual Solicitado */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Heart className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
            ABRIGO VIVA PATAS
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-4xl">
            Ajude nossos animais
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Sua doação ajuda a manter os cuidados e a rotina dos animais acolhidos.
          </p>

          {/* Botão temporário: TESTAR CONTA MERCADO PAGO */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              id="btn-testar-conta-mercado-pago"
              onClick={handleTestMercadoPagoAccount}
              disabled={isTestingAccount}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-indigo-500/30 bg-indigo-50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-indigo-700 transition hover:border-indigo-500 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/60 shadow-xs"
            >
              {isTestingAccount ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              TESTAR CONTA MERCADO PAGO
            </button>
          </div>
        </div>

        {/* Exibição do JSON retornado pelo Mercado Pago (sem expor o Access Token) */}
        {mpUserJson && (
          <div
            id="mp-user-json-container"
            className="mt-6 rounded-3xl border border-indigo-200 bg-card p-5 text-card-foreground shadow-sm dark:border-indigo-900/60"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Resposta do Mercado Pago (GET /users/me)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-copiar-json-mp"
                  onClick={() => {
                    const str = JSON.stringify(mpUserJson, null, 2);
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(str);
                    }
                    setCopiedMpUser(true);
                    setTimeout(() => setCopiedMpUser(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                >
                  {copiedMpUser ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedMpUser ? 'Copiado!' : 'Copiar JSON'}
                </button>
                <button
                  type="button"
                  onClick={() => setMpUserJson(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Resumo rápido dos campos principais */}
            {mpUserJson.id && (
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-surface-alt/70 p-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground">ID do Usuário</span>
                  <span className="font-mono font-extrabold text-foreground">{mpUserJson.id}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground">Nickname</span>
                  <span className="font-mono font-extrabold text-foreground">{mpUserJson.nickname || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground">E-mail</span>
                  <span className="font-mono font-extrabold text-foreground truncate" title={mpUserJson.email}>{mpUserJson.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground">País / Site</span>
                  <span className="font-mono font-extrabold text-foreground">{mpUserJson.country_id} / {mpUserJson.site_id}</span>
                </div>
              </div>
            )}

            {mpUserError && (
              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
                <p className="font-bold">Aviso:</p>
                <p>{mpUserError}</p>
              </div>
            )}

            {/* JSON bruto oficial do Mercado Pago retornado pelo backend */}
            <div className="mt-3">
              <span className="text-[11px] font-bold text-muted-foreground">JSON recebido do Mercado Pago:</span>
              <pre className="mt-1 max-h-72 overflow-auto rounded-2xl bg-slate-900 p-3.5 font-mono text-[11px] leading-relaxed text-slate-100 dark:bg-black/80">
                {JSON.stringify(mpUserJson, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Alerta de Token caso não esteja presente nas configurações */}
        {tokenConfigured === false && (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Atenção: MERCADO_PAGO_ACCESS_TOKEN não configurado</p>
                <p className="mt-1">
                  Para gerar Pix dinâmico no Mercado Pago, defina a chave secreta{' '}
                  <code className="rounded bg-amber-200/70 px-1 py-0.5 font-mono">
                    MERCADO_PAGO_ACCESS_TOKEN
                  </code>{' '}
                  no menu <strong>Settings &gt; Secrets</strong> do AI Studio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de Erro Real do Mercado Pago */}
        {error && (
          <div
            id="pix-error-banner"
            className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-rose-900 dark:text-rose-100">
                    Erro no Mercado Pago
                  </span>
                  {errorDetails?.status && (
                    <span className="rounded bg-rose-200/80 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-900 dark:bg-rose-900 dark:text-rose-100">
                      HTTP {errorDetails.status}
                    </span>
                  )}
                </div>
                <p className="font-medium">{error}</p>
                {errorDetails?.raw && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-bold text-[11px] text-rose-800 dark:text-rose-300 hover:underline">
                      Ver resposta completa da API
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-rose-100/70 p-2 font-mono text-[10px] text-rose-950 dark:bg-rose-900/60 dark:text-rose-100">
                      {JSON.stringify(errorDetails.raw, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Card Principal de Doação */}
        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {!donationData ? (
            /* ETAPA 1: ESCOLHA DE VALOR E GERAÇÃO */
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Escolha o valor da contribuição
                </h2>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Pix Oficial
                </span>
              </div>

              {/* Botões de Valores Pré-definidos: R$ 10, R$ 25, R$ 50, R$ 100 */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PRESET_AMOUNTS.map((val) => {
                  const isSelected = !isCustom && selectedAmount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      id={`btn-preset-${val}`}
                      onClick={() => handleSelectPreset(val)}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 py-3.5 px-2 transition-all ${
                        isSelected
                          ? 'border-brand bg-brand/5 text-brand shadow-xs'
                          : 'border-border bg-background text-foreground hover:border-brand/50 hover:bg-surface-alt'
                      }`}
                    >
                      <span className="text-xs font-medium text-muted-foreground">Doar</span>
                      <span className="mt-0.5 text-lg font-black tracking-tight">R$ {val}</span>
                    </button>
                  );
                })}
              </div>

              {/* Valor Personalizado */}
              <div className="mt-4">
                <label
                  htmlFor="custom-amount-input"
                  className="block text-xs font-bold text-foreground"
                >
                  Ou digite outro valor:
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-muted-foreground">
                    R$
                  </span>
                  <input
                    id="custom-amount-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 15.00"
                    value={customAmountStr}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-base font-bold text-foreground transition focus:outline-none ${
                      isCustom
                        ? 'border-brand ring-1 ring-brand bg-background'
                        : 'border-border bg-background/50 hover:border-muted-foreground/30'
                    }`}
                  />
                </div>
              </div>

              {/* Campo E-mail do doador */}
              <div className="mt-4">
                <label
                  htmlFor="donor-email-input"
                  className="block text-xs font-bold text-foreground"
                >
                  E-mail do doador
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="donor-email-input"
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={donorEmail}
                    onChange={(e) => {
                      setDonorEmail(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-sm font-medium text-foreground transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Resumo do Valor Escolhido */}
              <div className="mt-5 rounded-2xl border border-border/80 bg-surface-alt/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Valor selecionado:</span>
                  <span className="font-mono text-xl font-black text-brand">
                    R$ {getFinalAmount().toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Cobrança Pix imediata vinculada à conta do Abrigo Viva Patas via Mercado Pago.
                </p>
              </div>

              {/* Botão de Ação para Gerar Pix */}
              <button
                type="button"
                id="btn-doar-pix"
                disabled={isLoading || getFinalAmount() <= 0}
                onClick={handleGeneratePix}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-extrabold uppercase tracking-wide text-brand-foreground shadow-sm transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Gerando Pix Seguro...
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    Gerar Pix de R$ {getFinalAmount().toFixed(2).replace('.', ',')}
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ETAPA 2: EXIBIÇÃO DO PIX DINÂMICO GERADO */
            <div className="space-y-6">
              {/* Header do Pagamento Gerado */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Doação Gerada
                  </span>
                  <h2 className="text-lg font-black text-foreground">
                    Abrigo Viva Patas
                  </h2>
                </div>

                {/* Status: Aguardando Pagamento */}
                <div>
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Doação Confirmada!
                    </span>
                  ) : (
                    <span
                      id="status-aguardando"
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    >
                      <Clock className="h-4 w-4 animate-pulse text-amber-600" />
                      Aguardando pagamento
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Mostrar o valor da doação */}
              <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Valor da Doação
                </span>
                <p className="mt-0.5 font-mono text-3xl font-black text-brand">
                  R$ {Number(donationData.transaction_amount || getFinalAmount()).toFixed(2).replace('.', ',')}
                </p>
                {donationData.id && (
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    ID do Pagamento: #{donationData.id}
                  </p>
                )}
              </div>

              {/* 1. Mostrar o QR Code usando qr_code_base64 */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Escaneie o QR Code com o app do seu banco
                </p>
                <div className="flex h-56 w-56 items-center justify-center rounded-3xl border-2 border-border bg-white p-3 shadow-inner">
                  {qrCodeBase64 ? (
                    <img
                      src={`data:image/png;base64,${qrCodeBase64}`}
                      alt="QR Code Pix - Abrigo Viva Patas"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-3 text-xs text-muted-foreground">
                      <QrCode className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
                      <p>QR Code em processamento pela rede Pix</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Mostrar o Pix Copia e Cola usando qr_code */}
              {qrCodeText && (
                <div>
                  <label
                    htmlFor="pix-copia-cola-input"
                    className="block text-xs font-bold text-foreground"
                  >
                    Pix Copia e Cola:
                  </label>
                  <textarea
                    id="pix-copia-cola-input"
                    readOnly
                    rows={3}
                    value={qrCodeText}
                    className="mt-1.5 w-full resize-none rounded-2xl border border-border bg-surface-alt/70 p-3 font-mono text-[11px] leading-relaxed text-foreground select-all focus:outline-none"
                  />

                  {/* 3. Criar botão "Copiar Pix" */}
                  <button
                    type="button"
                    id="btn-copiar-pix"
                    onClick={handleCopyPix}
                    className={`mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold uppercase tracking-wide transition-all shadow-xs ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand text-brand-foreground hover:bg-brand-strong'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Código Pix Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        Copiar Pix
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Ticket URL opcional caso o doador queira ver no Mercado Pago */}
              {ticketUrl && (
                <div className="text-center">
                  <a
                    href={ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir comprovante/página no Mercado Pago
                  </a>
                </div>
              )}

              {/* Ações adicionais: Verificar status e Nova Doação */}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button
                  type="button"
                  id="btn-check-status"
                  onClick={handleCheckStatus}
                  disabled={isCheckingStatus}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-background py-3 text-xs font-bold text-foreground transition hover:border-brand disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  {isCheckingStatus ? 'Verificando...' : 'Verificar Status'}
                </button>

                <button
                  type="button"
                  id="btn-nova-doacao"
                  onClick={handleReset}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface-alt py-3 text-xs font-bold text-foreground transition hover:bg-muted"
                >
                  <Sparkles className="h-4 w-4 text-brand" />
                  Fazer outra doação
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Seguro e Institucional */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Abrigo Viva Patas</p>
          <p className="mt-1">
            Doações processadas com segurança através do Pix dinâmico do Mercado Pago.
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/70">
            Nenhuma credencial ou token confidencial é exposto no navegador.
          </p>
        </div>
      </div>
    </main>
  );
}
