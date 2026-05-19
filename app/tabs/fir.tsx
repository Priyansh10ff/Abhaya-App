import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Share, Linking,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'

type Step = 'reason' | 'state' | 'district' | 'letter'

const REFUSAL_REASONS = [
  { id: 'refused',    label: 'Police flat out refused',        desc: 'Said "we can\'t register this" or turned you away'  },
  { id: 'delayed',    label: 'Told me to "come back later"',   desc: 'Kept delaying or asking you to return tomorrow'      },
  { id: 'pressured',  label: 'Pressured me to withdraw',       desc: 'Asked you to settle or not pursue the case'          },
  { id: 'bribe',      label: 'Asked for money',                desc: 'Demanded a bribe to register the complaint'          },
  { id: 'wrongsec',   label: 'Registered wrong section',       desc: 'Filed under a lighter section to weaken your case'   },
]

const STATES: Record<string, string[]> = {
  'Karnataka':         ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Hubli-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davangere'],
  'Tamil Nadu':        ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Vellore'],
  'Maharashtra':       ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur'],
  'Delhi':             ['Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'New Delhi'],
  'Uttar Pradesh':     ['Lucknow', 'Agra', 'Kanpur', 'Allahabad', 'Varanasi', 'Noida', 'Ghaziabad'],
  'West Bengal':       ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur'],
  'Telangana':         ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Andhra Pradesh':    ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Kurnool', 'Tirupati'],
  'Rajasthan':         ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  'Gujarat':           ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Kerala':            ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kannur'],
  'Madhya Pradesh':    ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Bihar':             ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'],
  'Haryana':           ['Gurugram', 'Faridabad', 'Ambala', 'Hisar', 'Panipat'],
}

const EFIR_LINKS: Record<string, string> = {
  'Karnataka':       'https://ksp.karnataka.gov.in/eFIR',
  'Tamil Nadu':      'https://www.tnpolice.gov.in',
  'Maharashtra':     'https://mahapolice.gov.in',
  'Delhi':           'https://delhipolice.gov.in',
  'Uttar Pradesh':   'https://efir.uponline.gov.in',
  'West Bengal':     'https://wbpolice.gov.in',
  'Telangana':       'https://tsp.telangana.gov.in',
  'Andhra Pradesh':  'https://appolice.gov.in',
  'Rajasthan':       'https://www.police.rajasthan.gov.in',
  'Gujarat':         'https://gujhome.gujarat.gov.in',
}

function generateLetter(reason: string, state: string, district: string): string {
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const reasonMap: Record<string, string> = {
    refused:   'refused to register my First Information Report (FIR)',
    delayed:   'kept delaying the registration of my FIR without valid reason',
    pressured: 'pressured me to withdraw my complaint and not pursue legal action',
    bribe:     'demanded a monetary payment before agreeing to register my FIR',
    wrongsec:  'intentionally registered my complaint under a wrong/weaker section of the IPC',
  }

  return `Date: ${date}

To,
The Superintendent of Police,
${district} District,
${state}

Subject: Complaint regarding refusal to register FIR by local police station – request for immediate action

Respected Sir/Madam,

I am writing to bring to your urgent attention a serious matter that requires your immediate intervention.

I visited the [POLICE STATION NAME] police station in ${district} on [DATE] to register a First Information Report (FIR) regarding [BRIEF DESCRIPTION OF INCIDENT]. However, the police officers at the station ${reasonMap[reason] ?? 'failed to perform their legal duty'}.

This is in direct violation of Section 154 of the Code of Criminal Procedure (CrPC), 1973, which mandates that every police officer in charge of a police station MUST register an FIR when a cognizable offence is reported. The Supreme Court of India, in Lalita Kumari vs Government of Uttar Pradesh & Ors (2013), has held that registration of FIR is mandatory upon receipt of information disclosing commission of a cognizable offence.

I respectfully request that you:

1. Direct the concerned police station to register my FIR immediately
2. Take appropriate disciplinary action against the officers who refused/delayed
3. Provide me with the FIR number and a copy at the earliest

I am prepared to provide any further information required. Please treat this as urgent, as delay in registering the FIR is causing irreparable loss to the evidence and to my case.

I am simultaneously marking a copy of this complaint to:
- The Director General of Police, ${state}
- The National Commission for Women (NCW Helpline: 181)
- The State Women's Commission

Thanking you,

[YOUR FULL NAME]
[YOUR ADDRESS]
[YOUR MOBILE NUMBER]
[DATE]

---
Note: If no action is taken within 7 days, I reserve the right to file a petition before the Judicial Magistrate under Section 156(3) CrPC.`
}

