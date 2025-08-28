interface TextRegion {
  id: string;
  text: string;
  diagnosis: string;
  summary: string;
  coordinates: {
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
  };
}

interface SymptomContent {
  regions: TextRegion[];
  fallbackSymptoms: Array<{ id: string; text: string; }>;
}

export const symptomContent: Record<string, SymptomContent> = {
  "HEAD FRONT": {
    regions: [
      {
        id: "sinus",
        text: "Headache worsened by bending or coughing, more severe in the morning, and with increase in frequency and severity. Other signs include nausea and vomiting, seizures, personality change, and stroke symptoms such as slurred speech and weakness on one side of body.",
        diagnosis: "Possible sinus infection or tension headache",
        summary: "Headache with sinus symptoms",
        coordinates: { xPct: 25, yPct: 15, wPct: 20, hPct: 12 }
      },
      {
        id: "eyesocket",
        text: "Moderate to severe headache, most often on one side of head. Sensitivity to light and noise, sweating, and vomiting may occur. Before headache, there may be blind spots with lights in Z-shapes or flashes.",
        diagnosis: "Possible migraine headache",
        summary: "One-sided headache with light sensitivity",
        coordinates: { xPct: 60, yPct: 20, wPct: 18, hPct: 10 }
      },
      {
        id: "sinus_lower",
        text: "Throbbing pain over a sinus associated with a cough and cold. Clear discharge from nose. May also have headache and toothache.",
        diagnosis: "Upper respiratory infection",
        summary: "Sinus pain with cold symptoms",
        coordinates: { xPct: 25, yPct: 45, wPct: 20, hPct: 15 }
      },
      {
        id: "teeth",
        text: "Throbbing pain over a sinus associated with a cough and cold, which appears after a few days. Green-coloured discharge from one side of nose. Temperature above 38°C, after a few days. Green-coloured discharge from one side of nose. Temperature above 38°C.",
        diagnosis: "Bacterial sinus infection",
        summary: "Sinus infection with fever",
        coordinates: { xPct: 45, yPct: 65, wPct: 25, hPct: 18 }
      },
      {
        id: "jaw_area",
        text: "Severe toothache with swelling on face or the region of the affected tooth level. Seek dentist.",
        diagnosis: "Dental abscess or severe tooth decay",
        summary: "Severe toothache requiring dental care",
        coordinates: { xPct: 15, yPct: 70, wPct: 22, hPct: 15 }
      }
    ],
    fallbackSymptoms: [
      { id: "persistent_pain", text: "Persistent pain, aching, or discomfort in this area" },
      { id: "swelling", text: "Swelling, inflammation, or visible enlargement" },
      { id: "skin_changes", text: "Changes in skin color, texture, or appearance" },
      { id: "headache", text: "Headache or pressure sensation" },
      { id: "facial_pain", text: "Facial pain or jaw discomfort" }
    ]
  },
  "HEAD BACK": {
    regions: [
      {
        id: "back_head_upper",
        text: "Tension-type headache with pressure or tightness around the head, often described as a band-like sensation.",
        diagnosis: "Tension headache",
        summary: "Band-like head pressure",
        coordinates: { xPct: 35, yPct: 10, wPct: 30, hPct: 20 }
      },
      {
        id: "neck_connection",
        text: "Neck tension and stiffness radiating to the back of the head, often from poor posture or stress.",
        diagnosis: "Cervical muscle tension",
        summary: "Neck stiffness with head pain",
        coordinates: { xPct: 25, yPct: 65, wPct: 50, hPct: 25 }
      }
    ],
    fallbackSymptoms: [
      { id: "tension_headache", text: "Tension headache or pressure" },
      { id: "neck_stiffness", text: "Neck stiffness or pain" },
      { id: "muscle_tension", text: "Muscle tension or spasms" }
    ]
  },
  "CHEST FRONT": {
    regions: [
      {
        id: "upper_chest",
        text: "Chest tightness, pressure, or pain that may radiate to arms, jaw, or back. Could indicate cardiac issues requiring immediate attention.",
        diagnosis: "Possible cardiac or respiratory condition",
        summary: "Chest pain with radiation",
        coordinates: { xPct: 25, yPct: 15, wPct: 50, hPct: 25 }
      },
      {
        id: "respiratory_area",
        text: "Difficulty breathing, shortness of breath, or wheezing. May be accompanied by cough or chest congestion.",
        diagnosis: "Respiratory condition",
        summary: "Breathing difficulty with congestion",
        coordinates: { xPct: 20, yPct: 45, wPct: 60, hPct: 30 }
      }
    ],
    fallbackSymptoms: [
      { id: "chest_pain", text: "Chest pain or discomfort" },
      { id: "breathing_difficulty", text: "Difficulty breathing or shortness of breath" },
      { id: "heart_palpitations", text: "Heart palpitations or irregular heartbeat" },
      { id: "chest_tightness", text: "Chest tightness or pressure" }
    ]
  },
  "CHEST BACK": {
    regions: [
      {
        id: "upper_back",
        text: "Upper back pain between shoulder blades, often related to posture or muscle strain.",
        diagnosis: "Musculoskeletal strain",
        summary: "Upper back muscle pain",
        coordinates: { xPct: 25, yPct: 20, wPct: 50, hPct: 30 }
      },
      {
        id: "spine_area",
        text: "Spinal discomfort or pain along the thoracic vertebrae, may affect breathing or movement.",
        diagnosis: "Thoracic spine condition",
        summary: "Spinal pain affecting movement",
        coordinates: { xPct: 45, yPct: 15, wPct: 10, hPct: 60 }
      }
    ],
    fallbackSymptoms: [
      { id: "upper_back_pain", text: "Upper back pain or stiffness" },
      { id: "spine_discomfort", text: "Spine discomfort or alignment issues" },
      { id: "muscle_strain", text: "Muscle strain or tension" }
    ]
  },
  "ABDOMEN FRONT": {
    regions: [
      {
        id: "upper_abdomen",
        text: "Upper abdominal pain, nausea, or digestive discomfort. May indicate stomach or liver issues.",
        diagnosis: "Gastrointestinal condition",
        summary: "Upper abdominal pain with nausea",
        coordinates: { xPct: 25, yPct: 10, wPct: 50, hPct: 25 }
      },
      {
        id: "lower_abdomen",
        text: "Lower abdominal pain, cramping, or bladder/reproductive organ discomfort.",
        diagnosis: "Lower abdominal condition",
        summary: "Lower abdominal cramping",
        coordinates: { xPct: 25, yPct: 50, wPct: 50, hPct: 40 }
      }
    ],
    fallbackSymptoms: [
      { id: "abdominal_pain", text: "Abdominal pain or cramping" },
      { id: "nausea", text: "Nausea or digestive discomfort" },
      { id: "bloating", text: "Bloating or gas" },
      { id: "digestive_issues", text: "Digestive problems or changes" }
    ]
  },
  "ABDOMEN BACK": {
    regions: [
      {
        id: "lower_back",
        text: "Lower back pain, kidney area discomfort, or spinal issues affecting posture and movement.",
        diagnosis: "Lower back condition",
        summary: "Lower back and kidney area pain",
        coordinates: { xPct: 25, yPct: 30, wPct: 50, hPct: 40 }
      }
    ],
    fallbackSymptoms: [
      { id: "lower_back_pain", text: "Lower back pain or stiffness" },
      { id: "kidney_area", text: "Kidney area discomfort" },
      { id: "spinal_issues", text: "Spinal alignment problems" }
    ]
  },
  "LEGS FRONT": {
    regions: [
      {
        id: "thigh_area",
        text: "Thigh pain, muscle strain, or difficulty with movement. May affect walking or standing.",
        diagnosis: "Thigh muscle strain",
        summary: "Thigh pain affecting mobility",
        coordinates: { xPct: 20, yPct: 10, wPct: 60, hPct: 40 }
      },
      {
        id: "knee_area",
        text: "Knee pain, swelling, or joint stiffness affecting mobility and daily activities.",
        diagnosis: "Knee joint condition",
        summary: "Knee pain with swelling",
        coordinates: { xPct: 35, yPct: 50, wPct: 30, hPct: 15 }
      },
      {
        id: "shin_calf",
        text: "Lower leg pain, shin splints, or calf muscle strain. May cause difficulty walking.",
        diagnosis: "Lower leg muscle strain",
        summary: "Shin and calf pain",
        coordinates: { xPct: 25, yPct: 70, wPct: 50, hPct: 25 }
      }
    ],
    fallbackSymptoms: [
      { id: "leg_pain", text: "Leg pain or discomfort" },
      { id: "joint_stiffness", text: "Joint stiffness or swelling" },
      { id: "muscle_cramps", text: "Muscle cramps or spasms" },
      { id: "mobility_issues", text: "Difficulty walking or movement" }
    ]
  },
  "LEGS BACK": {
    regions: [
      {
        id: "hamstring_area",
        text: "Hamstring strain, back of thigh pain, or sciatic nerve discomfort.",
        diagnosis: "Hamstring strain or sciatica",
        summary: "Back thigh pain",
        coordinates: { xPct: 20, yPct: 15, wPct: 60, hPct: 35 }
      },
      {
        id: "calf_back",
        text: "Calf muscle pain, Achilles tendon issues, or back of lower leg discomfort.",
        diagnosis: "Calf muscle or Achilles condition",
        summary: "Calf and Achilles pain",
        coordinates: { xPct: 25, yPct: 60, wPct: 50, hPct: 30 }
      }
    ],
    fallbackSymptoms: [
      { id: "hamstring_pain", text: "Hamstring or back thigh pain" },
      { id: "calf_strain", text: "Calf muscle strain or tightness" },
      { id: "achilles_issues", text: "Achilles tendon problems" }
    ]
  },
  "ARMS FRONT": {
    regions: [
      {
        id: "upper_arm",
        text: "Upper arm pain, muscle strain, or shoulder-related discomfort affecting arm movement.",
        diagnosis: "Upper arm muscle strain",
        summary: "Upper arm pain with movement difficulty",
        coordinates: { xPct: 20, yPct: 15, wPct: 60, hPct: 35 }
      },
      {
        id: "elbow_area",
        text: "Elbow pain, tennis elbow, or joint inflammation affecting arm function.",
        diagnosis: "Elbow joint condition",
        summary: "Elbow pain affecting function",
        coordinates: { xPct: 35, yPct: 50, wPct: 30, hPct: 15 }
      },
      {
        id: "forearm_wrist",
        text: "Forearm or wrist pain, carpal tunnel symptoms, or repetitive strain injury.",
        diagnosis: "Repetitive strain injury",
        summary: "Forearm and wrist pain",
        coordinates: { xPct: 25, yPct: 70, wPct: 50, hPct: 25 }
      }
    ],
    fallbackSymptoms: [
      { id: "arm_pain", text: "Arm pain or weakness" },
      { id: "joint_problems", text: "Joint problems or stiffness" },
      { id: "nerve_symptoms", text: "Numbness or tingling" },
      { id: "repetitive_strain", text: "Repetitive strain or overuse injury" }
    ]
  },
  "ARMS BACK": {
    regions: [
      {
        id: "tricep_area",
        text: "Back of upper arm pain, tricep strain, or posterior shoulder discomfort.",
        diagnosis: "Tricep muscle strain",
        summary: "Back upper arm pain",
        coordinates: { xPct: 20, yPct: 15, wPct: 60, hPct: 35 }
      },
      {
        id: "back_forearm",
        text: "Back of forearm pain, extension muscle strain, or posterior wrist issues.",
        diagnosis: "Extensor muscle strain",
        summary: "Back forearm pain",
        coordinates: { xPct: 25, yPct: 60, wPct: 50, hPct: 30 }
      }
    ],
    fallbackSymptoms: [
      { id: "back_arm_pain", text: "Back of arm pain or strain" },
      { id: "tricep_issues", text: "Tricep muscle problems" },
      { id: "posterior_strain", text: "Posterior muscle strain" }
    ]
  }
};

export const getSymptomContentForBodyPart = (bodyPart: string): SymptomContent | null => {
  return symptomContent[bodyPart] || null;
};