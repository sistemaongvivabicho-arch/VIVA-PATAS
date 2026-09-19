import { CauseAllocation, AnimalItem, CarouselImage, NewsArticle, AnimalStory } from './types';

export const DONATION_AMOUNTS = [
  1000,   // R$ 10
  2000,   // R$ 20
  3000,   // R$ 30
  5000,   // R$ 50
  7500,   // R$ 75
  10000,  // R$ 100 (Mais doado)
  20000,  // R$ 200
  30000,  // R$ 300
];

export const POPULAR_AMOUNT = 10000;

export const INITIAL_ANIMALS: AnimalItem[] = [
  {
    id: 'animal-pipoca',
    name: 'Pipoca',
    status: 'Em recuperação',
    description: 'Resgatada muito assustada e debilitada nas ruas. Hoje recebe alimentação balanceada, acompanhamento veterinário e carinho no abrigo.',
    imageUrl: '/images/pipoca.png',
    tag: 'Recuperação',
    fullStory: 'Pipoca foi encontrada perambulando desorientada em uma área de muito movimento, assustada, fraca e com sinais evidentes de desnutrição e abandono recente. Ao chegar ao Abrigo Viva Patas, passou por uma triagem clínica completa, banho medicamentoso e iniciou protocolo de suplementação alimentar para restabelecer sua imunidade. Aos poucos, com paciência, carinho da equipe e ração de qualidade todos os dias, ela vem recuperando a confiança, demonstrando um olhar doce e cheio de gratidão.',
    rescueDetails: 'Sob protocolo de fortalecimento nutricional, vermifugação em dia e rotina diária de cuidados no abrigo.',
  },
  {
    id: 'animal-mingau',
    name: 'Mingau',
    status: 'Em recuperação',
    description: 'Gatinho resgatado desnutrido e assustado. Recebe alimentação especial, acompanhamento veterinário e muito carinho no abrigo.',
    imageUrl: '/images/gatinho.png',
    imagePosition: 'object-center',
    tag: 'Acolhimento',
    fullStory: 'Mingau foi acolhido ainda muito vulnerável e debilitado após ser resgatado sozinho. No Abrigo Viva Patas, recebeu avaliação clínica, hidratação, protocolo de vermifugação e alimentação especial para restabelecer suas forças. Aos poucos, vem ganhando peso, segurança e recebendo todo o carinho e cuidado diário da equipe.',
    rescueDetails: 'Sob acompanhamento veterinário, protocolo nutricional para ganho de peso e rotina de cuidados no abrigo.',
  },
  {
    id: 'animal-chico',
    name: 'Chico',
    status: 'Em acolhimento',
    description: 'Gatinho resgatado desamparado que precisava de cuidados urgentes. Hoje recebe alimentação balanceada, carinho e acompanhamento diário.',
    imageUrl: '/images/gatinho-2.png',
    imagePosition: 'object-center',
    tag: 'Acolhimento',
    fullStory: 'Chico foi acolhido ainda muito vulnerável e precisando de cuidados emergenciais. No Abrigo Viva Patas, passou por triagem clínica, foi desparasitado e recebeu suporte nutricional com ração úmida de alta absorção e suplementação. Com abrigo seguro, atenção constante e dedicação da equipe, Chico vem se restabelecendo a cada dia, seguro e cheio de disposição.',
    rescueDetails: 'Suporte nutricional enriquecido, vacinação preventiva em andamento e rotina diária de cuidados no abrigo.',
  },
  {
    id: 'animal-pretinha',
    name: 'Pretinha',
    status: 'Em acompanhamento',
    description: 'Resgatada precisando de cuidados ortopédicos e atenção constante. Hoje recebe medicação e reabilitação.',
    imageUrl: '/images/pretinha-real.png',
    imagePosition: 'object-top',
    tag: 'Reabilitação',
    fullStory: 'Pretinha foi resgatada sem conseguir se locomover, desidratada e com muitas dores. No abrigo, recebeu atendimento veterinário imediato, exames de raio-x e segue em tratamento ortopédico com medicações e curativos frequentes.',
    rescueDetails: 'Tratamento com anti-inflamatórios, analgésicos e suporte diário de reabilitação.',
  },
  {
    id: 'animal-amigo-2',
    name: 'Thor',
    status: 'Em tratamento',
    description: 'Resgatado com ferimentos nas patas. Passou por exames clínicos e segue sob cuidados diários de curativos.',
    imageUrl: '/images/thor.jpg',
    imagePosition: 'object-center',
    tag: 'Tratamento',
    fullStory: 'Thor chegou ao abrigo com lesões extensas nas patas que exigiam higienização profunda e troca diária de curativos. Com os cuidados contínuos, os ferimentos estão cicatrizando bem e ele já consegue apoiar o peso sem sentir dor.',
    rescueDetails: 'Curativos diários com pomadas cicatrizantes e acompanhamento semanal.',
  },
  {
    id: 'animal-amigo-3',
    name: 'Belinha',
    status: 'Em recuperação',
    description: 'Resgatada muito frágil e assustada nas ruas. Hoje recebe alimentação balanceada, acompanhamento veterinário e muito afeto.',
    imageUrl: '/images/belinha.jpg',
    imagePosition: 'object-center',
    tag: 'Recuperação',
    fullStory: 'Belinha foi resgatada em estado de vulnerabilidade, necessitando de acolhimento urgente. Quando deu entrada no Abrigo Viva Patas, estava assustada e precisando de cuidados imediatos com hidratação, vermifugação e alimentação adequada. Dia após dia, com o carinho e paciência da equipe, ela foi se sentindo segura e hoje já interage com doçura, demonstrando uma vontade imensa de viver e ser amada.',
    rescueDetails: 'Acompanhamento nutricional balanceado, vacinação em andamento e rotina diária de acolhimento.',
  },
  {
    id: 'animal-bob',
    name: 'Bob',
    status: 'Em reabilitação',
    description: 'Resgatado em situação de abandono, magro e assustado. Hoje segue protocolo nutricional e rotina de cuidados no abrigo.',
    imageUrl: '/images/bob.png',
    imagePosition: 'object-center',
    tag: 'Reabilitação',
    fullStory: 'Bob foi resgatado vagando sozinho e bastante debilitado. No Abrigo Viva Patas, passou por avaliação veterinária completa, controle de parasitas e iniciou dieta rica em proteínas e vitaminas. Já demonstra uma melhora significativa em sua energia e alegria diária.',
    rescueDetails: 'Acompanhamento veterinário, alimentação especial e medicação profilática.',
  },
  {
    id: 'animal-caramelo',
    name: 'Caramelo',
    status: 'Em tratamento',
    description: 'Muito dócil e companheiro, resgatado precisando de acolhimento e tratamento de pele. Está evoluindo a passos largos.',
    imageUrl: '/images/caramelo.png',
    imagePosition: 'object-center',
    tag: 'Tratamento',
    fullStory: 'Caramelo foi acolhido após ser encontrado sem assistência e com dermatite severa. Graças aos banhos terapêuticos e à suplementação diária, sua pelagem está se recuperando com brilho e vitalidade. Um cãozinho extremamente carinhoso e grato por cada gesto de cuidado.',
    rescueDetails: 'Banhos medicamentosos semanais, suplementação vitamínica e monitoramento da evolução clínica.',
  },
];

