export interface Seller {
  name: string;
  avatarUrl?: string;
  rating: number;
}

// Vendedor provisional del chat de demostración, hasta conectar las publicaciones al backend.
export const DEMO_SELLER: Seller = { name: 'Alex Silva', rating: 4.8 };

export interface Product {
  id: string;
  title: string;
  price: string;
  location: string;
  time: string;
  images: string[];
  condition?: string;
  brand?: string;
  color?: string;
  details?: string[];
  seller?: Seller;
}

// Datos Mock de Productos Cercanos
export const NEARBY_PRODUCTS: Product[] = [
  {
    id: 'p1',
    brand: 'Volkswagen',
    title: 'Volkswagen Gol Trend 1.6 MSI',
    price: '$ 8.500.000',
    location: 'Pilar Centro',
    time: 'Hace 15 min',
    images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&q=80'],
  },
  {
    id: 'p2',
    color: 'Grafito',
    details: ['128GB'],
    title: 'iPhone 13 Pro 128GB Grafito',
    price: '$ 680.000',
    location: 'Pilar, Km 50',
    time: 'Hace 1 hora',
    images: ['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&q=80'],
  },
  {
    id: 'p3',
    details: ['Rodado 29'],
    title: 'Bicicleta Rodado 29 Mountain Bike',
    price: '$ 240.000',
    location: 'Del Viso, Pilar',
    time: 'Hace 3 horas',
    images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&q=80'],
  },
];

// Datos Mock de Productos Recientes
export const RECENT_PRODUCTS: Product[] = [
  {
    id: 'r1',
    brand: 'PlayStation',
    details: ['2 joysticks'],
    title: 'PlayStation 5 con 2 Joysticks',
    price: '$ 750.000',
    location: 'Pilar Point',
    time: 'Hace 20 min',
    images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80'],
  },
  {
    id: 'r2',
    details: ['2 ambientes', 'Balcón'],
    title: 'Departamento 2 Ambientes c/ Balcón',
    price: 'USD 65.000',
    location: 'Pilar Casas',
    time: 'Hace 45 min',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80'],
  },
  {
    id: 'r3',
    brand: 'Samsung',
    details: ['50"', '4K', 'UHD'],
    title: 'Smart TV 50" 4K UHD Samsung',
    price: '$ 490.000',
    location: 'Pilar Centro',
    time: 'Hace 2 horas',
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80'],
  },
  {
    id: 'r4',
    details: ['Cuero', 'L'],
    title: 'Campera de Cuero Hombre Talle L',
    price: '$ 85.000',
    location: 'Manuel Alberti',
    time: 'Hace 5 horas',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80'],
  },
];

export const PRODUCTS = [...NEARBY_PRODUCTS, ...RECENT_PRODUCTS];
