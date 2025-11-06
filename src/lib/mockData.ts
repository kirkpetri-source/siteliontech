export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  brand: string;
  inStock: boolean;
  description: string;
  specs?: string[];
  badge?: "new" | "promo" | null;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  category: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  image?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "SSD Kingston NV2 500GB",
    category: "Armazenamento",
    price: 289.90,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=300&fit=crop",
    brand: "Kingston",
    inStock: true,
    description: "SSD M.2 NVMe de alta velocidade para upgrades",
    specs: ["500GB", "M.2 NVMe", "3500MB/s leitura"],
    badge: "promo",
  },
  {
    id: "2",
    name: "Memória RAM 8GB DDR4",
    category: "Memória",
    price: 149.90,
    image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=300&fit=crop",
    brand: "Kingston",
    inStock: true,
    description: "Memória DDR4 3200MHz para notebooks e desktops",
    specs: ["8GB", "DDR4", "3200MHz"],
  },
  {
    id: "3",
    name: "Mouse Gamer RGB",
    category: "Periféricos",
    price: 129.90,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop",
    brand: "Logitech",
    inStock: true,
    description: "Mouse gamer com iluminação RGB e 6 botões programáveis",
    specs: ["RGB", "6400 DPI", "6 botões"],
    badge: "new",
  },
  {
    id: "4",
    name: "Teclado Mecânico RGB",
    category: "Periféricos",
    price: 349.90,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop",
    brand: "Redragon",
    inStock: true,
    description: "Teclado mecânico com switches blue e RGB customizável",
    specs: ["Switch Blue", "RGB", "ABNT2"],
  },
  {
    id: "5",
    name: "Webcam Full HD 1080p",
    category: "Periféricos",
    price: 249.90,
    image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
    brand: "Logitech",
    inStock: true,
    description: "Webcam profissional para reuniões e streaming",
    specs: ["1080p", "60fps", "Microfone integrado"],
  },
  {
    id: "6",
    name: "HD Externo 1TB",
    category: "Armazenamento",
    price: 329.90,
    image: "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=300&fit=crop",
    brand: "Seagate",
    inStock: true,
    description: "HD externo portátil USB 3.0 para backup",
    specs: ["1TB", "USB 3.0", "Portátil"],
  },
  {
    id: "7",
    name: "Fonte 600W 80 Plus",
    category: "Componentes",
    price: 299.90,
    image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&h=300&fit=crop",
    brand: "Corsair",
    inStock: false,
    description: "Fonte de alimentação modular certificada 80 Plus",
    specs: ["600W", "80 Plus Bronze", "Modular"],
  },
  {
    id: "8",
    name: "Cooler RGB 120mm",
    category: "Componentes",
    price: 89.90,
    image: "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=400&h=300&fit=crop",
    brand: "Cooler Master",
    inStock: true,
    description: "Cooler para gabinete com iluminação RGB",
    specs: ["120mm", "RGB", "Silencioso"],
    badge: "new",
  },
  {
    id: "9",
    name: "Monitor 24\" Full HD",
    category: "Monitores",
    price: 699.90,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop",
    brand: "LG",
    inStock: true,
    description: "Monitor LED 24 polegadas Full HD IPS",
    specs: ["24\"", "Full HD", "IPS", "75Hz"],
  },
];

export const cases: Case[] = [
  {
    id: "1",
    title: "Upgrade de Notebook Lento",
    description: "Notebook com 5 anos estava muito lento. Fizemos upgrade de SSD e RAM, deixando o equipamento até 10x mais rápido.",
    beforeImage: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=400&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop",
    category: "Upgrade",
  },
  {
    id: "2",
    title: "Recuperação de MacBook Pro",
    description: "MacBook com problema na placa lógica. Realizamos reparo profissional e o equipamento voltou a funcionar perfeitamente.",
    beforeImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=600&h=400&fit=crop",
    category: "Apple",
  },
  {
    id: "3",
    title: "Montagem de PC Gamer",
    description: "Cliente solicitou montagem de PC para jogos. Resultado: setup completo com RGB e alta performance.",
    beforeImage: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&h=400&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1587202372583-49330a15584d?w=600&h=400&fit=crop",
    category: "Montagem",
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Carlos Silva",
    role: "Empresário",
    content: "Excelente atendimento! Meu notebook estava muito lento e eles fizeram um upgrade de SSD que deixou ele voando. Recomendo!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    name: "Maria Santos",
    role: "Designer",
    content: "Precisava urgente do meu MacBook e eles resolveram em 2 dias! Profissionais competentes e honestos. Voltarei sempre!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    name: "João Oliveira",
    role: "Contador",
    content: "Montaram meu PC gamer com muito capricho. Ficou lindo e roda todos os jogos perfeitamente. Valeu cada centavo!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    name: "Ana Paula",
    role: "Professora",
    content: "Atendimento impecável! Explicaram tudo detalhadamente e o preço foi justo. Meu computador está novo!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
];

export const categories = [
  "Todos",
  "Armazenamento",
  "Memória",
  "Periféricos",
  "Componentes",
  "Monitores",
];

export const brands = ["Todos", "Kingston", "Logitech", "Redragon", "Seagate", "Corsair", "Cooler Master", "LG"];
