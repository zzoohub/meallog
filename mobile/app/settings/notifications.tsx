import React, { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { SettingsItem, SettingsSection, SelectionModal, SettingsLayout } from '@/components/settings';
import { useSettingsStore } from '@/domains/settings/stores/settingsStore';

interface SelectionState {
  type: 'frequency' | null;
  visible: boolean;
}

export default function NotificationSettings() {
  const { notifications, updateNotifications } = useSettingsStore();
  const [selection, setSelection] = useState<SelectionState>({ type: null, visible: false });

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
    { value: 'immediate', label: 'Immediate', description: 'Get notifications right away' },
    { value: 'daily', label: 'Daily Digest', description: 'One summary per day' },
    { value: 'weekly', label: 'Weekly Summary', description: 'One summary per week' },
  ];

  const getFrequencyLabel = () => {
    return frequencyOptions.find(opt => opt.value === notifications.frequency)?.label || notifications.frequency;
  };

  return (
    <SettingsLayout title="Notifications">
        <SettingsSection
          title="Notification Types"
          footer="Choose which notifications you want to receive"
        >
          <SettingsItem
            title="Meal Reminders"
            description="Reminders to log your meals"
            icon="restaurant-outline"
            type="toggle"
            value={notifications.mealReminders}
            onValueChange={(value) => handleToggleChange('mealReminders', value)}
          />
          
          <SettingsItem
            title="Social Notifications"
            description="Likes, follows, and comments"
            icon="people-outline"
            type="toggle"
            value={notifications.socialNotifications}
            onValueChange={(value) => handleToggleChange('socialNotifications', value)}
          />
          
          <SettingsItem
            title="Progress Updates"
            description="Goal achievements and milestones"
            icon="trophy-outline"
            type="toggle"
            value={notifications.progressUpdates}
            onValueChange={(value) => handleToggleChange('progressUpdates', value)}
          />
          
          <SettingsItem
            title="AI Insights"
            description="Personalized recommendations and tips"
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
            title="Notification Frequency"
            description="How often to group notifications"
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