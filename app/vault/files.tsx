import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, Modal,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import * as ImagePicker    from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  loadMetadata, addFileToVault, deleteFromVault,
  getFileIcon, formatSize, formatDate,
  clearSession, type VaultFile,
} from '@/lib/vault'

type AddSheet = 'closed' | 'open'

export default function VaultFiles() {
  const [files,      setFiles]      = useState<VaultFile[]>([])
  const [loading,    setLoading]    = useState(true)
  const [adding,     setAdding]     = useState(false)
  const [addStep,    setAddStep]    = useState('')
  const [addSheet,   setAddSheet]   = useState<AddSheet>('closed')

  // Reload when screen focuses
  useFocusEffect(useCallback(() => {
    loadFiles()
  }, []))

  async function loadFiles() {
    setLoading(true)
    const data = await loadMetadata()
    setFiles(data.sort((a, b) => b.addedAt - a.addedAt))
    setLoading(false)
  }

  async function handleAddImage() {
    setAddSheet('closed')
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality:    1,
      allowsMultipleSelection: false,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    await addFile(
      asset.uri,
      asset.fileName ?? `photo_${Date.now()}.jpg`,
      asset.mimeType ?? 'image/jpeg',
      asset.fileSize ?? 0,
    )
  }

  async function handleAddDocument() {
    setAddSheet('closed')
    const result = await DocumentPicker.getDocumentAsync({
      type:   '*/*',
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    await addFile(
      asset.uri,
      asset.name,
      asset.mimeType ?? 'application/octet-stream',
      asset.size ?? 0,
    )
  }

  async function addFile(uri: string, name: string, mime: string, size: number) {
    setAdding(true)
    try {
      await addFileToVault(uri, name, mime, size, undefined, setAddStep)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      await loadFiles()
    } catch (e) {
      Alert.alert('Error', 'Failed to add file to vault.')
    } finally {
      setAdding(false)
      setAddStep('')
    }
  }

  async function handleDelete(file: VaultFile) {
    Alert.alert(
      'Delete file?',
      `"${file.name}" will be permanently removed from the vault.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteFromVault(file.id)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            await loadFiles()
          },
        },
      ]
    )
  }

  async function handleLock() {
    await clearSession()
    router.replace('/vault/unlock')
  }

  function renderFile({ item, index }: { item: VaultFile; index: number }) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <TouchableOpacity
          style={s.fileCard}
          onPress={() => router.push(`/vault/file/${item.id}` as any)}
          onLongPress={() => handleDelete(item)}
          activeOpacity={0.8}
        >
          <View style={s.fileIconWrap}>
            <Text style={s.fileIcon}>{getFileIcon(item.type)}</Text>
          </View>
          <View style={s.fileMeta}>
            <Text style={s.fileName} numberOfLines={1}>{item.name}</Text>
            <Text style={s.fileInfo}>
              {formatSize(item.size)} · {formatDate(item.addedAt)}
            </Text>
            {item.note && (
              <Text style={s.fileNote} numberOfLines={1}>📝 {item.note}</Text>
            )}
          </View>
          <View style={s.fileRight}>
            {item.timestamp ? (
              <View style={[s.tsBadge, item.timestamp.verified ? s.tsBadgeVerified : s.tsBadgeLocal]}>
                <Text style={s.tsText}>
                  {item.timestamp.verified ? '🔒 Timestamped' : '⏱ Recorded'}
                </Text>
              </View>
            ) : null}
            <Text style={s.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Evidence Vault</Text>
          <Text style={s.headerSub}>{files.length} files · tap to view · hold to delete</Text>
        </View>
        <TouchableOpacity style={s.lockBtn} onPress={handleLock}>
          <Text style={s.lockIcon}>🔒</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.teal} size="large" />
        </View>
      ) : files.length === 0 ? (
        <Animated.View entering={FadeIn.duration(500)} style={s.empty}>
          <Text style={s.emptyIcon}>🔒</Text>
          <Text style={s.emptyTitle}>Vault is empty</Text>
          <Text style={s.emptyBody}>
            Add screenshots of threatening messages, photos, voice notes — any evidence that matters. Each file gets a legal timestamp proving when it was saved.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderFile}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add button */}
      <TouchableOpacity
        style={s.addBtn}
        onPress={() => setAddSheet('open')}
        activeOpacity={0.85}
      >
        <Text style={s.addBtnText}>+ Add evidence</Text>
      </TouchableOpacity>

      {/* Add options sheet */}
      <Modal
        visible={addSheet === 'open'}
        transparent
        animationType="slide"
        onRequestClose={() => setAddSheet('closed')}
      >
        <TouchableOpacity style={s.sheetOverlay} onPress={() => setAddSheet('closed')} activeOpacity={1}>
          <Animated.View entering={FadeInDown.duration(300)} style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Add to vault</Text>
            <Text style={s.sheetSub}>All files are stored privately on this device only</Text>

            {[
              { icon: '📸', label: 'Photo or video',    sub: 'From your gallery',       action: handleAddImage    },
              { icon: '📄', label: 'Document or file',  sub: 'PDF, text, audio, other', action: handleAddDocument },
            ].map(opt => (
              <TouchableOpacity key={opt.label} style={s.sheetOption} onPress={opt.action}>
                <Text style={s.sheetOptIcon}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.sheetOptLabel}>{opt.label}</Text>
                  <Text style={s.sheetOptSub}>{opt.sub}</Text>
                </View>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={s.sheetCancel} onPress={() => setAddSheet('closed')}>
              <Text style={s.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Adding progress overlay */}
      <Modal visible={adding} transparent animationType="fade">
        <View style={s.progressOverlay}>
          <View style={s.progressCard}>
            <ActivityIndicator size="large" color={Colors.tealGlow} />
            <Text style={s.progressTitle}>Securing file</Text>
            <Text style={s.progressStep}>{addStep}</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon:   { fontSize: FontSize.xl, color: Colors.textPrimary },
  headerTitle:{ fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary, flex: 1 },
  headerSub:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },
  lockBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  lockIcon:   { fontSize: 20 },

  list: { padding: Spacing.xl, gap: Spacing.sm, paddingBottom: 100 },

  fileCard: {
    flexDirection:   'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius:    Radius.xl, padding: Spacing.lg,
  },
  fileIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.dark3,
    alignItems: 'center', justifyContent: 'center',
  },
  fileIcon:  { fontSize: 22 },
  fileMeta:  { flex: 1, gap: 2 },
  fileName:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm,  color: Colors.textPrimary },
  fileInfo:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,  color: Colors.textMuted   },
  fileNote:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,  color: Colors.textSecond  },
  fileRight: { alignItems: 'flex-end', gap: Spacing.xs },
  tsBadge:   { borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tsBadgeVerified: { backgroundColor: Colors.tealDim,     borderWidth: 1, borderColor: Colors.teal + '40' },
  tsBadgeLocal:    { backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warning + '30' },
  tsText:    { fontFamily: 'DMSans-SemiBold', fontSize: 9, color: Colors.tealGlow },
  chevron:   { fontSize: FontSize.lg, color: Colors.textMuted },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing['3x'], gap: Spacing.lg,
  },
  emptyIcon:  { fontSize: 56 },
  emptyTitle: { fontFamily: 'Lora-SemiBold', fontSize: FontSize.xl,  color: Colors.textPrimary, textAlign: 'center' },
  emptyBody:  { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond,  textAlign: 'center', lineHeight: 22 },

  addBtn: {
    position: 'absolute', bottom: 24, left: Spacing.xl, right: Spacing.xl,
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  addBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },

  sheetOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.dark2, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.md,
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  sheetTitle:  { fontFamily: 'Lora-SemiBold',  fontSize: FontSize.lg,  color: Colors.textPrimary },
  sheetSub:    { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,  color: Colors.textMuted, marginTop: -Spacing.sm },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg,
  },
  sheetOptIcon:  { fontSize: 26 },
  sheetOptLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  sheetOptSub:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,  color: Colors.textMuted   },
  sheetCancel: { alignItems: 'center', paddingVertical: Spacing.md },
  sheetCancelText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.textMuted },

  progressOverlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center' },
  progressCard: {
    backgroundColor: Colors.dark2, borderRadius: Radius.xxl,
    padding: Spacing['3x'], alignItems: 'center', gap: Spacing.md,
    width: 240, borderWidth: 1, borderColor: Colors.border,
  },
  progressTitle: { fontFamily: 'Lora-SemiBold',  fontSize: FontSize.lg, color: Colors.textPrimary },
  progressStep:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond, textAlign: 'center' },
})
