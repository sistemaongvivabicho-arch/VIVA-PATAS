import { useState, useEffect, FormEvent } from 'react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_CONFIG_EVENT,
  SupabaseConfig,
} from '../lib/config';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Server,
  KeyRound,
  Check,
} from 'lucide-react';

type ConnectionStatus = 'not_configured' | 'configured' | 'success' | 'failed';

export function ConfigPage() {
  const [config, setConfig] = useState<SupabaseConfig>(getSupabaseConfig);
  const [urlInput, setUrlInput] = useState<string>('');
  const [keyInput, setKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);

  // Connection status according to requirements:
  // - Supabase configurado
  // - Supabase não configurado
  // - Conexão realizada com sucesso
  // - Falha na conexão
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() => {
    const current = getSupabaseConfig();
    return current.isConfigured ? 'configured' : 'not_configured';
  });

  // Testing & Save feedback state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Initialize form with current localStorage settings if available
  useEffect(() => {
    const current = getSupabaseConfig();
    setConfig(current);
    if (current.source === 'localStorage') {
      setUrlInput(current.url);
      setKeyInput(current.publishableKey);
    }
    setConnectionStatus(current.isConfigured ? 'configured' : 'not_configured');
  }, []);

  // Listen for config changes across components
  useEffect(() => {
    const handleConfigChange = () => {
      const updated = getSupabaseConfig();
      setConfig(updated);
      setConnectionStatus((prev) => {
        if (prev === 'success' || prev === 'failed') return prev;
        return updated.isConfigured ? 'configured' : 'not_configured';
      });
    };

    window.addEventListener(SUPABASE_CONFIG_EVENT, handleConfigChange);
    return () => window.removeEventListener(SUPABASE_CONFIG_EVENT, handleConfigChange);
  }, []);

  // 3. Botão TESTAR CONEXÃO
  const handleTestConnection = async () => {
    setFeedbackMessage(null);

    const targetUrl = urlInput.trim() || config.url;
    const targetKey = keyInput.trim() || config.publishableKey;

    // Validar se URL e chave foram preenchidas
    if (!targetUrl || !targetKey) {
      setConnectionStatus('failed');
      setFeedbackMessage({
        type: 'error',
        text: 'Não foi possível conectar ao Supabase. Verifique a URL e a Publishable Key.',
      });
      return;
    }

    setIsTesting(true);

    try {
      const result = await testSupabaseConnection(targetUrl, targetKey);
      if (result.success) {
        setConnectionStatus('success');
        setFeedbackMessage({
          type: 'success',
          text: result.message || 'Conexão com o Supabase realizada com sucesso.',
        });
      } else {
        setConnectionStatus('failed');
        setFeedbackMessage({
          type: 'error',
          text: result.message || 'Não foi possível conectar ao Supabase. Verifique a URL e a Publishable Key.',
        });
      }
    } catch {
      setConnectionStatus('failed');
      setFeedbackMessage({
        type: 'error',
        text: 'Não foi possível conectar ao Supabase. Verifique a URL e a Publishable Key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 4. Botão SALVAR CONFIGURAÇÃO
  const handleSave = (e?: FormEvent) => {
    if (e) e.preventDefault();
    setFeedbackMessage(null);

    const cleanUrl = urlInput.trim();
    const cleanKey = keyInput.trim();

    if (!cleanUrl || !cleanKey) {
      setConnectionStatus('failed');
      setFeedbackMessage({
        type: 'error',
        text: 'Por favor, preencha a URL e a Publishable Key antes de salvar.',
      });
      return;
    }

    saveSupabaseConfig(cleanUrl, cleanKey);
    const updated = getSupabaseConfig();
    setConfig(updated);

    if (connectionStatus !== 'success') {
      setConnectionStatus('configured');
    }

    setFeedbackMessage({
      type: 'success',
      text: 'Configuração salva com sucesso no navegador.',
    });

    setTimeout(() => {
      setFeedbackMessage((prev) => (prev?.type === 'success' ? null : prev));
    }, 4000);
  };

  // 5. Botão LIMPAR CONFIGURAÇÃO
  const handleClear = () => {
    clearSupabaseConfig();
    setUrlInput('');
    setKeyInput('');
    const updated = getSupabaseConfig();
    setConfig(updated);
    setConnectionStatus('not_configured');
    setFeedbackMessage({
      type: 'info',
      text: 'Configurações locais limpas com sucesso.',
    });

    setTimeout(() => {
      setFeedbackMessage((prev) => (prev?.type === 'info' ? null : prev));
    }, 3000);
  };

  // Status indicator helper
  const renderStatusBadge = () => {
    switch (connectionStatus) {
      case 'success':
        return (
          <span
            id="supabase-status-badge"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Conexão realizada com sucesso
          </span>
        );
      case 'failed':
        return (
          <span
            id="supabase-status-badge"
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800"
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
            Falha na conexão
          </span>
        );
      case 'configured':
        return (
          <span
            id="supabase-status-badge"
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            Supabase configurado
          </span>
        );
      case 'not_configured':
      default:
        return (
          <span
            id="supabase-status-badge"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted-foreground"
          >
            <span className="h-2 w-2 rounded-full bg-muted-foreground/60"></span>
            Supabase não configurado
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt pb-16 pt-6">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Top Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Configuração
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Gerencie a conexão pública do frontend com o seu projeto Supabase.
            </p>
          </div>

          {/* 6. Indicador visual do status da conexão no cabeçalho */}
          <div className="flex items-center">{renderStatusBadge()}</div>
        </div>

        {/* Security Notice Card */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground">Armazenamento Local Seguro (localStorage)</p>
              <p className="mt-0.5">
                Os dados configurados nesta tela são tratados como configurações públicas do
                frontend e permanecem salvos exclusivamente no armazenamento local deste navegador.
                Eles nunca são enviados para servidores externos, banco de dados ou logs.
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/80">
                O <strong>MERCADOPAGO_ACCESS_TOKEN</strong> e a{' '}
                <strong>SERVICE_ROLE_KEY</strong> continuam exclusivamente protegidos no ambiente
                seguro de Edge Functions do Supabase e jamais devem ser inseridos aqui.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Form Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
          {/* Indicador visual de status em destaque dentro da área de formulário */}
          <div className="mb-5 rounded-xl border p-3.5 transition-colors">
            {connectionStatus === 'success' && (
              <div className="flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-800">Conexão realizada com sucesso</p>
                  <p className="text-emerald-700/90">
                    O frontend comunicou-se com sucesso com o projeto Supabase fornecido.
                  </p>
                </div>
              </div>
            )}
            {connectionStatus === 'failed' && (
              <div className="flex items-center gap-3 text-rose-900">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <div className="text-xs">
                  <p className="font-bold text-rose-800">Falha na conexão</p>
                  <p className="text-rose-700/90">
                    Não foi possível conectar ao Supabase. Verifique a URL e a Publishable Key.
                  </p>
                </div>
              </div>
            )}
            {connectionStatus === 'configured' && (
              <div className="flex items-center gap-3 text-blue-900">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
                <div className="text-xs">
                  <p className="font-bold text-blue-800">Supabase configurado</p>
                  <p className="text-blue-700/90">
                    Credenciais disponíveis. Clique no botão &quot;TESTAR CONEXÃO&quot; para verificar o acesso.
                  </p>
                </div>
              </div>
            )}
            {connectionStatus === 'not_configured' && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">Supabase não configurado</p>
                  <p className="text-muted-foreground">
                    Preencha a URL e a Publishable Key abaixo para conectar seu projeto.
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Campo: Supabase Project URL */}
            <div>
              <label
                htmlFor="supabase-project-url"
                className="block text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Supabase Project URL
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Server className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="supabase-project-url"
                  name="supabaseProjectUrl"
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (connectionStatus === 'failed' || connectionStatus === 'success') {
                      setConnectionStatus(e.target.value && keyInput ? 'configured' : 'not_configured');
                    }
                  }}
                  placeholder="https://seu-projeto.supabase.co"
                  autoComplete="off"
                  spellCheck="false"
                  className="block w-full rounded-xl border border-border bg-surface-alt py-3 pl-10 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-brand focus:bg-card focus:outline-hidden focus:ring-1 focus:ring-brand"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                URL do seu projeto encontrada no painel do Supabase (ex: https://seu-projeto.supabase.co).
              </p>
            </div>

            {/* 2. Campo: Supabase Publishable Key */}
            <div>
              <label
                htmlFor="supabase-publishable-key"
                className="block text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Supabase Publishable Key
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="supabase-publishable-key"
                  name="supabasePublishableKey"
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    if (connectionStatus === 'failed' || connectionStatus === 'success') {
                      setConnectionStatus(urlInput && e.target.value ? 'configured' : 'not_configured');
                    }
                  }}
                  placeholder="Chave pública anônima (anon / publishable)"
                  autoComplete="off"
                  spellCheck="false"
                  className="block w-full rounded-xl border border-border bg-surface-alt py-3 pl-10 pr-10 text-xs font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground/60 focus:border-brand focus:bg-card focus:outline-hidden focus:ring-1 focus:ring-brand"
                />
                <button
                  type="button"
                  id="toggle-publishable-key-visibility"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Utilize apenas a chave pública (anon / publishable). Nunca utilize a service_role key.
              </p>
            </div>

            {/* Mensagem de Feedback (Sucesso / Erro / Info) */}
            {feedbackMessage && (
              <div
                id="config-feedback-message"
                className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                  feedbackMessage.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50/90 text-emerald-900'
                    : feedbackMessage.type === 'error'
                    ? 'border-rose-200 bg-rose-50/90 text-rose-900'
                    : 'border-border bg-muted/60 text-foreground'
                }`}
              >
                {feedbackMessage.type === 'success' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : feedbackMessage.type === 'error' ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                ) : (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                )}
                <div className="font-semibold leading-relaxed">{feedbackMessage.text}</div>
              </div>
            )}

            {/* BOTÕES DE AÇÃO: Claramente dispostos juntos dos campos */}
            <div className="space-y-3 pt-2">
              {/* Linha Principal de Ações */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* 3. Botão: TESTAR CONEXÃO (Visível e destacado junto dos campos) */}
                <button
                  type="button"
                  id="test-connection-btn"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-50/80 px-4 py-3 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs transition-colors hover:bg-emerald-100 disabled:opacity-60"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                      TESTANDO CONEXÃO...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 text-emerald-700" />
                      TESTAR CONEXÃO
                    </>
                  )}
                </button>

                {/* 4. Botão: SALVAR CONFIGURAÇÃO */}
                <button
                  type="submit"
                  id="save-config-btn"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-foreground shadow-xs transition-colors hover:bg-brand-strong"
                >
                  <Save className="h-4 w-4" />
                  SALVAR CONFIGURAÇÃO
                </button>
              </div>

              {/* 5. Botão: LIMPAR CONFIGURAÇÃO */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  id="clear-config-btn"
                  onClick={handleClear}
                  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-xs transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  LIMPAR CONFIGURAÇÃO
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Current Origin Status Card */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Origem da Configuração Ativa:</span>
            <span className="font-mono text-[11px] font-bold text-foreground">
              {config.source === 'localStorage'
                ? 'Navegador (localStorage)'
                : config.source === 'env'
                ? 'Variáveis de Ambiente (.env)'
                : 'Nenhuma credencial configurada'}
            </span>
          </div>
          {config.isConfigured && (
            <div className="mt-2 truncate font-mono text-[10px] text-muted-foreground/80">
              URL Ativa: {config.url}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
