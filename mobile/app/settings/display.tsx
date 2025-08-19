import React, { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { SettingsItem, SettingsSection, SelectionModal, SettingsLayout } from '@/components/settings';
import { useSettingsStore } from '@/domains/settings/stores/settingsStore';

interface SelectionState {
  type: 'theme' | 'language' | 'units' | 'nutrition' | 'fontSize' | null;
  visible: boolean;
}

export default function DisplaySettings() {
  const { display, updateDisplay, isLoading } = useSettingsStore();
  const [selection, setSelection] = useState<SelectionState>({ type: null, visible: false });

  const openSelection = (type: SelectionState['type']) => {
    setSelection({ type, visible: true });
  };

  const closeSelection = () => {
    setSelection({ type: null, visible: false });
  };

  const handleSelectionChange = async (value: any) => {
    if (!selection.type) return;

    const updates: any = {};
    
    switch (selection.type) {
      case 'theme': 
        updates.theme = value;
        break;
      case 'language': 
        updates.language = value;
        break;
      case 'units': 
        updates.measurementUnits = value;
        break;
      case 'nutrition': 
        updates.nutritionDisplay = value;
        break;
      case 'fontSize': 
        updates.fontSize = value;
        break;
    }
    
    await updateDisplay(updates);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', description: 'Always use light theme' },
    { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
    { value: 'system', label: 'System', description: 'Follow device theme setting' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English', description: 'English (United States)' },
    { value: 'ko', label: '한국어', description: 'Korean (South Korea)' },
  ];

  const unitsOptions = [
    { value: 'metric', label: 'Metric', description: 'Kilograms, grams, celsius' },
    { value: 'imperial', label: 'Imperial', description: 'Pounds, ounces, fahrenheit' },
  ];

  const nutritionOptions = [
    { value: 'detailed', label: 'Detailed', description: 'Show all nutrition information' },
    { value: 'simple', label: 'Simple', description: 'Show only calories and macros' },
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small', description: 'Smaller text for more content' },
    { value: 'medium', label: 'Medium', description: 'Standard text size' },
    { value: 'large', label: 'Large', description: 'Larger text for better readability' },
  ];

  const getSelectionOptions = () => {
    switch (selection.type) {
      case 'theme': return themeOptions;
      case 'language': return languageOptions;
      case 'units': return unitsOptions;
      case 'nutrition': return nutritionOptions;
      case 'fontSize': return fontSizeOptions;
      default: return [];
    }
  };

  const getSelectionTitle = () => {
    switch (selection.type) {
      case 'theme': return 'Choose Theme';
      case 'language': return 'Choose Language';
      case 'units': return 'Measurement Units';
      case 'nutrition': return 'Nutrition Display';
      case 'fontSize': return 'Font Size';
      default: return '';
    }
  };

  const getCurrentValue = () => {
    if (!selection.type) return null;
    
    switch (selection.type) {
      case 'theme': return display.theme;
      case 'language': return display.language;
      case 'units': return display.measurementUnits;
      case 'nutrition': return display.nutritionDisplay;
      case 'fontSize': return display.fontSize;
      default: return null;
    }
  };

  const getDisplayValue = (key: keyof typeof display) => {
    const value = display[key];
    switch (key) {
      case 'theme':
        return themeOptions.find(opt => opt.value === value)?.label || value;
      case 'language':
        return languageOptions.find(opt => opt.value === value)?.label || value;
      case 'measurementUnits':
        return unitsOptions.find(opt => opt.value === value)?.label || value;
      case 'nutritionDisplay':
        return nutritionOptions.find(opt => opt.value === value)?.label || value;
      case 'fontSize':
        return fontSizeOptions.find(opt => opt.value === value)?.label || value;
      default:
        return value;
    }
  };

  return (
    <SettingsLayout title="Display & Appearance">
        <SettingsSection
          title="Appearance"
          footer="Choose how the app looks and feels"
          variant="grouped"
        >
          <SettingsItem
            title="Theme"
            description="App appearance"
            icon="color-palette-outline"
            type="select"
            value={getDisplayValue('theme')}
            onPress={() => openSelection('theme')}
            disabled={isLoading}
            variant="grouped"
          />
          
          <SettingsItem
            title="Font Size"
            description="Text size throughout the app"
            icon="text-outline"
            type="select"
            value={getDisplayValue('fontSize')}
            onPress={() => openSelection('fontSize')}
            disabled={isLoading}
            variant="grouped"
          />
        </SettingsSection>

        <SettingsSection
          title="Language & Region"
          footer="Language and regional settings"
          variant="grouped"
        >
          <SettingsItem
            title="Language"
            description="App language"
            icon="language-outline"
            type="select"
            value={getDisplayValue('language')}
            onPress={() => openSelection('language')}
            disabled={isLoading}
            variant="grouped"
          />
          
          <SettingsItem
            title="Measurement Units"
            description="Units for weight, temperature, etc."
            icon="calculator-outline"
            type="select"
            value={getDisplayValue('measurementUnits')}
            onPress={() => openSelection('units')}
            disabled={isLoading}
            variant="grouped"
          />
        </SettingsSection>

        <SettingsSection
          title="Content Display"
          footer="Customize how information is presented"
          variant="grouped"
        >
          <SettingsItem
            title="Nutrition Display"
            description="Detail level for nutrition information"
            icon="nutrition-outline"
            type="select"
            value={getDisplayValue('nutritionDisplay')}
            onPress={() => openSelection('nutrition')}
            disabled={isLoading}
            variant="grouped"
          />
        </SettingsSection>

      <SelectionModal
        visible={selection.visible}
        title={getSelectionTitle()}
        options={getSelectionOptions()}
        selectedValue={getCurrentValue()}
        onSelect={handleSelectionChange}
        onClose={closeSelection}
      />
    </SettingsLayout>
  );
}