export default function FIRTab() {
  const [step,     setStep]     = useState<Step>('reason')
  const [reason,   setReason]   = useState('')
  const [state,    setState]    = useState('')
  const [district, setDistrict] = useState('')
  const [letter,   setLetter]   = useState('')

  function selectReason(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setReason(id)
    setStep('state')
  }

  function selectState(s: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setState(s)
    setDistrict('')
    setStep('district')
  }

  function selectDistrict(d: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setDistrict(d)
    const generated = generateLetter(reason, state, d)
    setLetter(generated)
    setStep('letter')
  }

  async function shareLetter() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await Share.share({ message: letter, title: 'FIR Complaint Letter — Abhaya' })
  }

  function reset() {
    setStep('reason')
    setReason('')
    setState('')
    setDistrict('')
    setLetter('')
  }

  const steps: Step[] = ['reason', 'state', 'district', 'letter']
  const stepIdx       = steps.indexOf(step)

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        {step !== 'reason' && (
          <TouchableOpacity onPress={() => setStep(steps[stepIdx - 1])} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>FIR Escalator</Text>
          <Text style={styles.headerSub}>Generate a complaint in 60 seconds</Text>
        </View>
      </View>

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {steps.map((s, i) => (
          <View key={s} style={[styles.progressDot, i <= stepIdx && styles.progressDotActive]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── STEP 1: Reason ── */}
        {step === 'reason' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>What happened at the police station?</Text>
            <Text style={styles.stepSub}>
              Police are legally required to register your FIR. Refusing is a criminal offence under Section 154 CrPC.
            </Text>
            <View style={styles.optionList}>
              {REFUSAL_REASONS.map(r => (
                <TouchableOpacity key={r.id} style={styles.optionCard} onPress={() => selectReason(r.id)}>
                  <Text style={styles.optionLabel}>{r.label}</Text>
                  <Text style={styles.optionDesc}>{r.desc}</Text>
                  <Text style={styles.optionChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.legalNote}>
              <Text style={styles.legalNoteText}>
                📖 Supreme Court ruling in <Text style={{ fontStyle: 'italic' }}>Lalita Kumari vs UP (2013)</Text>: FIR registration is MANDATORY for cognizable offences. No exceptions.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── STEP 2: State ── */}
        {step === 'state' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Which state?</Text>
            <Text style={styles.stepSub}>Select your state to find the right Superintendent of Police</Text>
            <View style={styles.optionList}>
              {Object.keys(STATES).map(s => (
                <TouchableOpacity key={s} style={styles.optionCard} onPress={() => selectState(s)}>
                  <Text style={styles.optionLabel}>{s}</Text>
                  <Text style={styles.optionChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── STEP 3: District ── */}
        {step === 'district' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Which district?</Text>
            <Text style={styles.stepSub}>The complaint will be addressed to the SP of this district</Text>
            <View style={styles.optionList}>
              {(STATES[state] ?? []).map(d => (
                <TouchableOpacity key={d} style={styles.optionCard} onPress={() => selectDistrict(d)}>
                  <Text style={styles.optionLabel}>{d}</Text>
                  <Text style={styles.optionChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── STEP 4: Letter ── */}
        {step === 'letter' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Your complaint letter is ready</Text>
            <Text style={styles.stepSub}>
              Fill in the parts in [BRACKETS], then share or copy.
            </Text>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.shareBtn} onPress={shareLetter}>
                <Text style={styles.shareBtnText}>📤 Share / Copy</Text>
              </TouchableOpacity>
              {EFIR_LINKS[state] && (
                <TouchableOpacity
                  style={styles.efirBtn}
                  onPress={() => Linking.openURL(EFIR_LINKS[state])}
                >
                  <Text style={styles.efirBtnText}>🌐 e-FIR portal</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Letter preview */}
            <View style={styles.letterCard}>
              <Text style={styles.letterText}>{letter}</Text>
            </View>

            {/* Next steps */}
            <View style={styles.nextStepsCard}>
              <Text style={styles.nextStepsTitle}>📋 Next steps</Text>
              {[
                'Fill in the [BRACKETED] fields with your details',
                'Print or email this to the SP office',
                'Keep a copy — note the date you sent it',
                'If no response in 7 days, file before the Magistrate',
                'Or file the same complaint to NCW: 181',
              ].map((s, i) => (
                <View key={i} style={styles.nextRow}>
                  <Text style={styles.nextNum}>{i + 1}.</Text>
                  <Text style={styles.nextText}>{s}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetText}>Start over</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'] },

  header: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon:   { fontSize: FontSize.xl, color: Colors.textPrimary },
  headerTitle:{ fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  headerSub:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },

  progressRow: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
  },
  progressDot:       { flex: 1, height: 3, borderRadius: Radius.full, backgroundColor: Colors.border       },
  progressDotActive: { flex: 1, height: 3, borderRadius: Radius.full, backgroundColor: Colors.teal        },

  stepWrap:  { gap: Spacing.xl },
  stepTitle: { fontFamily: 'Lora-SemiBold', fontSize: FontSize.xl, color: Colors.textPrimary, lineHeight: 30 },
  stepSub:   { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21, marginTop: -Spacing.md },

  optionList: { gap: Spacing.sm },
  optionCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
    gap:             Spacing.sm,
  },
  optionLabel:   { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary, flex: 1 },
  optionDesc:    { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted,   flex: 2 },
  optionChevron: { fontSize: FontSize.xl, color: Colors.textMuted },

  legalNote: {
    backgroundColor: Colors.tealDim,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.teal + '30',
  },
  legalNoteText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.tealGlow + 'AA', lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  shareBtn: {
    flex:            1,
    backgroundColor: Colors.teal,
    borderRadius:    Radius.full,
    paddingVertical: Spacing.md,
    alignItems:      'center',
  },
  shareBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },
  efirBtn: {
    flex:            1,
    backgroundColor: Colors.cardBg,
    borderRadius:    Radius.full,
    paddingVertical: Spacing.md,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  efirBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textSecond },

  letterCard: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
  },
  letterText: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs,
    color:      Colors.textSecond,
    lineHeight: 20,
  },

  nextStepsCard: {
    backgroundColor: Colors.cardBg,
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
    gap:             Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  nextStepsTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  nextRow:        { flexDirection: 'row', gap: Spacing.sm },
  nextNum:        { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.tealGlow, width: 20 },
  nextText:       { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 20, flex: 1 },

  resetBtn:  { alignItems: 'center', paddingVertical: Spacing.md },
  resetText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.textMuted },
})
