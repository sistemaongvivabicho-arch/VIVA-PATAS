import { useState, useEffect } from 'react';
import {
  CAUSE_ALLOCATIONS,
  DONATION_AMOUNTS,
  formatBRL,
  POPULAR_AMOUNT,
  INITIAL_ANIMALS,
} from '../data';
import { WistiaPlayer } from './WistiaPlayer';
import {
  Heart,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Activity,
  HeartHandshake,
  X,
  AlertTriangle,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { AnimalItem } from '../types';

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

export const HERO_CAROUSEL_IMAGES = [
  {
    url: '/images/hero/hero-1.png',
    alt: 'Cuidado e acolhimento no Abrigo Viva Patas',
  },
  {
    url: '/images/hero/hero-2.png',
    alt: 'Rotina de amor e dedicação aos resgatados',
  },
  {
    url: '/images/hero/hero-3.png',
    alt: 'Animais acolhidos no Abrigo Viva Patas',
  },
  {
    url: '/images/hero/hero-4.png',
    alt: 'Proteção e reconstrução de vidas no abrigo',
  },
  {
    url: '/images/hero/hero-5.png',
    alt: 'Esperança e carinho para cada animal resgatado',
  },
];

/**
 * ============================================================================
 * CONFIGURAÇÃO DO VÍDEO WISTIA
 * ============================================================================
 * Insira o ID do seu vídeo Wistia entre as aspas abaixo.
 * Exemplo: const WISTIA_VIDEO_ID = "abc123xyz";
 * Se deixado vazio (""), o player exibirá uma moldura elegante com aviso amigável.
 */
export const WISTIA_VIDEO_ID = "qd92xcw9an";
export const WISTIA_HAPPY_VIDEO_ID = "pmsoemmlzp"; // https://sistema-ongvivabicho.wistia.com/s/c6ucgjfb497hg33

interface CampaignPageProps {
  selectedAmount: number;
  onSelectAmount: (cents: number) => void;
  onOpenDonationModal: (cents?: number) => void;
  onQueroAjudar?: (cents?: number) => void;
}

export function CampaignPage({
  selectedAmount,
  onSelectAmount,
  onOpenDonationModal,
  onQueroAjudar,
}: CampaignPageProps) {
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalItem | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Estados da integração oficial Pix Mercado Pago
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [isGeneratingPix, setIsGeneratingPix] = useState<boolean>(false);
  const [isCheckingPixStatus, setIsCheckingPixStatus] = useState<boolean>(false);
  const [pixCopied, setPixCopied] = useState<boolean>(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixErrorDetails, setPixErrorDetails] = useState<any | null>(null);
  const [donationData, setDonationData] = useState<PixDonationResponse | null>(null);

  // Carrossel automático passando suavemente a cada 3 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_CAROUSEL_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleNextHero = () => {
    setCurrentHeroIndex((prev) => (prev + 1) % HERO_CAROUSEL_IMAGES.length);
  };

  const handlePrevHero = () => {
    setCurrentHeroIndex((prev) => (prev - 1 + HERO_CAROUSEL_IMAGES.length) % HERO_CAROUSEL_IMAGES.length);
  };

  const getFinalAmount = (): number => {
    if (isCustom) {
      const parsed = parseFloat(customAmountStr.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return Number((selectedAmount / 100).toFixed(2));
  };

  const scrollToOffersSection = (cents?: number) => {
    if (cents) {
      setIsCustom(false);
      setCustomAmountStr('');
      onSelectAmount(cents);
    }
    const section = document.getElementById('doar') || document.getElementById('secao-ofertas');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectAmount = (cents: number) => {
    setIsCustom(false);
    setCustomAmountStr('');
    onSelectAmount(cents);
    setPixError(null);
  };

  // Gerador oficial de Pix Mercado Pago
  const handleGeneratePix = async () => {
    setPixError(null);
    setPixErrorDetails(null);
    setPixCopied(false);

    const amount = getFinalAmount();
    if (amount <= 0) {
      setPixError('Por favor, selecione ou digite um valor válido para a doação.');
      return;
    }

    const emailToUse = donorEmail.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setPixError('Por favor, informe um e-mail válido para o doador.');
      return;
    }

    setIsGeneratingPix(true);

    try {
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
        const errorMsg =
          data?.message || data?.error || `Erro retornado pelo Mercado Pago (HTTP ${response.status})`;
        setPixError(errorMsg);
        setPixErrorDetails({
          status: response.status,
          message: errorMsg,
          cause: data?.cause,
          raw: data?.raw || data,
        });
        return;
      }

      setDonationData(data);
    } catch (err: any) {
      setPixError(err?.message || 'Falha de conexão com o servidor de pagamentos.');
      setPixErrorDetails({
        message: err?.message,
      });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  // Verificação manual de status
  const handleCheckPixStatus = async () => {
    if (!donationData?.id) return;
    setIsCheckingPixStatus(true);
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
      // Silêncio
    } finally {
      setIsCheckingPixStatus(false);
    }
  };

  // Polling automático a cada 4 segundos quando aguardando pagamento
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (donationData?.id && donationData?.status === 'pending') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/pix/payments/${encodeURIComponent(String(donationData.id))}`);
          if (res.ok) {
            const updated = await res.json();
            if (updated.status === 'approved') {
              setDonationData((prev) => ({
                ...prev,
                status: 'approved',
                status_detail: updated.status_detail,
              }));
            }
          }
        } catch {
          // silêncio
        }
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [donationData?.id, donationData?.status]);

  // Copiar código Pix
  const handleCopyPix = () => {
    const code = donationData?.point_of_interaction?.transaction_data?.qr_code;
    if (!code) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setPixCopied(true);
        setTimeout(() => setPixCopied(false), 3000);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setPixCopied(true);
        setTimeout(() => setPixCopied(false), 3000);
      } catch {}
      document.body.removeChild(textarea);
    }
  };

  const handleResetPix = () => {
    setDonationData(null);
    setPixError(null);
    setPixErrorDetails(null);
    setPixCopied(false);
  };

  return (
    <div id="campaign-view" className="min-h-screen bg-surface-cream font-sans">
      {/* 1. Header Fixo Institucional */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface-cream/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/logo.png"
              alt="Logo Abrigo Viva Patas"
              className="h-9 w-9 rounded-full object-cover shadow-xs"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Abrigo Viva Patas
              </span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">
                Cuidado e proteção aos animais
              </span>
            </div>
          </div>
          <button
            id="header-donate-btn"
            type="button"
            onClick={() => scrollToOffersSection()}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong"
          >
            <Heart className="h-3.5 w-3.5 fill-current" />
            Quero Ajudar
          </button>
        </div>
      </header>

      <main>
        {/* 2. Hero da Página Principal */}
        <section className="bg-surface-cream px-4 pb-8 pt-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
              Eles foram resgatados.
              <br className="hidden sm:inline" />{' '}
              <span className="block sm:inline">E essa história está apenas começando.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Nasce o Abrigo Viva Patas, um novo espaço dedicado ao acolhimento, cuidado e proteção de animais que precisam de uma nova oportunidade.
            </p>

            {/* Carrossel Automático de Imagens (Passa a cada 3s) */}
            <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:aspect-[16/10] sm:max-h-[420px]">
              {HERO_CAROUSEL_IMAGES.map((image, idx) => (
                <div
                  key={image.url}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === currentHeroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}

              {/* Botões de Navegação Anterior / Próximo */}
              <button
                type="button"
                onClick={handlePrevHero}
                aria-label="Imagem anterior"
                className="absolute left-2.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition-all hover:bg-black/65 sm:left-3.5 sm:p-2"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                onClick={handleNextHero}
                aria-label="Próxima imagem"
                className="absolute right-2.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition-all hover:bg-black/65 sm:right-3.5 sm:p-2"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Indicadores (Dots) com feedback visual */}
              <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center items-center gap-1.5">
                {HERO_CAROUSEL_IMAGES.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentHeroIndex(dotIdx)}
                    aria-label={`Ir para a foto ${dotIdx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      dotIdx === currentHeroIndex
                        ? 'w-6 bg-brand shadow'
                        : 'w-2 bg-white/70 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* CTAs do Hero */}
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                id="hero-help-btn"
                type="button"
                onClick={() => scrollToOffersSection()}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-sm font-bold uppercase tracking-wide text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong"
              >
                <Heart className="h-4 w-4 fill-current" />
                QUERO AJUDAR
              </button>
              <a
                href="#animais-acolhidos"
                className="flex items-center justify-center rounded-xl border border-border bg-card px-5 py-4 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-brand"
              >
                CONHECER OS ANIMAIS
              </a>
            </div>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Doação direta via PIX · Pagamento processado de forma rápida e segura
            </p>
          </div>
        </section>

        {/* 3. Seção Institucional: Conheça o Viva Patas */}
        <section className="border-y border-border/60 bg-card px-4 py-10">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
                Apresentação Institucional
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Um abrigo, muitas histórias
              </h2>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Cada animal que chega ao Abrigo Viva Patas traz consigo uma história diferente. Alguns
                foram encontrados abandonados, outros chegaram machucados, doentes ou simplesmente sem um
                lugar seguro para ficar.
              </p>
              <p>
                Aqui, cada um recebe atenção, alimentação e os cuidados necessários para seguir em
                frente.
              </p>
              <p className="font-medium text-foreground">
                Nosso trabalho acontece todos os dias — e cada pessoa que ajuda passa a fazer parte dessa
                história.
              </p>
            </div>
          </div>
        </section>


        {/* 5. Seção: Conheça alguns dos nossos animais */}
        <section id="animais-acolhidos" className="scroll-mt-16 bg-card px-4 py-10 border-t border-border">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
                Animais do Abrigo
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Conheça alguns dos nossos animais
              </h2>
              <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
                Por trás de cada foto existe uma história. Conheça alguns dos animais que passaram a
                fazer parte do Abrigo Viva Patas.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {INITIAL_ANIMALS.map((animal) => (
                <div
                  key={animal.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface-cream/60 shadow-xs"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img
                        src={animal.imageUrl}
                        alt={animal.name}
                        loading="lazy"
                        className={`h-full w-full object-cover ${animal.imagePosition || 'object-center'}`}
                      />
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                        {animal.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground">{animal.name}</h3>
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                          {animal.tag}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {animal.description}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedAnimal(animal)}
                      className="w-full rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground transition-colors hover:border-brand hover:text-brand"
                    >
                      Conhecer história
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. O MOMENTO DO RESGATE: Vídeo + Pedido de Urgência */}
        <section id="rotina-e-urgencia" className="bg-surface-cream px-4 py-10">
          <div className="mx-auto max-w-2xl">
            {/* Header da Seção */}
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
                A REALIDADE QUE NÃO PODEMOS ESCONDER
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                O desespero da fome que eles enfrentavam nas ruas
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Animais magros e fragilizados disputando qualquer sobra para sobreviver. Assista ao vídeo e veja por que sua ajuda com ração e cuidados é urgente todos os dias.
              </p>
            </div>

            {/* Container do Vídeo Wistia */}
            <div className="mt-6">
              <WistiaPlayer videoId={WISTIA_VIDEO_ID} />
            </div>

            {/* Bloco: PEDIDO DE URGÊNCIA */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
              {/* Tag / Eyebrow */}
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <h2 className="text-[11px] font-extrabold uppercase tracking-widest">
                  PEDIDO DE URGÊNCIA
                </h2>
              </div>

              {/* Título Principal */}
              <h3 className="mt-2 text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
                O Abrigo Viva Patas precisa da sua ajuda
              </h3>

              {/* Texto Explicando as Necessidades */}
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Manter um abrigo funcionando exige cuidados todos os dias. Precisamos de apoio para garantir ração, medicamentos, produtos de higiene e outros itens essenciais para os animais acolhidos.
              </p>

              {/* Texto Complementar */}
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Qualquer contribuição pode ajudar a manter esses cuidados e garantir que os animais continuem recebendo o que precisam.
              </p>

              {/* CTA Quero Ajudar (reutiliza o mesmo fluxo PIX do projeto) */}
              <div className="mt-5">
                <button
                  type="button"
                  id="urgencia-ajude-viva-patas-btn"
                  onClick={() => scrollToOffersSection()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 px-4 text-xs font-extrabold uppercase tracking-wide text-brand-foreground shadow-sm transition-all hover:bg-brand-strong active:scale-[0.99] sm:text-sm"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  AJUDE O VIVA PATAS
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Seção: Depois do Resgate */}
        <section className="border-t border-border bg-card px-4 py-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Depois do Resgate
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Agora eles podem brincar, correr e simplesmente ser felizes
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground text-left sm:text-center">
              <p>
                O resgate foi apenas o começo. Depois de receberem cuidado, alimentação, atenção e proteção, esses animais ganharam algo que todos merecem:{' '}
                <strong className="font-semibold text-foreground">
                  um lugar seguro para viver e a liberdade de aproveitar cada dia.
                </strong>
              </p>
              <p>
                Hoje, eles podem brincar, correr, descansar, receber carinho e conviver com outros animais em um ambiente onde são cuidados e respeitados.
              </p>
            </div>

            <h3 className="mt-6 text-base font-bold text-foreground sm:text-lg">
              Porque uma nova oportunidade também significa poder voltar a ser feliz.
            </h3>

            {/* Vídeo dos Animais Brincando */}
            <div className="mt-5">
              <WistiaPlayer
                videoId={WISTIA_HAPPY_VIDEO_ID}
                videoSrc="/videos/domigou.mp4"
                posterUrl="/images/domigou-poster.jpg"
                aspectRatio="story"
                className="w-full"
              />
            </div>

            <p className="mt-5 text-sm font-semibold leading-relaxed text-foreground sm:text-base">
              Eles chegaram precisando de ajuda. Hoje, vivem cercados de cuidado, proteção e novas possibilidades.
            </p>
          </div>
        </section>


        {/* 10. Seção: Transparência (Como sua ajuda se transforma em cuidado) */}
        <section id="transparencia" className="bg-surface-cream px-4 py-12">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Sua ajuda se transforma em cuidado
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Manter o abrigo funcionando exige cuidado todos os dias. As contribuições ajudam nas
                necessidades dos animais e na manutenção da estrutura de acolhimento.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {CAUSE_ALLOCATIONS.map((alloc) => (
                <div
                  key={alloc.title}
                  className="rounded-2xl border border-border bg-card p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-lg">
                      {alloc.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                        {alloc.title}
                      </h3>
                      <p className="text-xs font-bold text-brand">{alloc.label}</p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {alloc.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* 11. Seção de Doação (Ofertas) & 12. PIX */}
        <section id="doar" data-section="ofertas" className="scroll-mt-20 bg-surface-alt px-4 py-12">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
                  ❤️ Doe via PIX
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Oficial Mercado Pago
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Faça parte dessa corrente de cuidado
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Você pode contribuir com o valor que estiver ao seu alcance. Cada contribuição ajuda a
                manter o trabalho do Abrigo Viva Patas e os cuidados com os animais acolhidos.
              </p>
            </div>

            {!donationData ? (
              <div className="mt-6">
                {/* Grid de Valores de Doação */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {DONATION_AMOUNTS.map((cents) => {
                    const isSelected = !isCustom && selectedAmount === cents;
                    const isPopular = cents === POPULAR_AMOUNT;
                    return (
                      <button
                        key={cents}
                        id={`amount-btn-${cents}`}
                        type="button"
                        onClick={() => handleSelectAmount(cents)}
                        aria-pressed={isSelected}
                        className={`relative rounded-xl border py-3.5 text-sm font-bold transition-all ${
                          isSelected
                            ? 'border-brand bg-brand text-brand-foreground shadow-sm'
                            : 'border-border bg-card text-foreground hover:border-brand'
                        }`}
                      >
                        {formatBRL(cents)}
                        {isPopular && (
                          <span className="absolute -top-2 right-2 rounded-full bg-brand-strong px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-brand-foreground shadow">
                            Mais doado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Campo de Outro Valor */}
                <div className="mt-4">
                  <label htmlFor="custom-amount-campaign" className="block text-xs font-bold text-foreground">
                    Ou digite outro valor:
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-muted-foreground">
                      R$
                    </span>
                    <input
                      id="custom-amount-campaign"
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 15,00"
                      value={customAmountStr}
                      onChange={(e) => {
                        setIsCustom(true);
                        setCustomAmountStr(e.target.value);
                        setPixError(null);
                      }}
                      className={`w-full rounded-2xl border py-3 pl-10 pr-4 text-base font-bold text-foreground transition focus:outline-none ${
                        isCustom
                          ? 'border-brand ring-1 ring-brand bg-card'
                          : 'border-border bg-card/60 hover:border-muted-foreground/30'
                      }`}
                    />
                  </div>
                </div>

                {/* Campo Obrigatório: E-mail do Doador */}
                <div className="mt-4 text-left">
                  <label htmlFor="donor-email-campaign" className="block text-xs font-bold text-foreground">
                    E-mail do doador <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="donor-email-campaign"
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={donorEmail}
                      onChange={(e) => {
                        setDonorEmail(e.target.value);
                        setPixError(null);
                      }}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-xs"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Necessário para registro da transação Pix oficial no Mercado Pago.
                  </p>
                </div>

                {/* Caixa de Resumo do Valor */}
                <div className="mt-4 rounded-2xl border border-border/80 bg-card p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Valor da contribuição:</span>
                    <span className="font-mono text-xl font-black text-brand">
                      R$ {getFinalAmount().toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Cobrança Pix imediata vinculada à conta do Abrigo Viva Patas via Mercado Pago.
                  </p>
                </div>

                {/* Banner de Erro Real se Houver */}
                {pixError && (
                  <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-left text-xs text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <p className="font-bold">Aviso no processamento do Pix</p>
                        <p className="mt-0.5">{pixError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão de Ação Principal de Doação */}
                <button
                  id="grid-donate-btn"
                  type="button"
                  disabled={isGeneratingPix || getFinalAmount() <= 0}
                  onClick={handleGeneratePix}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-extrabold uppercase tracking-wide text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPix ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Gerando Pix Seguro...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 fill-current" />
                      QUERO AJUDAR COM R$ {getFinalAmount().toFixed(2).replace('.', ',')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Interface Completa do Pix Gerado */
              <div className="mt-6 rounded-2xl border border-emerald-300/80 bg-card p-5 text-center shadow-md dark:border-emerald-800/80 sm:p-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between border-b border-border/80 pb-3.5">
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Abrigo Viva Patas · Doação Oficial
                    </span>
                    <h3 className="text-base font-extrabold text-foreground">
                      {donationData.status === 'approved' ? 'Doação Confirmada!' : 'Pix Gerado com Sucesso'}
                    </h3>
                  </div>
                  {donationData.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Aprovado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                      <Clock className="h-3.5 w-3.5 animate-pulse text-amber-600" />
                      Aguardando Pagamento
                    </span>
                  )}
                </div>

                {/* Valor Destacado */}
                <div className="my-4 rounded-xl bg-surface-cream/80 p-3.5">
                  <span className="text-xs text-muted-foreground">Valor a doar:</span>
                  <div className="font-mono text-2xl font-black text-brand">
                    R$ {Number(donationData.transaction_amount || getFinalAmount()).toFixed(2).replace('.', ',')}
                  </div>
                  {donationData.id && (
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                      ID Mercado Pago: #{donationData.id}
                    </div>
                  )}
                </div>

                {/* QR Code Dinâmico */}
                {donationData.point_of_interaction?.transaction_data?.qr_code_base64 && (
                  <div className="my-4 flex flex-col items-center">
                    <p className="text-xs font-bold text-foreground">
                      Escaneie o QR Code com o aplicativo do seu banco:
                    </p>
                    <div className="mt-2.5 rounded-2xl border-2 border-brand/40 bg-white p-3 shadow-inner">
                      <img
                        src={`data:image/png;base64,${donationData.point_of_interaction.transaction_data.qr_code_base64}`}
                        alt="QR Code Pix Oficial"
                        className="h-48 w-48 object-contain sm:h-56 sm:w-56"
                      />
                    </div>
                  </div>
                )}

                {/* Pix Copia e Cola */}
                {donationData.point_of_interaction?.transaction_data?.qr_code && (
                  <div className="my-4 text-left">
                    <label className="block text-xs font-bold text-foreground">
                      Pix Copia e Cola:
                    </label>
                    <div className="mt-1 flex flex-col gap-2">
                      <textarea
                        readOnly
                        value={donationData.point_of_interaction.transaction_data.qr_code}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-muted/40 p-2.5 font-mono text-xs text-muted-foreground focus:outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-wide transition-all shadow-xs ${
                          pixCopied
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-brand text-brand-foreground hover:bg-brand-strong'
                        }`}
                      >
                        {pixCopied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Código Pix Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copiar Código Pix
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Link Externo Mercado Pago se disponível */}
                {donationData.point_of_interaction?.transaction_data?.ticket_url && (
                  <div className="my-2">
                    <a
                      href={donationData.point_of_interaction.transaction_data.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Visualizar comprovante no Mercado Pago
                    </a>
                  </div>
                )}

                {/* Botões de Ação do Pix Gerado */}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleCheckPixStatus}
                    disabled={isCheckingPixStatus}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground transition-colors hover:border-brand hover:text-brand"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isCheckingPixStatus ? 'animate-spin' : ''}`} />
                    {isCheckingPixStatus ? 'Verificando...' : 'Verificar Pagamento'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPix}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-cream py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                  >
                    Fazer outra doação
                  </button>
                </div>
              </div>
            )}

            {/* Segurança do PIX */}
            <div className="mt-4 rounded-xl border border-brand/30 bg-card p-3.5 text-[11px] leading-relaxed text-muted-foreground text-left">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Doe via PIX · Pagamento processado de forma segura</span>
              </div>
              <p className="mt-1">
                Ao clicar em ajudar, o QR Code e o código PIX Copia e Cola são gerados instantaneamente na tela. Sua contribuição é destinada às necessidades dos animais acolhidos no abrigo.
              </p>
            </div>
          </div>
        </section>




        {/* 16. Seção: Sobre o Abrigo Viva Patas */}
        <section className="border-t border-border bg-card px-4 py-10">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
                Institucional
              </p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Sobre o Abrigo Viva Patas
              </h2>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                O Abrigo Viva Patas nasceu com o propósito de oferecer proteção e cuidado a animais que
                precisam de uma nova oportunidade.
              </p>
              <p>
                O trabalho envolve acolhimento, alimentação, cuidados diários e busca por atendimento
                adequado sempre que necessário.
              </p>
              <p className="font-semibold text-foreground">
                Cada contribuição ajuda a manter essa rotina e permite que o abrigo continue cuidando de
                quem precisa.
              </p>
            </div>
          </div>
        </section>

        {/* 18. CTA Final */}
        <section className="bg-surface-cream px-4 pb-12 pt-4">
          <div className="mx-auto max-w-2xl rounded-2xl border border-brand/40 bg-card p-6 text-center shadow-sm">
            <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
              Eles precisam de cuidado todos os dias.
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-sm">
              O Abrigo Viva Patas continua acolhendo animais que precisam de proteção, alimentação e
              atenção. Se você puder ajudar, faça parte dessa história.
            </p>

            <button
              id="final-cta-btn"
              type="button"
              onClick={() => scrollToOffersSection()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-4 text-sm font-extrabold uppercase tracking-wide text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong"
            >
              <Heart className="h-4 w-4 fill-current" />
              QUERO AJUDAR COM {formatBRL(selectedAmount)}
            </button>
          </div>
        </section>
      </main>

      {/* 19. Rodapé Oficial */}
      <footer className="border-t border-border bg-surface-alt px-4 pb-28 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <img
            src="/images/logo.png"
            alt="Logo Abrigo Viva Patas"
            className="mx-auto mb-3 h-14 w-14 rounded-full object-cover shadow-sm"
          />
          <p className="text-sm font-extrabold text-foreground">ABRIGO VIVA PATAS</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Cuidado, proteção e novas oportunidades para animais que precisam de uma segunda chance.
          </p>

          <p className="mt-5 rounded-xl border border-brand/30 bg-brand-soft/50 p-3 text-[11px] leading-relaxed text-accent-foreground">
            🔒 Este é o canal oficial de apoio aos animais acolhidos do Abrigo Viva Patas. Sua doação
            via PIX é processada com segurança e destinada diretamente aos cuidados do abrigo.
          </p>

          <p className="mt-5 text-[10px] text-muted-foreground/80">
            © Abrigo Viva Patas · Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* 20. Barra Fixa no Rodapé para Conversão Fácil */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-cream/95 px-4 py-2.5 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-foreground">
              Apoie o Abrigo Viva Patas
            </p>
            <p className="text-[10px] text-muted-foreground">
              Valor selecionado: <strong className="text-brand">{formatBRL(selectedAmount)}</strong>
            </p>
          </div>
          <button
            id="bottom-bar-donate-btn"
            type="button"
            onClick={() => scrollToOffersSection()}
            className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-brand-foreground transition-colors hover:bg-brand-strong"
          >
            DOAR {formatBRL(selectedAmount)}
          </button>
        </div>
      </div>

      {/* Modal de Detalhes do Animal */}
      {selectedAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="rounded bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {selectedAnimal.tag}
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-foreground">
                  História de {selectedAnimal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnimal(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <img
                src={selectedAnimal.imageUrl}
                alt={selectedAnimal.name}
                className={`max-h-60 w-full rounded-xl object-cover ${selectedAnimal.imagePosition || 'object-center'}`}
              />
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                  Status: {selectedAnimal.status}
                </span>
              </div>
              
              <div className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">
                  {selectedAnimal.description}
                </p>
                {selectedAnimal.fullStory && (
                  <p className="border-t border-border/60 pt-2.5">
                    {selectedAnimal.fullStory}
                  </p>
                )}
                {selectedAnimal.rescueDetails && (
                  <div className="rounded-xl border border-border/80 bg-surface-cream/70 p-3 text-[11px]">
                    <strong className="text-foreground">Cuidados atuais: </strong>
                    {selectedAnimal.rescueDetails}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                id="animal-modal-help-btn"
                onClick={() => {
                  setSelectedAnimal(null);
                  scrollToOffersSection();
                }}
                className="flex-1 rounded-xl bg-brand py-3 text-xs font-bold uppercase tracking-wide text-brand-foreground hover:bg-brand-strong"
              >
                Ajudar com Doação
              </button>
              <button
                type="button"
                onClick={() => setSelectedAnimal(null)}
                className="rounded-xl border border-border px-4 py-3 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
