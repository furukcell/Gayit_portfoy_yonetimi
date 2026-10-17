export type PropertyStatus = 'Aktif' | 'Opsiyonlu' | 'Satıldı' | 'Kiralandı';

export type Property = {
  id: string;
  title: string;
  location: string;
  price: number;
  rooms: string;
  area: number;
  type: 'Satılık' | 'Kiralık';
  status: PropertyStatus;
  accent: string;
  initials: string;
};

export const sampleProperties: Property[] = [
  {
    id: 'GY-1024',
    title: 'Modern Aile Dairesi',
    location: 'Muğla · Milas · İsmetpaşa',
    price: 4250000,
    rooms: '3+1',
    area: 145,
    type: 'Satılık',
    status: 'Aktif',
    accent: '#DCE8E8',
    initials: 'DA',
  },
  {
    id: 'GY-1023',
    title: 'Bahçeli Müstakil Villa',
    location: 'Muğla · Bodrum · Konacık',
    price: 125000,
    rooms: '4+1',
    area: 220,
    type: 'Kiralık',
    status: 'Opsiyonlu',
    accent: '#E8E0D5',
    initials: 'BV',
  },
  {
    id: 'GY-1022',
    title: 'Merkezi Konumda 2+1',
    location: 'Muğla · Milas · Güllük',
    price: 3150000,
    rooms: '2+1',
    area: 105,
    type: 'Satılık',
    status: 'Aktif',
    accent: '#DDE4F0',
    initials: '2+1',
  },
];

export const formatPrice = (price: number, type: Property['type']) => {
  const formatted = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(price);
  return type === 'Kiralık' ? `₺${formatted}/ay` : `₺${formatted}`;
};