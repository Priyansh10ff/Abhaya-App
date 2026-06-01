import Constants from 'expo-constants'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Constants.expoConfig?.extra?.supabaseUrl  ?? '',
  Constants.expoConfig?.extra?.supabaseAnon ?? '',
)

// ─── Types ──────────────────────────────────────────────
export type Category =
  | 'domestic_violence'
  | 'workplace'
  | 'legal_help'
  | 'mental_health'
  | 'safety'
  | 'general'

export type CrisisLevel = 0 | 1 | 2 | 3
// 0 = safe, 1 = watch, 2 = concern, 3 = crisis

export interface Post {
  id:           string
  content:      string
  category:     Category
  created_at:   string
  upvotes:      number
  reply_count:  number
  crisis_level: CrisisLevel
  is_flagged:   boolean
}

export interface Reply {
  id:           string
  post_id:      string
  content:      string
  created_at:   string
  upvotes:      number
  is_volunteer: boolean
}

export interface NewPost {
  content:      string
  category:     Category
  crisis_level: CrisisLevel
}

// ─── Category metadata ──────────────────────────────────
export const CATEGORIES: Record<Category, { label: string; icon: string; color: string; desc: string }> = {
  domestic_violence: { label: 'Domestic violence',    icon: '🏠', color: '#EF4444', desc: 'DV, abuse at home, family violence' },
  workplace:         { label: 'Workplace harassment', icon: '💼', color: '#F97316', desc: 'POSH, boss/colleague harassment'     },
  legal_help:        { label: 'Legal questions',      icon: '⚖️', color: '#3B82F6', desc: 'FIR, rights, lawyers, court'         },
  mental_health:     { label: 'Mental health',        icon: '💙', color: '#8B5CF6', desc: 'Stress, anxiety, trauma, support'    },
  safety:            { label: 'Safety',               icon: '🛡️', color: '#0B6860', desc: 'Stalking, threats, unsafe situations' },
  general:           { label: 'General',              icon: '💬', color: '#6B7280', desc: 'Anything else on your mind'           },
}

// ─── Fetch posts (paginated) ─────────────────────────────
export async function fetchPosts(
  category?:  Category,
  page:        number   = 0,
  pageSize:    number   = 20,
): Promise<Post[]> {
  try {
    let query = supabase
      .from('community_posts')
      .select('*')
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Post[]
  } catch {
    return []
  }
}

// ─── Fetch single post ───────────────────────────────────
export async function fetchPost(id: string): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Post
  } catch {
    return null
  }
}

// ─── Fetch replies ───────────────────────────────────────
export async function fetchReplies(postId: string): Promise<Reply[]> {
  try {
    const { data, error } = await supabase
      .from('community_replies')
      .select('*')
      .eq('post_id', postId)
      .eq('is_flagged', false)
      .order('is_volunteer', { ascending: false }) // Volunteer replies first
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as Reply[]
  } catch {
    return []
  }
}

// ─── Submit post (anonymous) ────────────────────────────
export async function submitPost(post: NewPost): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert([{
        content:      post.content,
        category:     post.category,
        crisis_level: post.crisis_level,
        upvotes:      0,
        reply_count:  0,
        is_flagged:   false,
        created_at:   new Date().toISOString(),
      }])
      .select()
      .single()
    if (error) throw error
    return data as Post
  } catch {
    return null
  }
}

// ─── Submit reply (anonymous) ────────────────────────────
export async function submitReply(postId: string, content: string): Promise<Reply | null> {
  try {
    const { data, error } = await supabase
      .from('community_replies')
      .insert([{
        post_id:      postId,
        content,
        upvotes:      0,
        is_volunteer: false,
        is_flagged:   false,
        created_at:   new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) throw error

    // Increment reply count
    await supabase.rpc('increment_reply_count', { post_id: postId })

    return data as Reply
  } catch {
    return null
  }
}

// ─── Upvote post ─────────────────────────────────────────
export async function upvotePost(id: string): Promise<void> {
  await supabase.rpc('increment_post_upvote', { post_id: id })
}

// ─── Upvote reply ────────────────────────────────────────
export async function upvoteReply(id: string): Promise<void> {
  await supabase.rpc('increment_reply_upvote', { reply_id: id })
}

// ─── Flag post ───────────────────────────────────────────
export async function flagPost(id: string): Promise<void> {
  await supabase.from('community_posts').update({ is_flagged: true }).eq('id', id)
}

// ─── Helpers ────────────────────────────────────────────
export function formatTimeAgo(dateStr: string): string {
  const now  = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60)       return 'just now'
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800)   return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function truncate(text: string, max = 140): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

// ─── Crisis resources ────────────────────────────────────
export const CRISIS_RESOURCES = [
  { name: 'iCall (Mental health)',  number: '9152987821', available: 'Mon–Sat 8am–10pm' },
  { name: 'Vandrevala Foundation',  number: '1860-2662-345', available: '24/7'           },
  { name: 'NCW Helpline',           number: '181',         available: '24/7'           },
  { name: 'Women Helpline',         number: '1091',        available: '24/7'           },
]
