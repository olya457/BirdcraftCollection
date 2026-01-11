export type MainTabParamList = {
  Collection: undefined;
  BirdGallery: undefined;
  Quiz: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Loader: undefined;
  Onboarding: undefined;
  MainTabs: undefined;

  CollectionDetail: { collectionId: string };
};
