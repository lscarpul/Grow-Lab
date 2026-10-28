import './global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Background } from './src/components/Background';
import { TabBar, TabId } from './src/components/layout';
import { plantAlerts } from './src/lib/insights';
import { AgeGate } from './src/screens/AgeGate';
import { GeneticsScreen } from './src/screens/GeneticsScreen';
import { GuideScreen } from './src/screens/GuideScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { KitScreen } from './src/screens/KitScreen';
import { PlantsScreen } from './src/screens/PlantsScreen';
import { ToolsScreen } from './src/screens/ToolsScreen';
import { StoreProvider, useStore } from './src/state/store';

function Shell() {
  const [tab, setTab] = useState<TabId>('home');
  const { plants, adult, confirmAdult } = useStore();
  const alertCount = useMemo(() => plants.flatMap(plantAlerts).length, [plants]);
  if (adult === null) return <View className="flex-1 bg-[#05080A]" />;
  if (!adult)
    return (
      <View className="flex-1 bg-[#05080A]">
        <Background />
        <AgeGate onConfirm={confirmAdult} />
      </View>
    );
  return (
    <View className="flex-1 bg-[#05080A]">
      <Background />
      <Animated.View key={tab} entering={FadeIn.duration(260)} className="flex-1">
        {tab === 'home' && <HomeScreen onNavigate={setTab} />}
        {tab === 'piante' && <PlantsScreen />}
        {tab === 'kit' && <KitScreen />}
        {tab === 'genetiche' && <GeneticsScreen />}
        {tab === 'guida' && <GuideScreen />}
        {tab === 'strumenti' && <ToolsScreen />}
      </Animated.View>
      <TabBar tab={tab} onChange={setTab} badges={{ piante: alertCount }} />
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {loaded ? (
        <StoreProvider>
          <Shell />
        </StoreProvider>
      ) : (
        <View className="flex-1 items-center justify-center bg-[#05080A]">
          <ActivityIndicator color="#34D88A" />
        </View>
      )}
    </SafeAreaProvider>
  );
}
