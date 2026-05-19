export interface GuideStep {
  id:         string
  step:       number
  icon:       string
  title:      string
  subtitle:   string
  body:       string
  critical?:  string        // Time-sensitive warning
  doList?:    string[]      // Things to do
  dontList?:  string[]      // Things NOT to do
  tip?:       string        // Pro tip
  timeLimit?: string        // e.g. "Act within 48 hours"
  ctaLabel?:  string
  ctaAction?: string        // 'call-hospital' | 'open-fir' | 'open-legal'
}

export const EMERGENCY_STEPS: GuideStep[] = [
  {
    id:       'safe-first',
    step:     1,
    icon:     '🛡️',
    title:    'Get somewhere safe first',
    subtitle: 'Nothing else matters until you are physically safe',
    body:     'Before anything else — evidence, reporting, calls — make sure you are in a safe location. If you are still near the person who hurt you, leave first. Go to a public place, a friend\'s home, or any place with other people around.',
    doList: [
      'Move to a public area or someone you trust',
      'Lock yourself in a room if you cannot leave',
      'Call a trusted person to come to you',
      'Stay on the phone with someone while you move',
    ],
    dontList: [
      'Do not try to confront the person',
      'Do not stay alone in an isolated place',
    ],
    tip: 'Your phone\'s emergency SOS (hold power + volume) calls emergency services and texts your location to emergency contacts.',
  },
  {
    id:       'hospital',
    step:     2,
    icon:     '🏥',
    title:    'Go to a hospital immediately',
    subtitle: 'You do NOT need a police complaint first',
    body:     'Go to any government hospital directly. By law, doctors must examine and treat you without requiring a police complaint first. This is one of the most important things to know — the hospital cannot refuse you.',
    critical: 'Evidence like DNA degrades within 72 hours. The sooner you go, the stronger your case.',
    doList: [
      'Go to the nearest government hospital',
      'Tell the doctor you need a medico-legal examination',
      'Ask for a female doctor — you have the right to one',
      'Ask for the SAEC (Sexual Assault Evidence Collection) kit',
      'Keep copies of all medical documents',
    ],
    dontList: [
      'Do NOT shower or bathe before going',
      'Do NOT change your clothes',
      'Do NOT brush your teeth',
      'Do NOT eat or drink (if oral assault)',
      'Do NOT clean the area of assault',
    ],
    tip: 'If the doctor asks for a police requisition before examining you — that is ILLEGAL. Say: "Under Supreme Court guidelines, you are required to examine me without a police complaint."',
    timeLimit: 'Most critical in first 72 hours',
    ctaLabel:  'Find nearest hospital',
    ctaAction: 'find-hospital',
  },
  {
    id:       'evidence-digital',
    step:     3,
    icon:     '📱',
    title:    'Save all digital evidence now',
    subtitle: 'Screenshots, messages, photos — before they are deleted',
    body:     'If the assault involved someone you know, there may be WhatsApp messages, calls, or photos that prove what happened. Save everything immediately — people often delete messages quickly after an incident.',
    critical: 'Request CCTV footage within 48 hours — after that it gets overwritten automatically.',
    doList: [
      'Screenshot all WhatsApp/text messages from the accused',
      'Export the full chat (WhatsApp → Chat → Export Chat)',
      'Screenshot call logs with the accused',
      'Note the exact time and location of the incident',
      'Take photos of any physical injuries',
      'Save any social media posts or DMs',
    ],
    tip: 'Go to Vault in Abhaya to store everything with a legal timestamp. Each file gets proof of when it was saved — this matters in court.',
    ctaLabel:  'Open Evidence Vault',
    ctaAction: 'open-vault',
  },
  {
    id:       'cctv-request',
    step:     4,
    icon:     '📹',
    title:    'Request CCTV footage immediately',
    subtitle: '48-hour window — after that footage is gone forever',
    body:     'If the incident happened in a place with cameras — road, mall, building, restaurant — the footage is your strongest evidence. Most CCTV systems overwrite footage every 24-72 hours. You must request preservation immediately.',
    critical: 'Most CCTV footage is overwritten after 48-72 hours. Every hour counts.',
    doList: [
      'Go to the nearest police station or contact the building manager',
      'Ask them to "preserve and secure CCTV footage" of the specific location and time',
      'Get their name and the date/time you made the request in writing',
      'If police refuse, file a written complaint that they refused',
      'Note the exact camera locations near the incident',
    ],
    tip: 'You can also write a simple letter: "I request preservation of CCTV footage from [location] between [time] on [date]. This is related to a criminal incident and evidence preservation is required by law." Keep a copy.',
    timeLimit: 'Act within 48 hours',
  },
  {
    id:       'fir-rights',
    step:     5,
    icon:     '📋',
    title:    'File an FIR — and know your rights',
    subtitle: 'Police MUST register your FIR. Refusing is illegal.',
    body:     'The First Information Report (FIR) starts the legal process. Under Section 154 of CrPC, the police officer is legally required to register your FIR. They cannot refuse. If they do, you have escalation options.',
    doList: [
      'Go to the nearest police station',
      'Ask to file an FIR under Section 376 IPC (rape) or applicable section',
      'Request a female police officer for recording your statement',
      'Get a free copy of the FIR — this is your legal right',
      'Note the FIR number and the officer\'s name and badge number',
    ],
    dontList: [
      'Do not let them talk you into a "compromise"',
      'Do not sign anything without reading it',
      'Do not let them delay by saying "come back tomorrow"',
    ],
    critical: 'If police refuse to register your FIR — that is a crime. Use the FIR Escalator in Abhaya to generate a complaint to the District Superintendent of Police instantly.',
    tip: 'You can also file an e-FIR online on your state police website, without going to a station.',
    ctaLabel:  'Open FIR Escalator',
    ctaAction: 'open-fir',
  },
  {
    id:       'legal-aid',
    step:     6,
    icon:     '⚖️',
    title:    'Get a free lawyer',
    subtitle: 'Free legal aid is your right — in every district of India',
    body:     'Under the Legal Services Authorities Act, every woman who has been a victim of a crime is entitled to free legal representation. The District Legal Services Authority (DLSA) in your district provides this — no income limit for victims of sexual assault.',
    doList: [
      'Contact your District Legal Services Authority (DLSA)',
      'Ask for a legal aid lawyer specifically for sexual assault cases',
      'They must provide one free of charge — this is law',
      'NALSA helpline: 15100 (free)',
      'Ask your lawyer to file for interim protection order if needed',
    ],
    tip: 'The Legal AI in Abhaya can explain your exact rights and generate a request letter to the DLSA in your district.',
    ctaLabel:  'Ask Legal AI',
    ctaAction: 'open-legal',
  },
  {
    id:       'support',
    step:     7,
    icon:     '💙',
    title:    'You don\'t have to go through this alone',
    subtitle: 'Real support, right now',
    body:     'What happened to you is not your fault. The process ahead can feel overwhelming — evidence, FIRs, courts, doctors. But you do not have to do it alone. There are people whose entire job is to help you through exactly this.',
    doList: [
      'iCall Mental Health: 9152987821 (Mon-Sat, 8am-10pm)',
      'NCW Helpline: 181 (24/7)',
      'Women Helpline: 1091 (24/7)',
      'One Stop Centre (OSC): Available in every district',
      'Majlis (Mumbai): 23827088',
      'Sakhi (Delhi): 011-23317004',
    ],
    tip: 'The anonymous community in Abhaya is also available if you want to talk to other women who have been through similar situations — no name, no account needed.',
  },
]

export const GUIDE_INTRO = {
  title:    'Emergency Guide',
  subtitle: 'What to do in the next 72 hours',
  body:     'This guide works offline. The first hours after an incident are critical for evidence and your safety. Follow these steps in order — but always prioritise getting safe first.',
  warning:  'If you are in immediate danger, call 112.',
}
