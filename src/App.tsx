import { useState } from 'react';
import { CampaignPage } from './components/CampaignPage';
import { ExitIntentModal } from './components/ExitIntentModal';

export default function App() {
  const [selectedAmount, setSelectedAmount] = useState<number>(10000); // Padrão R$ 100

  const handleScrollToDonate = (cents?: number) => {
    if (cents) {
      setSelectedAmount(cents);
    }
    const section = document.getElementById('doar') || document.getElementById('secao-ofertas');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative min-h-screen bg-surface-cream font-sans">
      {/* Página Oficial da Campanha com Fluxo Pix Integrado */}
      <CampaignPage
        selectedAmount={selectedAmount}
        onSelectAmount={setSelectedAmount}
        onOpenDonationModal={handleScrollToDonate}
        onQueroAjudar={handleScrollToDonate}
      />

      {/* Modal de Retenção de Saída direcionando para o Pix */}
      <ExitIntentModal
        onOpenDonation={() => {
          handleScrollToDonate();
        }}
      />
    </div>
  );
}

