import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'correctiverehab://'],
  config: {
    screens: {
      Home: 'home',
      Library: 'library',
      Log: 'log',
      Profile: 'profile',
    },
  },
};

export function getRedirectUrl() {
  return Linking.createURL('/');
}
