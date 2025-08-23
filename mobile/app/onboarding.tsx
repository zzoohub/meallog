import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image, Animated, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCameraPermissions } from "expo-camera";
import { useCommonI18n } from "@/lib/i18n";
import { useAuth } from "@/domains/auth";
import { useTheme } from "@/lib/theme";

const { width } = Dimensions.get("window");

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  component: React.ComponentType<any>;
}

// Note: steps titles and subtitles will be populated by translation hook
const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "",
    subtitle: "",
    component: WelcomeStep,
  },
  {
    id: "camera",
    title: "",
    subtitle: "",
    component: CameraStep,
  },
  {
    id: "demo",
    title: "",
    subtitle: "",
    component: DemoStep,
  },
  {
    id: "goals",
    title: "",
    subtitle: "",
    component: GoalsStep,
  },
  {
    id: "profile",
    title: "",
    subtitle: "",
    component: ProfileStep,
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userChoices, setUserChoices] = useState({});
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();
  const common = useCommonI18n();
  const { isAuthenticated, isLoading, user, updateUser } = useAuth();

  // Handle initial routing based on authentication state
  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    if (!isAuthenticated) {
      // Not authenticated, redirect to auth
      router.replace('/auth');
      return;
    }

    // If authenticated and already completed onboarding, go to main app
    if (user?.hasCompletedOnboarding) {
      router.replace('/(main)');
      return;
    }

    // Otherwise, stay on onboarding (authenticated but haven't completed onboarding)
  }, [isAuthenticated, isLoading, user]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: (currentStep + 1) * width, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // If not authenticated or no user, redirect to auth
      if (!isAuthenticated || !user) {
        router.replace("/auth");
        return;
      }
      
      // Mark user as having completed onboarding
      await updateUser({ hasCompletedOnboarding: true });
      
      router.replace("/(main)");
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // If authenticated but update fails, still navigate
      if (isAuthenticated && user) {
        router.replace("/(main)");
      } else {
        router.replace("/auth");
      }
    }
  };

  const skip = async () => {
    try {
      // If not authenticated or no user, redirect to auth
      if (!isAuthenticated || !user) {
        router.replace("/auth");
        return;
      }

      // Mark user as having completed onboarding even when skipping
      await updateUser({ hasCompletedOnboarding: true });
      router.replace("/(main)");
    } catch (error) {
      console.error('Failed to update user during skip:', error);
      // If authenticated but update fails, still navigate
      if (isAuthenticated && user) {
        router.replace("/(main)");
      } else {
        router.replace("/auth");
      }
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#FF6B35", "#F7931E", "#FFD23F"]} style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={skip}>
        <Text style={styles.skipText}>{common.onboarding.buttons.skip}</Text>
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View key={index} style={[styles.progressDot, index <= currentStep && styles.progressDotActive]} />
        ))}
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.scrollView}
        >
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepContainer}>
              <step.component
                onNext={nextStep}
                onChoice={(choice: any) => setUserChoices({ ...userChoices, [step.id]: choice })}
                isActive={index === currentStep}
              />
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const common = useCommonI18n();

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.stepContent}>
      <Animated.View style={[styles.heroSection, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.mealMontage}>
          {/* Animated meal icons */}
          <Ionicons name="restaurant" size={60} color="white" />
          <Text style={styles.heroEmoji}>🍎📱🧠</Text>
        </View>
        <Text style={styles.stepTitle}>{common.onboarding.welcome.title}</Text>
        <Text style={styles.stepSubtitle}>{common.onboarding.welcome.subtitle}</Text>
      </Animated.View>

      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>{common.onboarding.welcome.startJourney}</Text>
        <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
      </TouchableOpacity>
    </View>
  );
}

