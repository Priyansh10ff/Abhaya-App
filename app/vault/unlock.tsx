import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Vibration,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { verifyPin, createSession, isSessionValid } from '@/lib/vault'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function VaultUnlock() {
  const [pin,      setPin]      = useState('')
  const [attempts, setAttempts] = useState(0)
  const [locked,   setLocked]   = useState(false)
  const [error,    setError]    = useState('')

  const shake = useSharedValue(0)
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }]
  }))

  useEffect(() => {
    // Check if session is still valid (within 5 min)
    isSessionValid().then(valid => {
      if (valid) router.replace('/vault/files')
    })
  }, [])

  function triggerShake() {
    Vibration.vibrate(300)
    shake.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12,  { duration: 50 }),
      withTiming(-8,  { duration: 50 }),
      withTiming(8,   { duration: 50 }),
      withTiming(0,   { duration: 50 }),
    )
  }

  function handleKey(key: string) {
    if (key === '' || locked) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (key === '⌫') {
      setPin(p => p.slice(0, -1))
      setError('')
      return
    }
    if (pin.length >= 6) return

    const next = pin + key
    setPin(next)

    if (next.length === 6) {
      setTimeout(() => handleVerify(next), 200)
    }
  }

  async function handleVerify(enteredPin: string) {
    const valid = await verifyPin(enteredPin)
    if (valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      await createSession()
      router.replace('/vault/files')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPin('')
      triggerShake()

      if (newAttempts >= 5) {
        setLocked(true)
        setError('Too many attempts. Try again in 30 seconds.')
        setTimeout(() => {
          setLocked(false)
          setAttempts(0)
          setError('')
        }, 30000)
      } else {
        setError(`Wrong PIN. ${5 - newAttempts} attempts remaining.`)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      }
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeIn.duration(400)} style={s.header}>
          <Text style={s.icon}>🔒</Text>
          <Text style={s.title}>Evidence Vault</Text>
          <Text style={s.sub}>Enter your PIN to unlock</Text>
        </Animated.View>

        {/* PIN dots */}
        <Animated.View style={[s.dotsRow, shakeStyle]}>
          {[0,1,2,3,4,5].map(i => (
            <View key={i} style={[s.dot, i < pin.length && s.dotFilled]} />
          ))}
        </Animated.View>

        {error ? (
          <Animated.Text entering={FadeIn.duration(200)} style={s.error}>
            {error}
          </Animated.Text>
        ) : (
          <Text style={s.errorPlaceholder}> </Text>
        )}

        {/* Keypad */}
        <View style={s.keypad}>
          {KEYS.map((key, i) => (
            <TouchableOpacity
              key={i}
              style={[s.key, (key === '' || locked) && s.keyDisabled]}
              onPress={() => handleKey(key)}
              disabled={key === '' || locked}
              activeOpacity={0.7}
            >
              <Text style={[s.keyLabel, key === '⌫' && s.keyBackspace]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.bottomRow}>
          <Text style={s.bottomNote}>
            🔐 5-minute session. Auto-locks when you leave.
          </Text>
        </View>

      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.dark },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },

  backBtn:  { alignSelf: 'flex-start', padding: Spacing.sm, marginBottom: Spacing.xl },
  backIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },

  header: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing['3x'] },
  icon:   { fontSize: 48 },
  title:  { fontFamily: 'Lora-SemiBold', fontSize: FontSize.xl,  color: Colors.textPrimary },
  sub:    { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond  },

  dotsRow:   { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md },
  dot:       { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.border },
  dotFilled: { backgroundColor: Colors.teal, borderColor: Colors.teal },

  error:            { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.danger, marginBottom: Spacing.lg, textAlign: 'center' },
  errorPlaceholder: { height: 20, marginBottom: Spacing.lg },

  keypad: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    width:          280,
    gap:            Spacing.md,
    justifyContent: 'center',
    marginBottom:   Spacing['3x'],
  },
  key: {
    width:           80, height: 80, borderRadius: 40,
    backgroundColor: Colors.cardBg,
    borderWidth:     1, borderColor: Colors.border,
    alignItems:      'center', justifyContent: 'center',
  },
  keyDisabled:  { opacity: 0.3 },
  keyLabel:     { fontFamily: 'DMSans-Medium',  fontSize: FontSize.xl, color: Colors.textPrimary },
  keyBackspace: { fontFamily: 'DMSans-Regular', fontSize: FontSize.lg, color: Colors.textSecond  },

  bottomRow: { alignItems: 'center', gap: Spacing.sm },
  bottomNote: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    textAlign:  'center',
  },
})
