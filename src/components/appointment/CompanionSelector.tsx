import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CompanionsCount } from '../../types/appointment.types';
import {
  Colors,
  FontSizes,
  FontWeights,
  BorderRadius,
  Spacing,
} from '../../constants/theme';

interface CompanionSelectorProps {
  value: CompanionsCount;
  onChange: (value: CompanionsCount) => void;
}

const OPTIONS: { value: CompanionsCount; label: string; sublabel: string }[] = [
  { value: 0, label: 'Just Me', sublabel: '1 person' },
  { value: 1, label: '+1', sublabel: '2 people' },
  { value: 2, label: '+2', sublabel: '3 people' },
];

export const CompanionSelector: React.FC<CompanionSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.fieldLabel}>Number of Companions</Text>
      <View style={styles.optionsRow}>
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.75}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {opt.label}
              </Text>
              <Text
                style={[
                  styles.optionSublabel,
                  isSelected && styles.optionSublabelSelected,
                ]}
              >
                {opt.sublabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[4],
  },
  fieldLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.gray700,
    marginBottom: Spacing[2],
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.base,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 2,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionSublabel: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
  },
  optionSublabelSelected: {
    color: Colors.primary,
  },
});