import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useTheme } from '@/lib/theme';
import { SettingsItem, SettingsSection, SettingsLayout } from '@/components/settings';
import { useSettingsStore } from '@/domains/settings/stores/settingsStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DataManagementSettings() {
  const { exportUserData, resetToDefaults, isLoading } = useSettingsStore();
  const [storageInfo, setStorageInfo] = useState<{
    photos: number;
    meals: number;
    settings: number;
  } | null>(null);

  React.useEffect(() => {
    calculateStorageUsage();
  }, []);

  const calculateStorageUsage = async () => {
    try {
      // This is a mock calculation - in a real app, you'd calculate actual storage usage
      setStorageInfo({
        photos: 245, // MB
        meals: 12,   // MB
        settings: 1, // MB
      });
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }
  };

  const handleExportData = async () => {
    try {
      Alert.alert(
        'Export Data',
        'This will create a file containing all your food log data, photos, and settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: async () => {
              try {
                const data = await exportUserData();
                Alert.alert(
                  'Export Complete',
                  'Your data has been exported successfully. In a production app, this would be saved to your device or shared via email.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('Export Failed', 'Failed to export your data. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export your data. Please try again.');
    }
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'This feature would allow you to import data from other food tracking apps or a previous export.',
      [{ text: 'OK' }]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and cached data. Your meals and photos will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              // Clear various cache items
              await AsyncStorage.multiRemove([
                'temp_photos',
                'api_cache',
                'image_cache',
              ]);
              
              Alert.alert('Success', 'Cache cleared successfully');
              await calculateStorageUsage();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          }
        }
      ]
    );
  };

  const handleResetSettings = async () => {
    Alert.alert(
      'Reset All Settings',
      'This will reset all your preferences to default values. Your meals and photos will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetToDefaults();
              Alert.alert('Success', 'Settings have been reset to default values');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete ALL your data including photos, meals, settings, and account information. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Warning',
              'Are you absolutely sure? This will delete everything and cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // In a real app, this would delete all user data
                      await AsyncStorage.clear();
                      Alert.alert(
                        'Data Deleted',
                        'All data has been deleted. The app will now restart.',
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete data');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const getTotalStorage = () => {
    if (!storageInfo) return 0;
    return storageInfo.photos + storageInfo.meals + storageInfo.settings;
  };

  return (
    <SettingsLayout title="Data Management">
        <SettingsSection
          title="Storage Usage"
          footer={`Total storage used: ${getTotalStorage()} MB`}
        >
          <SettingsItem
            title="Photos"
            description="Food photos and images"
            icon="image-outline"
            type="info"
            value={storageInfo ? `${storageInfo.photos} MB` : 'Calculating...'}
          />
          
          <SettingsItem
            title="Meal Data"
            description="Food logs and nutrition data"
            icon="restaurant-outline"
            type="info"
            value={storageInfo ? `${storageInfo.meals} MB` : 'Calculating...'}
          />
          
          <SettingsItem
            title="Settings & Cache"
            description="App settings and temporary files"
            icon="cog-outline"
            type="info"
            value={storageInfo ? `${storageInfo.settings} MB` : 'Calculating...'}
          />
        </SettingsSection>

        <SettingsSection
          title="Data Export & Import"
          footer="Export your data for backup or transfer to another device"
        >
          <SettingsItem
            title="Export All Data"
            description="Create a backup of all your data"
            icon="download-outline"
            type="navigation"
            onPress={handleExportData}
            disabled={isLoading}
          />
          
          <SettingsItem
            title="Import Data"
            description="Import data from another device or app"
            icon="cloud-upload-outline"
            type="navigation"
            onPress={handleImportData}
            disabled={isLoading}
          />
        </SettingsSection>

        <SettingsSection
          title="Data Cleanup"
          footer="Free up storage space by removing temporary files"
        >
          <SettingsItem
            title="Clear Cache"
            description="Remove temporary files and cached data"
            icon="refresh-outline"
            type="navigation"
            onPress={handleClearCache}
            disabled={isLoading}
          />
          
          <SettingsItem
            title="Reset Settings"
            description="Reset all preferences to defaults"
            icon="refresh-circle-outline"
            type="navigation"
            onPress={handleResetSettings}
            disabled={isLoading}
          />
        </SettingsSection>

        <SettingsSection
          title="Danger Zone"
          footer="These actions cannot be undone"
        >
          <SettingsItem
            title="Delete All Data"
            description="Permanently delete everything"
            icon="trash-outline"
            type="navigation"
            onPress={handleDeleteAllData}
            disabled={isLoading}
          />
        </SettingsSection>

        <SettingsSection
          title="Data Policy"
          footer="Learn about how your data is handled"
        >
          <SettingsItem
            title="Privacy Policy"
            description="How we protect your data"
            icon="document-text-outline"
            type="navigation"
            onPress={() => {
              Alert.alert('Privacy Policy', 'This would open the privacy policy document.');
            }}
          />
          
          <SettingsItem
            title="Data Retention"
            description="How long we keep your data"
            icon="time-outline"
            type="navigation"
            onPress={() => {
              Alert.alert('Data Retention', 'Learn about our data retention policies.');
            }}
          />
        </SettingsSection>
    </SettingsLayout>
  );
}