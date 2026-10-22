import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { palette, styles } from '../theme/appStyles';
import type { Property } from '../types/property';

export default function PropertyRow({property,onPress,money}:{property:Property;onPress:()=>void;money:(n:number)=>string}) {
  const active = property.status === 'Aktif';
  return <Pressable onPress={onPress} style={styles.propertyCard}><View style={[styles.propertyThumb,{overflow:'hidden'}]}>{property.coverPhotoUrl ? <Image source={{uri:property.coverPhotoUrl}} style={{width:'100%',height:'100%',position:'absolute'}} resizeMode="cover"/> : <Ionicons name="home-outline" size={36} color={palette.navy2}/>}</View><View style={styles.propertyInfo}><View style={styles.propertyTitleLine}><Text numberOfLines={1} style={styles.propertyTitle}>{property.title}</Text><View style={[styles.miniStatus,active?styles.activeStatus:styles.optionStatus]}><Text style={[styles.miniStatusText,{color:active?palette.green:palette.amber}]}>{property.status}</Text></View></View><Text numberOfLines={1} style={styles.propertyAddress}><Ionicons name="location-outline" size={12}/> {property.address}</Text><Text style={styles.propertyPrice}>{money(property.price)}{property.kind==='Kiralık'?<Text style={styles.rentSuffix}> / ay</Text>:null}</Text><Text style={styles.propertyMeta}>{property.rooms}  ·  {property.area}  ·  {property.kind}</Text></View><Ionicons name="chevron-forward" size={17} color={palette.muted}/></Pressable>;
}
