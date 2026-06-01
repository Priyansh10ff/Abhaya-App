import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Linking,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  fetchPost, fetchReplies, submitReply, upvotePost, upvoteReply, flagPost,
  CATEGORIES, CRISIS_RESOURCES, formatTimeAgo,
  type Post, type Reply,
} from '@/lib/community'

function ReplyBubble({ reply, index }: { reply: Reply; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(350)} style={[
      s.reply,
      reply.is_volunteer && s.replyVolunteer,
    ]}>
      {reply.is_volunteer && (
        <View style={s.volunteerTag}>
          <Text style={s.volunteerTagText}>💚 Volunteer</Text>
        </View>
      )}
      <Text style={s.replyContent}>{reply.content}</Text>
      <View style={s.replyFooter}>
        <Text style={s.replyTime}>{formatTimeAgo(reply.created_at)}</Text>
        <TouchableOpacity
          style={s.replyUpvote}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); upvoteReply(reply.id) }}
        >
          <Text style={s.replyUpvoteIcon}>♥</Text>
          <Text style={s.replyUpvoteCount}>{reply.upvotes}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

export default function PostDetail() {
  const { id }               = useLocalSearchParams<{ id: string }>()
  const [post,    setPost]   = useState<Post | null>(null)
  const [replies, setReplies]= useState<Reply[]>([])
  const [reply,   setReply]  = useState('')
  const [sending, setSending]= useState(false)
  const listRef              = useRef<FlatList>(null)

  useEffect(() => { load() }, [id])

  async function load() {
    const [p, r] = await Promise.all([fetchPost(id), fetchReplies(id)])
    if (p) setPost(p)
    setReplies(r)
  }

  async function handleSendReply() {
    if (!reply.trim() || reply.trim().length < 3 || !id) return
    setSending(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const result = await submitReply(id, reply.trim())
    setSending(false)
    if (result) {
      setReply('')
      setReplies(prev => [...prev, result])
      setPost(p => p ? { ...p, reply_count: p.reply_count + 1 } : p)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Alert.alert('Could not send', 'Check your connection.')
    }
  }

  if (!post) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
      </SafeAreaView>
    )
  }

  const cat = CATEGORIES[post.category]

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={[s.catBadge, { backgroundColor: cat.color + '20' }]}>
            <Text>{cat.icon}</Text>
            <Text style={[s.catLabel, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <TouchableOpacity onPress={() => {
            Alert.alert('Report post', 'Flag this as inappropriate?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Flag', style: 'destructive', onPress: () => flagPost(post.id) },
            ])
          }}>
            <Text style={s.flagBtn}>⚑</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={replies}
          keyExtractor={r => r.id}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Original post */}
              <Animated.View entering={FadeIn.duration(400)} style={[
                s.postCard,
                post.crisis_level >= 2 && s.postCardCrisis,
              ]}>
                <Text style={s.postContent}>{post.content}</Text>
                <View style={s.postFooter}>
                  <Text style={s.postTime}>{formatTimeAgo(post.created_at)}</Text>
                  <TouchableOpacity
                    style={s.upvoteBtn}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); upvotePost(post.id) }}
                  >
                    <Text style={s.upvoteIcon}>♥</Text>
                    <Text style={s.upvoteCount}>{post.upvotes}</Text>
                  </TouchableOpacity>
                  <Text style={s.anonTag}>🔒 anonymous</Text>
                </View>
              </Animated.View>

              {/* Crisis resources if needed */}
              {post.crisis_level >= 2 && (
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.crisisCard}>
                  <Text style={s.crisisTitle}>
                    {post.crisis_level === 3 ? '🆘 Crisis resources' : '💙 Support resources'}
                  </Text>
                  <Text style={s.crisisBody}>
                    If you or someone you know needs help right now:
                  </Text>
                  {CRISIS_RESOURCES.slice(0, 3).map(r => (
                    <TouchableOpacity
                      key={r.number}
                      style={s.crisisResource}
                      onPress={() => Linking.openURL(`tel:${r.number}`)}
                    >
                      <Text style={s.crisisResourceName}>{r.name}</Text>
                      <Text style={s.crisisResourceNum}>{r.number}</Text>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}

              {/* Replies header */}
              {replies.length > 0 ? (
                <Text style={s.repliesHeader}>
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </Text>
              ) : (
                <View style={s.noReplies}>
                  <Text style={s.noRepliesText}>
                    No replies yet. Be the first to respond with kindness.
                  </Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <ReplyBubble reply={item} index={index} />
          )}
        />

        {/* Reply input */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={reply}
            onChangeText={setReply}
            placeholder="Reply anonymously with kindness..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!reply.trim() || sending) && s.sendBtnDim]}
            onPress={handleSendReply}
            disabled={!reply.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={s.sendIcon}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:{ padding: Spacing.xl, paddingBottom: Spacing['3x'], gap: Spacing.md },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },
  catBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, alignSelf: 'flex-start' },
  catLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs },
  flagBtn:  { fontSize: FontSize.lg, color: Colors.textMuted, padding: Spacing.sm },

  postCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
  },
  postCardCrisis: { borderColor: Colors.dangerBorder, backgroundColor: Colors.dangerLight + '22' },
  postContent:    { fontFamily: 'DMSans-Regular', fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 24 },
  postFooter:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  postTime:       { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
  upvoteBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  upvoteIcon:     { fontSize: 14, color: Colors.danger + 'AA' },
  upvoteCount:    { fontFamily: 'DMSans-Medium', fontSize: FontSize.xs, color: Colors.textMuted },
  anonTag:        { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs - 1, color: Colors.textMuted },

  crisisCard: {
    backgroundColor: Colors.dangerLight, borderRadius: Radius.xl,
    padding: Spacing.xl, gap: Spacing.md, borderWidth: 1, borderColor: Colors.dangerBorder,
  },
  crisisTitle:       { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.danger },
  crisisBody:        { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.danger + 'CC' },
  crisisResource: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.dangerBorder + '40',
  },
  crisisResourceName: { fontFamily: 'DMSans-Medium',   fontSize: FontSize.sm,  color: Colors.danger      },
  crisisResourceNum:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.danger      },

  repliesHeader: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  noReplies:     { alignItems: 'center', paddingVertical: Spacing.lg },
  noRepliesText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  reply: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.sm,
  },
  replyVolunteer: { borderColor: Colors.success + '50', backgroundColor: Colors.successLight + '22' },
  volunteerTag: {
    flexDirection: 'row', alignSelf: 'flex-start',
    backgroundColor: Colors.successLight, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  volunteerTagText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs - 1, color: Colors.success },
  replyContent:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21 },
  replyFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyTime:     { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs - 1, color: Colors.textMuted },
  replyUpvote:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyUpvoteIcon: { fontSize: 12, color: Colors.danger + '80' },
  replyUpvoteCount:{ fontFamily: 'DMSans-Regular', fontSize: FontSize.xs - 1, color: Colors.textMuted },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.dark,
  },
  input: {
    flex: 1, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textPrimary,
    maxHeight: 120,
  },
  sendBtn:    { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
  sendBtnDim: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  sendIcon:   { fontSize: FontSize.md, color: Colors.white, fontWeight: '700' },
})
