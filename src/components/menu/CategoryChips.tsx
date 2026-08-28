import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { MenuCategory } from '../../types/menu';
import { menuColors, menuRadius, menuSpacing, menuTypography } from '../../constants/menuTheme';

type Props = {
  categories: MenuCategory[];
  selectedId: string | 'all';
  onSelect: (id: string | 'all') => void;
};

export default function CategoryChips({ categories, selectedId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Chip label="Todos" emoji="🍽️" active={selectedId === 'all'} onPress={() => onSelect('all')} />
      {categories.map((cat) => (
        <Chip
          key={cat.id}
          label={cat.label}
          emoji={cat.emoji}
          active={selectedId === cat.id}
          onPress={() => onSelect(cat.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  emoji,
  active,
  onPress,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: menuSpacing.lg,
    paddingVertical: menuSpacing.md,
    gap: menuSpacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: menuColors.surface,
    borderWidth: 1,
    borderColor: menuColors.border,
    borderRadius: menuRadius.pill,
    paddingVertical: menuSpacing.sm,
    paddingHorizontal: menuSpacing.md,
    marginRight: menuSpacing.sm,
  },
  chipActive: {
    backgroundColor: menuColors.accent,
    borderColor: menuColors.accent,
  },
  chipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  chipLabel: {
    ...menuTypography.subtitle,
    color: menuColors.textPrimary,
  },
  chipLabelActive: {
    color: menuColors.surface,
  },
});