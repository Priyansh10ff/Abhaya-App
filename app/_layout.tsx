import { useEffect } from 'react'
import { Stack }     from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Font from 'expo-font'
import { View, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Colors } from '@/constants/colors'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = Font.useFonts({
    'DMSans-Regular':   require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium':    require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold':  require('../assets/fonts/DMSans-SemiBold.ttf'),
    'Lora-Regular':     require('../assets/fonts/Lora-Regular.ttf'),
    'Lora-SemiBold':    require('../assets/fonts/Lora-SemiBold.ttf'),
    'Lora-Italic':      require('../assets/fonts/Lora-Italic.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.root}>
        <StatusBar style="light" backgroundColor={Colors.dark} />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index"          options={{ animation: 'none' }} />
          <Stack.Screen name="onboarding"     options={{ animation: 'fade'  }} />
          <Stack.Screen name="tabs"           options={{ animation: 'none' }} />
          <Stack.Screen name="guide/[step]"   options={{ animation: 'slide_from_right' }} />
        </Stack>
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
})
