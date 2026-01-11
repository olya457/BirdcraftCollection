import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CollectionScreen from '../screens/CollectionScreen';
import BirdGalleryScreen from '../screens/BirdGalleryScreen';
import QuizScreen from '../screens/QuizScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type MainTabParamList = {
  Collection: undefined;
  BirdGallery: undefined;
  Quiz: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ICONS = {
  Collection: {
    on: require('../assets/collection_on.png'),
    off: require('../assets/collection_off.png'),
  },
  BirdGallery: {
    on: require('../assets/gallery_on.png'),
    off: require('../assets/gallery_off.png'),
  },
  Quiz: {
    on: require('../assets/quiz_on.png'),
    off: require('../assets/quiz_off.png'),
  },
  Settings: {
    on: require('../assets/settings_on.png'),
    off: require('../assets/settings_off.png'),
  },
};

const TAB_BG = '#D8D23A';
const ACTIVE_TEXT = '#163B0F';
const INACTIVE_TEXT = 'rgba(255,255,255,0.85)';

function getLabel(routeName: keyof MainTabParamList) {
  switch (routeName) {
    case 'Collection':
      return 'Collection';
    case 'BirdGallery':
      return 'Bird Gallery';
    case 'Quiz':
      return 'Quiz';
    case 'Settings':
      return 'Settings';
    default:
      return routeName;
  }
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  const isSmall = height <= 700 || width <= 360;
  const lift = isSmall ? 18 : 30;
  const barH = isSmall ? 72 : 78;
  const padBottom = Math.max(10, insets.bottom > 0 ? insets.bottom - 2 : 10);

  const iconSize = isSmall ? 20 : 22;
  const fontSize = isSmall ? 11 : 12;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.barWrap,
        {
          paddingBottom: padBottom,
          bottom: lift,
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: TAB_BG,
            height: barH,
            borderRadius: 16,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const name = route.name as keyof MainTabParamList;

          const iconSource = isFocused ? ICONS[name].on : ICONS[name].off;
          const label = getLabel(name);

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel}
              testID={descriptors[route.key]?.options?.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.item,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Image
                source={iconSource}
                style={[
                  styles.icon,
                  {
                    width: iconSize,
                    height: iconSize,
                  },
                ]}
                resizeMode="contain"
              />

              <Text
                style={[
                  styles.label,
                  {
                    fontSize,
                    color: isFocused ? ACTIVE_TEXT : INACTIVE_TEXT,
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Collection" component={CollectionScreen} />
      <Tab.Screen name="BirdGallery" component={BirdGalleryScreen} options={{ title: 'Bird Gallery' }} />
      <Tab.Screen name="Quiz" component={QuizScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },

  bar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 10,
    paddingTop: 10,

    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },

  icon: {
    opacity: 0.98,
  },

  label: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
