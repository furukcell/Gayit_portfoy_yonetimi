import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { PropertiesScreen } from './src/screens/PropertiesScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BottomNavigation, TabKey } from './src/components/BottomNavigation';
import { colors } from './src/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'properties':
        return <PropertiesScreen />;
      case 'customers':
        return <CustomersScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen onOpenProperties={() => setActiveTab('properties')} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.content}>{renderScreen()}</View>
        <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});