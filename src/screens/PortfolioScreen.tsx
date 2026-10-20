import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { palette, styles } from '../theme/appStyles';
import PropertyRow from '../components/PropertyRow';
import BrandMark from '../components/BrandMark';

export default function PortfolioScreen(props: any) {
  const { styles, palette, role, portfolioPresentationMode, setPortfolioPresentationMode, setSelectedPresentationIds, selectedPresentationIds, setAddOpen, search, setSearch, quickTypeFilter, quickCityFilter, quickDistrictFilter, setQuickDropdown, quickDropdown, properties, setQuickTypeFilter, setQuickCityFilter, setQuickDistrictFilter, filter, setFilter, sortBy, setSortBy, recentOnly, setRecentOnly, favoritesOnly, setFavoritesOnly, minPriceFilter, setMinPriceFilter, maxPriceFilter, setMaxPriceFilter, statusFilter, setStatusFilter, showArchived, setShowArchived, createMultiPropertyPdf, propertiesLoading, visibleProperties, money, openProperty, toggleFavorite, favoriteIds } = props;
  const cityOptions: string[] = Array.from(new Set<string>(
    properties
      .map((p: any) => String(p.address || '').split(',').map((part: string) => part.trim()).filter(Boolean).slice(-1)[0] || '')
      .filter((value: string) => value.length > 0)
  )).sort((a: string, b: string) => a.localeCompare(b, 'tr'));
  const districtOptions: string[] = Array.from(new Set<string>(
    properties
      .map((p: any) => String(p.district || String(p.address || '').split(',').map((part: string) => part.trim()).filter(Boolean).slice(-2)[0] || ''))
      .filter((value: string) => value.length > 0)
  )).sort((a: string, b: string) => a.localeCompare(b, 'tr'));
  const quickFilterOptions: string[] = ['Tümü', ...(quickDropdown === 'type' ? ['Daire', 'Villa', 'Arsa', 'İş yeri', 'Müstakil ev', 'Diğer'] : quickDropdown === 'city' ? cityOptions : districtOptions)];
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);
  const [draftType, setDraftType] = React.useState(quickTypeFilter);
  const [draftCity, setDraftCity] = React.useState(quickCityFilter);
  const [draftDistrict, setDraftDistrict] = React.useState(quickDistrictFilter);
  const [draftFilter, setDraftFilter] = React.useState(filter);
  const [draftSortBy, setDraftSortBy] = React.useState(sortBy);
  const [draftRecentOnly, setDraftRecentOnly] = React.useState(recentOnly);
  const [draftFavoritesOnly, setDraftFavoritesOnly] = React.useState(favoritesOnly);
  const [draftMinPrice, setDraftMinPrice] = React.useState(minPriceFilter);
  const [draftMaxPrice, setDraftMaxPrice] = React.useState(maxPriceFilter);
  const [draftStatus, setDraftStatus] = React.useState(statusFilter);
  const [draftArchived, setDraftArchived] = React.useState(showArchived);
  const openFilters = () => {
    setDraftType(quickTypeFilter); setDraftCity(quickCityFilter); setDraftDistrict(quickDistrictFilter);
    setDraftFilter(filter); setDraftSortBy(sortBy); setDraftRecentOnly(recentOnly);
    setDraftFavoritesOnly(favoritesOnly); setDraftMinPrice(minPriceFilter); setDraftMaxPrice(maxPriceFilter);
    setDraftStatus(statusFilter); setDraftArchived(showArchived); setFilterModalVisible(true);
  };
  const activeFilterCount = [
    quickTypeFilter !== 'Tümü', quickCityFilter !== 'Tümü', quickDistrictFilter !== 'Tümü',
    filter !== 'Tümü', sortBy !== 'newest', recentOnly, favoritesOnly,
    Boolean(minPriceFilter), Boolean(maxPriceFilter), statusFilter !== 'Tümü', showArchived
  ].filter(Boolean).length;
  const chipStyle = (active: boolean) => ({paddingVertical:9,paddingHorizontal:12,borderRadius:10,borderWidth:1,borderColor:active?palette.green:palette.line,backgroundColor:active?palette.goldSoft:palette.white,marginRight:7,marginBottom:7});
  const chipText = (active: boolean) => ({fontSize:13,fontWeight:active?'700' as const:'500' as const,color:active?palette.green:palette.ink});
  if (!props.visible) return null;
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
              <View style={{flexDirection:'row',alignItems:'center',gap:7}}><BrandMark size={20}/><Text style={styles.eyebrow}>GAYIT · PORTFÖY</Text></View><View style={styles.titleRow}><View><Text style={styles.pageTitle}>Portföyler</Text><Text style={styles.pageSub}>{role === 'owner' ? 'Ofisteki tüm gayrimenkuller' : 'Sana ait gayrimenkuller'}</Text></View><View style={{flexDirection:'row',gap:8}}><Pressable onPress={()=>{setPortfolioPresentationMode((v: boolean)=>!v);setSelectedPresentationIds([]);}} style={[styles.addButton,{backgroundColor:portfolioPresentationMode?palette.green:palette.navy2}]}><Ionicons name="documents-outline" size={22} color="#fff"/></Pressable><Pressable onPress={()=>setAddOpen(true)} style={styles.addButton}><Ionicons name="add" size={25} color="#fff"/></Pressable></View></View>
              <View style={styles.search}><Ionicons name="search-outline" size={19} color={palette.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="İlan, adres veya kod ara" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
              <Pressable onPress={openFilters} style={{marginTop:12,marginBottom:10,minHeight:46,borderRadius:12,borderWidth:1,borderColor:activeFilterCount?palette.green:palette.line,backgroundColor:palette.white,paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:9}}><Ionicons name="options-outline" size={20} color={palette.green}/><Text style={{fontSize:14,fontWeight:'700',color:palette.ink}}>Filtrele ve sırala</Text>{activeFilterCount>0&&<View style={{backgroundColor:palette.green,borderRadius:12,minWidth:22,height:22,alignItems:'center',justifyContent:'center',paddingHorizontal:6}}><Text style={{fontSize:12,fontWeight:'700',color:'#fff'}}>{activeFilterCount}</Text></View>}</View>
                <Ionicons name="chevron-forward" size={18} color={palette.muted}/>
              </Pressable>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{alignItems:'center',paddingBottom:4}}>
                {[
                  ...(quickTypeFilter!=='Tümü'?[quickTypeFilter]:[]), ...(quickCityFilter!=='Tümü'?[quickCityFilter]:[]),
                  ...(quickDistrictFilter!=='Tümü'?[quickDistrictFilter]:[]), ...(filter!=='Tümü'?[filter]:[]),
                  ...(statusFilter!=='Tümü'?[statusFilter]:[]), ...(minPriceFilter?['Min ₺']:[]), ...(maxPriceFilter?['Maks ₺']:[]),
                  ...(recentOnly?['Son görüntülenenler']:[]), ...(favoritesOnly?['Favoriler']:[]), ...(showArchived?['Arşiv']:[])
                ].map((label:string,index:number)=><View key={label+index} style={{paddingVertical:6,paddingHorizontal:10,borderRadius:16,backgroundColor:palette.goldSoft,marginRight:6}}><Text style={{fontSize:11,color:palette.green,fontWeight:'600'}}>{label}</Text></View>)}
                {activeFilterCount>0&&<Pressable onPress={()=>{setQuickTypeFilter('Tümü');setQuickCityFilter('Tümü');setQuickDistrictFilter('Tümü');setFilter('Tümü');setSortBy('newest');setRecentOnly(false);setFavoritesOnly(false);setMinPriceFilter('');setMaxPriceFilter('');setStatusFilter('Tümü');setShowArchived(false);}}><Text style={{fontSize:12,color:palette.green,fontWeight:'700'}}>Temizle</Text></Pressable>}
              </ScrollView>
              <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={()=>setFilterModalVisible(false)}>
                <View style={{flex:1,backgroundColor:'rgba(10,22,36,0.48)',justifyContent:'flex-end'}}>
                  <View style={{backgroundColor:palette.white,borderTopLeftRadius:24,borderTopRightRadius:24,maxHeight:'92%',paddingTop:18,paddingHorizontal:18,paddingBottom:24}}>
                    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><View><Text style={{fontSize:20,fontWeight:'800',color:palette.navy}}>Filtrele ve sırala</Text><Text style={{fontSize:12,color:palette.muted,marginTop:3}}>Birden fazla seçenek belirleyebilirsin</Text></View><Pressable onPress={()=>setFilterModalVisible(false)} hitSlop={12} style={{padding:6}}><Ionicons name="close" size={24} color={palette.ink}/></Pressable></View>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                      <Text style={{fontSize:13,fontWeight:'700',color:palette.ink,marginBottom:8}}>Gayrimenkul tipi</Text>
                      <View style={{flexDirection:'row',flexWrap:'wrap'}}>{['Tümü','Daire','Villa','Arsa','İş yeri','Müstakil ev','Diğer'].map(v=><Pressable key={v} onPress={()=>setDraftType(v)} style={chipStyle(draftType===v)}><Text style={chipText(draftType===v)}>{v}</Text></Pressable>)}</View>
                      <Text style={{fontSize:13,fontWeight:'700',color:palette.ink,marginTop:8,marginBottom:8}}>Şehir</Text>
                      <View style={{flexDirection:'row',flexWrap:'wrap'}}>{['Tümü',...cityOptions].map(v=><Pressable key={v} onPress={()=>{setDraftCity(v);if(v==='Tümü')setDraftDistrict('Tümü')}} style={chipStyle(draftCity===v)}><Text style={chipText(draftCity===v)}>{v}</Text></Pressable>)}</View>
                      <Text style={{fontSize:13,fontWeight:'700',color:palette.ink,marginTop:8,marginBottom:8}}>Mahalle / ilçe</Text>
                      <View style={{flexDirection:'row',flexWrap:'wrap'}}>{['Tümü',...districtOptions].map(v=><Pressable key={v} onPress={()=>setDraftDistrict(v)} style={chipStyle(draftDistrict===v)}><Text style={chipText(draftDistrict===v)}>{v}</Text></Pressable>)}</View>
                      <Text style={{fontSize:13,fontWeight:'700',color:palette.ink,marginTop:8,marginBottom:8}}>İlan türü</Text>
                      <View style={{flexDirection:'row',flexWrap:'wrap'}}>{['Tümü','Satılık','Kiralık'].map(v=><Pressable key={v} onPress={()=>setDraftFilter(v)} style={chipStyle(draftFilter===v)}><Text style={chipText(draftFilter===v)}>{v}</Text></Pressable>)}</View>
                      <Text style={{fontSize:13,fontWeight:'700',color:palette.ink,marginTop:8,marginBottom:8}}>Fiyat aralığı (₺)</Text>
                      <View style={{flexDirection:'row',gap:10}}><View style={[styles.search,{flex:1,marginTop:0}]}><TextInput value={draftMinPrice} onChangeText={setDraftMinPrice} keyboardType="numeric" placeholder="En düşük" placeholderTextColor={palette.muted} style={styles.searchInput}/></View><View style={[styles.search,{flex:1,marginTop:0}]}><TextInput value={draftMaxPrice} onChangeText={setDraftMaxPrice} keyboardType="numeric" placeholder="En yüksek" placeholderTextColor={palette.muted} style={styles.searchInput}/></View></View>
                      <Text style={{fontSize:13,fontWeight:'700',color:palette.ink,marginTop:14,marginBottom:8}}>İlan durumu</Text>
                      <View style={{flexDirection:'row',flexWrap:'wrap'}}>{['Tümü','Aktif','Opsiyonlu','Satıldı','Kiralandı'].map(v=><Pressable key={v} onPress={()=>setDraftStatus(v)} style={chipStyle(draftStatus===v)}><Text style={chipText(draftStatus===v)}>{v}</Text></Pressable>)}</View>
                      <Text style={{fontSize:13,fontWeight:'700',color:palette.ink,marginTop:8,marginBottom:8}}>Sıralama</Text>
                      <View style={{flexDirection:'row',flexWrap:'wrap'}}>{[{key:'newest',label:'En yeni'},{key:'priceAsc',label:'Fiyat ↑'},{key:'priceDesc',label:'Fiyat ↓'}].map(v=><Pressable key={v.key} onPress={()=>setDraftSortBy(v.key)} style={chipStyle(draftSortBy===v.key)}><Text style={chipText(draftSortBy===v.key)}>{v.label}</Text></Pressable>)}</View>
                      <Text style={{fontSize:13,fontWeight:'700',color:palette.ink,marginTop:8,marginBottom:8}}>Ek filtreler</Text>
                      <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                        <Pressable onPress={()=>{setDraftRecentOnly(!draftRecentOnly);if(!draftRecentOnly)setDraftFavoritesOnly(false)}} style={chipStyle(draftRecentOnly)}><Text style={chipText(draftRecentOnly)}>◷ Son görüntülenenler</Text></Pressable>
                        <Pressable onPress={()=>{setDraftFavoritesOnly(!draftFavoritesOnly);if(!draftFavoritesOnly)setDraftRecentOnly(false)}} style={chipStyle(draftFavoritesOnly)}><Text style={chipText(draftFavoritesOnly)}>♡ Yalnızca favorilerim</Text></Pressable>
                        <Pressable onPress={()=>setDraftArchived(!draftArchived)} style={chipStyle(draftArchived)}><Text style={chipText(draftArchived)}>Arşivlenmiş portföyler</Text></Pressable>
                      </View>
                    </ScrollView>
                    <View style={{flexDirection:'row',gap:10,paddingTop:12,borderTopWidth:1,borderTopColor:palette.line,marginTop:8}}>
                      <Pressable onPress={()=>{setDraftType('Tümü');setDraftCity('Tümü');setDraftDistrict('Tümü');setDraftFilter('Tümü');setDraftSortBy('newest');setDraftRecentOnly(false);setDraftFavoritesOnly(false);setDraftMinPrice('');setDraftMaxPrice('');setDraftStatus('Tümü');setDraftArchived(false)}} style={{flex:1,minHeight:48,borderRadius:12,borderWidth:1,borderColor:palette.line,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:14,fontWeight:'700',color:palette.ink}}>Temizle</Text></Pressable>
                      <Pressable onPress={()=>{setQuickTypeFilter(draftType);setQuickCityFilter(draftCity);setQuickDistrictFilter(draftDistrict);setFilter(draftFilter);setSortBy(draftSortBy);setRecentOnly(draftRecentOnly);setFavoritesOnly(draftFavoritesOnly);setMinPriceFilter(draftMinPrice);setMaxPriceFilter(draftMaxPrice);setStatusFilter(draftStatus);setShowArchived(draftArchived);setFilterModalVisible(false)}} style={{flex:2,minHeight:48,borderRadius:12,backgroundColor:palette.green,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:14,fontWeight:'800',color:'#fff'}}>Sonuçları göster</Text></Pressable>
                    </View>
                  </View>
                </View>
              </Modal>
              {portfolioPresentationMode && <View style={{backgroundColor:palette.goldSoft,borderRadius:14,padding:13,marginBottom:12}}><Text style={styles.teamName}>Müşteriye özel sunum</Text><Text style={styles.pageSub}>Listeden en az 2 portföy seç. Seçilen ilanlar tek PDF dosyasında, her biri ayrı sayfada hazırlanır.</Text><Text style={[styles.teamRole,{marginTop:6}]}>{selectedPresentationIds.length} portföy seçildi</Text><Pressable disabled={selectedPresentationIds.length<2} onPress={createMultiPropertyPdf} style={[styles.saveButton,{marginTop:10,opacity:selectedPresentationIds.length<2?0.45:1}]}><Text style={styles.saveButtonText}>Tek PDF oluştur ve paylaş</Text><Ionicons name="share-outline" size={19} color="#fff"/></Pressable></View>}<Text style={styles.resultCount}>{propertiesLoading ? 'Portföyler yükleniyor…' : `${visibleProperties.length} portföy`}</Text>
    
              {visibleProperties.map((p: any)=><View key={p.id} style={{flexDirection:'row',alignItems:'center',gap:4}}>{portfolioPresentationMode&&<Pressable onPress={()=>setSelectedPresentationIds((ids: string[])=>ids.includes(p.id)?ids.filter((id: string)=>id!==p.id):[...ids,p.id])} style={{width:38,height:48,alignItems:'center',justifyContent:'center',marginBottom:11}}><Ionicons name={selectedPresentationIds.includes(p.id)?'checkbox':'square-outline'} size={24} color={selectedPresentationIds.includes(p.id)?palette.green:palette.muted}/></Pressable>}<View style={{flex:1}}><PropertyRow property={p} money={money} onPress={()=>portfolioPresentationMode?setSelectedPresentationIds((ids: string[])=>ids.includes(p.id)?ids.filter((id: string)=>id!==p.id):[...ids,p.id]):openProperty(p)} /></View>{!portfolioPresentationMode&&<Pressable onPress={()=>toggleFavorite(p)} accessibilityLabel={favoriteIds.includes(p.id)?'Favorilerden çıkar':'Favorilere ekle'} style={{width:40,height:48,alignItems:'center',justifyContent:'center',backgroundColor:palette.white,borderRadius:12,borderWidth:1,borderColor:palette.line,marginBottom:11}}><Ionicons name={favoriteIds.includes(p.id)?'heart':'heart-outline'} size={20} color={favoriteIds.includes(p.id)?palette.red:palette.muted}/></Pressable>}</View>)}
              {!visibleProperties.length && <View style={styles.empty}><Ionicons name="file-tray-outline" size={32} color={palette.muted}/><Text style={styles.sectionTitle}>Portföy bulunamadı</Text><Text style={styles.pageSub}>Aramanı değiştir veya yeni ilan ekle.</Text></View>}
            </ScrollView>
  );
}
