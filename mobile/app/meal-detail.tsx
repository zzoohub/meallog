import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Meal } from "@/domains/meals/types";
import { MealStorageService } from "@/domains/meals/services/mealStorage";
import { MealType } from "@/types";
import { useMealDetailI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface MealData {
  name: string;
  confidence: number;
  nutrition: NutritionInfo;
  ingredients: string[];
}

export default function MealDetail() {
  const { theme } = useTheme();
  const { photoUri, isNew, mealId } = useLocalSearchParams<{
    photoUri: string;
    isNew: string;
    mealId?: string;
  }>();
  const router = useRouter();
  const mealDetail = useMealDetailI18n();
  const [mealData, setMealData] = useState<MealData | null>(null);
  const [existingMeal, setExistingMeal] = useState<Meal | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState<string>("");
  const [savedAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isNew === "true" && photoUri) {
      // New meal - analyze the photo
      analyzeMeal();
    } else if (isNew === "false" && mealId) {
      // Existing meal - load from storage
      loadExistingMeal();
    }
  }, [photoUri, isNew, mealId]);

  const loadExistingMeal = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!mealId) {
        throw new Error(mealDetail.noMealId);
      }

      const meals = await MealStorageService.getAllMeals();
      const meal = meals.find(m => m.id === mealId);

      if (!meal) {
        throw new Error(mealDetail.mealNotFound);
      }

      setExistingMeal(meal);
      // Convert to MealData format for editing
      setMealData({
        name: meal.name,
        confidence: meal.aiAnalysis?.confidence || 0,
        nutrition: meal.nutrition,
        ingredients: meal.ingredients,
      });
    } catch (err) {
      setError(mealDetail.failedToLoad);
      console.error("Meal loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeMeal = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI analysis result
      const mockData: MealData = {
        name: "Grilled Chicken Salad",
        confidence: 85,
        nutrition: {
          calories: 380,
          protein: 32,
          carbs: 18,
          fat: 22,
          fiber: 8,
        },
        ingredients: [
          "Grilled chicken breast",
          "Mixed greens",
          "Cherry tomatoes",
          "Cucumber",
          "Olive oil dressing",
          "Feta cheese",
        ],
      };

      setMealData(mockData);
    } catch (err) {
      setError("Failed to analyze meal. Please try again.");
      console.error("Meal analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showSaveAnimation = () => {
    Animated.sequence([
      Animated.timing(savedAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(savedAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleFieldEdit = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setEditedValue(currentValue.toString());
  };

  const handleFieldSave = () => {
    if (!mealData || !editingField) return;

    const newData = { ...mealData };

    if (editingField === "name") {
      newData.name = editedValue;
    } else if (editingField.startsWith("nutrition.")) {
      const nutritionField = editingField.split(".")[1] as keyof NutritionInfo;
      newData.nutrition[nutritionField] = parseFloat(editedValue) || 0;
    } else if (editingField.startsWith("ingredient.")) {
      const index = parseInt(editingField.split(".")[1]);
      newData.ingredients[index] = editedValue;
    }

    setMealData(newData);
    setEditingField(null);
    showSaveAnimation();
  };

  const handleAddIngredient = () => {
    if (!mealData) return;
    const newData = { ...mealData };
    newData.ingredients.push("");
    setMealData(newData);
    const newIndex = newData.ingredients.length - 1;
    handleFieldEdit(`ingredient.${newIndex}`, "");
  };

  const handleRemoveIngredient = (index: number) => {
    if (!mealData) return;
    const newData = { ...mealData };
    newData.ingredients.splice(index, 1);
    setMealData(newData);
    showSaveAnimation();
  };

  const handleSave = async () => {
    if (!mealData) return;

    try {
      if (isNew === "true") {
        // Save new meal
        await MealStorageService.saveMeal({
          userId: "user_1", // TODO: Get actual user ID
          name: mealData.name,
          photoUri,
          timestamp: new Date(),
          mealType: determineMealType(), // Auto-detect based on time
          nutrition: mealData.nutrition,
          ingredients: mealData.ingredients,
          aiAnalysis: {
            detectedMeals: mealData.ingredients,
            confidence: mealData.confidence,
            estimatedCalories: mealData.nutrition.calories,
            mealCategory: determineMealType(),
            ingredients: mealData.ingredients,
          },
          isVerified: true, // User has reviewed/edited
        });
      } else if (existingMeal) {
        // Update existing meal
        await MealStorageService.updateMeal(existingMeal.id, {
          name: mealData.name,
          nutrition: mealData.nutrition,
          ingredients: mealData.ingredients,
          isVerified: true,
          aiAnalysis: {
            ...existingMeal.aiAnalysis,
            confidence: mealData.confidence,
          },
        });
      }

      showSaveAnimation();
      setTimeout(() => router.back(), 1000);
    } catch (error) {
      console.error("Error saving meal:", error);
      setError(mealDetail.failedToSave);
    }
  };

  const determineMealType = (): MealType => {
    const hour = new Date().getHours();
    if (hour < 11) return MealType.BREAKFAST;
    if (hour < 16) return MealType.LUNCH;
    if (hour < 22) return MealType.DINNER;
    return MealType.SNACK;
  };

  const handleRetake = () => {
    router.back();
  };

  const dismissKeyboard = () => {
    if (editingField) {
      handleFieldSave();
    }
    Keyboard.dismiss();
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={theme.colors.primary} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>{mealDetail.analysisFailed}</Text>
          <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={analyzeMeal}
          >
            <Text style={styles.retryButtonText}>{mealDetail.tryAgain}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: theme.colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.text }]}>{mealDetail.goBack}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isNew === "true" ? mealDetail.title : mealDetail.editTitle}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={[styles.saveText, { color: theme.colors.primary }]}>{mealDetail.save}</Text>
        </TouchableOpacity>
      </View>

      {/* Save Animation Indicator */}
      <Animated.View
        style={[
          styles.saveIndicator,
          {
            opacity: savedAnimation,
            transform: [
              {
                scale: savedAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
        <Text style={styles.saveIndicatorText}>{mealDetail.saved}</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={true}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        onScrollBeginDrag={dismissKeyboard}
      >
        {/* Photo */}
        {(photoUri || existingMeal?.photoUri) && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri || existingMeal?.photoUri || "" }} style={styles.photo} />
          </View>
        )}

        {isAnalyzing || isLoading ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.analyzingText}>{isAnalyzing ? mealDetail.analyzing : mealDetail.loadingMeal}</Text>
            <Text style={styles.analyzingSubtext}>
              {isAnalyzing ? mealDetail.analyzingSubtext : mealDetail.loadingSubtext}
            </Text>
          </View>
        ) : mealData ? (
          <>
            {/* Meal Info */}
            <View style={styles.section}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleFieldEdit("name", mealData.name)}>
                {editingField === "name" ? (
                  <TextInput
                    style={[styles.mealNameInput, { color: theme.colors.text }]}
                    value={editedValue}
                    onChangeText={setEditedValue}
                    onBlur={handleFieldSave}
                    onSubmitEditing={handleFieldSave}
                    autoFocus
                    selectTextOnFocus
                    maxLength={50}
                  />
                ) : (
                  <View style={styles.editableField}>
                    <Text style={[styles.mealName, { color: theme.colors.text }]}>{mealData.name}</Text>
                    <View style={styles.editHint} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.confidence, { color: theme.colors.secondary }]}>
                {`${mealData.confidence}% confidence`}
              </Text>
            </View>

            {/* Nutrition */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{mealDetail.nutritionFacts}</Text>
              <View style={[styles.nutritionGrid, { backgroundColor: theme.colors.surface }]}>
                {/* Calories */}
                <TouchableOpacity
                  style={styles.nutritionItem}
                  activeOpacity={0.7}
                  onPress={() => handleFieldEdit("nutrition.calories", mealData.nutrition.calories)}
                >
                  {editingField === "nutrition.calories" ? (
                    <TextInput
                      style={styles.nutritionInput}
                      value={editedValue}
                      onChangeText={setEditedValue}
                      onBlur={handleFieldSave}
                      onSubmitEditing={handleFieldSave}
                      keyboardType="numeric"
                      autoFocus
                      selectTextOnFocus
                      maxLength={4}
                    />
                  ) : (
                    <View style={styles.editableField}>
                      <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                        {mealData.nutrition.calories}
                      </Text>
                      <View style={styles.editHintSmall} />
                    </View>
                  )}
                  <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                    {mealDetail.calories}
                  </Text>
                </TouchableOpacity>

                {/* Protein */}
                <TouchableOpacity
                  style={styles.nutritionItem}
                  activeOpacity={0.7}
                  onPress={() => handleFieldEdit("nutrition.protein", mealData.nutrition.protein)}
                >
                  {editingField === "nutrition.protein" ? (
                    <View style={styles.nutritionInputWrapper}>
                      <TextInput
                        style={styles.nutritionInput}
                        value={editedValue}
                        onChangeText={setEditedValue}
                        onBlur={handleFieldSave}
                        onSubmitEditing={handleFieldSave}
                        keyboardType="numeric"
                        autoFocus
                        selectTextOnFocus
                        maxLength={3}
                      />
                      <Text style={styles.nutritionUnit}>g</Text>
                    </View>
                  ) : (
                    <View style={styles.editableField}>
                      <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                        {mealData.nutrition.protein}g
                      </Text>
                      <View style={styles.editHintSmall} />
                    </View>
                  )}
                  <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>
                    {mealDetail.protein}
                  </Text>
                </TouchableOpacity>

                {/* Carbs */}
                <TouchableOpacity
                  style={styles.nutritionItem}
                  activeOpacity={0.7}
                  onPress={() => handleFieldEdit("nutrition.carbs", mealData.nutrition.carbs)}
                >
                  {editingField === "nutrition.carbs" ? (
                    <View style={styles.nutritionInputWrapper}>
                      <TextInput
                        style={styles.nutritionInput}
                        value={editedValue}
                        onChangeText={setEditedValue}
                        onBlur={handleFieldSave}
                        onSubmitEditing={handleFieldSave}
                        keyboardType="numeric"
                        autoFocus
                        selectTextOnFocus
                        maxLength={3}
                      />
                      <Text style={styles.nutritionUnit}>g</Text>
                    </View>
                  ) : (
                    <View style={styles.editableField}>
                      <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                        {mealData.nutrition.carbs}g
                      </Text>
                      <View style={styles.editHintSmall} />
                    </View>
                  )}
                  <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>{mealDetail.carbs}</Text>
                </TouchableOpacity>

                {/* Fat */}
                <TouchableOpacity
                  style={styles.nutritionItem}
                  activeOpacity={0.7}
                  onPress={() => handleFieldEdit("nutrition.fat", mealData.nutrition.fat)}
                >
                  {editingField === "nutrition.fat" ? (
                    <View style={styles.nutritionInputWrapper}>
                      <TextInput
                        style={styles.nutritionInput}
                        value={editedValue}
                        onChangeText={setEditedValue}
                        onBlur={handleFieldSave}
                        onSubmitEditing={handleFieldSave}
                        keyboardType="numeric"
                        autoFocus
                        selectTextOnFocus
                        maxLength={3}
                      />
                      <Text style={styles.nutritionUnit}>g</Text>
                    </View>
                  ) : (
                    <View style={styles.editableField}>
                      <Text style={[styles.nutritionValue, { color: theme.colors.primary }]}>
                        {mealData.nutrition.fat}g
                      </Text>
                      <View style={styles.editHintSmall} />
                    </View>
                  )}
                  <Text style={[styles.nutritionLabel, { color: theme.colors.textSecondary }]}>{mealDetail.fat}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Ingredients */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{mealDetail.ingredients}</Text>
                <TouchableOpacity onPress={handleAddIngredient} style={styles.addButton}>
                  <Ionicons name="add-circle" size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
              </View>
              {mealData.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.secondary} />
                  <TouchableOpacity
                    style={styles.ingredientTextContainer}
                    activeOpacity={0.7}
                    onPress={() => handleFieldEdit(`ingredient.${index}`, ingredient)}
                  >
                    {editingField === `ingredient.${index}` ? (
                      <TextInput
                        style={[styles.ingredientInput, { color: theme.colors.text }]}
                        value={editedValue}
                        onChangeText={setEditedValue}
                        onBlur={handleFieldSave}
                        onSubmitEditing={handleFieldSave}
                        autoFocus
                        placeholder="Enter ingredient"
                        placeholderTextColor={theme.colors.textSecondary}
                      />
                    ) : (
                      <View style={styles.editableField}>
                        <Text style={[styles.ingredientText, { color: theme.colors.text }]}>{ingredient}</Text>
                        <View style={styles.editHintIngredient} />
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveIngredient(index)} style={styles.removeButton}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.retakeButton, { borderColor: theme.colors.primary }]}
                onPress={handleRetake}
              >
                <Ionicons name="camera" size={20} color={theme.colors.primary} />
                <Text style={[styles.retakeText, { color: theme.colors.primary }]}>Retake Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSave}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.saveButtonText}>Save Meal</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveBtn: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveIndicator: {
    position: "absolute",
    top: 90,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(78, 205, 196, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  saveIndicatorText: {
    color: "#4ECDC4",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  photoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 0,
    alignItems: "center",
  },
  photo: {
    width: "100%",
    height: 250,
    borderRadius: 12,
  },
  analyzingContainer: {
    alignItems: "center",
    padding: 40,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
  },
  analyzingSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  section: {
    margin: 20,
  },
  editableField: {
    position: "relative",
  },
  editHint: {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    opacity: 0.5,
  },
  editHintSmall: {
    position: "absolute",
    bottom: -2,
    left: "20%",
    right: "20%",
    height: 1,
    backgroundColor: "rgba(255, 107, 53, 0.3)",
    opacity: 0.5,
  },
  editHintIngredient: {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.5,
  },
  mealName: {
    fontSize: 24,
    fontWeight: "bold",
    paddingVertical: 4,
  },
  mealNameInput: {
    fontSize: 24,
    fontWeight: "bold",
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B35",
  },
  confidence: {
    color: "#4ECDC4",
    fontSize: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addButton: {
    padding: 4,
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 20,
  },
  nutritionItem: {
    alignItems: "center",
    minWidth: 70,
  },
  nutritionValue: {
    color: "#FF6B35",
    fontSize: 20,
    fontWeight: "bold",
    paddingVertical: 2,
  },
  nutritionInput: {
    color: "#FF6B35",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    minWidth: 50,
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B35",
    paddingVertical: 2,
  },
  nutritionInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  nutritionUnit: {
    color: "#FF6B35",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 2,
  },
  nutritionLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  ingredientTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  ingredientText: {
    fontSize: 16,
    paddingVertical: 4,
  },
  ingredientInput: {
    fontSize: 16,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B35",
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
  },
  retakeText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
