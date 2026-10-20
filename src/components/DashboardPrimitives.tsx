import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { palette, styles } from '../theme/appStyles';

export function Stat({icon,label,value,note}:{icon:keyof typeof Ionicons.glyphMap;label:string;value:string;note:string}) {
  return <View style={styles.statCard}><View style={styles.statTop}><View style={styles.statIcon}><Ionicons name={icon} size={18} color={palette.navy2}/></View><Text style={styles.statNote}>{note}</Text></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

export function Feature({icon,label,value}:{icon:keyof typeof Ionicons.glyphMap;label:string;value:string}) {
  return <View style={styles.feature}><Ionicons name={icon} size={20} color={palette.gold}/><Text style={styles.featureValue}>{value}</Text><Text style={styles.featureLabel}>{label}</Text></View>;
}
