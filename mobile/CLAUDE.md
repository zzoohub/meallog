# Frontend Design Guideline for Expo React Native

This document summarizes key frontend design principles and rules for Expo React Native applications, showcasing recommended patterns. Follow these guidelines when writing mobile app code.

# Readability

Improving the clarity and ease of understanding code in React Native applications.

## Naming Magic Numbers

**Rule:** Replace magic numbers with named constants for clarity.

**Reasoning:**

- Improves clarity by giving semantic meaning to unexplained values
- Enhances maintainability, especially for device-specific values

#### Recommended Pattern:

```typescript
import { Animated } from "react-native";

const ANIMATION_DURATION_MS = 300;
const HEADER_HEIGHT = 60;
const TAB_BAR_HEIGHT = 49;
const SWIPE_THRESHOLD = 120;

function AnimatedHeader() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION_MS, // Clear intent
      useNativeDriver: true,
    }).start();
  };

  return <Animated.View style={{ height: HEADER_HEIGHT, opacity: fadeAnim }}>{/* Header content */}</Animated.View>;
}
```

## Abstracting Implementation Details

**Rule:** Abstract complex logic/interactions into dedicated components or custom hooks.

**Reasoning:**

- Reduces cognitive load by separating concerns
- Improves readability, testability, and maintainability
- Especially important for platform-specific code

#### Recommended Pattern 1: Authentication Guard

```tsx
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

// App structure with Expo Router
export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </AuthProvider>
  );
}

// AuthGuard component handles navigation logic
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redirect to login
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Redirect to home
      router.replace("/(app)/home");
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
```

#### Recommended Pattern 2: Camera Permission Handler

```tsx
import { Camera } from "expo-camera";
import { Alert, View, Text, Pressable } from "react-native";

export function QRScanner() {
  return (
    <View style={{ flex: 1 }}>
      <CameraWithPermission>
        {camera => (
          <Camera
            ref={camera}
            style={{ flex: 1 }}
            type={Camera.Constants.Type.back}
            onBarCodeScanned={handleBarCodeScanned}
          />
        )}
      </CameraWithPermission>
    </View>
  );
}

// Dedicated component handles permission logic
function CameraWithPermission({ children }) {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return <LoadingView />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera access is required</Text>
        <Pressable style={styles.button} onPress={openSettings}>
          <Text>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  return children(cameraRef);
}
```

## Separating Code Paths for Platform-Specific Rendering

**Rule:** Separate platform-specific UI/logic into distinct components.

**Reasoning:**

- Improves readability by avoiding complex platform conditionals
- Ensures each platform gets optimized implementation

#### Recommended Pattern:

```tsx
import { Platform } from "react-native";

// Main component delegates to platform-specific versions
function DatePicker({ value, onChange }) {
  return Platform.select({
    ios: <IOSDatePicker value={value} onChange={onChange} />,
    android: <AndroidDatePicker value={value} onChange={onChange} />,
  });
}

// iOS-specific implementation
function IOSDatePicker({ value, onChange }) {
  return (
    <DateTimePicker
      value={value}
      mode="date"
      display="spinner" // iOS-specific display
      onChange={(event, date) => onChange(date)}
    />
  );
}

// Android-specific implementation
function AndroidDatePicker({ value, onChange }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <Pressable onPress={() => setShow(true)}>
        <Text>{value.toLocaleDateString()}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default" // Android-specific display
          onChange={(event, date) => {
            setShow(false);
            if (date) onChange(date);
          }}
        />
      )}
    </>
  );
}
```

## Simplifying Complex Ternary Operators

**Rule:** Replace complex/nested ternaries with clear conditional logic.

**Reasoning:**

- Makes conditional rendering logic easier to follow
- Especially important for responsive layouts

#### Recommended Pattern:

```typescript
import { useWindowDimensions } from "react-native";

function ResponsiveLayout({ children }) {
  const { width, height } = useWindowDimensions();

  const orientation = (() => {
    if (width > height) return "landscape";
    return "portrait";
  })();

  const deviceType = (() => {
    if (width < 380) return "small";
    if (width < 768) return "medium";
    if (width < 1024) return "large";
    return "xlarge";
  })();

  return <View style={styles[`${deviceType}Container`]}>{children}</View>;
}
```

## Reducing Eye Movement with Colocated Styles

**Rule:** Colocate styles and component logic when appropriate.

**Reasoning:**

- Allows top-to-bottom reading and faster comprehension
- Reduces context switching between files

#### Recommended Pattern A: Inline StyleSheet

```tsx
import { StyleSheet, View, Text, Pressable } from "react-native";

function NotificationCard({ title, message, onPress }) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </Pressable>
  );
}

// Styles colocated with component
const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    fontSize: 14,
    color: "#666",
  },
});
```

#### Recommended Pattern B: Themed Styles Hook

```tsx
function ProfileScreen() {
  const styles = useStyles();
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
      </View>
    </ScrollView>
  );
}

// Colocated theme-aware styles
const useStyles = () => {
  const { colors, spacing } = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: "center",
      padding: spacing.large,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: spacing.medium,
    },
    name: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
  });
};
```

