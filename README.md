# Corrective Rehab App

This is a React Native application built with Expo to help users correct their posture and gait.

## Features
- **Library:** Watch video tutorials for corrective exercises (Hip Flexors, Gait, etc.).
- **Tracker:** Log daily bad habits (e.g., crossing legs) to track progress.
- **Dashboard:** Get daily tips and insights based on your logs.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npx expo start
   ```

3. Scan the QR code with your phone (using Expo Go app).

## Tech Stack
- React Native (Expo)
- React Navigation
- Lucide Icons
- Expo AV (Video)

## Future Roadmap (Supabase Integration)
- Connect to Supabase for real user auth and database.
- Use Edge Functions to call AWS Rekognition for AI Posture Analysis.
