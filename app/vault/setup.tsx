import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, TextInput, Vibration,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { setPin } from '@/lib/vault'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function VaultSetup() {
  const [step,    setStep]    = useState<'create' | 'confirm'>('create')
  const [pin,     setPin_]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [error,   setError]   = useState('')

  const shake = useSharedValue(0)
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }]
  }))

  function triggerShake() {
    Vibration.vibrate(200)
    shake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10,  { duration: 50 }),
      withTiming(-8,  { duration: 50 }),
      withTiming(8,   { duration: 50 }),
      withTiming(0,   { duration: 50 }),
    )
  }

  function handleKey(key: string) {
    if (key === '') return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (step === 'create') {
      if (key === '⌫') {
        setPin_(p => p.slice(0, -1))
        return
      }
      if (pin.length >= 6) return
      const next = pin + key
      setPin_(next)
      if (next.length === 6) {
        setTimeout(() => setStep('confirm'), 200)
      }
    } else {
      if (key === '⌫') {
        setConfirm(p => p.slice(0, -1))
        setError('')
        return
      }
      if (confirm.length >= 6) return
      const next = confirm + key
      setConfirm(next)
      if (next.length === 6) {
        setTimeout(() => handleConfirm(next), 200)
      }
    }
  }

  async function handleConfirm(confirmPin: string) {
    if (confirmPin !== pin) {
      setError('PINs don\'t match. Try again.')
      setConfirm('')
      triggerShake()
      return
    }
    await setPin(pin)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.replace('/vault/unlock')
  }

  const current = step === 'create' ? pin : confirm
  const title   = step === 'create' ? 'Create vault PIN' : 'Confirm your PIN'
  const sub     = step === 'create'
    ? 'Choose a 6-digit PIN. You\'ll need this every time you open the vault.'
    : 'Enter the same PIN again to confirm.'

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
          <Text style={s.icon}>🔒</Text>
          <Text style={s.title}>{title}</Text>
          <Text style={s.sub}>{sub}</Text>
        </Animated.View>

        {/* PIN dots */}
        <Animated.View style={[s.dotsRow, shakeStyle]}>
          {[0,1,2,3,4,5].map(i => (
            <View
              key={i}
              style={[
                s.dot,
                i < current.length && s.dotFilled,
              ]}
            />
          ))}
        </Animated.View>

        {/* Error */}
        {error ? (
          <Animated.Text entering={FadeInDown.duration(200)} style={s.error}>
            {error}
          </Animated.Text>
        ) : null}

        {/* Keypad */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.keypad}>
          {KEYS.map((key, i) => (
            <TouchableOpacity
              key={i}
              style={[s.key, key === '' && s.keyEmpty]}
              onPress={() => handleKey(key)}
              disabled={key === ''}
              activeOpacity={0.7}
            >
              <Text style={[s.keyLabel, key === '⌫' && s.keyBackspace]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Security note */}
        <Text style={s.note}>
          🔐 Your PIN is stored securely on this device only. We cannot recover it if lost.
        </Text>

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
  title:  { fontFamily: 'Lora-SemiBold', fontSize: FontSize.xl,  color: Colors.textPrimary, textAlign: 'center' },
  sub:    { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond,  textAlign: 'center', lineHeight: 21 },

  dotsRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xl },
  dot:     { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.border },
  dotFilled: { backgroundColor: Colors.teal, borderColor: Colors.teal },

  error: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.danger, marginBottom: Spacing.lg },

  keypad: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    width:         280,
    gap:           Spacing.md,
    justifyContent: 'center',
    marginBottom:  Spacing['3x'],
  },
  key: {
    width:           80, height: 80,
    borderRadius:    40,
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyLabel:     { fontFamily: 'DMSans-Medium',   fontSize: FontSize.xl,  color: Colors.textPrimary },
  keyBackspace: { fontFamily: 'DMSans-Regular',  fontSize: FontSize.lg,  color: Colors.textSecond  },

  note: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    textAlign:  'center',
    lineHeight: 18,
    maxWidth:   260,
  },
})
