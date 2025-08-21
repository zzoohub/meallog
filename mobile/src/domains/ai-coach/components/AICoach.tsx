import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAICoachI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

interface AICoachProps {
  onNavigate: (section: string) => void;
  isActive: boolean;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface Insight {
  id: string;
  title: string;
  description: string;
  type: "nutrition" | "habit" | "goal" | "achievement";
  icon: string;
  priority: "high" | "medium" | "low";
}

const mockInsights: Insight[] = [
  {
    id: "1",
    title: "Protein Goal Achievement",
    description: "You've hit your protein goal 5 days in a row! Keep up the great work.",
    type: "achievement",
    icon: "💪",
    priority: "high",
  },
  {
    id: "2",
    title: "Hydration Reminder",
    description: "You're averaging 6 cups of water daily. Try to increase to 8 cups for optimal hydration.",
    type: "habit",
    icon: "💧",
    priority: "medium",
  },
  {
    id: "3",
    title: "Vegetable Variety",
    description: "Consider adding more colorful vegetables to increase your nutrient diversity.",
    type: "nutrition",
    icon: "🥗",
    priority: "medium",
  },
];

const mockConversation: Message[] = [
  {
    id: "1",
    text: "Hello! I'm your AI nutrition coach. How can I help you today?",
    isUser: false,
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    suggestions: ["Analyze my nutrition", "Set new goals", "Weekly report", "Meal suggestions"],
  },
];

export default function AICoach({ onNavigate, isActive }: AICoachProps) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const aiCoach = useAICoachI18n();

  const mockInsights: Insight[] = [
    {
      id: "1",
      title: aiCoach.proteinGoal,
      description: aiCoach.proteinGoalDesc,
      type: "achievement",
      icon: "💪",
      priority: "high",
    },
    {
      id: "2",
      title: aiCoach.hydrationReminder,
      description: aiCoach.hydrationReminderDesc,
      type: "habit",
      icon: "💧",
      priority: "medium",
    },
    {
      id: "3",
      title: aiCoach.vegetableVariety,
      description: aiCoach.vegetableVarietyDesc,
      type: "nutrition",
      icon: "🥗",
      priority: "medium",
    },
  ];

  const mockConversation: Message[] = [
    {
      id: "1",
      text: aiCoach.greeting,
      isUser: false,
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      suggestions: [aiCoach.analyzeMy, aiCoach.setGoals, aiCoach.weeklyReport, aiCoach.mealSuggestions],
    },
  ];

  // Initialize conversation with translated content
  useEffect(() => {
    if (messages.length === 0) {
      setMessages(mockConversation);
    }
  }, [aiCoach]);

  useEffect(() => {
    if (isActive) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(text),
        isUser: false,
        timestamp: new Date(),
        suggestions: generateSuggestions(text),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userText: string): string => {
    const lowercaseText = userText.toLowerCase();

    if (lowercaseText.includes("protein")) {
      return "Great question about protein! Based on your recent meals, you're averaging 85g of protein daily. For your goals, I recommend aiming for 120g. Try adding Greek yogurt or lean chicken to your meals.";
    } else if (lowercaseText.includes("weight") || lowercaseText.includes("lose")) {
      return "For healthy weight management, focus on creating a moderate calorie deficit. Your current intake is good - try adding more fiber-rich meals to help with satiety.";
    } else if (lowercaseText.includes("meal") || lowercaseText.includes("recipe")) {
      return "Based on your preferences, I suggest a Mediterranean quinoa bowl with grilled chicken, vegetables, and tahini dressing. It fits your macro goals perfectly!";
    } else {
      return "I understand you're looking for nutrition guidance. Let me analyze your recent eating patterns and provide personalized recommendations based on your goals.";
    }
  };

  const generateSuggestions = (userText: string): string[] => {
    const lowercaseText = userText.toLowerCase();

    if (lowercaseText.includes("protein")) {
      return ["High protein recipes", "Protein timing tips", "Best protein sources"];
    } else if (lowercaseText.includes("weight")) {
      return ["Healthy recipes", "Portion control tips", "Exercise suggestions"];
    } else {
      return ["Nutrition analysis", "Meal planning", "Goal setting", "Progress tracking"];
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const renderMessage = (message: Message, index: number) => {
    const isLast = index === messages.length - 1;

    return (
      <View
        key={message.id}
        style={[styles.messageContainer, message.isUser ? styles.userMessageContainer : styles.aiMessageContainer]}
      >
        {!message.isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.aiAvatarText}>🤖</Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            message.isUser
              ? [styles.userMessageBubble, { backgroundColor: theme.colors.primary }]
              : [styles.aiMessageBubble, { backgroundColor: theme.colors.surface }],
          ]}
        >
          <Text style={[styles.messageText, message.isUser ? { color: "white" } : { color: theme.colors.text }]}>
            {message.text}
          </Text>

          {message.suggestions && isLast && (
            <View style={styles.suggestionsContainer}>
              {message.suggestions.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.suggestionChip,
                    { backgroundColor: theme.colors.primary + "40", borderColor: theme.colors.primary + "80" },
                  ]}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.messageTime, { color: theme.colors.textSecondary }]}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  };

  const renderInsight = (insight: Insight) => (
    <TouchableOpacity key={insight.id} style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.insightHeader}>
        <Text style={styles.insightIcon}>{insight.icon}</Text>
        <View style={styles.insightInfo}>
          <Text style={[styles.insightTitle, { color: theme.colors.text }]}>{insight.title}</Text>
          <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>{insight.description}</Text>
        </View>
        <View
          style={[
            styles.priorityDot,
            {
              backgroundColor:
                insight.priority === "high" ? "#FF6B35" : insight.priority === "medium" ? "#FFD93D" : "#4ECDC4",
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate("camera")}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{aiCoach.title}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>{aiCoach.subtitle}</Text>
        </View>

        <TouchableOpacity onPress={() => onNavigate("settings")}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Insights Section */}
      <Animated.View style={[styles.insightsSection, { opacity: fadeAnim }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{aiCoach.insights}</Text>
        <View style={styles.insightsRow}>{mockInsights.slice(0, 2).map(renderInsight)}</View>
      </Animated.View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}

        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={[styles.aiAvatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.aiAvatarText}>🤖</Text>
            </View>
            <View style={[styles.typingBubble, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Section */}
      <View style={[styles.inputSection, { backgroundColor: theme.colors.background + "E6" }]}>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.textInput, { color: theme.colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={aiCoach.typeMessage}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
              !inputText.trim() && { backgroundColor: theme.colors.border },
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={inputText.trim() ? "white" : "rgba(255, 255, 255, 0.3)"} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[aiCoach.weeklyReport, aiCoach.mealIdeas, aiCoach.goalCheck].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => sendMessage(action)}
            >
              <Text style={[styles.quickActionText, { color: theme.colors.textSecondary }]}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
  },
  insightsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  insightCard: {
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightInfo: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  aiAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userMessageBubble: {
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 8,
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  insightsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
