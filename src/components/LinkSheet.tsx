import { ExternalLink, Globe, RotateCw } from 'lucide-react-native';
import { ComponentType, Ref, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, View } from 'react-native';
import { WebView, WebViewNavigation, WebViewProps } from 'react-native-webview';

// The package's class typings don't resolve under React 19's JSX types.
const Web = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebView> }>;
import { C } from '../theme/tokens';
import { Drawer } from './Drawer';
import { Badge, T, tap } from './ui';

let show: ((url: string) => void) | null = null;

/** Opens a shop page in a bottom sheet inside the app (falls back to the browser where no host is mounted, e.g. web). */
export function openLink(url: string) {
  tap();
  if (show && Platform.OS !== 'web') show(url);
  else Linking.openURL(url).catch(() => undefined);
}

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/** Mounted once at the root; shows the page passed to openLink. */
export function LinkSheetHost() {
  const [url, setUrl] = useState<string | null>(null);
  const [current, setCurrent] = useState('');
  const [loading, setLoading] = useState(true);
  const web = useRef<WebView>(null);

  useEffect(() => {
    show = (u) => {
      setUrl(u);
      setCurrent(u);
      setLoading(true);
    };
    return () => {
      show = null;
    };
  }, []);

  return (
    <Drawer
      open={!!url}
      onClose={() => setUrl(null)}
      accent={C.sky}
      scroll={false}
      header={
        <View>
          <Badge tone="sky" dot>
            Negozio
          </Badge>
          <View className="mt-2 flex-row items-center">
            <Globe size={15} color="#8A9A93" />
            <T className="ml-1.5 flex-1 font-inter-sb text-[15px]" numberOfLines={1}>
              {host(current)}
            </T>
            <Pressable
              accessibilityLabel="Ricarica"
              hitSlop={8}
              onPress={() => web.current?.reload()}
              className="mr-2 h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] active:scale-90 active:opacity-70"
            >
              <RotateCw size={14} color="#C9D4CF" />
            </Pressable>
            <Pressable
              accessibilityLabel="Apri nel browser"
              hitSlop={8}
              onPress={() => current && Linking.openURL(current).catch(() => undefined)}
              className="h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] active:scale-90 active:opacity-70"
            >
              <ExternalLink size={14} color="#C9D4CF" />
            </Pressable>
          </View>
          <T className="mt-1 text-2xs text-[#56655F]">Trascina giù la maniglia per chiudere</T>
        </View>
      }
    >
      {url && (
        <View style={{ flex: 1, overflow: 'hidden', backgroundColor: '#fff' }}>
          <Web
            ref={web}
            source={{ uri: url }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={(s: WebViewNavigation) => setCurrent(s.url)}
            setSupportMultipleWindows={false}
            allowsBackForwardNavigationGestures
          />
          {loading && (
            <View style={{ position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center' }}>
              <View className="rounded-full bg-[#0A1215]/90 px-3 py-2">
                <ActivityIndicator color={C.sky} />
              </View>
            </View>
          )}
        </View>
      )}
    </Drawer>
  );
}
