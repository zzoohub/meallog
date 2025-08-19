import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';


interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'achievement' | 'reminder' | 'social' | 'challenge';
  icon: string;
  duration?: number;
}

export function FloatingNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const animatedValues = useRef<Map<string, Animated.Value>>(new Map()).current;

  useEffect(() => {
    // Simulate incoming notifications
    const timer = setTimeout(() => {
      showNotification({
        id: '1',
        title: 'Streak Achievement!',
        message: 'You\'ve logged meals for 7 days straight! 🔥',
        type: 'achievement',
        icon: '🏆',
        duration: 4000,
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [showNotification]);

  const dismissNotification = useCallback((id: string) => {
    const animValue = animatedValues.get(id);
    if (animValue) {
      Animated.timing(animValue, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        animatedValues.delete(id);
      });
    }
  }, [animatedValues]);

  const showNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [...prev, notification]);
    
    const animValue = new Animated.Value(-100);
    animatedValues.set(notification.id, animValue);

    // Slide in animation
    Animated.spring(animValue, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Auto dismiss
    const duration = notification.duration || 3000;
    setTimeout(() => {
      dismissNotification(notification.id);
    }, duration);
  }, [animatedValues, dismissNotification]);

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'achievement': return '#FFD93D';
      case 'reminder': return '#4ECDC4';
      case 'social': return '#FF6B35';
      case 'challenge': return '#96CEB4';
      default: return '#FF6B35';
    }
  };

  const renderNotification = (notification: Notification) => {
    const animValue = animatedValues.get(notification.id);
    if (!animValue) return null;

    return (
      <Animated.View
        key={notification.id}
        style={[
          styles.notificationContainer,
          {
            transform: [{ translateY: animValue }],
            borderLeftColor: getNotificationColor(notification.type),
          }
        ]}
      >
        <TouchableOpacity
          style={styles.notification}
          onPress={() => dismissNotification(notification.id)}
          activeOpacity={0.9}
        >
          <View style={styles.notificationContent}>
            <Text style={styles.notificationIcon}>{notification.icon}</Text>
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => dismissNotification(notification.id)}
          >
            <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map(renderNotification)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notificationContainer: {
    marginBottom: 8,
    borderLeftWidth: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  notification: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    lineHeight: 16,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});