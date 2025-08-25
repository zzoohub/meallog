import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { SettingsItem, SettingsSection, SelectionModal, SettingsLayout } from '@/domains/settings/components';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/domains/settings/stores/settingsStore';

interface SelectionState {
  type: 'weightUnit' | 'timeframe' | null;
  visible: boolean;
}

export default function GoalSettings() {
  const { theme } = useTheme();
  const { goals, updateGoals, isLoading } = useSettingsStore();
  const [selection, setSelection] = useState<SelectionState>({ type: null, visible: false });
  
  const [editingCalories, setEditingCalories] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [editingMeals, setEditingMeals] = useState(false);
  const [tempValues, setTempValues] = useState({
    calories: goals.dailyCalories.toString(),
    weight: goals.weightGoal.target.toString(),
    meals: goals.mealFrequency.toString(),
  });

  const openSelection = (type: SelectionState['type']) => {
    setSelection({ type, visible: true });
  };

  const closeSelection = () => {
    setSelection({ type: null, visible: false });
  };

  const handleSelectionChange = async (value: any) => {
    if (!selection.type) return;

    if (selection.type === 'weightUnit') {
      await updateGoals({
        weightGoal: { ...goals.weightGoal, unit: value }
      });
    } else if (selection.type === 'timeframe') {
      await updateGoals({
        weightGoal: { ...goals.weightGoal, timeframe: value }
      });
    }
  };

  const handleSaveCalories = async () => {
    const calories = parseInt(tempValues.calories);
    if (isNaN(calories) || calories < 800 || calories > 5000) {
      Alert.alert('Invalid Input', 'Please enter a calorie goal between 800 and 5000');
      return;
    }
    
    await updateGoals({ dailyCalories: calories });
    setEditingCalories(false);
  };

  const handleSaveWeight = async () => {
    const weight = parseFloat(tempValues.weight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid weight');
      return;
    }
    
    await updateGoals({
      weightGoal: { ...goals.weightGoal, target: weight }
    });
    setEditingWeight(false);
  };

  const handleSaveMeals = async () => {
    const meals = parseInt(tempValues.meals);
    if (isNaN(meals) || meals < 1 || meals > 10) {
      Alert.alert('Invalid Input', 'Please enter between 1 and 10 meals per day');
      return;
    }
    
    await updateGoals({ mealFrequency: meals });
    setEditingMeals(false);
  };

  const handleMacroChange = async (macro: keyof typeof goals.macroGoals, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    
    const newMacros = { ...goals.macroGoals, [macro]: numValue };
    const total = newMacros.protein + newMacros.carbs + newMacros.fat;
    
    if (total <= 100) {
      await updateGoals({ macroGoals: newMacros });
    }
  };

  const weightUnitOptions = [
    { value: 'kg', label: 'Kilograms', description: 'Metric system' },
    { value: 'lbs', label: 'Pounds', description: 'Imperial system' },
  ];

  const timeframeOptions = [
    { value: 'weekly', label: 'Weekly', description: 'Track progress weekly' },
    { value: 'monthly', label: 'Monthly', description: 'Track progress monthly' },
  ];

  const getUnitLabel = () => {
    return weightUnitOptions.find(opt => opt.value === goals.weightGoal.unit)?.label || goals.weightGoal.unit;
  };

  const getTimeframeLabel = () => {
    return timeframeOptions.find(opt => opt.value === goals.weightGoal.timeframe)?.label || goals.weightGoal.timeframe;
  };

  const getCurrentValue = () => {
    if (selection.type === 'weightUnit') {
      return goals.weightGoal.unit;
    } else if (selection.type === 'timeframe') {
      return goals.weightGoal.timeframe;
    }
    return null;
  };

  const macroTotal = goals.macroGoals.protein + goals.macroGoals.carbs + goals.macroGoals.fat;

  return (
    <SettingsLayout title="Goals & Targets">
        <SettingsSection
          title="Daily Goals"
          footer="Set your daily nutrition and meal goals"
        >
          <Card style={styles.goalCard}>
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalTitle, { color: theme.colors.text }]}>
                  Daily Calories
                </Text>
                {!editingCalories ? (
                  <Button
                    title="Edit"
                    variant="ghost"
                    size="small"
                    onPress={() => {
                      setTempValues(prev => ({ ...prev, calories: goals.dailyCalories.toString() }));
                      setEditingCalories(true);
                    }}
                  />
                ) : (
                  <View style={styles.editActions}>
                    <Button
                      title="Cancel"
                      variant="ghost"
                      size="small"
                      onPress={() => setEditingCalories(false)}
                      style={styles.editButton}
                    />
                    <Button
                      title="Save"
                      variant="primary"
                      size="small"
                      onPress={handleSaveCalories}
                      style={styles.editButton}
                    />
                  </View>
                )}
              </View>
              {editingCalories ? (
                <TextInput
                  style={[styles.goalInput, { 
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }]}
                  value={tempValues.calories}
                  onChangeText={(text) => setTempValues(prev => ({ ...prev, calories: text }))}
                  keyboardType="numeric"
                  placeholder="Enter daily calorie goal"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              ) : (
                <Text style={[styles.goalValue, { color: theme.colors.text }]}>
                  {goals.dailyCalories} calories
                </Text>
              )}
            </View>
          </Card>

          <Card style={styles.goalCard}>
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalTitle, { color: theme.colors.text }]}>
                  Meals Per Day
                </Text>
                {!editingMeals ? (
                  <Button
                    title="Edit"
                    variant="ghost"
                    size="small"
                    onPress={() => {
                      setTempValues(prev => ({ ...prev, meals: goals.mealFrequency.toString() }));
                      setEditingMeals(true);
                    }}
                  />
                ) : (
                  <View style={styles.editActions}>
                    <Button
                      title="Cancel"
                      variant="ghost"
                      size="small"
                      onPress={() => setEditingMeals(false)}
                      style={styles.editButton}
                    />
                    <Button
                      title="Save"
                      variant="primary"
                      size="small"
                      onPress={handleSaveMeals}
                      style={styles.editButton}
                    />
                  </View>
                )}
              </View>
              {editingMeals ? (
                <TextInput
                  style={[styles.goalInput, { 
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }]}
                  value={tempValues.meals}
                  onChangeText={(text) => setTempValues(prev => ({ ...prev, meals: text }))}
                  keyboardType="numeric"
                  placeholder="Enter meal frequency"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              ) : (
                <Text style={[styles.goalValue, { color: theme.colors.text }]}>
                  {goals.mealFrequency} meals
                </Text>
              )}
            </View>
          </Card>
        </SettingsSection>

        <SettingsSection
          title="Macronutrient Goals"
          footer={`Current total: ${macroTotal}% (should equal 100%)`}
        >
          <Card style={styles.macroCard}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>
                Protein
              </Text>
              <View style={styles.macroInput}>
                <TextInput
                  style={[styles.percentInput, { 
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={goals.macroGoals.protein.toString()}
                  onChangeText={(text) => handleMacroChange('protein', text)}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={[styles.percentSign, { color: theme.colors.textSecondary }]}>%</Text>
              </View>
            </View>

            <View style={styles.macroItem}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>
                Carbohydrates
              </Text>
              <View style={styles.macroInput}>
                <TextInput
                  style={[styles.percentInput, { 
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={goals.macroGoals.carbs.toString()}
                  onChangeText={(text) => handleMacroChange('carbs', text)}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={[styles.percentSign, { color: theme.colors.textSecondary }]}>%</Text>
              </View>
            </View>

            <View style={styles.macroItem}>
              <Text style={[styles.macroLabel, { color: theme.colors.text }]}>
                Fat
              </Text>
              <View style={styles.macroInput}>
                <TextInput
                  style={[styles.percentInput, { 
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={goals.macroGoals.fat.toString()}
                  onChangeText={(text) => handleMacroChange('fat', text)}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={[styles.percentSign, { color: theme.colors.textSecondary }]}>%</Text>
              </View>
            </View>
          </Card>
        </SettingsSection>

        <SettingsSection
          title="Weight Goal"
          footer="Set your target weight and tracking preferences"
        >
          <Card style={styles.goalCard}>
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalTitle, { color: theme.colors.text }]}>
                  Target Weight
                </Text>
                {!editingWeight ? (
                  <Button
                    title="Edit"
                    variant="ghost"
                    size="small"
                    onPress={() => {
                      setTempValues(prev => ({ ...prev, weight: goals.weightGoal.target.toString() }));
                      setEditingWeight(true);
                    }}
                  />
                ) : (
                  <View style={styles.editActions}>
                    <Button
                      title="Cancel"
                      variant="ghost"
                      size="small"
                      onPress={() => setEditingWeight(false)}
                      style={styles.editButton}
                    />
                    <Button
                      title="Save"
                      variant="primary"
                      size="small"
                      onPress={handleSaveWeight}
                      style={styles.editButton}
                    />
                  </View>
                )}
              </View>
              {editingWeight ? (
                <TextInput
                  style={[styles.goalInput, { 
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }]}
                  value={tempValues.weight}
                  onChangeText={(text) => setTempValues(prev => ({ ...prev, weight: text }))}
                  keyboardType="numeric"
                  placeholder="Enter target weight"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              ) : (
                <Text style={[styles.goalValue, { color: theme.colors.text }]}>
                  {goals.weightGoal.target} {goals.weightGoal.unit}
                </Text>
              )}
            </View>
          </Card>

          <SettingsItem
            title="Weight Unit"
            description="Kilograms or pounds"
            icon="scale-outline"
            type="select"
            value={getUnitLabel()}
            onPress={() => openSelection('weightUnit')}
            disabled={isLoading}
          />

          <SettingsItem
            title="Tracking Timeframe"
            description="How often to track progress"
            icon="calendar-outline"
            type="select"
            value={getTimeframeLabel()}
            onPress={() => openSelection('timeframe')}
            disabled={isLoading}
          />
        </SettingsSection>

      <SelectionModal
        visible={selection.visible}
        title={selection.type === 'weightUnit' ? 'Weight Unit' : 'Tracking Timeframe'}
        options={selection.type === 'weightUnit' ? weightUnitOptions : timeframeOptions}
        selectedValue={getCurrentValue()}
        onSelect={handleSelectionChange}
        onClose={closeSelection}
      />
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    marginBottom: 8,
    padding: 16,
  },
  goalItem: {
    gap: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  goalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    minWidth: 60,
  },
  macroCard: {
    padding: 16,
    gap: 16,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  macroInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 50,
  },
  percentSign: {
    fontSize: 16,
    fontWeight: '500',
  },
});