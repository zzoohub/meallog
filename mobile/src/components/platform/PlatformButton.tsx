/**
 * Platform-Optimized Button Component
 * Adapts button behavior and styling based on platform capabilities
 */

import { memo, useMemo } from 'react';
import { Platform, ViewStyle, TextStyle } from 'react-native';
import { Button, ButtonProps } from '@/components/ui/Button';
import { PlatformStyles } from '@/utils/platform-optimizations';
import { 
  useDeviceCapabilities, 
  useHapticFeedback, 
  useOptimizedAnimations 
} from '@/hooks/usePlatformOptimizations';

interface PlatformButtonProps extends ButtonProps {
  platformVariant?: 'native' | 'material' | 'cupertino';
  adaptiveHaptics?: boolean;
  adaptiveAnimations?: boolean;
}

const PlatformButton = memo<PlatformButtonProps>(function PlatformButton({
  platformVariant = 'native',
  adaptiveHaptics = true,
  adaptiveAnimations = true,
  style,
  onPress,
  ...props
}) {
  const deviceCapabilities = useDeviceCapabilities();
  const { impact } = useHapticFeedback();
  const { config: animationConfig } = useOptimizedAnimations();

  // Platform-specific styling
  const platformStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {};
    
    if (platformVariant === 'native') {
      if (Platform.OS === 'ios') {
        return {
          ...baseStyle,
          borderRadius: PlatformStyles.borderRadius('medium'),
          ...PlatformStyles.shadow(2),
        };
      } else if (Platform.OS === 'android') {
        return {
          ...baseStyle,
          borderRadius: PlatformStyles.borderRadius('medium'),
          elevation: 4,
        };
      }
    } else if (platformVariant === 'cupertino' && Platform.OS === 'ios') {
      return {
        ...baseStyle,
        borderRadius: PlatformStyles.borderRadius('large'),
        backgroundColor: 'rgba(0,122,255,1)', // iOS blue
        ...PlatformStyles.shadow(1),
      };
    } else if (platformVariant === 'material') {
      return {
        ...baseStyle,
        borderRadius: PlatformStyles.borderRadius('small'),
        elevation: Platform.OS === 'android' ? 6 : 0,
        ...Platform.select({
          ios: PlatformStyles.shadow(3),
          default: {},
        }),
      };
    }
    
    return baseStyle;
  }, [platformVariant]);

  // Platform-optimized press handler
  const handlePress = useMemo(() => {
    return async () => {
      // Trigger haptic feedback if supported and enabled
      if (adaptiveHaptics && deviceCapabilities.supportsHaptics) {
        await impact('light');
      }
      
      // Execute original onPress
      onPress?.();
    };
  }, [onPress, adaptiveHaptics, deviceCapabilities.supportsHaptics, impact]);

  // Platform-specific props
  const platformProps = useMemo(() => {
    const props: Partial<ButtonProps> = {};
    
    // Disable haptics if we're handling them ourselves
    if (adaptiveHaptics) {
      props.haptic = false;
    }
    
    // Adaptive animations based on device capabilities
    if (adaptiveAnimations && deviceCapabilities.isLowEndDevice) {
      props.rippleColor = undefined; // Disable ripple on low-end devices
    }
    
    return props;
  }, [adaptiveHaptics, adaptiveAnimations, deviceCapabilities.isLowEndDevice]);

  return (
    <Button
      {...props}
      {...platformProps}
      style={[platformStyle, style]}
      onPress={handlePress}
    />
  );
});

PlatformButton.displayName = 'PlatformButton';

export { PlatformButton };
export type { PlatformButtonProps };