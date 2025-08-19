# Foodsy Mobile App

A mobile application for food sharing and social interaction.

## Project Structure

The project follows a domain-driven design approach with the following structure:

```
src/
├── components/       # Shared UI components
│   └── core/         # Core UI components (Text, View, etc.)
├── hooks/            # Shared hooks
├── utils/            # Utility functions
├── lib/              # Third-party library wrappers
├── stores/           # Global state management with Zustand
└── domains/          # Feature domains
    ├── post/         # Post-related features
    │   ├── components/
    │   ├── hooks/
    │   └── utils/
    ├── user/         # User-related features
    │   ├── components/
    │   ├── hooks/
    │   └── utils/
    └── search/       # Search-related features
        ├── components/
        ├── hooks/
        └── utils/
```

## Routing

This app uses Expo Router for navigation:

- `app/` - Contains all the routing configuration
  - `(tabs)/` - Tab-based navigation (Home, Create Post, Profile)
  - `_layout.tsx` - Root layout configuration

## Key Design Principles

1. **Domain-driven organization**: Code is organized by feature/domain rather than by type
2. **Component composition**: Components use composition over props drilling
3. **Single responsibility**: Each file has a clear, single purpose
4. **Descriptive naming**: Avoiding ambiguity with clear, descriptive names

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm dev
```

## Development

- **Adding a new feature**: Create a new directory under the appropriate domain
- **Shared functionality**: Add to the appropriate shared directory (components, hooks, utils)
- **Global state**: Use Zustand stores in the stores directory

## Best Practices

- Follow the Toss Frontend Guidelines
- Use descriptive variable names
- Create focused, single-responsibility components
- Keep state at the appropriate level
- Abstract implementation details into dedicated components

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
