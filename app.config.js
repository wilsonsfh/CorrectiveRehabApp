export default ({ config }) => ({
  ...config,
  scheme: 'correctiverehab',
  plugins: [
    'expo-video',
    'expo-web-browser',
    'expo-notifications',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow CorrectiveRehabApp to access your camera to record gym sets.',
        microphonePermission: 'Allow CorrectiveRehabApp to access your microphone to record gym sets.',
        recordAudioAndroid: true,
      },
    ],
  ],
});
