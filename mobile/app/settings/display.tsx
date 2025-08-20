import React, { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { SettingsItem, SettingsSection, SelectionModal, SettingsLayout } from '@/components/settings';
import { useSettingsStore } from '@/domains/settings/stores/settingsStore';
import { changeLanguage, useSettingsI18n } from '@/lib/i18n';

interface SelectionState {
  type: 'theme' | 'language' | 'units' | 'nutrition' | 'fontSize' | null;
  visible: boolean;
}

export default function DisplaySettings() {
  const { display, updateDisplay, isLoading } = useSettingsStore();
  const [selection, setSelection] = useState<SelectionState>({ type: null, visible: false });
  const settings = useSettingsI18n();

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
        // Also update i18n language
        await changeLanguage(value);
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
    { value: 'light', label: settings.display.theme.light, description: settings.display.theme.lightDesc },
    { value: 'dark', label: settings.display.theme.dark, description: settings.display.theme.darkDesc },
    { value: 'system', label: settings.display.theme.system, description: settings.display.theme.systemDesc },
  ];

  const languageOptions = [
    { value: 'en', label: 'English', description: 'English (United States)' },
    { value: 'ko', label: '한국어', description: 'Korean (South Korea)' },
  ];

  const unitsOptions = [
    { value: 'metric', label: settings.display.units.metric, description: settings.display.units.metricDesc },
    { value: 'imperial', label: settings.display.units.imperial, description: settings.display.units.imperialDesc },
  ];

  const nutritionOptions = [
    { value: 'detailed', label: settings.display.nutrition.detailed, description: settings.display.nutrition.detailedDesc },
    { value: 'simple', label: settings.display.nutrition.simple, description: settings.display.nutrition.simpleDesc },
  ];

  const fontSizeOptions = [
    { value: 'small', label: settings.display.fontSize.small, description: settings.display.fontSize.smallDesc },
    { value: 'medium', label: settings.display.fontSize.medium, description: settings.display.fontSize.mediumDesc },
    { value: 'large', label: settings.display.fontSize.large, description: settings.display.fontSize.largeDesc },
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
      case 'language': return settings.display.language.select;
      case 'units': return settings.display.units.select;
      case 'nutrition': return settings.display.nutrition.select;
      case 'fontSize': return settings.display.fontSize.select;
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
    <SettingsLayout title={settings.display.title}>
        <SettingsSection
          title={settings.display.appearance.title}
          footer={settings.display.appearance.description}
          variant="grouped"
        >
          <SettingsItem
            title={settings.display.theme.title}
            description={settings.display.theme.description}
            icon="color-palette-outline"
            type="select"
            value={getDisplayValue('theme')}
            onPress={() => openSelection('theme')}
            disabled={isLoading}
            variant="grouped"
          />
          
          <SettingsItem
            title={settings.display.fontSize.title}
            description={settings.display.fontSize.description}
            icon="text-outline"
            type="select"
            value={getDisplayValue('fontSize')}
            onPress={() => openSelection('fontSize')}
            disabled={isLoading}
            variant="grouped"
          />
        </SettingsSection>

        <SettingsSection
          title={settings.display.languageRegion.title}
          footer={settings.display.languageRegion.description}
          variant="grouped"
        >
          <SettingsItem
            title={settings.language.title}
            description={settings.language.description}
            icon="language-outline"
            type="select"
            value={getDisplayValue('language')}
            onPress={() => openSelection('language')}
            disabled={isLoading}
            variant="grouped"
          />
          
          <SettingsItem
            title={settings.display.units.title}
            description={settings.display.units.description}
            icon="calculator-outline"
            type="select"
            value={getDisplayValue('measurementUnits')}
            onPress={() => openSelection('units')}
            disabled={isLoading}
            variant="grouped"
          />
        </SettingsSection>

        <SettingsSection
          title={settings.display.content.title}
          footer={settings.display.content.description}
          variant="grouped"
        >
          <SettingsItem
            title={settings.display.nutrition.title}
            description={settings.display.nutrition.description}
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