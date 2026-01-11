import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import LoaderScreen from '../screens/LoaderScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabs from './MainTabs';
import CollectionDetailScreen from '../screens/CollectionDetailScreen';

import { UnlockProvider } from '../unlocks/UnlockProvider';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <UnlockProvider
      onGoToGallery={() => {
        if (!navigationRef.isReady()) return;
        navigationRef.navigate('MainTabs', {
          screen: 'BirdGallery',
        } as never);
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loader" component={LoaderScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="CollectionDetail"
          component={CollectionDetailScreen}
        />
      </Stack.Navigator>
    </UnlockProvider>
  );
}
