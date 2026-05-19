import { Tabs }           from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontSize } from '@/constants/colors'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:    false,
        tabBarStyle:    styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛡️" label="Guide" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="legal"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚖️" label="Legal AI" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="fir"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label="FIR" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="☰" label="More" focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D1825',
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    height:          70,
    paddingBottom:   10,
    paddingTop:      6,
  },
  tabItem: {
    alignItems:  'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabEmoji:  { fontSize: 20 },
  tabLabel:  {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs - 1,
    color:      Colors.textMuted,
  },
  tabLabelActive: { color: Colors.tealGlow },
})