## Naming Complex Conditions

**Rule:** Assign complex boolean conditions to named variables.

**Reasoning:**

- Makes gesture and interaction logic more understandable
- Improves debugging of touch handlers

#### Recommended Pattern:

```typescript
import { PanGestureHandler } from "react-native-gesture-handler";

function SwipeableCard({ onSwipe }) {
  const handleGestureEvent = event => {
    const { translationX, velocityX } = event.nativeEvent;

    // Named conditions for swipe detection
    const isSwipedRight = translationX > SWIPE_THRESHOLD && velocityX > 0;
    const isSwipedLeft = translationX < -SWIPE_THRESHOLD && velocityX < 0;
    const isQuickSwipe = Math.abs(velocityX) > VELOCITY_THRESHOLD;

    if (isSwipedRight && isQuickSwipe) {
      onSwipe("right");
    } else if (isSwipedLeft && isQuickSwipe) {
      onSwipe("left");
    }
  };

  return (
    <PanGestureHandler onGestureEvent={handleGestureEvent}>
      <Animated.View>{/* Card content */}</Animated.View>
    </PanGestureHandler>
  );
}
```

# Predictability

Ensuring React Native code behaves as expected across platforms and devices.

## Standardizing Return Types

**Rule:** Use consistent return types for similar hooks and functions.

**Reasoning:**

- Improves code predictability across the app
- Reduces confusion when working with async operations

#### Recommended Pattern 1: Data Fetching Hooks

```typescript
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Consistent return type for all data hooks
function useUser(): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const token = await AsyncStorage.getItem("authToken");
      return fetchUser(token);
    },
  });
}

function useNotifications(): UseQueryResult<Notification[], Error> {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}
```

#### Recommended Pattern 2: Form Validation

```typescript
type ValidationResult = { valid: true } | { valid: false; error: string };

function validatePhoneNumber(phone: string): ValidationResult {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 0) {
    return { valid: false, error: "Phone number is required" };
  }
  if (cleaned.length !== 10) {
    return { valid: false, error: "Phone number must be 10 digits" };
  }
  return { valid: true };
}

function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return { valid: false, error: "Email is required" };
  }
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true };
}
```

## Revealing Hidden Logic (Single Responsibility)

**Rule:** Avoid hidden side effects in functions; maintain single responsibility.

**Reasoning:**

- Critical for debugging React Native apps
- Prevents unexpected behavior across different devices

#### Recommended Pattern:

```typescript
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

// Function ONLY gets push token
async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null; // Simulators can't receive push notifications
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

// Caller explicitly handles each step
async function setupNotifications() {
  // Each action is explicit and visible
  const token = await getPushToken();

  if (token) {
    await savePushTokenToServer(token); // Explicit save
    await Analytics.track("push_token_registered"); // Explicit tracking
    await AsyncStorage.setItem("pushToken", token); // Explicit caching
  }
}
```

## Using Unique and Descriptive Names

**Rule:** Use unique, descriptive names that clearly indicate functionality.

**Reasoning:**

- Especially important for navigation and screen components
- Helps distinguish between similar components

#### Recommended Pattern:

```typescript
// In navigation/stacks/AuthStack.tsx
export function AuthStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// In services/SecureApiClient.ts
import * as SecureStore from "expo-secure-store";

export const SecureApiClient = {
  async getWithAuth(endpoint: string) {
    const token = await SecureStore.getItemAsync("authToken");
    return fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  },

  async postWithAuth(endpoint: string, body: any) {
    const token = await SecureStore.getItemAsync("authToken");
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  },
};
```

# Cohesion

Keeping related React Native code together and ensuring modules have well-defined purposes.

## Considering Screen Cohesion

**Rule:** Choose between screen-level or component-level state management based on requirements.

**Reasoning:**

- Balances component reusability vs. screen unity
- Important for navigation and data flow

#### Recommended Pattern (Component-Level):

```tsx
// Reusable form components with local validation
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validateEmail = value => {
    if (!value.includes("@")) {
      setErrors(prev => ({ ...prev, email: "Invalid email" }));
    } else {
      setErrors(prev => ({ ...prev, email: null }));
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={text => {
          setEmail(text);
          validateEmail(text);
        }}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text>Login</Text>
      </Pressable>
    </View>
  );
}
```

#### Recommended Pattern (Screen-Level):

```tsx
// Screen manages all form state with React Hook Form
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function LoginScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async data => {
    try {
      await signIn(data);
      router.replace("/(app)/home");
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder="Email"
            keyboardType="email-address"
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder="Password"
            secureTextEntry
          />
        )}
      />
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text>Login</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
```

## Organizing Code by Feature/Screen

**Rule:** Organize directories by feature/screen in Expo apps.

**Reasoning:**

- Aligns with Expo Router's file-based routing
- Keeps screen-related code together

#### Recommended Pattern:

