# Open Wardrobe Market - Mobile App

React Native (Expo) mobile application for Open Wardrobe Market - an AI-powered fashion design platform.

## Features

- **STUDIO**: Browse and view fashion designs created by the community
- **FUSION**: Combine two garment images using AI to create unique fashion designs
- **Supabase Authentication**: Secure user authentication with email/password and Google OAuth
- **Cloudflare R2 Integration**: Optimized image loading and caching
- **Native Mobile Experience**: Smooth animations, haptics, and mobile-optimized UI

## Tech Stack

- **Framework**: Expo (Managed Workflow, SDK 52+)
- **Language**: TypeScript
- **Navigation**: expo-router (File-based routing)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Auth**: Supabase JS + expo-secure-store
- **3D**: @react-three/fiber/native + expo-gl (for future Urula feature)
- **Images**: expo-image with Cloudflare R2
- **Backend**: Connects to existing Next.js API at https://open-wardrobe-market.com

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for testing on physical devices)

## Setup Instructions

### 1. Install Dependencies

```bash
cd ~/OpenWardrobeMarket_app
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with production API endpoints:

```env
EXPO_PUBLIC_SUPABASE_URL=https://etvmigcsvrvetemyeiez.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=https://open-wardrobe-market.com
EXPO_PUBLIC_R2_PUBLIC_BASE_URL=https://assets.open-wardrobe-market.com
```

For local development, update `.env.local`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm start
```

This will start the Expo development server. You can then:

- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan the QR code with Expo Go app (iOS/Android)

### 4. Platform-Specific Commands

```bash
# iOS
npm run ios

# Android
npm run android

# Web (experimental)
npm run web
```

## Project Structure

```
OpenWardrobeMarket_app/
├── app/                      # App screens (expo-router)
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # STUDIO screen
│   │   ├── two.tsx          # FUSION screen
│   │   └── _layout.tsx      # Tab layout
│   └── _layout.tsx          # Root layout
├── components/              # Reusable components
│   └── ui/                  # UI components (Button, Card, etc)
├── constants/               # Colors, styles, and constants
├── contexts/                # React contexts (Auth, etc)
├── lib/                     # Utilities and clients
│   ├── supabase.ts         # Supabase client with SecureStore
│   └── api-client.ts       # Axios wrapper with auth
├── types/                   # TypeScript type definitions
├── assets/                  # Images, fonts, etc
├── global.css              # Global Tailwind styles
├── tailwind.config.js      # Tailwind configuration
├── metro.config.js         # Metro bundler config
└── app.json                # Expo configuration

```

## Key Implementation Details

### Authentication

The app uses Supabase for authentication with `expo-secure-store` for secure token storage:

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, signIn, signOut } = useAuth();
```

### API Calls

All API calls use the configured client that automatically injects auth tokens:

```typescript
import { apiClient } from '@/lib/api-client';

const response = await apiClient.get('/api/studio/items');
```

### Image Handling

The app uses `expo-image` for optimized image loading:

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  transition={300}
/>
```

### FUSION Flow

1. User selects two images using `expo-image-picker`
2. Images are converted to base64
3. Posted to `/api/variants-generate` endpoint
4. Job ID is returned and user is notified
5. User can check back to see generated designs

## Design System

### Colors

- **Off-white**: `#F4F4F0` - Primary background
- **Black**: `#111111` - Primary text and UI elements
- **Accent**: `#FF7A1A` - Call-to-action and highlights
- **Klein Blue**: `#002FA7` - Special accents

### Typography

- Headlines: Bold, high contrast
- Body: Regular weight, ink-700 (`#3A3A3A`)
- Captions: Ink-400 (`#777777`)

### Spacing & Borders

- Border radius: 12px (xl), 16px (2xl)
- Consistent spacing scale: 8, 12, 16, 20, 24px

## Development Tips

### Debugging

```bash
# Clear cache and restart
npm start -- --clear

# View logs
npx expo start --dev-client
```

### Testing on Device

1. Install Expo Go on your iOS/Android device
2. Ensure your device is on the same network as your computer
3. Scan the QR code from the terminal

### Known Issues

- **Web version**: Some features (SecureStore, ImagePicker) have limited web support
- **3D (Urula)**: Not yet implemented in this version

## Next Steps (Phase 2+)

- [ ] Implement Archive screen
- [ ] Add detailed item view
- [ ] Implement Urula 3D visualization
- [ ] Add Supabase Realtime for FUSION job updates
- [ ] Implement user profile and settings
- [ ] Add offline support
- [ ] Implement haptic feedback

## Production Deployment

### Using EAS Build

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure build:
```bash
eas build:configure
```

4. Build for iOS/Android:
```bash
eas build --platform ios
eas build --platform android
```

### App Store Submission

Follow Expo's guide for submitting to app stores:
- [iOS App Store](https://docs.expo.dev/distribution/app-stores/#ios)
- [Google Play Store](https://docs.expo.dev/distribution/app-stores/#android)

## Contributing

This is a mobile companion to the existing web application. Ensure all API endpoints match the production Next.js backend.

## License

Proprietary - Open Wardrobe Market

## Support

For issues or questions, please contact the development team.

---

Built with ❤️ using Expo, React Native, and Supabase
