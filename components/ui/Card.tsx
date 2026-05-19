import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Radius, Spacing } from '@/constants/colors'

interface Props {
  children:  React.ReactNode
  style?:    ViewStyle
  variant?:  'default' | 'teal' | 'danger' | 'warning'
  padding?:  number
}

export default function Card({ children, style, variant = 'default', padding }: Props) {
  return (
    <View style={[
      styles.base,
      styles[variant],
      padding !== undefined && { padding },
      style,
    ]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    padding:      Spacing.xl,
    borderWidth:  1,
  },
  default: {
    backgroundColor: Colors.cardBg,
    borderColor:     Colors.cardBorder,
  },
  teal: {
    backgroundColor: Colors.tealDim,
    borderColor:     Colors.teal + '40',
  },
  danger: {
    backgroundColor: Colors.dangerLight,
    borderColor:     Colors.dangerBorder,
  },
  warning: {
    backgroundColor: Colors.warningLight,
    borderColor:     Colors.warning + '30',
  },
})
