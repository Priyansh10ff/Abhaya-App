import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontSize } from '@/constants/colors'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={s.item}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={[s.label, focused && s.labelActive]}>{label}</Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: s.bar, tabBarShowLabel: false }}>
      <Tabs.Screen name="home"   options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home"   focused={focused} /> }} />
      <Tabs.Screen name="guide"  options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" label="Guide"  focused={focused} /> }} />
      <Tabs.Screen name="legal"  options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚖️" label="Legal"  focused={focused} /> }} />
      <Tabs.Screen name="health" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🩺" label="Health" focused={focused} /> }} />
      <Tabs.Screen name="more"   options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="☰"  label="More"   focused={focused} /> }} />
    </Tabs>
  )
}

const s = StyleSheet.create({
  bar:        { backgroundColor: '#0D1825', borderTopWidth: 1, borderTopColor: Colors.border, height: 70, paddingBottom: 10, paddingTop: 6 },
  item:       { alignItems: 'center', justifyContent: 'center', gap: 2 },
  emoji:      { fontSize: 20 },
  label:      { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs - 1, color: Colors.textMuted  },
  labelActive:{ fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs - 1, color: Colors.tealGlow   },
})
