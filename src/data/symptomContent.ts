interface TextRegion {
  id: string;
  text: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface SymptomContent {
  regions: TextRegion[];
  fallbackSymptoms: Array<{ id: string; text: string; }>;
}

export const symptomContent: Record<string, SymptomContent> = {
  "NAUSEA AND VOMITING": {
    regions: [
      {
        id: "nausea_general",
        text: "Nausea, usually with earache, dizziness, and reduced hearing. Nausea, usually with dizziness and vertigo, ringing in ears and pain. Dizziness, tinnitus (ringing sounds) in both ears, and hearing loss, with feelings of nausea. Usually a long-term condition, with recurrent episodes.",
        coordinates: { x: 430, y: 10, width: 200, height: 120 }
      },
      {
        id: "gastroenteritis",
        text: "Often one-sided headache, with blurred vision, and flashing lights. Rash, fever, headache, stiff neck, and generally unwell. Can rapidly result in unconsciousness if untreated. This is a medical emergency; dial 999",
        coordinates: { x: 104, y: 20, width: 180, height: 100 }
      },
      {
        id: "abdominal_pain",
        text: "Pain that comes and goes, beginning in the lower back and moving to the abdomen. May need to pass urine frequently or notice blood in urine. More common in hot climates.",
        coordinates: { x: 8, y: 200, width: 150, height: 120 }
      },
      {
        id: "stomach_pain",
        text: "Often cramping in children. Most common in the developing world. Chronic constipation causes a build-up in bowel and affects children. Failure to grow and put on weight. Abdominal pain and diarrhoea, with rash, tiredness. Common in the developing world.",
        coordinates: { x: 650, y: 200, width: 180, height: 150 }
      },
      {
        id: "blood_symptoms",
        text: "Vomiting with flu-like symptoms, blood in urine, and back pain. More common in women. Seek medical attention soon if symptoms severe. Pain that comes and goes, beginning in the lower back and moving to the abdomen. May need to pass urine frequently or notice blood in urine. More common in hot climates.",
        coordinates: { x: 650, y: 400, width: 200, height: 180 }
      },
      {
        id: "appetite_loss",
        text: "Loss of appetite, nausea, vomiting, fatigue, weakness, itching, lethargy, swelling, shortness of breath, muscle cramps, and headache.",
        coordinates: { x: 650, y: 580, width: 180, height: 80 }
      }
    ],
    fallbackSymptoms: [
      { id: "nausea", text: "General nausea and discomfort" },
      { id: "vomiting", text: "Vomiting episodes" },
      { id: "stomach_upset", text: "Stomach upset and pain" }
    ]
  },
  "WEIGHT LOSS": {
    regions: [
      {
        id: "unintentional_weight_loss",
        text: "Unexpected weight loss without changes in diet or exercise. Could indicate underlying medical conditions that require evaluation.",
        coordinates: { x: 100, y: 50, width: 200, height: 100 }
      },
      {
        id: "appetite_changes",
        text: "Changes in appetite leading to weight loss. May be accompanied by fatigue, weakness, or changes in eating patterns.",
        coordinates: { x: 400, y: 80, width: 180, height: 120 }
      },
      {
        id: "metabolic_changes",
        text: "Metabolic changes causing rapid weight loss. May include symptoms like increased thirst, frequent urination, or changes in energy levels.",
        coordinates: { x: 50, y: 250, width: 220, height: 140 }
      },
      {
        id: "digestive_issues",
        text: "Digestive problems affecting food absorption and leading to weight loss. May include nausea, changes in bowel habits, or abdominal discomfort.",
        coordinates: { x: 500, y: 300, width: 200, height: 150 }
      }
    ],
    fallbackSymptoms: [
      { id: "weight_loss", text: "Unexplained weight loss" },
      { id: "appetite_loss", text: "Loss of appetite" },
      { id: "fatigue", text: "Fatigue and weakness" }
    ]
  }
};

export const getSymptomContentForBodyPart = (bodyPart: string): SymptomContent | null => {
  return symptomContent[bodyPart] || null;
};