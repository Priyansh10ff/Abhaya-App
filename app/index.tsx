import { useEffect } from 'react'
import { Redirect }  from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { isOnboarded, loadChatHistory, getLanguage } from '@/lib/storage'
import { useAppStore } from '@/store/app'
import { Colors } from '@/constants/colors'
import { useState } from 'react'

export default function Index() {
  const [ready,    setReady]    = useState(false)
  const [dest,     setDest]     = useState<'/onboarding' | '/tabs'>('/onboarding')
  const { setOnboarded, setLanguage, chatMessages, addMessage } = useAppStore()

  useEffect(() => {
    async function boot() {
      // Load persisted state
      const [onboarded, history, lang] = await Promise.all([
        isOnboarded(),
        loadChatHistory(),
        getLanguage(),
      ])

      setOnboarded(onboarded)
      setLanguage(lang)

      // Restore chat history if empty in store
      if (chatMessages.length === 0 && history.length > 0) {
        history.forEach(m => addMessage(m))
      }

      setDest(onboarded ? '/tabs' : '/onboarding')
      setReady(true)
    }
    boot()
  }, [])

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.teal} />
      </View>
    )
  }

  return <Redirect href={dest} />
}

const styles = StyleSheet.create({
  center: {
    flex:            1,
    backgroundColor: Colors.dark,
    alignItems:      'center',
    justifyContent:  'center',
  },
})
