'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, ScrollView, Modal, Linking, Alert,
} from 'react-native'
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import * as Location from 'expo-location'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  fetchReports, CATEGORIES, TIME_OPTIONS, calculateSafetyScore,
  getSafetyLabel, type SafetyReport, type TimeOfDay, type Category,
} from '@/lib/safety-map'

// Dark map style matching our app theme
const DARK_MAP_STYLE = [
  { elementType: 'geometry',                 stylers: [{ color: '#0d1825' }] },
  { elementType: 'labels.text.fill',         stylers: [{ color: '#5a7a8a' }] },
  { elementType: 'labels.text.stroke',       stylers: [{ color: '#0d1825' }] },
  { featureType: 'road',      elementType: 'geometry',       stylers: [{ color: '#1e3040' }] },
  { featureType: 'road',      elementType: 'geometry.stroke', stylers: [{ color: '#0d1825' }] },
  { featureType: 'road.highway', elementType: 'geometry',    stylers: [{ color: '#1e4060' }] },
  { featureType: 'water',     elementType: 'geometry',       stylers: [{ color: '#050e1a' }] },
  { featureType: 'poi',       elementType: 'geometry',       stylers: [{ color: '#0d2030' }] },
  { featureType: 'poi',       elementType: 'labels',         stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',   elementType: 'labels',         stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1a3040' }] },
]

const BENGALURU_REGION: Region = {
  latitude:       12.9716, longitude:     77.5946,
  latitudeDelta:  0.05,    longitudeDelta: 0.05,
}

