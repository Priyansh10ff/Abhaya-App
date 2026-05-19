import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Colors, Radius, FontSize, Spacing } from '@/constants/colors'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface Props {
  label:      string
  onPress:    () => void
  variant?:   Variant
  size?:      Size
  loading?:   boolean
  disabled?:  boolean
  icon?:      React.ReactNode
  fullWidth?: boolean
  style?:     ViewStyle
}

export default function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, fullWidth = false, style,
}: Props) {

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style ?? {},
  ]

  const textStyle: TextStyle[] = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
  ]

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.tealGlow}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.sm,
    borderRadius:   Radius.full,
  },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },

  // Variants
  primary: {
    backgroundColor: Colors.teal,
  },
  secondary: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     Colors.tealGlow + '40',
  },
  danger: {
    backgroundColor: Colors.dangerLight,
    borderWidth:     1,
    borderColor:     Colors.dangerBorder,
  },

  // Sizes
  size_sm: { paddingHorizontal: Spacing.md,  paddingVertical: Spacing.sm  },
  size_md: { paddingHorizontal: Spacing.xl,  paddingVertical: Spacing.md  },
  size_lg: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg  },

  // Labels
  label:           { fontFamily: 'DMSans-SemiBold' },
  label_primary:   { color: Colors.white },
  label_secondary: { color: Colors.textPrimary },
  label_ghost:     { color: Colors.tealGlow },
  label_danger:    { color: Colors.danger },

  labelSize_sm:    { fontSize: FontSize.xs },
  labelSize_md:    { fontSize: FontSize.sm },
  labelSize_lg:    { fontSize: FontSize.base },
})
