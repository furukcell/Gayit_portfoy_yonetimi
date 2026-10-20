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
  if (!props.visible) return null;
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
              <View style={{flexDirection:'row',alignItems:'center',gap:7}}><BrandMark size={20}/><Text style={styles.eyebrow}>GAYIT · PORTFÖY</Text></View><View style={styles.titleRow}><View><Text style={styles.pageTitle}>Portföyler</Text><Text style={styles.pageSub}>{role === 'owner' ? 'Ofisteki tüm gayrimenkuller' : 'Sana ait gayrimenkuller'}</Text></View><View style={{flexDirection:'row',gap:8}}><Pressable onPress={()=>{setPortfolioPresentationMode((v: boolean)=>!v);setSelectedPresentationIds([]);}} style={[styles.addButton,{backgroundColor:portfolioPresentationMode?palette.green:palette.navy2}]}><Ionicons name="documents-outline" size={22} color="#fff"/></Pressable><Pressable onPress={()=>setAddOpen(true)} style={styles.addButton}><Ionicons name="add" size={25} color="#fff"/></Pressable></View></View>
              <View style={styles.search}><Ionicons name="search-outline" size={19} color={palette.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="İlan, adres veya kod ara" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
              <Text style={[styles.sectionTitle,{marginTop:12,marginBottom:8}]}>Hızlı ilan bul</Text>
              <View style={{flexDirection:'row',gap:8}}>
                {([{key:'type' as const,label:quickTypeFilter==='Tümü'?'Gayrimenkul tipi':quickTypeFilter},{key:'city' as const,label:quickCityFilter==='Tümü'?'Şehir':quickCityFilter},{key:'district' as const,label:quickDistrictFilter==='Tümü'?'Mahalle / ilçe':quickDistrictFilter}]).map(item=><Pressable key={item.key} onPress={()=>setQuickDropdown(item.key)} style={{flex:1,minHeight:44,paddingHorizontal:9,borderRadius:11,borderWidth:1,borderColor:palette.line,backgroundColor:palette.white,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text numberOfLines={1} style={{fontSize:12,color:palette.ink,flexShrink:1}}>{item.label}</Text><Ionicons name="chevron-down" size={16} color={palette.muted}/></Pressable>)}
              </View>
              {(quickTypeFilter!=='Tümü'||quickCityFilter!=='Tümü'||quickDistrictFilter!=='Tümü')&&<Pressable onPress={()=>{setQuickTypeFilter('Tümü');setQuickCityFilter('Tümü');setQuickDistrictFilter('Tümü');}} style={{alignSelf:'flex-start',marginTop:7,paddingVertical:4}}><Text style={{fontSize:12,color:palette.green,fontWeight:'600'}}>Hızlı filtreleri temizle</Text></Pressable>}
              <Modal visible={quickDropdown!==null} transparent animationType="fade" onRequestClose={()=>setQuickDropdown(null)}>
                <Pressable onPress={()=>setQuickDropdown(null)} style={{flex:1,backgroundColor:'rgba(10,22,36,0.45)',justifyContent:'flex-end'}}>
                  <Pressable onPress={()=>{}} style={{backgroundColor:palette.white,borderTopLeftRadius:22,borderTopRightRadius:22,padding:18,maxHeight:'72%'}}>
                    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><Text style={{fontSize:18,fontWeight:'700',color:palette.navy}}>{quickDropdown==='type'?'Gayrimenkul tipi':quickDropdown==='city'?'Şehir seç':'Mahalle / ilçe seç'}</Text><Pressable onPress={()=>setQuickDropdown(null)}><Ionicons name="close" size={23} color={palette.ink}/></Pressable></View>
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {quickFilterOptions.map((option: string)=>{
                        const active=quickDropdown==='type'?quickTypeFilter===option:quickDropdown==='city'?quickCityFilter===option:quickDistrictFilter===option;
                        return <Pressable key={String(option)} onPress={()=>{if(quickDropdown==='type')setQuickTypeFilter(String(option));else if(quickDropdown==='city'){setQuickCityFilter(String(option));setQuickDistrictFilter('Tümü');}else setQuickDistrictFilter(String(option));setQuickDropdown(null);}} style={{paddingVertical:13,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:palette.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:active?palette.goldSoft:palette.white}}><Text style={{fontSize:15,color:palette.ink}}>{option}</Text>{active&&<Ionicons name="checkmark-circle" size={19} color={palette.green}/>}</Pressable>
                      })}
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </Modal>
              <View style={styles.filters}>{(['Tümü','Satılık','Kiralık'] as const).map(f=><Pressable key={f} onPress={()=>setFilter(f)} style={[styles.filter,filter===f&&styles.filterOn]}><Text style={[styles.filterText,filter===f&&styles.filterTextOn]}>{f}</Text></Pressable>)}</View>
              <View style={[styles.filters,{marginTop:10}]}>{([{key:'newest',label:'En yeni'},{key:'priceAsc',label:'Fiyat ↑'},{key:'priceDesc',label:'Fiyat ↓'}] as const).map(opt=><Pressable key={opt.key} onPress={()=>setSortBy(opt.key)} style={[styles.filter,sortBy===opt.key&&styles.filterOn]}><Text style={[styles.filterText,sortBy===opt.key&&styles.filterTextOn]}>{opt.label}</Text></Pressable>)}</View>
              <Pressable onPress={()=>{setRecentOnly((v: boolean)=>!v);setFavoritesOnly(false);}} style={[styles.filter,{alignSelf:'flex-start',marginTop:8},recentOnly&&styles.filterOn]}><Text style={[styles.filterText,recentOnly&&styles.filterTextOn]}>{recentOnly?'Son görüntülenenler gösteriliyor':'◷ Son görüntülenenler'}</Text></Pressable>
              <Pressable onPress={()=>setFavoritesOnly((v: boolean)=>!v)} style={[styles.filter,{alignSelf:'flex-start',marginTop:8},favoritesOnly&&styles.filterOn]}><Text style={[styles.filterText,favoritesOnly&&styles.filterTextOn]}>{favoritesOnly?'♥ Favoriler gösteriliyor':'♡ Yalnızca favorilerim'}</Text></Pressable>
              <Text style={[styles.sectionTitle,{marginTop:14,marginBottom:8}]}>Fiyat aralığı</Text>
              <View style={{flexDirection:'row',gap:10}}>
                <View style={[styles.search,{flex:1,marginTop:0}]}><TextInput value={minPriceFilter} onChangeText={setMinPriceFilter} keyboardType="numeric" placeholder="En düşük ₺" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
                <View style={[styles.search,{flex:1,marginTop:0}]}><TextInput value={maxPriceFilter} onChangeText={setMaxPriceFilter} keyboardType="numeric" placeholder="En yüksek ₺" placeholderTextColor={palette.muted} style={styles.searchInput}/></View>
              </View>
              <Text style={[styles.sectionTitle,{marginTop:14,marginBottom:8}]}>İlan durumu</Text>
              <View style={styles.filters}>{(['Tümü','Aktif','Opsiyonlu','Satıldı','Kiralandı'] as const).map(status=><Pressable key={status} onPress={()=>setStatusFilter(status)} style={[styles.filter,statusFilter===status&&styles.filterOn]}><Text style={[styles.filterText,statusFilter===status&&styles.filterTextOn]}>{status}</Text></Pressable>)}</View>
              <Pressable onPress={()=>setShowArchived((v: boolean)=>!v)} style={[styles.filter,{alignSelf:'flex-start',marginTop:10},showArchived&&styles.filterOn]}><Text style={[styles.filterText,showArchived&&styles.filterTextOn]}>{showArchived ? 'Arşivden çıkış · Aktif portföyleri göster' : 'Arşivlenmiş portföyleri göster'}</Text></Pressable>
              {portfolioPresentationMode && <View style={{backgroundColor:palette.goldSoft,borderRadius:14,padding:13,marginBottom:12}}><Text style={styles.teamName}>Müşteriye özel sunum</Text><Text style={styles.pageSub}>Listeden en az 2 portföy seç. Seçilen ilanlar tek PDF dosyasında, her biri ayrı sayfada hazırlanır.</Text><Text style={[styles.teamRole,{marginTop:6}]}>{selectedPresentationIds.length} portföy seçildi</Text><Pressable disabled={selectedPresentationIds.length<2} onPress={createMultiPropertyPdf} style={[styles.saveButton,{marginTop:10,opacity:selectedPresentationIds.length<2?0.45:1}]}><Text style={styles.saveButtonText}>Tek PDF oluştur ve paylaş</Text><Ionicons name="share-outline" size={19} color="#fff"/></Pressable></View>}<Text style={styles.resultCount}>{propertiesLoading ? 'Portföyler yükleniyor…' : `${visibleProperties.length} portföy`}</Text>
    
              {visibleProperties.map((p: any)=><View key={p.id} style={{flexDirection:'row',alignItems:'center',gap:4}}>{portfolioPresentationMode&&<Pressable onPress={()=>setSelectedPresentationIds((ids: string[])=>ids.includes(p.id)?ids.filter((id: string)=>id!==p.id):[...ids,p.id])} style={{width:38,height:48,alignItems:'center',justifyContent:'center',marginBottom:11}}><Ionicons name={selectedPresentationIds.includes(p.id)?'checkbox':'square-outline'} size={24} color={selectedPresentationIds.includes(p.id)?palette.green:palette.muted}/></Pressable>}<View style={{flex:1}}><PropertyRow property={p} money={money} onPress={()=>portfolioPresentationMode?setSelectedPresentationIds((ids: string[])=>ids.includes(p.id)?ids.filter((id: string)=>id!==p.id):[...ids,p.id]):openProperty(p)} /></View>{!portfolioPresentationMode&&<Pressable onPress={()=>toggleFavorite(p)} accessibilityLabel={favoriteIds.includes(p.id)?'Favorilerden çıkar':'Favorilere ekle'} style={{width:40,height:48,alignItems:'center',justifyContent:'center',backgroundColor:palette.white,borderRadius:12,borderWidth:1,borderColor:palette.line,marginBottom:11}}><Ionicons name={favoriteIds.includes(p.id)?'heart':'heart-outline'} size={20} color={favoriteIds.includes(p.id)?palette.red:palette.muted}/></Pressable>}</View>)}
              {!visibleProperties.length && <View style={styles.empty}><Ionicons name="file-tray-outline" size={32} color={palette.muted}/><Text style={styles.sectionTitle}>Portföy bulunamadı</Text><Text style={styles.pageSub}>Aramanı değiştir veya yeni ilan ekle.</Text></View>}
            </ScrollView>
  );
}
