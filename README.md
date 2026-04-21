# CartSync

## Server Status

🔍 **Health Check**: [https://kusy.net/cartsync/health](https://kusy.net/cartsync/health)

Check the server status above to ensure the backend is operational before running the app.

---

## Overview

CartSync is a real-time collaborative shopping list application built with React Native and Expo. It allows multiple users to share and synchronize shopping lists in real-time, making grocery shopping more efficient and collaborative.

## Features

- 🔐 **User Authentication** - Secure login and registration system
- 📋 **Multiple Shopping Lists** - Create and manage multiple shopping lists
- ✅ **Real-time Synchronization** - WebSocket-based live updates across devices
- 👥 **Collaborative Lists** - Share lists with family and friends
- 📱 **Cross-platform** - Works on Android and iOS
- 🖼️ **Receipt Attachments** - Attach photos of receipts using image picker
- 💾 **Secure Storage** - Credentials stored securely using expo-secure-store

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (~54.0.33)
- **Language**: TypeScript (~5.9.2)
- **UI Library**: React Native (0.81.5)
- **Navigation**: React Navigation 7
- **State Management**: React Context API
- **Real-time Communication**: WebSocket
- **Secure Storage**: expo-secure-store

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (package manager)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For Android: [Android Studio](https://developer.android.com/studio)
- For iOS: [Xcode](https://developer.apple.com/xcode/) (macOS only)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cartsync
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure the API URL (optional):
   - The default API URL is configured in `services/api.ts`
   - For production, update the `extra.apiUrl` in `app.json` or set it via environment variables

## Running the App

### Start the development server:
```bash
pnpm start
```

### Run on Android:
```bash
pnpm android
```

### Run on iOS:
```bash
pnpm ios
```

### Run on Web:
```bash
pnpm web
```

## Project Structure

```
cartsync/
├── components/       # Reusable UI components
│   ├── Header.tsx
│   └── ui.tsx
├── context/         # React Context providers
│   ├── AuthContext.tsx
│   └── ListContext.tsx
├── navigation/      # Navigation configuration
│   └── index.tsx
├── screens/         # App screens
│   ├── AuthScreens.tsx
│   ├── ListPickerScreen.tsx
│   ├── ListScreen.tsx
│   ├── SettingsScreen.tsx
│   └── ShoppingScreens.tsx
├── services/        # API and WebSocket services
│   ├── api.ts
│   └── ws.ts
├── theme/          # Theme configuration
│   └── index.ts
├── android/        # Android native code
├── assets/         # Images and other assets
├── App.tsx         # Root component
├── app.json        # Expo configuration
├── eas.json        # EAS Build configuration
└── package.json    # Dependencies and scripts
```

## Configuration

### API Configuration

The app connects to the CartSync backend server. The base URL can be configured in:
- Development: `services/api.ts` (default: `http://10.0.2.2:6300` for Android emulator)
- Production: Set via `app.json` under `expo.extra.apiUrl`

### Permissions

The app requires the following permissions:
- **Photo Library Access**: For attaching receipt images to shopping list items

## Building for Production

### Using EAS Build:

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Build for Android:
```bash
eas build --platform android
```

3. Build for iOS:
```bash
eas build --platform ios
```

## Development

### Type Checking

```bash
npx tsc --noEmit
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

This is a portfolio project created to demonstrate full-stack mobile development skills.

## Support

For issues or questions, please check the [health check endpoint](https://kusy.net/cartsync/health) first to ensure the backend is operational.