export const ROUTINE_GALLERY: CarouselImage[] = [
  {
    id: 'gal-1',
    url: '/images/image-9.png',
    title: 'Alimentação e suprimentos essenciais',
    caption: 'Distribuição diária de ração, água fresca e controle rigoroso de insumos para cada animal acolhido.',
  },
  {
    id: 'gal-2',
    url: '/images/image-7.png',
    title: 'Procedimentos e curativos',
    caption: 'Acompanhamento constante para garantir que cada ferimento seja devidamente tratado.',
  },
  {
    id: 'gal-3',
    url: '/images/pretinha-real.png',
    title: 'Acolhimento e repouso',
    caption: 'Ambiente seguro e protegido para os animais descansarem durante o período de recuperação.',
  },
  {
    id: 'gal-4',
    url: '/images/image-6.png',
    title: 'Exames e diagnósticos',
    caption: 'Avaliações clínicas para investigar as causas dos sintomas e orientar o melhor cuidado.',
  },
  {
    id: 'gal-5',
    url: '/images/image-10.png',
    title: 'Rotina de convivência',
    caption: 'Momentos de cuidado, carinho e acompanhamento diário com a equipe do abrigo.',
  },
];

export const ANIMAL_STORIES: AnimalStory[] = [
  {
    id: 'hist-pretinha',
    title: 'A história da Pretinha',
    subtitle: 'Uma história de resgate e superação',
    summary: 'Acolhida após sofrer lesões graves, Pretinha encontrou no abrigo o carinho, exames clínicos e tratamentos necessários para voltar a ter dignidade.',
    imageUrl: '/images/pretinha-real.png',
    status: 'Em reabilitação',
  },
  {
    id: 'hist-novo-comeco',
    title: 'Um novo começo',
    subtitle: 'História de um animal recém-chegado',
    summary: 'Chegar ao abrigo é o primeiro passo para deixar para trás o abandono e o medo. O carinho e a rotina segura ajudam na adaptação de cada acolhido.',
    imageUrl: '/images/image-10.png',
    status: 'Acolhido recente',
  },
  {
    id: 'hist-pos-resgate',
    title: 'Depois do resgate',
    subtitle: 'Acompanhe a evolução de um animal acolhido',
    summary: 'Alimentação adequada diária, limpeza dos canis e acompanhamento veterinário transformam vidas e preparam os animais para um futuro com mais esperança.',
    imageUrl: '/images/image-7.png',
    status: 'Em acompanhamento',
  },
];

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'noticia-1',
    title: 'Cuidados diários: a importância da nutrição na recuperação de animais resgatados',
    summary: 'Conheça como a escolha da ração adequada e o controle de peso aceleram a cicatrização e fortalecem a imunidade dos animais que chegam ao abrigo.',
    category: 'CUIDADOS',
    date: '16 de Setembro',
    imageUrl: '/images/image-10.png',
    readTime: '3 min',
  },
  {
    id: 'noticia-2',
    title: 'Como funciona o acolhimento e a triagem quando um novo animal chega ao abrigo',
    summary: 'Do primeiro exame clínico à adaptação aos outros animais, entenda as etapas fundamentais para garantir a saúde e a segurança de todos.',
    category: 'ROTINA DO ABRIGO',
    date: '14 de Setembro',
    imageUrl: '/images/image-7.png',
    readTime: '4 min',
  },
  {
    id: 'noticia-3',
    title: 'Exames diagnósticos: por que a investigação clínica faz a diferença nos tratamentos',
    summary: 'Radiografias, exames de sangue e ultrassom ajudam a identificar problemas silenciosos e direcionar medicamentos com maior precisão.',
    category: 'RESGATES',
    date: '10 de Setembro',
    imageUrl: '/images/image-6.png',
    readTime: '3 min',
  },
];

