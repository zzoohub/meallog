import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface SocialFeedProps {
  onNavigate: (section: string) => void;
  isActive: boolean;
}

interface FeedPost {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
    foodCharacter: string;
  };
  meal: {
    imageUri: string;
    name: string;
    calories: number;
    nutrition: {
      protein: number;
      carbs: number;
      fat: number;
    };
    tags: string[];
  };
  timestamp: Date;
  reactions: {
    protein: number;
    healthy: number;
    fire: number;
    love: number;
  };
  comments: number;
  userReaction?: "protein" | "healthy" | "fire" | "love" | undefined;
}

const mockPosts: FeedPost[] = [
  {
    id: "1",
    user: {
      id: "user1",
      username: "sarah_eats",
      avatar: "https://i.pravatar.cc/150?img=1",
      foodCharacter: "🥗 Veggie Warrior",
    },
    meal: {
      imageUri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop",
      name: "Rainbow Buddha Bowl",
      calories: 420,
      nutrition: { protein: 25, carbs: 45, fat: 18 },
      tags: ["#healthy", "#vegan", "#colorful"],
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    reactions: { protein: 12, healthy: 28, fire: 5, love: 15 },
    comments: 8,
  },
  {
    id: "2",
    user: {
      id: "user2",
      username: "mike_gains",
      avatar: "https://i.pravatar.cc/150?img=2",
      foodCharacter: "💪 Protein Master",
    },
    meal: {
      imageUri: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop",
      name: "Grilled Chicken & Quinoa",
      calories: 580,
      nutrition: { protein: 45, carbs: 35, fat: 20 },
      tags: ["#protein", "#postworkout", "#gains"],
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    reactions: { protein: 35, healthy: 18, fire: 22, love: 8 },
    comments: 12,
  },
];

export default function SocialFeed({ onNavigate }: SocialFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>(mockPosts);
  const [refreshing, setRefreshing] = useState(false);
  const [feedMode, setFeedMode] = useState<"following" | "discover">("following");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleReaction = (postId: string, reactionType: keyof FeedPost["reactions"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const newReactions = { ...post.reactions };

          // Remove previous reaction if exists
          if (post.userReaction) {
            newReactions[post.userReaction]--;
          }

          // Add new reaction or remove if same
          if (post.userReaction === reactionType) {
            return {
              ...post,
              userReaction: undefined,
            };
          } else {
            newReactions[reactionType]++;
            return {
              ...post,
              reactions: newReactions,
              userReaction: reactionType,
            };
          }
        }
        return post;
      }),
    );
  };

  const renderReactionButton = (
    postId: string,
    type: keyof FeedPost["reactions"],
    emoji: string,
    count: number,
    isActive: boolean,
  ) => (
    <TouchableOpacity
      style={[styles.reactionButton, isActive && styles.reactionButtonActive]}
      onPress={() => handleReaction(postId, type)}
    >
      <Text style={styles.reactionEmoji}>{emoji}</Text>
      <Text style={[styles.reactionCount, isActive && styles.reactionCountActive]}>{count}</Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item: post }: { item: FeedPost }) => (
    <View style={styles.postContainer}>
      {/* Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.username}>{post.user.username}</Text>
            <Text style={styles.foodCharacter}>{post.user.foodCharacter}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.timestamp}>
          {Math.floor((Date.now() - post.timestamp.getTime()) / (1000 * 60 * 60))}h ago
        </Text>
      </View>

      {/* Food Image */}
      <TouchableOpacity style={styles.imageContainer}>
        <Image source={{ uri: post.meal.imageUri }} style={styles.foodImage} />
        <View style={styles.nutritionBadge}>
          <Text style={styles.calorieText}>{post.meal.calories} cal</Text>
        </View>
      </TouchableOpacity>

      {/* Meal Info */}
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{post.meal.name}</Text>
        <View style={styles.macros}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>P</Text>
            <Text style={styles.macroValue}>{post.meal.nutrition.protein}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>C</Text>
            <Text style={styles.macroValue}>{post.meal.nutrition.carbs}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>F</Text>
            <Text style={styles.macroValue}>{post.meal.nutrition.fat}g</Text>
          </View>
        </View>
      </View>

      {/* Reactions */}
      <View style={styles.reactionsContainer}>
        {renderReactionButton(post.id, "protein", "💪", post.reactions.protein, post.userReaction === "protein")}
        {renderReactionButton(post.id, "healthy", "🥗", post.reactions.healthy, post.userReaction === "healthy")}
        {renderReactionButton(post.id, "fire", "🔥", post.reactions.fire, post.userReaction === "fire")}
        {renderReactionButton(post.id, "love", "❤️", post.reactions.love, post.userReaction === "love")}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{post.comments} comments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="repeat-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Cook this</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {post.meal.tags.map((tag, index) => (
          <TouchableOpacity key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate("camera")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Feed Mode Toggle */}
        <View style={styles.feedToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, feedMode === "following" && styles.toggleButtonActive]}
            onPress={() => setFeedMode("following")}
          >
            <Text style={[styles.toggleText, feedMode === "following" && styles.toggleTextActive]}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, feedMode === "discover" && styles.toggleButtonActive]}
            onPress={() => setFeedMode("discover")}
          >
            <Text style={[styles.toggleText, feedMode === "discover" && styles.toggleTextActive]}>Discover</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => onNavigate("progress")}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Daily Challenge Banner */}
      <TouchableOpacity style={styles.challengeBanner}>
        <View style={styles.challengeContent}>
          <Text style={styles.challengeEmoji}>🥬</Text>
          <View>
            <Text style={styles.challengeTitle}>Veggie Monday</Text>
            <Text style={styles.challengeSubtitle}>2/5 vegetables today</Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#FF6B35" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  feedToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: "#FF6B35",
  },
  toggleText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  toggleTextActive: {
    color: "white",
  },
  feed: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  foodCharacter: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  timestamp: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
  },
  imageContainer: {
    position: "relative",
  },
  foodImage: {
    width: "100%",
    height: 300,
  },
  nutritionBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  calorieText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  mealInfo: {
    padding: 16,
  },
  mealName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  macros: {
    flexDirection: "row",
    gap: 16,
  },
  macroItem: {
    alignItems: "center",
  },
  macroLabel: {
    color: "#FF6B35",
    fontSize: 12,
    fontWeight: "600",
  },
  macroValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  reactionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  reactionButtonActive: {
    backgroundColor: "#FF6B35",
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  reactionCountActive: {
    color: "white",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(255, 107, 53, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: "#FF6B35",
    fontSize: 12,
    fontWeight: "500",
  },
  challengeBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.3)",
  },
  challengeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  challengeEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  challengeTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  challengeSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
});
