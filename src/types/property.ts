export type Role = 'owner' | 'agent' | 'superadmin';
export type Tab = 'home' | 'portfolio' | 'customers' | 'matches' | 'more' | 'team' | 'stats' | 'agenda';
export type Customer = { id: string; fullName: string; phone: string; roles: string[]; assignedAgent: string; notes: string; active: boolean; requirementCount: number; nextFollowUpAt: string | null; assignedAgentId: string };
export type PropertyStatus = 'Aktif' | 'Opsiyonlu' | 'Satıldı' | 'Kiralandı' | 'Arşivde';
export type PropertyPhoto = { id: string; storagePath: string; url: string; sortOrder: number };
export type Property = {
  id: string; title: string; address: string; district: string; price: number; coverPhotoUrl?: string;
  rooms: string; area: string; propertyType?: string; kind: 'Satılık' | 'Kiralık'; status: PropertyStatus;
  agent: string; ownerAgentId: string; views: number; createdAt: string; description: string;
  bathrooms?: string; balcony?: string; parking?: string; heating?: string; cooling?: string;
  occupancyPermit?: string; elevator?: string; nearbyAmenities?: string;
  buildingAge?: string; floorNumber?: string; totalFloors?: string;
};
