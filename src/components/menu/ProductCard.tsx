import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { menuColors, menuRadius, menuSpacing, menuTypography } from '../../constants/menuTheme';
import { MenuItem } from '../../types/menu';

type Props = {
  item: MenuItem;
  onPress: () => void;
  onToggleAvailability: () => void; // <-- Propiedad añadida
};

export default function ProductCard({ item, onPress, onToggleAvailability }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.imageWrap}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.emoji}>{item.emoji}</Text>
        )}
        <View style={styles.priceSticker}>
          <Text style={styles.priceText}>${item.price}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: menuColors.surface,
    borderRadius: menuRadius.lg,
    padding: menuSpacing.sm,
    margin: menuSpacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imageWrap: {
    position: 'relative',
    borderRadius: menuRadius.md,
    overflow: 'hidden',
    aspectRatio: 1,
    marginBottom: menuSpacing.sm,
    backgroundColor: menuColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 56,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  priceSticker: {
    position: 'absolute',
    bottom: menuSpacing.sm,
    right: menuSpacing.sm,
    backgroundColor: menuColors.price,
    borderRadius: menuRadius.pill,
    paddingHorizontal: menuSpacing.sm,
    paddingVertical: 4,
  },
  priceText: {
    ...menuTypography.price,
    color: '#fff',
  },
  name: {
    ...menuTypography.subtitle,
    color: menuColors.textPrimary,
    marginBottom: 2,
  },
  description: {
    ...menuTypography.body,
    fontSize: 12,
    color: menuColors.textSecondary,
  },
});