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
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Background } from './src/components/Background';
import { TABS, TabBar, TabId } from './src/components/layout';
import { LinkSheetHost } from './src/components/LinkSheet';
import { plantAlerts } from './src/lib/insights';
import { AgeGate } from './src/screens/AgeGate';
import { GeneticsScreen } from './src/screens/GeneticsScreen';
import { GuideScreen } from './src/screens/GuideScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { KitScreen } from './src/screens/KitScreen';
import { Onboarding } from './src/screens/Onboarding';
import { PlantsScreen } from './src/screens/PlantsScreen';
import { ToolsMode, ToolsScreen } from './src/screens/ToolsScreen';
import { StoreProvider, useStore } from './src/state/store';

function Shell() {
  const [tab, setTabState] = useState<TabId>('home');
  const [toolsMode, setToolsMode] = useState<ToolsMode>('foto');
  // Slide in from the side of the tab that was tapped, so switching tabs reads as moving through the bar.
  const dir = useRef(1);
  const setTab = (t: TabId) => {
    dir.current = TABS.findIndex((x) => x.id === t) >= TABS.findIndex((x) => x.id === tab) ? 1 : -1;
    if (t !== 'strumenti') setToolsMode('foto');
    setTabState(t);
  };
  const { plants, adult, confirmAdult, onboarded } = useStore();
  const alertCount = useMemo(() => plants.flatMap(plantAlerts).length, [plants]);
  if (adult === null || onboarded === null) return <View className="flex-1 bg-[#05080A]" />;
  if (!adult)
    return (
      <View className="flex-1 bg-[#05080A]">
        <Background />
        <AgeGate onConfirm={confirmAdult} />
      </View>
    );
  // Nothing configured yet: welcome and the guided setup come before the dashboard.
  if (!onboarded)
    return (
      <View className="flex-1 bg-[#05080A]">
        <Background />
        <Onboarding />
      </View>
    );
  return (
    <View className="flex-1 bg-[#05080A]">
      <Background />
      <Animated.View key={tab} entering={(dir.current > 0 ? FadeInRight : FadeInLeft).duration(240)} style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen onNavigate={setTab} />}
        {tab === 'piante' && <PlantsScreen />}
        {tab === 'kit' && <KitScreen />}
        {tab === 'genetiche' && <GeneticsScreen />}
        {tab === 'guida' && (
          <GuideScreen
            onOpenDiagnosis={() => {
              setTab('strumenti');
              setToolsMode('sintomi');
            }}
          />
        )}
        {tab === 'strumenti' && <ToolsScreen initial={toolsMode} />}
      </Animated.View>
      <TabBar tab={tab} onChange={setTab} badges={{ piante: alertCount }} />
      <LinkSheetHost />
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
