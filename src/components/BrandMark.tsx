import React from 'react';
import { Image } from 'react-native';
import { useOfficeBrand } from './OfficeBranding';

type Props = { size?: number; style?: any };

export default function BrandMark({ size = 24, style }: Props) {
  const { logoUrl } = useOfficeBrand();
  return (
    <Image
      source={logoUrl ? { uri: logoUrl } : require('../../assets/images/icon.png')}
      resizeMode="contain"
      accessibilityLabel="Ofis logosu"
      style={[{ width: size, height: size, borderRadius: Math.max(4, Math.round(size * 0.18)) }, style]}
    />
  );
}
