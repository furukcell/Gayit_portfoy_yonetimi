import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ImageBackground, Text, View } from 'react-native';
import { styles } from '../theme/appStyles';

function AnimatedSplash() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.timing(spin, {
      toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [spin]);
  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <ImageBackground source={require('./assets/images/splash.png')} resizeMode="cover" style={styles.splashScreen}>
      <View style={styles.splashLoading}>
        <Animated.View style={[styles.splashSpinner, { transform: [{ rotate: rotation }] }]} />
        <Text style={styles.splashLoadingText}>YÜKLENİYOR</Text>
      </View>
    </ImageBackground>
  );
}
