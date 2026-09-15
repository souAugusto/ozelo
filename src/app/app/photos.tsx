import { IconLock, IconUserCircle } from '@tabler/icons-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientCard } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthProvider';
import { getProgressPhotoUrl, getProgressPhotos, uploadProgressPhoto } from '@/lib/queries';
import { BorderWidth, Colors, IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import type { ProgressPhoto } from '@/types/database';

export default function PhotosScreen() {
  const { session } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const reload = useCallback(() => {
    if (!session) return;
    getProgressPhotos(session.user.id).then(async (rows) => {
      setPhotos(rows);
      const entries = await Promise.all(
        rows.map(async (row) => [row.id, await getProgressPhotoUrl(row.storage_path)] as const)
      );
      setUrls(Object.fromEntries(entries));
    }).catch(() => {});
  }, [session]);

  useFocusEffect(reload);

  async function handleAddPhoto() {
    if (!session) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      await uploadProgressPhoto(session.user.id, result.assets[0].uri, photos.length + 1);
      reload();
    } finally {
      setUploading(false);
    }
  }

  const first = photos[0];
  const last = photos[photos.length - 1];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title="Fotos de progresso" />
      <ScrollView contentContainerStyle={styles.content}>
        <GradientCard>
          <Text style={styles.gradientLabel}>Antes e agora</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              {first && urls[first.id] ? (
                <Image source={{ uri: urls[first.id] }} style={styles.compareThumb} />
              ) : (
                <View style={[styles.compareThumb, styles.placeholder]}>
                  <IconUserCircle size={28} color="rgba(255,255,255,0.6)" />
                </View>
              )}
            </View>
            <View style={styles.compareItem}>
              {last && urls[last.id] ? (
                <Image source={{ uri: urls[last.id] }} style={styles.compareThumb} />
              ) : (
                <View style={[styles.compareThumb, styles.placeholder]}>
                  <IconUserCircle size={28} color="rgba(255,255,255,0.6)" />
                </View>
              )}
            </View>
          </View>
        </GradientCard>

        <Pressable style={styles.dashedButton} onPress={handleAddPhoto} disabled={uploading}>
          <Text style={styles.dashedButtonLabel}>
            {uploading ? 'Enviando...' : '+ Adicionar foto de hoje'}
          </Text>
        </Pressable>

        <View style={styles.timelineGrid}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.timelineItem}>
              {urls[photo.id] ? (
                <Image source={{ uri: urls[photo.id] }} style={styles.timelineThumb} />
              ) : (
                <View style={[styles.timelineThumb, styles.placeholder]}>
                  <IconUserCircle size={22} color={Colors.textMuted} />
                </View>
              )}
              <Text style={styles.timelineLabel}>Sem. {photo.week_number ?? index + 1}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.privacyFooter}>
        <IconLock size={IconSize.sm} color={Colors.textMuted} strokeWidth={1.75} />
        <Text style={styles.privacyText}>Fotos visíveis só pra você, armazenadas de forma privada</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  gradientLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  compareRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  compareItem: {
    flex: 1,
  },
  compareThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
  },
  placeholder: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedButton: {
    borderWidth: BorderWidth.hairline,
    borderStyle: 'dashed',
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dashedButtonLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  timelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timelineItem: {
    width: '31%',
    gap: 4,
  },
  timelineThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
    backgroundColor: Colors.cardElevated,
  },
  timelineLabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: BorderWidth.hairline,
    borderTopColor: Colors.cardBorder,
  },
  privacyText: {
    ...Typography.caption,
    flexShrink: 1,
  },
});