function CameraStep({ onNext }: { onNext: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const common = useCommonI18n();

  const handlePermission = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (result.granted) {
        onNext();
      }
    } else {
      onNext();
    }
  };

  return (
    <View style={styles.stepContent}>
      <View style={styles.permissionIcon}>
        <Ionicons name="camera" size={80} color="white" />
      </View>
      <Text style={styles.stepTitle}>{common.onboarding.camera.title}</Text>
      <Text style={styles.stepSubtitle}>
        {common.onboarding.camera.description}
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handlePermission}>
        <Text style={styles.primaryButtonText}>
          {permission?.granted ? common.onboarding.buttons.next : common.onboarding.camera.grantAccess}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function DemoStep({ onNext }: { onNext: () => void }) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const common = useCommonI18n();

  const runDemo = () => {
    setShowAnalysis(true);
    setTimeout(() => {
      onNext();
    }, 3000);
  };

  return (
    <View style={styles.stepContent}>
      <View style={styles.demoContainer}>
        <View style={styles.demoPhone}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop" }}
            style={styles.demoImage}
          />
          {showAnalysis && (
            <View style={styles.analysisOverlay}>
              <Text style={styles.analysisText}>🥗 Salad Bowl</Text>
              <Text style={styles.analysisText}>420 calories</Text>
              <Text style={styles.analysisText}>💪 25g protein</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.stepTitle}>{common.onboarding.demo.title}</Text>
      <Text style={styles.stepSubtitle}>{common.onboarding.demo.subtitle}</Text>

      <TouchableOpacity
        style={[styles.primaryButton, showAnalysis && styles.primaryButtonDisabled]}
        onPress={runDemo}
        disabled={showAnalysis}
      >
        <Text style={styles.primaryButtonText}>
          {showAnalysis ? "Analyzing..." : common.onboarding.demo.tryDemo}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function GoalsStep({ onNext, onChoice }: { onNext: () => void; onChoice: (choice: string) => void }) {
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const common = useCommonI18n();

  const goals = [
    { id: "lose_weight", emoji: "⚖️", title: "Lose weight", description: "Track calories and portion sizes" },
    { id: "gain_muscle", emoji: "💪", title: "Gain muscle", description: "Focus on protein and timing" },
    { id: "eat_healthier", emoji: "🥗", title: "Eat healthier", description: "Improve nutrition quality" },
    { id: "track_nutrition", emoji: "📊", title: "Track nutrition", description: "Monitor vitamins and minerals" },
  ];

  const selectGoal = (goalId: string) => {
    setSelectedGoal(goalId);
    onChoice(goalId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{common.onboarding.goals.title}</Text>
      <Text style={styles.stepSubtitle}>{common.onboarding.goals.subtitle}</Text>

      <View style={styles.goalsContainer}>
        {goals.map(goal => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.goalOption, selectedGoal === goal.id && styles.goalOptionSelected]}
            onPress={() => selectGoal(goal.id)}
          >
            <Text style={styles.goalEmoji}>{goal.emoji}</Text>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDescription}>{goal.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !selectedGoal && styles.primaryButtonDisabled]}
        onPress={onNext}
        disabled={!selectedGoal}
      >
        <Text style={styles.primaryButtonText}>{common.onboarding.buttons.getStarted}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileStep({ onNext }: { onNext: () => void }) {
  const common = useCommonI18n();

  return (
    <View style={styles.stepContent}>
      <View style={styles.characterContainer}>
        <Text style={styles.characterEmoji}>🌟</Text>
        <Text style={styles.characterName}>The Balanced Explorer</Text>
      </View>

      <Text style={styles.stepTitle}>{common.onboarding.profile.title}</Text>
      <Text style={styles.stepSubtitle}>
        {common.onboarding.profile.subtitle}
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>{common.onboarding.buttons.getStarted}</Text>
        <Ionicons name="rocket" size={20} color="white" style={styles.buttonIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 1,
    padding: 12,
  },
  skipText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: "white",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width,
    flex: 1,
  },
  stepContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 60,
  },
  mealMontage: {
    alignItems: "center",
    marginBottom: 24,
  },
  heroEmoji: {
    fontSize: 40,
    marginTop: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
  primaryButton: {
    backgroundColor: "white",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    minWidth: 200,
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  primaryButtonText: {
    color: "#FF6B35",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginLeft: 8,
    color: "#FF6B35",
  },
  permissionIcon: {
    marginBottom: 32,
  },
  demoContainer: {
    marginBottom: 32,
  },
  demoPhone: {
    width: 200,
    height: 300,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    position: "relative",
  },
  demoImage: {
    width: "100%",
    height: "70%",
    borderRadius: 12,
  },
  analysisOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 8,
    padding: 8,
  },
  analysisText: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
  goalsContainer: {
    width: "100%",
    marginVertical: 32,
  },
  goalOption: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  goalOptionSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderColor: "white",
  },
  goalEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  goalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  goalDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textAlign: "center",
  },
  characterContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  characterEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  characterName: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
});