export const CAUSE_ALLOCATIONS: CauseAllocation[] = [
  {
    icon: '🥣',
    cents: 2000,
    label: 'R$ 20',
    title: 'Alimentação',
    detail: 'Ração e alimentação necessária para os animais acolhidos.',
  },
  {
    icon: '💊',
    cents: 3000,
    label: 'R$ 30',
    title: 'Medicamentos',
    detail: 'Remédios e itens necessários para os tratamentos.',
  },
  {
    icon: '🩺',
    cents: 7500,
    label: 'R$ 75',
    title: 'Atendimento Veterinário',
    detail: 'Consultas, exames e procedimentos quando necessários.',
  },
  {
    icon: '🧴',
    cents: 5000,
    label: 'R$ 50',
    title: 'Higiene e Cuidados',
    detail: 'Produtos utilizados na rotina de cuidado dos animais.',
  },
  {
    icon: '🏡',
    cents: 10000,
    label: 'R$ 100',
    title: 'Estrutura',
    detail: 'Itens necessários para manter o ambiente adequado e seguro.',
  },
  {
    icon: '🐾',
    cents: 20000,
    label: 'R$ 200',
    title: 'Novos Resgates',
    detail: 'Recursos que ajudam o abrigo a continuar acolhendo animais.',
  },
];

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(cents / 100) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
