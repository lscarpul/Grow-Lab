import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alpha } from '../theme/tokens';
import { tap } from './ui';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  accent?: string;
  header: ReactNode;
  children: ReactNode;
}

/** Bottom sheet with blurred backdrop, spring entrance and drag-to-dismiss on the handle. */
export function Drawer({ open, onClose, accent = '#34D88A', header, children }: DrawerProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetH = Math.min(height * 0.9, height - insets.top - 24);
  // Modals on Android are not resized by the keyboard: lift the sheet above it so inputs stay visible.
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKb(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  // Core Animated on purpose: the Reanimated view is wrapped by NativeWind (layout.tsx), and inside a Modal on Android
  // that wrapper dropped the static styles (no backdrop, no sheet background).
  const y = useRef(new Animated.Value(sheetH)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      y.setValue(sheetH);
      Animated.parallel([
        Animated.spring(y, { toValue: 0, damping: 22, stiffness: 190, mass: 0.9, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(y, { toValue: sheetH, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(({ finished }) => finished && setMounted(false));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        y.setValue(Math.max(0, g.dy));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 1.2) {
          tap();
          onCloseRef.current();
        } else Animated.spring(y, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }).start();
      },
    }),
  ).current;
  const sheetStyle = { transform: [{ translateY: y }] };
  const backdropStyle = { opacity: fade };

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        {Platform.OS !== 'android' && <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />}
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,5,6,0.62)' }]} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: kb,
            height: kb ? Math.min(sheetH, height - kb - insets.top - 12) : sheetH,
            maxWidth: 560,
            alignSelf: 'center',
            width: '100%',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            overflow: 'hidden',
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: 'rgba(255,255,255,0.10)',
            backgroundColor: '#0A1215',
          },
          sheetStyle,
        ]}
      >
        <LinearGradient
          colors={[alpha(accent, 0.22), alpha(accent, 0.04), 'transparent']}
          locations={[0, 0.35, 0.6]}
          style={[StyleSheet.absoluteFill, { height: 340 }]}
        />
        <View {...pan.panHandlers}>
          <View className="items-center pb-1 pt-3">
            <View className="h-1 w-10 rounded-full bg-white/25" />
          </View>
          <View className="flex-row items-start px-5 pb-3 pt-2">
            <View className="flex-1">{header}</View>
            <Pressable
              onPress={() => {
                tap();
                onClose();
              }}
              hitSlop={12}
              className="ml-3 h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]"
            >
              <X size={17} color="#C9D4CF" />
            </Pressable>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingBottom: (kb ? 16 : insets.bottom) + 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
