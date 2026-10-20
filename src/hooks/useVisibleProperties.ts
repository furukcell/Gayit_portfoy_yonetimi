import { useMemo } from 'react';
import type { Property } from '../types/property';

type Options = {
  properties: Property[];
  search: string;
  minPriceFilter: string;
  maxPriceFilter: string;
  statusFilter: string;
  quickTypeFilter: string;
  quickCityFilter: string;
  quickDistrictFilter: string;
  showArchived: boolean;
  filter: string;
  favoritesOnly: boolean;
  favoriteIds: string[];
  recentOnly: boolean;
  recentPropertyIds: string[];
  sortBy: string;
  propertyTypeLabel: (type: any) => string;
};

export default function useVisibleProperties(options: Options) {
  const {
    properties, search, minPriceFilter, maxPriceFilter, statusFilter, quickTypeFilter,
    quickCityFilter, quickDistrictFilter, showArchived, filter, favoritesOnly,
    favoriteIds, recentOnly, recentPropertyIds, sortBy, propertyTypeLabel,
  } = options;

  return useMemo(() => properties.filter(p => {
    const searchMatch = `${p.title} ${p.address} ${p.id}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'));
    const minPrice = minPriceFilter.trim() ? Number(minPriceFilter.replace(/[^0-9]/g, '')) : null;
    const maxPrice = maxPriceFilter.trim() ? Number(maxPriceFilter.replace(/[^0-9]/g, '')) : null;
    const statusMatch = statusFilter === 'Tümü' || p.status === statusFilter;
    const city = (p.address.split(',').map(part => part.trim()).filter(Boolean).slice(-1)[0] || '').toLocaleLowerCase('tr-TR');
    const district = (p.district || p.address.split(',').map(part => part.trim()).filter(Boolean).slice(-2)[0] || '').toLocaleLowerCase('tr-TR');
    const typeMatch = quickTypeFilter === 'Tümü' || propertyTypeLabel(p.propertyType) === quickTypeFilter;
    const cityMatch = quickCityFilter === 'Tümü' || city === quickCityFilter.toLocaleLowerCase('tr-TR');
    const districtMatch = quickDistrictFilter === 'Tümü' || district === quickDistrictFilter.toLocaleLowerCase('tr-TR');
    const minMatch = minPrice === null || p.price >= minPrice;
    const maxMatch = maxPrice === null || p.price <= maxPrice;
    return searchMatch && (showArchived ? p.status === 'Arşivde' : p.status !== 'Arşivde') && (filter === 'Tümü' || p.kind === filter) && typeMatch && cityMatch && districtMatch && statusMatch && minMatch && maxMatch && (!favoritesOnly || favoriteIds.includes(p.id)) && (!recentOnly || recentPropertyIds.includes(p.id));
  }).sort((a, b) => sortBy === 'priceAsc' ? a.price - b.price : sortBy === 'priceDesc' ? b.price - a.price : 0), [
    properties, search, minPriceFilter, maxPriceFilter, statusFilter, quickTypeFilter,
    quickCityFilter, quickDistrictFilter, showArchived, filter, favoritesOnly,
    favoriteIds, recentOnly, recentPropertyIds, sortBy, propertyTypeLabel,
  ]);
}
