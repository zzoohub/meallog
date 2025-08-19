import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useTheme } from '@/lib/theme';
import { SettingsItem, SettingsSection, SelectionModal, SettingsLayout } from '@/components/settings';
import { useSettingsStore } from '@/domains/settings/stores/settingsStore';

interface SelectionState {
  type: 'profileVisibility' | 'exportFormat' | null;
  visible: boolean;
}

export default function PrivacySettings() {
  const { privacy, updatePrivacy, exportUserData, isLoading } = useSettingsStore();
  const [selection, setSelection] = useState<SelectionState>({ type: null, visible: false });

  const openSelection = (type: SelectionState['type']) => {
    setSelection({ type, visible: true });
  };

  const closeSelection = () => {
    setSelection({ type: null, visible: false });
  };

  const handleToggleChange = async (key: string, value: boolean) => {
    if (key.includes('.')) {
      const [parentKey, childKey] = key.split('.');
      const updates: any = {};
      updates[parentKey] = { ...privacy[parentKey as keyof typeof privacy], [childKey]: value };
      await updatePrivacy(updates);
    } else {
      const updates: any = {};
      updates[key] = value;
      await updatePrivacy(updates);
    }
  };

  const handleSelectionChange = async (value: any) => {
    if (!selection.type) return;

    if (selection.type === 'exportFormat') {
      const updates = {
        dataExport: { ...privacy.dataExport, format: value }
      };
      await updatePrivacy(updates);
    } else {
      const updates: any = {};
      updates[selection.type] = value;
      await updatePrivacy(updates);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData();
      Alert.alert(
        'Export Ready',
        'Your data has been prepared for export. In a real app, this would be saved to your device or sent via email.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Export Failed',
        'Failed to export your data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your data including photos, meals, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement data deletion
            console.log('Delete all user data');
          }
        }
      ]
    );
  };

  const profileVisibilityOptions = [
    { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
    { value: 'friends', label: 'Friends Only', description: 'Only approved friends can see your profile' },
    { value: 'private', label: 'Private', description: 'Only you can see your profile' },
  ];

  const exportFormatOptions = [
    { value: 'json', label: 'JSON', description: 'Machine-readable format' },
    { value: 'csv', label: 'CSV', description: 'Spreadsheet-friendly format' },
  ];

  const getVisibilityLabel = () => {
    return profileVisibilityOptions.find(opt => opt.value === privacy.profileVisibility)?.label || privacy.profileVisibility;
  };

  const getExportFormatLabel = () => {
    return exportFormatOptions.find(opt => opt.value === privacy.dataExport.format)?.label || privacy.dataExport.format;
  };

  const getCurrentValue = () => {
    if (selection.type === 'profileVisibility') {
      return privacy.profileVisibility;
    } else if (selection.type === 'exportFormat') {
      return privacy.dataExport.format;
    }
    return null;
  };

  return (
    <SettingsLayout title="Privacy & Data">
        <SettingsSection
          title="Profile Privacy"
          footer="Control who can see your profile and posts"
        >
          <SettingsItem
            title="Profile Visibility"
            description="Who can see your profile"
            icon="eye-outline"
            type="select"
            value={getVisibilityLabel()}
            onPress={() => openSelection('profileVisibility')}
            disabled={isLoading}
          />
          
          <SettingsItem
            title="Location Sharing"
            description="Include location with your posts"
            icon="location-outline"
            type="toggle"
            value={privacy.locationSharing}
            onValueChange={(value) => handleToggleChange('locationSharing', value)}
            disabled={isLoading}
          />
        </SettingsSection>

        <SettingsSection
          title="Data Collection"
          footer="Control what data we collect to improve the app"
        >
          <SettingsItem
            title="Analytics Collection"
            description="Help improve the app with usage data"
            icon="analytics-outline"
            type="toggle"
            value={privacy.analyticsCollection}
            onValueChange={(value) => handleToggleChange('analyticsCollection', value)}
            disabled={isLoading}
          />
          
          <SettingsItem
            title="Crash Reporting"
            description="Automatically send crash reports"
            icon="bug-outline"
            type="toggle"
            value={privacy.crashReporting}
            onValueChange={(value) => handleToggleChange('crashReporting', value)}
            disabled={isLoading}
          />
        </SettingsSection>

        <SettingsSection
          title="Data Export"
          footer="Export your data or configure export settings"
        >
          <SettingsItem
            title="Include Photos in Export"
            description="Include photos in data export"
            icon="image-outline"
            type="toggle"
            value={privacy.dataExport.includePhotos}
            onValueChange={(value) => handleToggleChange('dataExport.includePhotos', value)}
            disabled={isLoading}
          />
          
          <SettingsItem
            title="Include Analytics in Export"
            description="Include usage analytics in export"
            icon="bar-chart-outline"
            type="toggle"
            value={privacy.dataExport.includeAnalytics}
            onValueChange={(value) => handleToggleChange('dataExport.includeAnalytics', value)}
            disabled={isLoading}
          />
          
          <SettingsItem
            title="Export Format"
            description="Choose export file format"
            icon="document-outline"
            type="select"
            value={getExportFormatLabel()}
            onPress={() => openSelection('exportFormat')}
            disabled={isLoading}
          />
          
          <SettingsItem
            title="Export My Data"
            description="Download all your data"
            icon="download-outline"
            type="navigation"
            onPress={handleExportData}
            disabled={isLoading}
          />
        </SettingsSection>

        <SettingsSection
          title="Data Management"
          footer="Manage or delete your data"
        >
          <SettingsItem
            title="Delete All Data"
            description="Permanently delete all your data"
            icon="trash-outline"
            type="navigation"
            onPress={handleDeleteData}
            disabled={isLoading}
          />
        </SettingsSection>

      <SelectionModal
        visible={selection.visible}
        title={selection.type === 'profileVisibility' ? 'Profile Visibility' : 'Export Format'}
        options={selection.type === 'profileVisibility' ? profileVisibilityOptions : exportFormatOptions}
        selectedValue={getCurrentValue()}
        onSelect={handleSelectionChange}
        onClose={closeSelection}
      />
    </SettingsLayout>
  );
}