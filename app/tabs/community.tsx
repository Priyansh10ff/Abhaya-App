import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ScrollView, Alert,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  fetchPosts, upvotePost, flagPost,
  CATEGORIES, CRISIS_RESOURCES,
  formatTimeAgo, truncate,
  type Post, type Category,
} from '@/lib/community'

const CRISIS_BG: Record<number, string> = {
  0: 'transparent',
  1: 'rgba(245,158,11,0.08)',
  2: 'rgba(249,115,22,0.10)',
  3: 'rgba(239,68,68,0.12)',
}
const CRISIS_BORDER: Record<number, string> = {
  0: Colors.border,
  1: 'rgba(245,158,11,0.35)',
  2: 'rgba(249,115,22,0.40)',
  3: 'rgba(239,68,68,0.50)',
}

function CrisisBanner({ level }: { level: number }) {
  if (level < 2) return null
  return (
    <View style={cb.banner}>
      <Text style={cb.icon}>{level === 3 ? '🆘' : '⚠️'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={cb.title}>
          {level === 3 ? 'This person may be in crisis' : 'This person seems distressed'}
        </Text>
        <Text style={cb.sub}>
          If you can, reply with kindness. Crisis resources: iCall 9152987821 · NCW 181
        </Text>
      </View>
    </View>
  )
}

function PostCard({ item, index, onUpvote }: {
  item: Post; index: number; onUpvote: (id: string) => void
}) {
  const cat = CATEGORIES[item.category]
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <TouchableOpacity
        style={[
          s.postCard,
          { backgroundColor: CRISIS_BG[item.crisis_level] || Colors.cardBg,
            borderColor:      CRISIS_BORDER[item.crisis_level] || Colors.border }
        ]}
        onPress={() => router.push(`/community/${item.id}` as any)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          Alert.alert('Report post', 'Flag this post as inappropriate?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Flag', style: 'destructive', onPress: () => flagPost(item.id) },
          ])
        }}
        activeOpacity={0.8}
      >
        {/* Crisis banner */}
        <CrisisBanner level={item.crisis_level} />

        {/* Category + time */}
        <View style={s.postMeta}>
          <View style={[s.catBadge, { backgroundColor: cat.color + '20' }]}>
            <Text style={s.catIcon}>{cat.icon}</Text>
            <Text style={[s.catLabel, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <Text style={s.postTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>

        {/* Content */}
        <Text style={s.postContent}>{truncate(item.content)}</Text>

        {/* Footer */}
        <View style={s.postFooter}>
          <TouchableOpacity
            style={s.upvoteBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpvote(item.id) }}
          >
            <Text style={s.upvoteIcon}>♥</Text>
            <Text style={s.upvoteCount}>{item.upvotes}</Text>
          </TouchableOpacity>
          <View style={s.replyCount}>
            <Text style={s.replyIcon}>💬</Text>
            <Text style={s.replyCountText}>{item.reply_count}</Text>
          </View>
          <Text style={s.anonTag}>🔒 anonymous</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function CommunityTab() {
  const [posts,      setPosts]      = useState<Post[]>([])
  const [filter,     setFilter]     = useState<Category | undefined>()
  const [refreshing, setRefreshing] = useState(false)
  const [page,       setPage]       = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [hasMore,    setHasMore]    = useState(true)

  useFocusEffect(useCallback(() => {
    load(undefined, 0)
  }, []))

  async function load(cat?: Category, pg = 0) {
    setLoading(true)
    const data = await fetchPosts(cat, pg)
    if (pg === 0) setPosts(data)
    else          setPosts(prev => [...prev, ...data])
    setHasMore(data.length === 20)
    setPage(pg)
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await load(filter, 0)
    setRefreshing(false)
  }

  async function handleFilter(cat?: Category) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setFilter(cat)
    await load(cat, 0)
  }

  async function handleUpvote(id: string) {
    await upvotePost(id)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p))
  }

  async function loadMore() {
    if (!hasMore || loading) return
    await load(filter, page + 1)
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Safe Space</Text>
          <Text style={s.headerSub}>Anonymous · No names · No judgment</Text>
        </View>
        <TouchableOpacity
          style={s.postBtn}
          onPress={() => router.push('/community/post' as any)}
        >
          <Text style={s.postBtnText}>+ Share</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterContent}
      >
        <TouchableOpacity
          style={[s.filterChip, !filter && s.filterChipActive]}
          onPress={() => handleFilter(undefined)}
        >
          <Text style={[s.filterChipText, !filter && s.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
          <TouchableOpacity
            key={key}
            style={[s.filterChip, filter === key && s.filterChipActive]}
            onPress={() => handleFilter(key)}
          >
            <Text style={s.filterChipIcon}>{cat.icon}</Text>
            <Text style={[s.filterChipText, filter === key && s.filterChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Crisis resources banner */}
      <View style={s.crisisBanner}>
        <Text style={s.crisisBannerText}>
          In crisis? Call iCall: 9152987821 · NCW: 181 · Women: 1091
        </Text>
      </View>

      {/* Posts */}
      {posts.length === 0 && !loading ? (
        <Animated.View entering={FadeIn.duration(500)} style={s.empty}>
          <Text style={s.emptyIcon}>💬</Text>
          <Text style={s.emptyTitle}>No posts yet</Text>
          <Text style={s.emptyBody}>
            Be the first to share. No names. No one in your life will know it's you.
          </Text>
          <TouchableOpacity
            style={s.emptyCta}
            onPress={() => router.push('/community/post' as any)}
          >
            <Text style={s.emptyCtaText}>Share something →</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
              tintColor={Colors.teal} colors={[Colors.teal]} />
          }
          renderItem={({ item, index }) => (
            <PostCard item={item} index={index} onUpvote={handleUpvote} />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore
              ? <TouchableOpacity style={s.loadMore} onPress={loadMore}>
                  <Text style={s.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              : <Text style={s.endText}>You've seen everything · Pull to refresh</Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

const cb = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    padding: Spacing.sm, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.dangerBorder,
  },
  icon:  { fontSize: 16 },
  title: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.danger, marginBottom: 2 },
  sub:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs - 1, color: Colors.danger + 'AA', lineHeight: 15 },
})

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  headerSub:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },
  postBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  postBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.white },

  filterScroll:  { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent: { paddingHorizontal: Spacing.xl, alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    flexShrink: 0,
  },
  filterChipActive:     { backgroundColor: Colors.tealDim, borderColor: Colors.teal },
  filterChipIcon:       { fontSize: 13 },
  filterChipText:       { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted   },
  filterChipTextActive: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.tealGlow    },

  crisisBanner: {
    backgroundColor: Colors.dangerLight, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.dangerBorder,
  },
  crisisBannerText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.danger, textAlign: 'center' },

  list:    { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['4x'] },
  postCard: {
    borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
  },
  postMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  catIcon:  { fontSize: 12 },
  catLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs },
  postTime: { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted },

  postContent: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 22 },

  postFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  upvoteBtn:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  upvoteIcon: { fontSize: 14, color: Colors.danger + 'AA' },
  upvoteCount:{ fontFamily: 'DMSans-Medium', fontSize: FontSize.xs, color: Colors.textMuted },
  replyCount: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  replyIcon:  { fontSize: 13 },
  replyCountText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.xs, color: Colors.textMuted },
  anonTag:    { marginLeft: 'auto', fontFamily: 'DMSans-Regular', fontSize: FontSize.xs - 1, color: Colors.textMuted },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3x'], gap: Spacing.lg },
  emptyIcon:    { fontSize: 52 },
  emptyTitle:   { fontFamily: 'Lora-SemiBold',  fontSize: FontSize.xl,  color: Colors.textPrimary, textAlign: 'center' },
  emptyBody:    { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond,  textAlign: 'center', lineHeight: 22 },
  emptyCta: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingHorizontal: Spacing['3x'], paddingVertical: Spacing.md,
  },
  emptyCtaText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },

  loadMore:     { alignItems: 'center', paddingVertical: Spacing.xl },
  loadMoreText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.tealGlow },
  endText:      { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
})