```
src/
├── app/                    # Expo Router screens
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (app)/
│   │   ├── _layout.tsx
│   │   ├── home/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx   # Dynamic route
│   │   ├── profile/
│   │   │   └── index.tsx
│   │   └── settings/
│   │       └── index.tsx
│   └── _layout.tsx
├── components/             # Shared components
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   └── layout/
│       ├── Header.tsx
│       └── TabBar.tsx
├── domains/              # Domain-specific logic
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── notifications/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── payments/
│       ├── components/
│       ├── hooks/
│       └── services/
├── hooks/                 # Global hooks
├── services/              # Global services
├── utils/                 # Global utilities
└── constants/             # App constants
```

## Relating Constants to Platform Logic

**Rule:** Define platform-specific constants near related logic.

**Reasoning:**

- Critical for maintaining consistent behavior across iOS/Android
- Prevents platform-specific bugs

#### Recommended Pattern:

```typescript
import { Platform, StatusBar } from "react-native";

// Platform-specific constants grouped together
const PLATFORM_CONSTANTS = {
  statusBarHeight: Platform.select({
    ios: 20,
    android: StatusBar.currentHeight || 0,
  }),
  headerHeight: Platform.select({
    ios: 44,
    android: 56,
  }),
  tabBarHeight: Platform.select({
    ios: 49,
    android: 48,
  }),
  keyboardBehavior: Platform.select({
    ios: "padding",
    android: "height",
  }),
};

// Usage in component
function ScreenWrapper({ children }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={PLATFORM_CONSTANTS.keyboardBehavior} style={{ flex: 1 }}>
        <View style={{ paddingTop: PLATFORM_CONSTANTS.statusBarHeight }}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

# Coupling

Minimizing dependencies between different parts of the React Native codebase.

## Avoiding Premature Abstraction

**Rule:** Don't over-abstract similar components if they might diverge.

**Reasoning:**

- Screen-specific requirements often diverge over time
- Maintaining flexibility is crucial for mobile apps

#### Guidance:

Before creating a shared component like `useBottomSheet` that multiple screens use, consider if each screen might need different behaviors (different heights, different animations, different content). Initial duplication might lead to more maintainable code.

```typescript
// Instead of one generic useBottomSheet...
// Allow each feature to have its own implementation initially

// features/products/hooks/useProductFilterSheet.ts
export function useProductFilterSheet() {
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);
  // Product-specific sheet logic
}

// features/cart/hooks/useCartSheet.ts
export function useCartSheet() {
  const snapPoints = useMemo(() => ["40%"], []);
  // Cart-specific sheet logic
}
```

## Scoping State Management

**Rule:** Break down global state into focused slices.

**Reasoning:**

- Reduces unnecessary re-renders
- Improves performance on mobile devices

#### Recommended Pattern:

```typescript
// Using Zustand for focused state slices
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// Separate store for user state
const useUserStore = create(
  subscribeWithSelector(set => ({
    user: null,
    setUser: user => set({ user }),
    clearUser: () => set({ user: null }),
  })),
);

// Separate store for app settings
const useSettingsStore = create(set => ({
  theme: "light",
  notifications: true,
  language: "en",
  updateSettings: settings => set(settings),
}));

// Components only subscribe to what they need
function ProfileHeader() {
  const user = useUserStore(state => state.user);
  // Not affected by settings changes
  return <Text>{user?.name}</Text>;
}

function ThemeToggle() {
  const theme = useSettingsStore(state => state.theme);
  const updateSettings = useSettingsStore(state => state.updateSettings);
  // Not affected by user changes
  return (
    <Switch value={theme === "dark"} onValueChange={isDark => updateSettings({ theme: isDark ? "dark" : "light" })} />
  );
}
```

## Eliminating Props Drilling with Context

**Rule:** Use Context API or component composition to avoid props drilling.

**Reasoning:**

- Reduces coupling between navigation screens
- Simplifies data flow in deep component trees

#### Recommended Pattern:

```tsx
import { createContext, useContext } from "react";

// Create focused contexts
const SheetContext = createContext(null);

function CheckoutScreen() {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Provide context at screen level
  return (
    <SheetContext.Provider
      value={{
        selectedAddress,
        setSelectedAddress,
        selectedPayment,
        setSelectedPayment,
      }}
    >
      <ScrollView>
        {/* Direct composition, no props drilling */}
        <AddressSection />
        <PaymentSection />
        <OrderSummary />
        <CheckoutButton />
      </ScrollView>
    </SheetContext.Provider>
  );
}

// Child components access context directly
function AddressSection() {
  const { selectedAddress, setSelectedAddress } = useContext(SheetContext);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Delivery Address</Text>
      <AddressSelector value={selectedAddress} onChange={setSelectedAddress} />
    </View>
  );
}

function CheckoutButton() {
  const { selectedAddress, selectedPayment } = useContext(SheetContext);
  const canCheckout = selectedAddress && selectedPayment;

  return (
    <Pressable
      style={[styles.button, !canCheckout && styles.disabled]}
      disabled={!canCheckout}
      onPress={handleCheckout}
    >
      <Text>Complete Order</Text>
    </Pressable>
  );
}
```
