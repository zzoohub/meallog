import React, { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { SettingsItem, SettingsSection, SelectionModal, SettingsLayout } from '@/domains/settings/components';
import { useSettingsStore } from '@/domains/settings/stores/settingsStore';
import { useSettingsI18n } from '@/lib/i18n';

interface SelectionState {
  type: 'frequency' | null;
  visible: boolean;
}

export default function NotificationSettings() {
  const { notifications, updateNotifications } = useSettingsStore();
  const [selection, setSelection] = useState<SelectionState>({ type: null, visible: false });
  const settings = useSettingsI18n();

  const openSelection = (type: SelectionState['type']) => {
    setSelection({ type, visible: true });
  };

  const closeSelection = () => {
    setSelection({ type: null, visible: false });
  };

  const handleToggleChange = async (key: string, value: boolean) => {
    const updates: any = {};
    if (key === 'quietHours') {
      updates.quietHours = { ...notifications.quietHours, enabled: value };
    } else {
      updates[key] = value;
    }
    await updateNotifications(updates);
  };

  const handleSelectionChange = async (value: any) => {
    if (!selection.type) return;
    const updates: any = {};
    updates[selection.type] = value;
    await updateNotifications(updates);
  };

  const frequencyOptions = [
    { value: 'immediate', label: 'Immediate', description: 'Get notified right away' },
    { value: 'daily', label: 'Daily Digest', description: 'Once per day summary' },
    { value: 'weekly', label: 'Weekly Summary', description: 'Weekly progress summary' },
  ];

  const getFrequencyLabel = () => {
    return frequencyOptions.find(opt => opt.value === notifications.frequency)?.label || notifications.frequency;
  };

  return (
    <SettingsLayout title={settings.notifications.title}>
        <SettingsSection
          title={settings.notifications.title}
          footer={settings.notifications.description}
        >
          <SettingsItem
            title="Meal Reminders"
            description="Remind me to log my meals"
            icon="restaurant-outline"
            type="toggle"
            value={notifications.mealReminders}
            onValueChange={(value) => handleToggleChange('mealReminders', value)}
          />
          
          <SettingsItem
            title="Social Notifications"
            description="Comments, likes, and follows"
            icon="people-outline"
            type="toggle"
            value={notifications.socialNotifications}
            onValueChange={(value) => handleToggleChange('socialNotifications', value)}
          />
          
          <SettingsItem
            title="Progress Updates"
            description="Weekly progress and achievements"
            icon="trophy-outline"
            type="toggle"
            value={notifications.progressUpdates}
            onValueChange={(value) => handleToggleChange('progressUpdates', value)}
          />
          
          <SettingsItem
            title="AI Insights"
            description="Personalized nutrition insights"
            icon="bulb-outline"
            type="toggle"
            value={notifications.aiInsights}
            onValueChange={(value) => handleToggleChange('aiInsights', value)}
          />
        </SettingsSection>

        <SettingsSection
          title="Timing"
          footer="Control when and how often you receive notifications"
        >
          <SettingsItem
            title="Quiet Hours"
            description={`${notifications.quietHours.start} - ${notifications.quietHours.end}`}
            icon="moon-outline"
            type="toggle"
            value={notifications.quietHours.enabled}
            onValueChange={(value) => handleToggleChange('quietHours', value)}
          />
          
          <SettingsItem
            title="Frequency"
            description="How often to receive notifications"
            icon="time-outline"
            type="select"
            value={getFrequencyLabel()}
            onPress={() => openSelection('frequency')}
          />
        </SettingsSection>

        <SettingsSection
          title="Advanced"
          footer="Additional notification settings"
        >
          <SettingsItem
            title="Test Notification"
            description="Send a test notification"
            icon="send-outline"
            type="navigation"
            onPress={() => {
              // TODO: Send test notification
              console.log('Send test notification');
            }}
          />
        </SettingsSection>
      <SelectionModal
        visible={selection.visible}
        title="Notification Frequency"
        options={frequencyOptions}
        selectedValue={notifications.frequency}
        onSelect={handleSelectionChange}
        onClose={closeSelection}
      />
    </SettingsLayout>
  );
}