/**
 * MedAI Triage & Clinical Assessment Engine
 * Performs intelligent clinical rule matching, symptom classification,
 * risk scoring, follow-up questions, and specialty recommendations.
 */

const EMERGENCY_PATTERNS = [
  { pattern: /chest\s*pain|heart\s*attack|crushing\s*pressure/i, reason: 'Possible acute coronary syndrome / cardiac event' },
  { pattern: /difficulty\s*breathing|cannot\s*breathe|shortness\s*of\s*breath|gasping/i, reason: 'Severe respiratory distress' },
  { pattern: /unconscious|passed\s*out|fainting|blackout|syncope/i, reason: 'Loss of consciousness / neurological syncopal episode' },
  { pattern: /severe\s*bleeding|hemorrhage|coughing\s*up\s*blood/i, reason: 'Acute hemorrhage' },
  { pattern: /sudden\s*numbness|face\s*drooping|slurred\s*speech|stroke/i, reason: 'Signs indicative of acute stroke (FAST)' },
  { pattern: /severe\s*allergic|anaphylaxis|swollen\s*throat|lip\s*swelling/i, reason: 'Anaphylactic reaction' }
];

const CLINICAL_KNOWLEDGE_BASE = [
  {
    keywords: ['fever', 'chills', 'cough', 'sore throat', 'runny nose', 'congestion', 'flu', 'cold'],
    condition: 'Upper Respiratory Viral Syndrome / Influenza-like Illness',
    specialty: 'General Practice / Internal Medicine',
    risk: 'low',
    confidence: 0.89,
    advice: [
      'Get ample bed rest and hydrate with warm fluids (water, herbal teas, broth)',
      'Monitor body temperature twice daily with a digital thermometer',
      'Over-the-counter antipyretics (like acetaminophen) can assist with discomfort if safe for you',
      'Seek evaluation if fever persists >3 days, exceeds 103°F (39.4°C), or breathing difficulty develops'
    ],
    followup: [
      'How high is your fever and how many days has it lasted?',
      'Are you experiencing any shortness of breath or persistent chest discomfort?'
    ]
  },
  {
    keywords: ['headache', 'migraine', 'throbbing', 'light sensitivity', 'sound sensitivity', 'temple', 'nausea'],
    condition: 'Tension-Type Headache or Migraine Episode',
    specialty: 'Neurology / General Practice',
    risk: 'medium',
    confidence: 0.86,
    advice: [
      'Rest in a quiet, dark, well-ventilated room with minimal screen exposure',
      'Apply a cold compress across forehead or temples, or a warm compress on the neck',
      'Maintain regular hydration and avoid known dietary triggers (excess caffeine, aged cheese)',
      'Promptly consult a doctor if you experience sudden "thunderclap" headache or vision alterations'
    ],
    followup: [
      'Is the pain throbbing or dull, and is it on one or both sides of your head?',
      'Did the headache begin gradually or very suddenly?'
    ]
  },
  {
    keywords: ['stomach', 'abdominal', 'belly', 'cramps', 'diarrhea', 'nausea', 'vomiting', 'indigestion', 'bloating', 'acid'],
    condition: 'Gastroenteritis / Functional Dyspepsia',
    specialty: 'Gastroenterology / Internal Medicine',
    risk: 'medium',
    confidence: 0.84,
    advice: [
      'Adopt the BRAT diet (Bananas, Rice, Applesauce, Toast) and sip oral rehydration solutions',
      'Avoid spicy, fatty, acidic foods, caffeine, and dairy temporarily',
      'Eat smaller, frequent portions rather than heavy meals',
      'Seek clinical care if severe localized abdominal pain, dark stools, or signs of dehydration occur'
    ],
    followup: [
      'Where is the pain located (upper, lower, right side, or generalized)?',
      'Are you able to keep liquids down without vomiting?'
    ]
  },
  {
    keywords: ['back pain', 'joint pain', 'knee', 'shoulder', 'stiffness', 'muscle ache', 'sprain', 'swelling'],
    condition: 'Musculoskeletal Strain / Joint Inflammation',
    specialty: 'Orthopedics / Physical Therapy',
    risk: 'low',
    confidence: 0.85,
    advice: [
      'Follow the PRICE protocol: Protect, Rest, Ice (15-20 min intervals), Compress, and Elevate',
      'Avoid strenuous lifting, sudden twisting, or high-impact athletic activity',
      'Gentle low-impact stretching may alleviate stiffness once acute soreness subsides',
      'Consult a specialist if unable to bear weight or if joint redness/severe swelling is observed'
    ],
    followup: [
      'Did this pain begin after physical trauma/exertion or gradually over time?',
      'Does the pain radiate down your legs or arms?'
    ]
  },
  {
    keywords: ['rash', 'skin', 'itching', 'hives', 'redness', 'spots', 'eczema', 'dermatitis'],
    condition: 'Cutaneous Dermatitis / Allergic Skin Reaction',
    specialty: 'Dermatology',
    risk: 'low',
    confidence: 0.83,
    advice: [
      'Apply cool compresses and fragrance-free hypoallergenic moisturizers to soothe the skin',
      'Avoid scratching to prevent secondary bacterial infection',
      'Identify and discontinue contact with new detergents, soaps, cosmetics, or allergens',
      'Seek medical attention if the rash spreads rapidly, blisters, or affects mucous membranes'
    ],
    followup: [
      'Have you recently started any new medication, skincare product, or laundry detergent?',
      'Is the rash itchy, painful, or warm to the touch?'
    ]
  },
  {
    keywords: ['anxiety', 'stress', 'insomnia', 'panic', 'heart racing', 'overwhelmed', 'fatigue', 'depression', 'sleep'],
    condition: 'Stress & Autonomic Fatigue / Sleep Dysregulation',
    specialty: 'Psychiatry & Behavioral Health',
    risk: 'low',
    confidence: 0.82,
    advice: [
      'Practice structured diaphragmatic breathing (e.g. 4-7-8 technique) to downregulate nervous system',
      'Establish a fixed sleep schedule, dimming blue light exposure 1 hour prior to bedtime',
      'Limit caffeine and alcohol consumption, especially later in the day',
      'Consider speaking with a licensed mental health clinician or counselor for personalized support'
    ],
    followup: [
      'How long have you been experiencing difficulty sleeping or heightened stress?',
      'Are you experiencing physical symptoms like heart palpitations or shortness of breath?'
    ]
  }
];

