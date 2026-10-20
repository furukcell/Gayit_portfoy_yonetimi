import React from 'react';
import { Image } from 'react-native';

type Props = { size?: number; style?: any };

export default function BrandMark({ size = 24, style }: Props) {
  return (
    <Image
      source={require('../../assets/images/icon.png')}
      resizeMode="contain"
      accessibilityLabel="GAYIT Portföy Yönetimi logosu"
      style={[{ width: size, height: size, borderRadius: Math.max(4, Math.round(size * 0.18)) }, style]}
    />
  );
}
