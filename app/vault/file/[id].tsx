import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Share, Alert, TextInput,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  loadMetadata, deleteFromVault, updateNote,
  getFileIcon, formatSize, formatDate, type VaultFile,
} from '@/lib/vault'

export default function FileDetail() {
  const { id }          = useLocalSearchParams<{ id: string }>()
  const [file, setFile] = useState<VaultFile | null>(null)
  const [note, setNote] = useState('')
  const [editNote, setEditNote] = useState(false)

  useEffect(() => {
    loadMetadata().then(files => {
      const f = files.find(f => f.id === id)
      if (f) { setFile(f); setNote(f.note ?? '') }
    })
  }, [id])

  async function handleShare() {
    if (!file) return
    await Share.share({
      message: `Evidence file: ${file.name}\nSaved: ${formatDate(file.addedAt)}\nIntegrity hash (SHA-256): ${file.hash}\nTimestamped: ${file.timestamp?.verified ? 'Yes (RFC 3161)' : 'Locally recorded'}`,
      title:   'Evidence details — Abhaya Vault',
    })
  }

  async function handleSaveNote() {
    if (!file) return
    await updateNote(file.id, note)
    setFile(f => f ? { ...f, note } : f)
    setEditNote(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  async function handleDelete() {
    Alert.alert('Delete file?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!file) return
          await deleteFromVault(file.id)
          router.back()
        },
      },
    ])
  }

  if (!file) return null

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>{file.name}</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={s.shareIcon}>↑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* File preview */}
        <View style={s.previewWrap}>
          {file.type === 'image' ? (
            <Image source={{ uri: file.localPath }} style={s.imagePreview} resizeMode="contain" />
          ) : (
            <View style={s.iconPreview}>
              <Text style={s.iconPreviewEmoji}>{getFileIcon(file.type)}</Text>
            </View>
          )}
        </View>

        {/* File info */}
        <View style={s.infoCard}>
          <Text style={s.sectionLabel}>File details</Text>
          {[
            { label: 'Name',      value: file.name                    },
            { label: 'Type',      value: file.mimeType                },
            { label: 'Size',      value: formatSize(file.size)        },
            { label: 'Added',     value: formatDate(file.addedAt)     },
          ].map(row => (
            <View key={row.label} style={s.infoRow}>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={s.infoValue} selectable>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Integrity hash */}
        <View style={s.hashCard}>
          <View style={s.hashHeader}>
            <Text style={s.sectionLabel}>🔐 Integrity hash (SHA-256)</Text>
          </View>
          <Text style={s.hashValue} selectable numberOfLines={3}>
            {file.hash}
          </Text>
          <Text style={s.hashNote}>
            This fingerprint uniquely identifies your file. If even one pixel changes, this hash changes — proving the file hasn't been tampered with.
          </Text>
        </View>

        {/* Timestamp */}
        <View style={[s.tsCard, file.timestamp?.verified ? s.tsCardVerified : s.tsCardLocal]}>
          <Text style={s.tsTitle}>
            {file.timestamp?.verified ? '🔒 RFC 3161 Timestamp' : '⏱ Local timestamp'}
          </Text>
          {file.timestamp ? (
            <>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Recorded at</Text>
                <Text style={s.infoValue}>{formatDate(file.timestamp.fetchedAt)}</Text>
              </View>
              {file.timestamp.serialNumber && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Serial</Text>
                  <Text style={s.infoValue} selectable numberOfLines={2}>{file.timestamp.serialNumber}</Text>
                </View>
              )}
              <Text style={s.tsNote}>
                {file.timestamp.verified
                  ? 'Timestamp issued by a trusted authority. Proves this file existed at this exact time — legally admissible.'
                  : 'Locally recorded. Provides a record of when the file was added to Abhaya.'}
              </Text>
            </>
          ) : (
            <Text style={s.tsNote}>No timestamp available.</Text>
          )}
        </View>

        {/* Note */}
        <View style={s.noteCard}>
          <View style={s.noteHeader}>
            <Text style={s.sectionLabel}>📝 Your note</Text>
            {!editNote && (
              <TouchableOpacity onPress={() => setEditNote(true)}>
                <Text style={s.editBtn}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {editNote ? (
            <View style={s.noteEditWrap}>
              <TextInput
                style={s.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Add context — where this was taken, who is involved, what happened..."
                placeholderTextColor={Colors.textMuted}
                multiline
                autoFocus
              />
              <View style={s.noteActions}>
                <TouchableOpacity onPress={() => { setEditNote(false); setNote(file.note ?? '') }}>
                  <Text style={s.noteCancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.noteSaveBtn} onPress={handleSaveNote}>
                  <Text style={s.noteSaveText}>Save note</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={note ? s.noteText : s.notePlaceholder}>
              {note || 'No note added. Tap Edit to add context.'}
            </Text>
          )}
        </View>

        {/* Delete */}
        <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
          <Text style={s.deleteBtnText}>🗑 Delete from vault</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1 },
  content:{ padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.lg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon:  { fontSize: FontSize.xl, color: Colors.textPrimary },
  topTitle:  { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  shareIcon: { fontSize: FontSize.xl, color: Colors.tealGlow, paddingHorizontal: Spacing.sm },

  previewWrap:   { alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  imagePreview:  { width: '100%', height: 260, borderRadius: Radius.xl },
  iconPreview: {
    width: 120, height: 120, borderRadius: Radius.xxl,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  iconPreviewEmoji: { fontSize: 52 },

  sectionLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm },

  infoCard: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md },
  infoRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md },
  infoLabel:{ fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textMuted,  flex: 1 },
  infoValue:{ fontFamily: 'DMSans-Medium',   fontSize: FontSize.sm, color: Colors.textPrimary, flex: 2, textAlign: 'right' },

  hashCard: { backgroundColor: Colors.dark3, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md },
  hashHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hashValue: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.tealGlow, lineHeight: 18, letterSpacing: 0.5 },
  hashNote:  { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },

  tsCard:         { borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md, borderWidth: 1 },
  tsCardVerified: { backgroundColor: Colors.tealDim, borderColor: Colors.teal + '40' },
  tsCardLocal:    { backgroundColor: Colors.warningLight, borderColor: Colors.warning + '30' },
  tsTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  tsNote:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textSecond, lineHeight: 18 },

  noteCard: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md },
  noteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editBtn:    { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.tealGlow },
  noteText:        { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21 },
  notePlaceholder: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted,  lineHeight: 21, fontStyle: 'italic' },
  noteEditWrap: { gap: Spacing.md },
  noteInput: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md,
    fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top',
  },
  noteActions:   { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md },
  noteCancelBtn: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.textMuted, padding: Spacing.sm },
  noteSaveBtn:   { backgroundColor: Colors.teal, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  noteSaveText:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },

  deleteBtn: {
    backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerBorder,
    borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center',
  },
  deleteBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.danger },
})
