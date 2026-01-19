# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CollegeDash Teacher App is a React Native mobile application built with Expo and TypeScript. It serves as a teacher portal for managing academic activities including attendance, grades, assignments, timetable, and fee payments. The app targets Android, iOS, and web platforms.

## Development Commands

### Running the Application

- `npm start` or `expo start` - Start the development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser

### Code Quality

- `npm run lint` - Run ESLint for code linting
- Format code using Prettier (configured in `.prettierrc.json`)

### Project Reset

- `npm run reset-project` - Moves starter code to app-example and creates blank app directory

## Architecture

### Routing System

This app uses **Expo Router** with file-based routing. The routing structure is:

- `app/_layout.tsx` - Root layout with Stack navigation, theme provider, and font loading
- `app/(tabs)/_layout.tsx` - Tab navigation layout with 4 main tabs (Dashboard, Fees, Profile, More)
- Route screens are organized in `app/` directory with nested `(tabs)/` folder for tabbed screens
- Typed routes are enabled via `experiments.typedRoutes` in app.json

### State Management & Theming

- **Theme Context** (`contexts/ThemeContext.tsx`) manages app-wide theme state with light/dark/system modes
- `hooks/useColorScheme.ts` provides platform-specific color scheme detection
- `hooks/useThemeColor.ts` provides theme-aware color values
- Colors defined in `constants/Colors.ts` with separate light/dark palettes
- Custom navigation themes integrate with React Navigation in `app/_layout.tsx`

### API Integration

- Axios instance configured in `services/axios.ts` with:
  - Base URL from `process.env.API_BASE` (defaults to `https://multi-api.studyaid.in/api`)
  - Request interceptor adds Bearer token from localStorage
  - Response interceptor handles errors and 401 unauthorized
  - Note: Uses `localStorage` which will need replacement with AsyncStorage for native platforms
- Account service (`services/account.ts`) handles authentication with typed API responses
- `services/dummyData.ts` contains mock data for development

### Component Structure

- **Themed Components**: `ThemedText.tsx` and `ThemedView.tsx` automatically adapt to current theme
- **Custom UI**: Platform-specific IconSymbol components (`components/ui/`) with iOS-specific variants
- **Special Components**:
  - `HapticTab.tsx` - Haptic feedback for tab presses
  - `AttendanceCalendar.tsx` - Calendar visualization for attendance
  - `ParallaxScrollView.tsx` - Scroll view with parallax effect
  - `Collapsible.tsx` - Animated collapsible sections

### Screen Organization

Main feature screens: attendance, assignments, grades, homework, notifications, timetable, settings, fees

- Login screen uses demo credentials: `teacher@collegedash.com` / `password`
- Dashboard (`(tabs)/index.tsx`) displays stats, quick actions, and recent announcements

## Configuration

### TypeScript

- Strict mode enabled
- Path alias `@/*` maps to project root for imports (e.g., `@/components/ThemedText`)
- Expo types auto-generated in `.expo/types/`

### Prettier Configuration

- Single quotes, no semicolons
- 100 character line width
- 2-space indentation
- Arrow function parentheses avoided when possible

### Expo Configuration (app.json)

- React Native New Architecture enabled (`newArchEnabled: true`)
- Custom URI scheme: `collegedashteacherapp`
- Web bundler: Metro with static output
- Plugins: expo-router, expo-splash-screen

## Development Notes

### Known Limitations

- `services/axios.ts` uses `localStorage` (browser API) which doesn't exist in React Native - replace with `@react-native-async-storage/async-storage` for production
- Login authentication is currently mocked (1-second timeout simulation)
- All data is dummy data loaded from `services/dummyData.ts`

### Platform-Specific Code

- Platform-specific components use `.ios.tsx` and `.web.ts` extensions (e.g., `IconSymbol.ios.tsx`)
- Tab bar uses iOS blur effect via `TabBarBackground` component
- Status bar style adapts to theme in root layout

### Navigation Patterns

- Use `router.push()` for navigation to sub-screens
- Use `router.replace()` for authentication flows (prevents back navigation)
- Tab screens are in `(tabs)/` folder, non-tab screens are in root `app/` folder
- All navigation is type-safe with generated route types
