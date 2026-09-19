import { ChevronRight, ShieldCheck, HeartHandshake } from 'lucide-react';

interface PresellPageProps {
  onNavigateToCampaign: () => void;
}

export function PresellPage({ onNavigateToCampaign }: PresellPageProps) {
  return (
    <div id="presell-view" className="flex min-h-screen flex-col bg-surface-cream font-sans">
      {/* Header simples estilo portal editorial */}
      <header className="border-b border-border/80 bg-card">
        <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="Logo Abrigo Viva Patas"
              className="h-6 w-6 rounded-full object-cover shadow-xs"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Abrigo Viva Patas
            </span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Acolhimento Animal
          </span>
        </div>
      </header>

      {/* Artigo simples, direto e limpo - igual antes */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          {/* Categoria / Data */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-bold uppercase tracking-wider text-brand">Resgate & Acolhimento</span>
            <span>•</span>
            <span>Abrigo Viva Patas</span>
          </div>

          {/* Título Principal */}
          <h1 className="mt-2.5 text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
            Ela foi encontrada sem conseguir andar, debilitada e com sede. Hoje recebe acolhimento no Abrigo Viva Patas.
          </h1>

          {/* Subtítulo */}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            O caso da Pretinha mobilizou cuidados urgentes. Mas a realidade é que muitos outros animais acolhidos pelo abrigo também dependem de alimentação diária, medicamentos e acompanhamento contínuo para se recuperarem.
          </p>

          {/* Foto Principal */}
          <div className="my-5 overflow-hidden rounded-xl border border-border bg-muted">
            <img
              src="/images/pretinha-real.png"
              alt="Pretinha acolhida e recebendo cuidados no abrigo"
              loading="eager"
              className="w-full object-cover sm:max-h-[380px]"
            />
            <p className="border-t border-border bg-surface-alt p-2.5 text-[11px] leading-relaxed text-muted-foreground">
              Pretinha acolhida após o resgate — Foto: Arquivo do Abrigo Viva Patas
            </p>
          </div>

          {/* Texto do Artigo */}
          <div className="space-y-3.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            <p>
              Quando um animal ferido é resgatado das ruas, tirá-lo do perigo é apenas o primeiro passo. A verdadeira batalha começa nos dias seguintes: consultas, exames clínicos, curativos, medicações para dor e uma alimentação balanceada para recuperar as forças.
            </p>

            <p>
              No <strong className="text-foreground">Abrigo Viva Patas</strong>, dezenas de cães e gatos que passaram por situações de abandono encontram um lar temporário seguro e todo o suporte necessário para recomeçar.
            </p>

            <p>
              Manter essa rotina exige esforço diário e recursos constantes para ração, produtos de higiene e cuidados veterinários. É uma corrente de solidariedade mantida por pessoas que se importam com a vida de cada um desses animais.
            </p>
          </div>

          {/* Box de Ação Direta */}
          <div className="mt-6 rounded-xl border border-brand/30 bg-brand-soft/30 p-4 text-center sm:p-5">
            <p className="text-xs font-bold text-foreground sm:text-sm">
              Conheça o trabalho completo do Abrigo Viva Patas e veja como você pode ajudar
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Sua contribuição com qualquer valor faz a diferença na alimentação e no tratamento dos animais.
            </p>

            <button
              id="presell-continue-btn"
              type="button"
              onClick={onNavigateToCampaign}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-xs font-extrabold uppercase tracking-wide text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong sm:text-sm"
            >
              Continuar e Conhecer o Abrigo
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              <span>Apoio direto via PIX · Seguro e transparente</span>
            </div>
          </div>
        </article>
      </main>

      {/* Footer simples */}
      <footer className="border-t border-border bg-card px-4 py-5 text-center text-[11px] text-muted-foreground">
        <p className="font-semibold text-foreground">Abrigo Viva Patas</p>
        <p className="mt-0.5">Cuidado, proteção e acolhimento aos animais resgatados.</p>
      </footer>
    </div>
  );
}
