import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  ModalProps,
} from "react-native";

interface DialogProps extends Omit<ModalProps, "animationType" | "transparent"> {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  dimOpacity?: number;
  fadeAnimationDuration?: number;
  scaleAnimation?: boolean;
  backgroundColor?: string;
  maxWidth?: number;
  padding?: number;
}

const DEFAULT_DIM_OPACITY = 0.5;
const DEFAULT_FADE_DURATION = 200;
const DEFAULT_MAX_WIDTH = 340;
const DEFAULT_PADDING = 20;

export function Dialog({
  visible,
  onClose,
  children,
  style,
  dimOpacity = DEFAULT_DIM_OPACITY,
  fadeAnimationDuration = DEFAULT_FADE_DURATION,
  scaleAnimation = true,
  backgroundColor = "white",
  maxWidth = DEFAULT_MAX_WIDTH,
  padding = DEFAULT_PADDING,
  ...modalProps
}: DialogProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Start animations when showing
      const animations = [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: fadeAnimationDuration,
          useNativeDriver: true,
        }),
      ];

      if (scaleAnimation) {
        animations.push(
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 9,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    } else {
      // Reverse animations when hiding
      const animations = [
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: fadeAnimationDuration * 0.8,
          useNativeDriver: true,
        }),
      ];

      if (scaleAnimation) {
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: fadeAnimationDuration * 0.8,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start();
    }
  }, [visible, fadeAnim, scaleAnim, fadeAnimationDuration, scaleAnimation]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="none" // We handle animations manually
      {...modalProps}
    >
      {/* Animated dim overlay with fade */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, dimOpacity],
            }),
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Animated dialog content with fade and optional scale */}
        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor,
              maxWidth,
              padding,
              opacity: fadeAnim,
              transform: scaleAnimation ? [{ scale: scaleAnim }] : [],
            },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 1)", // Base color, opacity controlled by animation
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialog: {
    borderRadius: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});