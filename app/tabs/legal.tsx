import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Constants from 'expo-constants'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { sendLegalMessage, QUICK_QUESTIONS, type Message } from '@/lib/claude'
import { useAppStore } from '@/store/app'
import { saveChatHistory } from '@/lib/storage'

const API_KEY = Constants.expoConfig?.extra?.claudeApiKey ?? ''

function Bubble({ msg, isFirst }: { msg: { role: string; content: string; timestamp: number }; isFirst?: boolean }) {
  const isUser = msg.role === 'user'
  const time   = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.bubbleWrap, isUser ? styles.bubbleWrapUser : styles.bubbleWrapAI]}
    >
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={{ fontSize: 14 }}>⚖️</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {msg.content}
        </Text>
        <Text style={styles.bubbleTime}>{time}</Text>
      </View>
    </Animated.View>
  )
}

export default function LegalTab() {
  const { chatMessages, addMessage, isChatLoading, setChatLoading, clearChat } = useAppStore()
  const [input,   setInput]   = useState('')
  const [error,   setError]   = useState('')
  const scrollRef             = useRef<ScrollView>(null)

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [chatMessages, isChatLoading])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || isChatLoading) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setInput('')
    setError('')

    const userMsg = { role: 'user' as const, content, timestamp: Date.now() }
    addMessage(userMsg)
    setChatLoading(true)

    try {
      // Build messages array for API (exclude timestamps for API call)
      const apiMessages: Message[] = [...chatMessages, userMsg].map(m => ({
        role:    m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const reply = await sendLegalMessage(apiMessages, API_KEY)
      const aiMsg = { role: 'assistant' as const, content: reply, timestamp: Date.now() }
      addMessage(aiMsg)

      // Persist to storage
      await saveChatHistory([...chatMessages, userMsg, aiMsg])
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Check your connection.')
    } finally {
      setChatLoading(false)
    }
  }

  const showWelcome = chatMessages.length === 0

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.aiIcon}><Text style={{ fontSize: 18 }}>⚖️</Text></View>
            <View>
              <Text style={styles.headerTitle}>Legal Rights AI</Text>
              <Text style={styles.headerSub}>Powered by Claude · Not legal advice</Text>
            </View>
          </View>
          {chatMessages.length > 0 && (
            <TouchableOpacity onPress={() => { clearChat(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}>
              <Text style={styles.clearBtn}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {showWelcome ? (
            <Animated.View entering={FadeIn.duration(500)} style={styles.welcome}>
              <Text style={styles.welcomeEmoji}>⚖️</Text>
              <Text style={styles.welcomeTitle}>Know your rights</Text>
              <Text style={styles.welcomeBody}>
                Ask anything about your legal rights under Indian law — DV Act, POSH, FIR process, free legal aid, protection orders, and more. Available in Hindi, Kannada, Tamil, Telugu, Bengali.
              </Text>
              <View style={styles.disclaimer}>
                <Text style={styles.disclaimerText}>
                  ℹ️ This provides legal information, not legal advice. For complex cases, connect with a free DLSA lawyer.
                </Text>
              </View>

              {/* Quick questions */}
              <Text style={styles.quickLabel}>Common questions</Text>
              <View style={styles.quickList}>
                {QUICK_QUESTIONS.map(q => (
                  <TouchableOpacity
                    key={q}
                    style={styles.quickChip}
                    onPress={() => send(q)}
                  >
                    <Text style={styles.quickChipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ) : (
            <View style={styles.messages}>
              {chatMessages.map((m, i) => (
                <Bubble key={i} msg={m} isFirst={i === 0} />
              ))}
              {isChatLoading && (
                <View style={styles.loadingBubble}>
                  <View style={styles.aiAvatar}>
                    <Text style={{ fontSize: 14 }}>⚖️</Text>
                  </View>
                  <View style={styles.bubbleAI}>
                    <View style={styles.typingDots}>
                      {[0,1,2].map(i => (
                        <View key={i} style={[styles.dot, { opacity: 0.4 + i * 0.2 }]} />
                      ))}
                    </View>
                  </View>
                </View>
              )}
              {error && (
                <View style={styles.errorBubble}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Quick chips when chatting */}
        {!showWelcome && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}
          >
            {QUICK_QUESTIONS.slice(0, 4).map(q => (
              <TouchableOpacity key={q} style={styles.miniChip} onPress={() => send(q)}>
                <Text style={styles.miniChipText} numberOfLines={1}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your rights..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isChatLoading) && styles.sendBtnDim]}
            onPress={() => send()}
            disabled={!input.trim() || isChatLoading}
          >
            {isChatLoading
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={styles.sendIcon}>↑</Text>
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.dark },

  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  aiIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.tealDim,
    borderWidth: 1, borderColor: Colors.teal + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  headerSub:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },
  clearBtn:    { fontFamily: 'DMSans-Medium',   fontSize: FontSize.sm,   color: Colors.tealGlow    },

  scroll:        { flex: 1 },
  scrollContent: { flexGrow: 1, padding: Spacing.xl },

  // Welcome
  welcome: { flex: 1, gap: Spacing.xl },
  welcomeEmoji: { fontSize: 48, textAlign: 'center', marginTop: Spacing['3x'] },
  welcomeTitle: {
    fontFamily: 'Lora-SemiBold',
    fontSize:   FontSize.xl,
    color:      Colors.textPrimary,
    textAlign:  'center',
  },
  welcomeBody: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.sm,
    color:      Colors.textSecond,
    textAlign:  'center',
    lineHeight: 22,
  },
  disclaimer: {
    backgroundColor: Colors.tealDim,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.teal + '30',
  },
  disclaimerText: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs,
    color:      Colors.tealGlow + 'AA',
    lineHeight: 18,
    textAlign:  'center',
  },
  quickLabel: {
    fontFamily: 'DMSans-SemiBold',
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  quickList: { gap: Spacing.sm },
  quickChip: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
  },
  quickChipText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond },

  // Messages
  messages: { gap: Spacing.md },
  bubbleWrap:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  bubbleWrapUser: { flexDirection: 'row-reverse' },
  bubbleWrapAI:   {},
  aiAvatar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.tealDim,
    borderWidth: 1, borderColor: Colors.teal + '30',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bubble:     { maxWidth: '80%', borderRadius: Radius.xl, padding: Spacing.md, gap: Spacing.xs },
  bubbleUser: { backgroundColor: Colors.teal, borderBottomRightRadius: 4 },
  bubbleAI:   {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText:     { fontSize: FontSize.sm, lineHeight: 21 },
  bubbleTextUser: { fontFamily: 'DMSans-Regular', color: Colors.white },
  bubbleTextAI:   { fontFamily: 'DMSans-Regular', color: Colors.textSecond },
  bubbleTime: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs - 1,
    color:      Colors.textMuted,
    alignSelf:  'flex-end',
  },

  // Loading
  loadingBubble: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  typingDots: { flexDirection: 'row', gap: 4, padding: Spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.tealGlow },

  // Error
  errorBubble: {
    backgroundColor: Colors.dangerLight,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.dangerBorder,
  },
  errorText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.danger },

  // Chips
  chipsScroll: { maxHeight: 48, paddingVertical: Spacing.sm },
  miniChip: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    flexShrink: 0,
  },
  miniChipText: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs,
    color:      Colors.textSecond,
    maxWidth:   180,
  },

  // Input
  inputBar: {
    flexDirection:   'row',
    alignItems:      'flex-end',
    gap:             Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
    backgroundColor: Colors.dark,
  },
  input: {
    flex:            1,
    backgroundColor: Colors.inputBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    fontFamily:      'DMSans-Regular',
    fontSize:        FontSize.sm,
    color:           Colors.textPrimary,
    maxHeight:       120,
  },
  sendBtn: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: Colors.teal,
    alignItems:      'center',
    justifyContent:  'center',
  },
  sendBtnDim: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  sendIcon: { fontSize: FontSize.md, color: Colors.white, fontWeight: '700' },
})