exports.analyzeSymptoms = async ({ text, history = [] }) => {
  const lower = text.toLowerCase();

  // 1. Check for critical emergencies
  for (const item of EMERGENCY_PATTERNS) {
    if (item.pattern.test(lower)) {
      return {
        isEmergency: true,
        structured: {
          risk: 'high',
          urgency: 'CRITICAL / IMMEDIATE EMERGENCY',
          specialty: 'Emergency Medicine (ER / 911)',
          confidence_score: 0.99,
          reason: item.reason,
          suggestions: [
            'Call 911 or your local emergency services IMMEDIATELY',
            'Go to the nearest hospital Emergency Room right away',
            'Do not drive yourself—ask someone else or wait for an ambulance',
            'Rest comfortably in an upright or seated position until emergency response arrives'
          ],
          followup_questions: [
            'Are you currently in a safe location with someone nearby to assist?'
          ]
        },
        text: `CRITICAL ALERT: Your described symptoms indicate a potential medical emergency (${item.reason}). Please seek emergency medical assistance immediately by calling 911 or proceeding to the nearest emergency department.`
      };
    }
  }

  // 2. Score matches across knowledge base
  let bestMatch = null;
  let highestScore = 0;

  for (const kb of CLINICAL_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of kb.keywords) {
      if (lower.includes(kw)) {
        score += 1;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = kb;
    }
  }

  if (bestMatch && highestScore >= 1) {
    return {
      isEmergency: false,
      structured: {
        risk: bestMatch.risk,
        urgency: bestMatch.risk === 'high' ? 'High' : bestMatch.risk === 'medium' ? 'Moderate Priority' : 'Routine / Self-Care',
        possibleCondition: bestMatch.condition,
        specialty: bestMatch.specialty,
        confidence_score: Math.min(0.95, bestMatch.confidence + (highestScore * 0.03)),
        suggestions: bestMatch.advice,
        followup_questions: bestMatch.followup
      },
      text: `Based on your description, your symptoms are consistent with **${bestMatch.condition}** (Risk Level: ${bestMatch.risk.toUpperCase()}). Recommended specialist: **${bestMatch.specialty}**.\n\nRecommended actions:\n• ${bestMatch.advice.join('\n• ')}`
    };
  }

  // 3. Fallback general triage
  return {
    isEmergency: false,
    structured: {
      risk: 'low',
      urgency: 'Routine Clinical Evaluation',
      possibleCondition: 'General Health Query',
      specialty: 'General Practice / Family Medicine',
      confidence_score: 0.75,
      suggestions: [
        'Monitor your symptoms closely over the next 24-48 hours and note any changes',
        'Maintain good hydration, nutrition, and adequate rest',
        'Book an appointment with a primary care physician if symptoms persist or worsen'
      ],
      followup_questions: [
        'How long have you been experiencing these symptoms?',
        'Are there any other associated symptoms you have noticed?'
      ]
    },
    text: `Thank you for sharing your symptoms. While these do not immediately suggest an acute emergency, we recommend monitoring your condition and scheduling an appointment with a primary care physician for a formal evaluation.`
  };
};
