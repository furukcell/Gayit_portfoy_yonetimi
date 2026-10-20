import React from 'react';
import { Modal, SafeAreaView, View, Pressable, ScrollView, Text, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, styles } from '../theme/appStyles';

type Props = { notificationsOpen: any; setNotificationsOpen: any; notificationsLoading: any; notifications: any; markNotificationRead: any };

export default function NotificationsModal(props: Props) {
  const { notificationsOpen, setNotificationsOpen, notificationsLoading, notifications, markNotificationRead } = props;
  return (
          <Modal visible={notificationsOpen} animationType="slide" statusBarTranslucent={false} onRequestClose={()=>setNotificationsOpen(false)}>
            <SafeAreaView style={[styles.modalSafe, { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }]}>
              <View style={[styles.modalHeader, { minHeight: 56, paddingTop: 8, paddingBottom: 8, alignItems: 'center' }]}><Pressable onPress={()=>setNotificationsOpen(false)} hitSlop={12} style={[styles.roundButton, { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="close" size={22} color={palette.navy}/></Pressable><Text style={styles.modalHeaderTitle}>Bildirim merkezi</Text><View style={{width:44,height:44}}/></View>
              <ScrollView contentContainerStyle={styles.formPage}>
                <Text style={styles.pageTitle}>Bildirimler</Text><Text style={styles.pageSub}>Eşleşme ve operasyon bildirimlerini buradan takip et.</Text>
                {notificationsLoading && <Text style={styles.pageSub}>Bildirimler yükleniyor…</Text>}
                {!notificationsLoading && notifications.map((n: any)=><Pressable key={n.id} onPress={()=>!n.read_at&&markNotificationRead(n.id)} style={[styles.matchCard,!n.read_at&&{borderColor:palette.gold, borderWidth:1}]}><View style={{flex:1}}><Text style={styles.teamName}>{n.title}</Text><Text style={styles.teamRole}>{n.body || 'Bildirim ayrıntısı yok.'}</Text><Text style={styles.teamMeta}>{new Date(n.created_at).toLocaleString('tr-TR')}{n.read_at?' · Okundu':' · Okunmadı'}</Text></View>{!n.read_at&&<Ionicons name="ellipse" size={10} color={palette.gold}/>}</Pressable>)}
                {!notificationsLoading && !notifications.length && <View style={styles.empty}><Ionicons name="notifications-outline" size={30} color={palette.muted}/><Text style={styles.sectionTitle}>Henüz bildirim yok</Text><Text style={styles.pageSub}>Yeni eşleşmeler oluştuğunda bildirimler burada görünür.</Text></View>}
              </ScrollView>
            </SafeAreaView>
          </Modal>
  );
}
