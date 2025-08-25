import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as Haptics from 'expo-haptics';

interface SelectionOption {
  value: any;
  label: string;
  description?: string;
}

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: SelectionOption[];
  selectedValue: any;
  onSelect: (value: any) => void;
  onClose: () => void;
}

export function SelectionModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SelectionModalProps) {
  const { theme } = useTheme();

  const handleSelect = (value: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptics feedback failed:', error);
    }
    
    onSelect(value);
    onClose();
  };

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptics feedback failed:', error);
    }
    
    onClose();
  };

  const renderOption = (option: SelectionOption) => {
    const isSelected = option.value === selectedValue;
    
    return (
      <Card key={option.value} style={styles.optionCard}>
        <TouchableOpacity
          style={styles.optionContent}
          onPress={() => handleSelect(option.value)}
          activeOpacity={0.7}
        >
          <View style={styles.optionLeft}>
            <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
              {option.label}
            </Text>
            {option.description && (
              <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                {option.description}
              </Text>
            )}
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark"
              size={20}
              color={theme.colors.primary}
            />
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleClose}
          >
            <Ionicons
              name="close"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          {options.map(renderOption)}
        </View>
        
        <View style={styles.footer}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={handleClose}
            fullWidth
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  optionCard: {
    marginBottom: 8,
    padding: 0,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 56,
  },
  optionLeft: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingTop: 8,
  },
});