import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { Card } from '@/components/ui/Card';

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  footer?: string;
  style?: any;
  variant?: 'default' | 'grouped';
}

export function SettingsSection({
  title,
  children,
  footer,
  style,
  variant = 'default',
}: SettingsSectionProps) {
  const { theme } = useTheme();

  if (variant === 'grouped') {
    return (
      <View style={[styles.container, style]}>
        {title && (
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
        )}
        <Card variant="grouped" padding="none" style={styles.groupedCard}>
          {React.Children.map(children, (child, index) => {
            const isLast = index === React.Children.count(children) - 1;
            return (
              <View>
                {child}
                {!isLast && (
                  <View style={[styles.divider, { backgroundColor: theme.colors.border + '30' }]} />
                )}
              </View>
            );
          })}
        </Card>
        {footer && (
          <Text style={[styles.footer, { color: theme.colors.textSecondary }]}>
            {footer}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {title && (
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
      )}
      <View style={styles.content}>
        {children}
      </View>
      {footer && (
        <Text style={[styles.footer, { color: theme.colors.textSecondary }]}>
          {footer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    marginHorizontal: 4,
  },
  content: {
    gap: 0,
  },
  groupedCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: {
    height: 0.5,
    marginLeft: 56, // Align with text content, accounting for icon space
  },
  footer: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginHorizontal: 16,
  },
});