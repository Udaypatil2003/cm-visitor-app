import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');
type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const arrowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer loop on the loader pill
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Arrow bounce loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: -6, duration: 500, useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0,  duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Navigate after 2.5s — no auth check here, kept simple
    const timer = setTimeout(() => navigation.replace('Login'), 2500);
    return () => clearTimeout(timer);
  }, []);

  const loaderOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View style={styles.container}>
      {/* Background decorative blobs */}
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

      {/* Top lotus icon */}
      <View style={styles.topIcon}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconEmoji}>🪷</Text>
        </View>
      </View>

      {/* CM Photo */}
      <View style={styles.photoRingOuter}>
        <View style={styles.photoRingInner}>
          {/* Replace uri with your actual CM photo asset */}
          <Image
            source={{ uri: 'https://via.placeholder.com/200x200/c8a96e/ffffff?text=CM' }}
            style={styles.photo}
          />
        </View>
        {/* Small badge bottom-right of photo */}
        <View style={styles.photoCornerBadge}>
          <Text style={{ fontSize: 14 }}>🪷</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Book Darshan</Text>
        <Text style={styles.subtitle}>Hon. Minister's Bungalow</Text>

        {/* Divider with lotus */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLotus}>🪷</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.govText}>GOVERNMENT OF MAHARASHTRA</Text>
      </View>

      {/* Loader pill */}
      <Animated.View style={[styles.loaderPill, { opacity: loaderOpacity }]}>
        <Text style={styles.loaderText}>INITIALIZING SECURE PORTAL</Text>
      </Animated.View>

      {/* Swipe up hint */}
      <Animated.View style={[styles.swipeHint, { transform: [{ translateY: arrowAnim }] }]}>
        <Text style={styles.swipeArrow}>∧</Text>
        <Text style={styles.swipeText}>SWIPE UP TO BEGIN</Text>
      </Animated.View>
    </View>
  );
}

const GOLD   = '#E8A020';
const CREAM  = '#FAF8F3';
const NAVY   = '#1A2B5E';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
    alignItems: 'center',
    paddingTop: 60,
  },
  blobTopLeft: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F5E6C8',
    opacity: 0.6,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: 60,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EDE8F0',
    opacity: 0.5,
  },
  topIcon: {
    marginBottom: Spacing.lg,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  photoRingOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  photoRingInner: {
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoCornerBadge: {
    position: 'absolute',
    bottom: 8,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: NAVY,
    opacity: 0.7,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  dividerLine: {
    width: 60,
    height: 1,
    backgroundColor: GOLD,
    opacity: 0.5,
  },
  dividerLotus: {
    fontSize: 18,
  },
  govText: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#888',
    fontWeight: '500',
  },
  loaderPill: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: Spacing.lg,
  },
  loaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
    letterSpacing: 1.5,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  swipeArrow: {
    fontSize: 16,
    color: GOLD,
    fontWeight: '700',
  },
  swipeText: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#999',
    fontWeight: '600',
    marginTop: 2,
  },
});