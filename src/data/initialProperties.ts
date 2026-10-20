import type { Property } from '../types/property';

export const initialProperties: Property[] = [
  { id: 'GY-1024', title: 'Modern Aile Dairesi', address: 'İsmetpaşa Mahallesi, Milas, Muğla', district: 'Milas', price: 4250000, rooms: '3+1', area: '145 m²', kind: 'Satılık', status: 'Aktif', agent: 'Mert Yılmaz', ownerAgentId: 'demo-agent-1', views: 0, createdAt: '12 Ekim 2026', description: 'Aydınlık salonu, kullanışlı planı ve merkezi konumuyla öne çıkan aile dairesi.' },
  { id: 'GY-1023', title: 'Bahçeli Müstakil Villa', address: 'Konacık Mahallesi, Bodrum, Muğla', district: 'Bodrum', price: 125000, rooms: '4+1', area: '220 m²', kind: 'Kiralık', status: 'Opsiyonlu', agent: 'Elif Demir', ownerAgentId: 'demo-agent-2', views: 0, createdAt: '10 Ekim 2026', description: 'Özel bahçeli, ferah yaşam alanlarına sahip müstakil villa.' },
  { id: 'GY-1022', title: 'Merkezi Konumda 2+1', address: 'Güllük Mahallesi, Milas, Muğla', district: 'Milas', price: 3150000, rooms: '2+1', area: '105 m²', kind: 'Satılık', status: 'Aktif', agent: 'Sen', ownerAgentId: 'demo-owner', views: 0, createdAt: '8 Ekim 2026', description: 'Ulaşım noktalarına yakın, bakımlı daire.' },
];
const money = (n: number) => '₺' + new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
const propertyTypeLabel = (type?: string) => ({ apartment: 'Daire', villa: 'Villa', land: 'Arsa', commercial: 'İş yeri', house: 'Müstakil ev', other: 'Diğer' } as Record<string, string>)[type || 'apartment'] || 'Daire';
const shareText = (p: Property) => `GAYIT | ${p.title}\n${p.address}\n${p.rooms} · ${p.area}\n${p.kind}: ${money(p.price)}${p.kind === 'Kiralık' ? '/ay' : ''}\n\nDetaylı bilgi için bizimle iletişime geçin.`;
const htmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
