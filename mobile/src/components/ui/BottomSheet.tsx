import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  ModalProps,
} from "react-native";

interface BottomSheetProps extends Omit<ModalProps, "animationType" | "transparent"> {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string;
  style?: ViewStyle;
  dimOpacity?: number;
  slideAnimationConfig?: {
    tension?: number;
    friction?: number;
    duration?: number;
  };
  fadeAnimationDuration?: number;
  enableSwipeDown?: boolean;
  backgroundColor?: string;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const DEFAULT_DIM_OPACITY = 0.5;
const DEFAULT_FADE_DURATION = 300;
const DEFAULT_SLIDE_CONFIG = {
  tension: 65,
  friction: 11,
};

export function BottomSheet({
  visible,
  onClose,
  children,
  height = "auto",
  style,
  dimOpacity = DEFAULT_DIM_OPACITY,
  slideAnimationConfig = DEFAULT_SLIDE_CONFIG,
  fadeAnimationDuration = DEFAULT_FADE_DURATION,
  backgroundColor = "white",
  ...modalProps
}: BottomSheetProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      // Show modal first
      setModalVisible(true);
      // Reset values before animating in
      fadeAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      
      // Start both animations when showing
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: dimOpacity,
          duration: fadeAnimationDuration,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: slideAnimationConfig.tension || DEFAULT_SLIDE_CONFIG.tension,
          friction: slideAnimationConfig.friction || DEFAULT_SLIDE_CONFIG.friction,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      // Reverse animations when hiding
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: fadeAnimationDuration * 0.7, // Slightly faster when closing
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: slideAnimationConfig.duration || 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hide modal after animation completes
        setModalVisible(false);
      });
    }
  }, [visible]);

  const handleClose = () => {
    // Trigger close animation via parent
    onClose();
  };

  return (
    <Modal
      transparent={true}
      visible={modalVisible}
      onRequestClose={handleClose}
      animationType="none" // We handle animations manually
      {...modalProps}
    >
      <View style={styles.container}>
        {/* Animated dim overlay with fade - separate from content */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.dimOverlay,
              {
                opacity: fadeAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Animated sheet content with slide - no opacity applied */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor,
              height,
              transform: [{ translateY: slideAnim }],
            },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dimOverlay: {
    backgroundColor: "rgba(0, 0, 0, 1)", // Solid black, opacity controlled by animation
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: 100,
  },
});