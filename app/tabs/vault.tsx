import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { isPinSet, isSessionValid } from '@/lib/vault'
import { Colors } from '@/constants/colors'

// This tab acts as a router:
// No PIN set → vault/setup
// PIN set + session valid → vault/files
// PIN set + session expired → vault/unlock

export default function VaultTab() {
  useEffect(() => {
    async function route() {
      const pinSet  = await isPinSet()
      if (!pinSet) {
        router.push('/vault/setup')
        return
      }
      const session = await isSessionValid()
      router.push(session ? '/vault/files' : '/vault/unlock')
    }
    route()
  }, [])

  return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={Colors.teal} />
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
})
