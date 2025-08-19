import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface DiscoverSectionProps {
  onNavigate: (section: string) => void;
  isActive: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  participants: number;
  timeLeft: string;
  difficulty: "easy" | "medium" | "hard";
  reward: string;
}

interface Recipe {
  id: string;
  title: string;
  image: string;
  cookTime: number;
  calories: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

interface Restaurant {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  rating: number;
  distance: number;
  healthScore: number;
}

const mockChallenges: Challenge[] = [
  {
    id: "1",
    title: "Veggie Monday",
    description: "Eat 5 different vegetables today",
    emoji: "🥬",
    participants: 1247,
    timeLeft: "6h left",
    difficulty: "easy",
    reward: "50 XP",
  },
  {
    id: "2",
    title: "Protein Power Week",
    description: "Hit protein goals for 7 days",
    emoji: "💪",
    participants: 892,
    timeLeft: "3 days left",
    difficulty: "medium",
    reward: "Protein Master Badge",
  },
];

const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Mediterranean Buddha Bowl",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop",
    cookTime: 20,
    calories: 380,
    difficulty: "easy",
    tags: ["healthy", "vegetarian", "high-protein"],
  },
  {
    id: "2",
    title: "Grilled Salmon & Quinoa",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
    cookTime: 25,
    calories: 520,
    difficulty: "medium",
    tags: ["high-protein", "omega-3", "gluten-free"],
  },
];

const mockRestaurants: Restaurant[] = [
  {
    id: "1",
    name: "Green Garden Café",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop",
    cuisine: "Healthy",
    rating: 4.8,
    distance: 0.3,
    healthScore: 95,
  },
  {
    id: "2",
    name: "Mediterranean Bistro",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop",
    cuisine: "Mediterranean",
    rating: 4.6,
    distance: 0.7,
    healthScore: 88,
  },
];

export default function DiscoverSection({ onNavigate }: DiscoverSectionProps) {
  const [activeTab, setActiveTab] = useState<"challenges" | "recipes" | "restaurants">("challenges");

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "#4ECDC4";
      case "medium":
        return "#FFD93D";
      case "hard":
        return "#FF6B6B";
      default:
        return "#4ECDC4";
    }
  };

  const renderChallenge = (challenge: Challenge) => (
    <TouchableOpacity key={challenge.id} style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
        </View>
        <View style={styles.challengeMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}>
            <Text style={styles.difficultyText}>{challenge.difficulty}</Text>
          </View>
        </View>
      </View>

      <View style={styles.challengeStats}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.statText}>{challenge.participants.toLocaleString()}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.statText}>{challenge.timeLeft}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trophy" size={16} color="#FFD93D" />
          <Text style={styles.statText}>{challenge.reward}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Join Challenge</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecipe = (recipe: Recipe) => (
    <TouchableOpacity key={recipe.id} style={styles.recipeCard}>
      <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <View style={styles.recipeStats}>
          <View style={styles.recipeStat}>
            <Ionicons name="time-outline" size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.recipeStatText}>{recipe.cookTime}min</Text>
          </View>
          <View style={styles.recipeStat}>
            <Ionicons name="flash-outline" size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.recipeStatText}>{recipe.calories} cal</Text>
          </View>
        </View>
        <View style={styles.recipeTags}>
          {recipe.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.recipeTag}>
              <Text style={styles.recipeTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRestaurant = (restaurant: Restaurant) => (
    <TouchableOpacity key={restaurant.id} style={styles.restaurantCard}>
      <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
      <View style={styles.restaurantContent}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <View style={styles.healthScoreBadge}>
            <Text style={styles.healthScoreText}>{restaurant.healthScore}</Text>
          </View>
        </View>
        <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
        <View style={styles.restaurantStats}>
          <View style={styles.restaurantStat}>
            <Ionicons name="star" size={14} color="#FFD93D" />
            <Text style={styles.restaurantStatText}>{restaurant.rating}</Text>
          </View>
          <View style={styles.restaurantStat}>
            <Ionicons name="location-outline" size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.restaurantStatText}>{restaurant.distance} mi</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate("camera")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Discover</Text>

        <TouchableOpacity>
          <Ionicons name="search-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(["challenges", "recipes", "restaurants"] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "challenges" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Challenges</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {mockChallenges.map(renderChallenge)}

            {/* Featured Challenge */}
            <View style={styles.featuredChallenge}>
              <Text style={styles.featuredTitle}>🏆 Challenge of the Week</Text>
              <Text style={styles.featuredDescription}>
                Mediterranean Diet Challenge - Follow the Mediterranean diet for 7 days and win exclusive badges!
              </Text>
              <TouchableOpacity style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "recipes" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Browse all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recipesContainer}>
              {mockRecipes.slice(0, 2).map(renderRecipe)}
            </View>

            {/* Recipe Categories */}
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoriesGrid}>
                {["High Protein", "Low Carb", "Vegetarian", "Quick & Easy"].map((category, index) => (
                  <TouchableOpacity key={index} style={styles.categoryCard}>
                    <Text style={styles.categoryText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === "restaurants" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Healthy Spots Nearby</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>View map</Text>
              </TouchableOpacity>
            </View>
            {mockRestaurants.map(renderRestaurant)}

            {/* Filter Options */}
            <View style={styles.filtersSection}>
              <Text style={styles.sectionTitle}>Filter by Cuisine</Text>
              <View style={styles.filtersContainer}>
                {["All", "Healthy", "Mediterranean", "Asian"].map((filter, index) => (
                  <TouchableOpacity key={index} style={[styles.filterChip, index === 0 && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, index === 0 && styles.filterChipTextActive]}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#FF6B35",
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "white",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  seeAllText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "500",
  },
  challengeCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  challengeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  challengeDescription: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  challengeMeta: {
    alignItems: "flex-end",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  challengeStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  joinButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  featuredChallenge: {
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.3)",
    marginTop: 8,
  },
  featuredTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  featuredDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  featuredButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  featuredButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  recipeCard: {
    width: width * 0.45,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    overflow: "hidden",
  },
  recipeImage: {
    width: "100%",
    height: 120,
  },
  recipeContent: {
    padding: 12,
  },
  recipeTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  recipeStats: {
    flexDirection: "row",
    marginBottom: 8,
  },
  recipeStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  recipeStatText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginLeft: 4,
  },
  recipeTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  recipeTag: {
    backgroundColor: "rgba(255, 107, 53, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  recipeTagText: {
    color: "#FF6B35",
    fontSize: 10,
    fontWeight: "500",
  },
  categoriesSection: {
    marginTop: 24,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  restaurantCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  restaurantImage: {
    width: "100%",
    height: 120,
  },
  restaurantContent: {
    padding: 12,
  },
  restaurantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  restaurantName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  healthScoreBadge: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  healthScoreText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  restaurantCuisine: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 8,
  },
  restaurantStats: {
    flexDirection: "row",
  },
  restaurantStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  restaurantStatText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginLeft: 4,
  },
  filtersSection: {
    marginTop: 24,
  },
  filterChip: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: "#FF6B35",
  },
  filterChipText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "white",
  },
  recipesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
