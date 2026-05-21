import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, FontWeights } from '../../constants/theme';

interface AvatarProps {
  uri: string | null | undefined;
  size?: number;
  name?: string;           // used for initials fallback
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({ uri, size = 48, name }) => {
  const [imgError, setImgError] = React.useState(false);
  const showImage = !!uri && !imgError;
  const initials = getInitials(name);
  const fontSize = size * 0.36;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
});