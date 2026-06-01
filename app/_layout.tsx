import { useEffect } from 'react'
import { Stack }     from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { View } from 'react-native'
import { Colors } from '@/constants/colors'
import {
  useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans'
import {
  Lora_400Regular, Lora_600SemiBold, Lora_400Regular_Italic,
} from '@expo-google-fonts/lora'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'DMSans-Regular':  DMSans_400Regular,
    'DMSans-Medium':   DMSans_500Medium,
    'DMSans-SemiBold': DMSans_600SemiBold,
    'Lora-Regular':    Lora_400Regular,
    'Lora-SemiBold':   Lora_600SemiBold,
    'Lora-Italic':     Lora_400Regular_Italic,
  })

  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync() }, [fontsLoaded])
  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: Colors.dark }}>
        <StatusBar style="light" backgroundColor={Colors.dark} />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index"              options={{ animation: 'none' }} />
          <Stack.Screen name="onboarding"         options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)"             options={{ animation: 'none' }} />
          <Stack.Screen name="guide/[step]"       options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="vault/setup"        options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="vault/unlock"       options={{ animation: 'fade' }} />
          <Stack.Screen name="vault/files"        options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="vault/file/[id]"    options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="map/report"         options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="cases/add"          options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="cases/[cnr]"        options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="community/post"     options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="community/[id]"     options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="health/log"         options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="health/pcos"        options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="health/schemes"     options={{ animation: 'slide_from_right' }} />
        </Stack>
      </View>
    </GestureHandlerRootView>
  )
}
