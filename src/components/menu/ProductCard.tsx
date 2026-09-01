import { Pressable, StyleSheet, Text, View } from 'react-native';
import { menuColors, menuRadius, menuSpacing, menuTypography } from '../../constants/menuTheme';
import { MenuItem } from '../../types/menu';

type Props = {
  item: MenuItem;
  onPress: () => void;
  onToggleAvailability: () => void;
};

export default function ProductCard({ 
  item,
  onPress,
  onToggleAvailability
}: Props) {
  return (
      <View style={styles.card}>
    
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.productContent,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.imageWrap}>
        <Text style={styles.emoji}>{item.emoji}</Text>

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

    {/* BOTÓN DE DISPONIBILIDAD */}
    <Pressable
      style={[
        styles.availabilityButton,
        !item.available && styles.unavailableButton,
      ]}
      onPress={onToggleAvailability}
    >
      <Text style={styles.availabilityText}>
        {item.available ? 'Disponible' : 'No disponible'}
      </Text>
    </Pressable>

  </View>
    
    
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
  availabilityButton: {
  marginTop: menuSpacing.sm,
  paddingVertical: 8,
  borderRadius: menuRadius.md,
  alignItems: 'center',
  backgroundColor: '#4CAF50',
},

unavailableButton: {
  backgroundColor: '#E53935',
},

availabilityText: {
  color: '#FFFFFF',
  fontWeight: 'bold',
  fontSize: 12,
},
productContent: {
  flex: 1,
},
});