export default function MapTab() {
  const mapRef               = useRef<MapView>(null)
  const [reports,   setReports]   = useState<SafetyReport[]>([])
  const [location,  setLocation]  = useState<Location.LocationObject | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeOfDay>('any')
  const [selected,  setSelected]  = useState<SafetyReport | null>(null)
  const [region,    setRegion]    = useState<Region>(BENGALURU_REGION)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setLocation(loc)
      const userRegion: Region = {
        latitude:       loc.coords.latitude,
        longitude:      loc.coords.longitude,
        latitudeDelta:  0.04,
        longitudeDelta: 0.04,
      }
      setRegion(userRegion)
      mapRef.current?.animateToRegion(userRegion, 800)
    }
    await loadReports(region)
    setLoading(false)
  }

  async function loadReports(r: Region, filter: TimeOfDay = timeFilter) {
    const pad = r.latitudeDelta * 0.6
    const data = await fetchReports(
      r.latitude - pad, r.latitude + pad,
      r.longitude - pad, r.longitude + pad,
      filter,
    )
    setReports(data)
  }

  async function handleRegionChange(r: Region) {
    setRegion(r)
    // Only reload if map moved significantly
    const moved = Math.abs(r.latitude - region.latitude) > 0.01 ||
                  Math.abs(r.longitude - region.longitude) > 0.01
    if (moved) loadReports(r)
  }

  async function applyFilter(filter: TimeOfDay) {
    setTimeFilter(filter)
    setShowFilters(false)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await loadReports(region, filter)
  }

  function goToMyLocation() {
    if (!location) {
      Alert.alert('Location needed', 'Enable location access to see your position on the map.')
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const r: Region = {
      latitude:       location.coords.latitude,
      longitude:      location.coords.longitude,
      latitudeDelta:  0.02,
      longitudeDelta: 0.02,
    }
    setRegion(r)
    mapRef.current?.animateToRegion(r, 600)
  }

  const nearbyReports = location
    ? reports.filter(r => {
        const dist = Math.sqrt(
          Math.pow(r.lat - location.coords.latitude,  2) +
          Math.pow(r.lng - location.coords.longitude, 2)
        )
        return dist < 0.03 // ~3km radius
      })
    : []

  const safetyScore = calculateSafetyScore(nearbyReports)
  const safety      = getSafetyLabel(safetyScore)

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Safety Map</Text>
          <Text style={s.headerSub}>
            {reports.length} reports in this area
          </Text>
        </View>
        <TouchableOpacity
          style={s.filterBtn}
          onPress={() => setShowFilters(true)}
        >
          <Text style={s.filterBtnText}>
            🕐 {timeFilter === 'any' ? 'All times' : timeFilter}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Safety score banner */}
      {location && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[s.scoreBanner, { borderColor: safety.color + '40' }]}
        >
          <View style={[s.scoreDot, { backgroundColor: safety.color }]} />
          <Text style={[s.scoreLabel, { color: safety.color }]}>
            {safety.label}
          </Text>
          <Text style={s.scoreNum}>{safetyScore}/10</Text>
          <Text style={s.scoreSub}>near you · {nearbyReports.length} reports</Text>
        </Animated.View>
      )}

      {/* Map */}
      <View style={s.mapWrap}>
        {loading ? (
          <View style={s.mapLoading}>
            <ActivityIndicator size="large" color={Colors.teal} />
            <Text style={s.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={s.map}
            provider={PROVIDER_GOOGLE}
            customMapStyle={DARK_MAP_STYLE}
            initialRegion={region}
            onRegionChangeComplete={handleRegionChange}
            showsUserLocation={!!location}
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {reports.map(report => (
              <Marker
                key={report.id}
                coordinate={{ latitude: report.lat, longitude: report.lng }}
                onPress={() => { setSelected(report); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
              >
                <View style={[
                  s.pin,
                  { backgroundColor: CATEGORIES[report.category]?.color ?? Colors.danger }
                ]}>
                  <Text style={s.pinIcon}>
                    {CATEGORIES[report.category]?.icon ?? '📍'}
                  </Text>
                </View>
              </Marker>
            ))}
          </MapView>
        )}

        {/* My location button */}
        <TouchableOpacity style={s.myLocBtn} onPress={goToMyLocation}>
          <Text style={s.myLocIcon}>◎</Text>
        </TouchableOpacity>

        {/* Report button */}
        <TouchableOpacity
          style={s.reportBtn}
          onPress={() => router.push('/map/report' as any)}
        >
          <Text style={s.reportBtnText}>+ Report unsafe spot</Text>
        </TouchableOpacity>
      </View>

      {/* Time filter modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          style={s.sheetOverlay}
          onPress={() => setShowFilters(false)}
          activeOpacity={1}
        >
          <Animated.View entering={FadeInDown.duration(300)} style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Filter by time of day</Text>
            {(Object.keys(TIME_OPTIONS) as TimeOfDay[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.filterOption, timeFilter === t && s.filterOptionActive]}
                onPress={() => applyFilter(t)}
              >
                <Text style={[s.filterOptionText, timeFilter === t && s.filterOptionTextActive]}>
                  {TIME_OPTIONS[t]}
                </Text>
                {timeFilter === t && <Text style={s.filterCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Report detail modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <TouchableOpacity
            style={s.sheetOverlay}
            onPress={() => setSelected(null)}
            activeOpacity={1}
          >
            <Animated.View entering={FadeInDown.duration(300)} style={s.sheet}>
              <View style={s.sheetHandle} />

              <View style={s.reportDetailHeader}>
                <View style={[s.reportDot, { backgroundColor: CATEGORIES[selected.category]?.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.reportDetailCategory}>
                    {CATEGORIES[selected.category]?.icon} {CATEGORIES[selected.category]?.label}
                  </Text>
                  <Text style={s.reportDetailTime}>
                    {TIME_OPTIONS[selected.time_of_day]} · {new Date(selected.reported_at).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              </View>

              {selected.description && (
                <View style={s.reportDetailDesc}>
                  <Text style={s.reportDetailDescText}>{selected.description}</Text>
                </View>
              )}

              <View style={s.reportDetailActions}>
                <Text style={s.reportDetailAnon}>
                  🔒 Reported anonymously
                </Text>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Text style={s.reportDetailClose}>Close</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}
      </Modal>

    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  headerSub:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },
  filterBtn: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  filterBtnText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.xs, color: Colors.textSecond },

  scoreBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginVertical: Spacing.sm,
    backgroundColor: Colors.cardBg, borderWidth: 1,
    borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  scoreDot:    { width: 8, height: 8, borderRadius: 4 },
  scoreLabel:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, flex: 1 },
  scoreNum:    { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  scoreSub:    { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted   },

  mapWrap:   { flex: 1, position: 'relative' },
  map:       { flex: 1 },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted },

  pin: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 3, elevation: 4,
  },
  pinIcon: { fontSize: 14 },

  myLocBtn: {
    position: 'absolute', top: Spacing.lg, right: Spacing.lg,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.dark2, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  myLocIcon: { fontSize: FontSize.lg, color: Colors.tealGlow },

  reportBtn: {
    position: 'absolute', bottom: Spacing.xl,
    left: Spacing.xl, right: Spacing.xl,
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingVertical: Spacing.lg, alignItems: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  reportBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },

  sheetOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.dark2, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.md, paddingBottom: 36,
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  sheetTitle: { fontFamily: 'Lora-SemiBold', fontSize: FontSize.lg, color: Colors.textPrimary, marginBottom: Spacing.sm },

  filterOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  filterOptionActive: { borderColor: Colors.teal, backgroundColor: Colors.tealDim },
  filterOptionText:       { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond },
  filterOptionTextActive: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.tealGlow   },
  filterCheck: { color: Colors.tealGlow, fontSize: FontSize.base },

  reportDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  reportDot:          { width: 12, height: 12, borderRadius: 6 },
  reportDetailCategory: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  reportDetailTime:     { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },
  reportDetailDesc: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  reportDetailDescText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21 },
  reportDetailActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reportDetailAnon:  { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted },
  reportDetailClose: { fontFamily: 'DMSans-Medium',  fontSize: FontSize.sm, color: Colors.tealGlow  },
})
