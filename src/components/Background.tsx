import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

/** Ambient backdrop: deep gradient + soft colored glows that give the glass cards something to blur. */
export function Background() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#071012', '#05080A', '#060A0D']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="g1" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#16C172" stopOpacity="0.30" />
            <Stop offset="1" stopColor="#16C172" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="g2" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#8B5CF6" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="g3" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#0EA5E9" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#0EA5E9" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={width * 0.1} cy={height * 0.06} r={width * 0.75} fill="url(#g1)" />
        <Circle cx={width * 1.05} cy={height * 0.42} r={width * 0.7} fill="url(#g2)" />
        <Circle cx={width * 0.15} cy={height * 0.95} r={width * 0.7} fill="url(#g3)" />
      </Svg>
    </View>
  );
}
