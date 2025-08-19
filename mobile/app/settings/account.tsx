import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { SettingsItem, SettingsSection, SettingsLayout } from '@/components/settings';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserStore } from '@/domains/user/stores/userStore';

export default function AccountSettings() {
  const { theme } = useTheme();
  const { user, updateUser, logout, isLoading } = useUserStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const handleSaveProfile = async () => {
    try {
      if (!editForm.username.trim() || !editForm.email.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      await updateUser({
        username: editForm.username.trim(),
        email: editForm.email.trim(),
      });

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: user?.username || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'This feature would redirect to a secure password change form.',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            console.log('Delete account');
          }
        }
      ]
    );
  };

  const renderProfileCard = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.avatarText, { color: '#fff' }]}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {user?.username || 'Not set'}
          </Text>
          <Text style={[styles.email, { color: theme.colors.textSecondary }]}>
            {user?.email || 'Not set'}
          </Text>
        </View>
        <View style={styles.profileActions}>
          {!isEditing ? (
            <Button
              title="Edit"
              icon="create-outline"
              variant="ghost"
              size="small"
              onPress={() => setIsEditing(true)}
              disabled={isLoading}
            />
          ) : (
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                variant="ghost"
                size="small"
                onPress={handleCancelEdit}
              />
              <Button
                title="Save"
                variant="primary"
                size="small"
                onPress={handleSaveProfile}
                loading={isLoading}
              />
            </View>
          )}
        </View>
      </View>

      {isEditing && (
        <View style={styles.editForm}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Username
            </Text>
            <TextInput
              style={[styles.input, { 
                borderColor: theme.colors.border, 
                backgroundColor: theme.colors.surface,
                color: theme.colors.text 
              }]}
              value={editForm.username}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, username: text }))}
              placeholder="Enter username"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Email
            </Text>
            <TextInput
              style={[styles.input, { 
                borderColor: theme.colors.border, 
                backgroundColor: theme.colors.surface,
                color: theme.colors.text 
              }]}
              value={editForm.email}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
              placeholder="Enter email"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
      )}
    </Card>
  );

  return (
    <SettingsLayout title="Account & Profile">
        <SettingsSection
          title="Profile Information"
          footer="Manage your profile details"
        >
          {renderProfileCard()}
        </SettingsSection>

        <SettingsSection
          title="Security"
          footer="Account security and authentication settings"
        >
          <SettingsItem
            title="Change Password"
            description="Update your account password"
            icon="lock-closed-outline"
            type="navigation"
            onPress={handleChangePassword}
            disabled={isLoading}
          />

          <SettingsItem
            title="Two-Factor Authentication"
            description="Add an extra layer of security"
            icon="shield-checkmark-outline"
            type="navigation"
            onPress={() => {
              Alert.alert('Coming Soon', '2FA setup will be available soon');
            }}
            disabled={isLoading}
          />

          <SettingsItem
            title="Login Sessions"
            description="View and manage your active sessions"
            icon="desktop-outline"
            type="navigation"
            onPress={() => {
              Alert.alert('Coming Soon', 'Session management will be available soon');
            }}
            disabled={isLoading}
          />
        </SettingsSection>

        <SettingsSection
          title="Account Management"
          footer="Account-related actions"
        >
          <SettingsItem
            title="Sign Out"
            description="Sign out of your account"
            icon="log-out-outline"
            type="navigation"
            onPress={handleLogout}
            disabled={isLoading}
          />

          <SettingsItem
            title="Delete Account"
            description="Permanently delete your account"
            icon="trash-outline"
            type="navigation"
            onPress={handleDeleteAccount}
            disabled={isLoading}
          />
        </SettingsSection>
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
  },
  profileActions: {
    marginLeft: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editForm: {
    paddingTop: 20,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
});