interface TextRegion {
  id: string;
  text: string;
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
  "NAUSEA AND VOMITING": {
    regions: [
      {
        id: "nausea_general",
        text: "Nausea, usually with earache, dizziness, and reduced hearing. Nausea, usually with dizziness and vertigo, ringing in ears and pain. Dizziness, tinnitus (ringing sounds) in both ears, and hearing loss, with feelings of nausea. Usually a long-term condition, with recurrent episodes.",
        coordinates: { xPct: 51.2, yPct: 1.2, wPct: 23.8, hPct: 14.3 }
      },
      {
        id: "gastroenteritis",
        text: "Often one-sided headache, with blurred vision, and flashing lights. Rash, fever, headache, stiff neck, and generally unwell. Can rapidly result in unconsciousness if untreated. This is a medical emergency; dial 999",
        coordinates: { xPct: 12.4, yPct: 2.4, wPct: 21.4, hPct: 11.9 }
      },
      {
        id: "abdominal_pain",
        text: "Pain that comes and goes, beginning in the lower back and moving to the abdomen. May need to pass urine frequently or notice blood in urine. More common in hot climates.",
        coordinates: { xPct: 1.0, yPct: 23.8, wPct: 17.9, hPct: 14.3 }
      },
      {
        id: "stomach_pain",
        text: "Often cramping in children. Most common in the developing world. Chronic constipation causes a build-up in bowel and affects children. Failure to grow and put on weight. Abdominal pain and diarrhoea, with rash, tiredness. Common in the developing world.",
        coordinates: { xPct: 77.4, yPct: 23.8, wPct: 21.4, hPct: 17.9 }
      },
      {
        id: "blood_symptoms",
        text: "Vomiting with flu-like symptoms, blood in urine, and back pain. More common in women. Seek medical attention soon if symptoms severe. Pain that comes and goes, beginning in the lower back and moving to the abdomen. May need to pass urine frequently or notice blood in urine. More common in hot climates.",
        coordinates: { xPct: 77.4, yPct: 47.6, wPct: 23.8, hPct: 21.4 }
      },
      {
        id: "appetite_loss",
        text: "Loss of appetite, nausea, vomiting, fatigue, weakness, itching, lethargy, swelling, shortness of breath, muscle cramps, and headache.",
        coordinates: { xPct: 77.4, yPct: 69.0, wPct: 21.4, hPct: 9.5 }
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
        coordinates: { xPct: 11.9, yPct: 6.0, wPct: 23.8, hPct: 11.9 }
      },
      {
        id: "appetite_changes",
        text: "Changes in appetite leading to weight loss. May be accompanied by fatigue, weakness, or changes in eating patterns.",
        coordinates: { xPct: 47.6, yPct: 9.5, wPct: 21.4, hPct: 14.3 }
      },
      {
        id: "metabolic_changes",
        text: "Metabolic changes causing rapid weight loss. May include symptoms like increased thirst, frequent urination, or changes in energy levels.",
        coordinates: { xPct: 6.0, yPct: 29.8, wPct: 26.2, hPct: 16.7 }
      },
      {
        id: "digestive_issues",
        text: "Digestive problems affecting food absorption and leading to weight loss. May include nausea, changes in bowel habits, or abdominal discomfort.",
        coordinates: { xPct: 59.5, yPct: 35.7, wPct: 23.8, hPct: 17.9 }
      }
    ],
    fallbackSymptoms: [
      { id: "weight_loss", text: "Unexplained weight loss" },
      { id: "appetite_loss", text: "Loss of appetite" },
      { id: "fatigue", text: "Fatigue and weakness" }
    ]
  },
  "SKIN RASHES": {
    regions: [
      {
        id: "allergic_reaction",
        text: "Allergic skin reactions with itching, redness, and swelling. May be caused by contact with allergens, food, or medications. Often appears as raised bumps or welts.",
        coordinates: { xPct: 15.0, yPct: 10.0, wPct: 25.0, hPct: 15.0 }
      },
      {
        id: "infectious_rash",
        text: "Rashes caused by bacterial, viral, or fungal infections. May be accompanied by fever, warmth, or spreading patterns. Requires medical evaluation for proper treatment.",
        coordinates: { xPct: 50.0, yPct: 20.0, wPct: 30.0, hPct: 18.0 }
      },
      {
        id: "eczema_dermatitis",
        text: "Chronic skin conditions with dry, itchy, inflamed patches. Often affects areas like elbows, knees, and face. May worsen with stress or environmental triggers.",
        coordinates: { xPct: 10.0, yPct: 45.0, wPct: 35.0, hPct: 20.0 }
      },
      {
        id: "autoimmune_rash",
        text: "Skin manifestations of autoimmune conditions. May include butterfly rash, psoriasis patches, or other distinctive patterns. Often requires specialized treatment.",
        coordinates: { xPct: 60.0, yPct: 55.0, wPct: 25.0, hPct: 22.0 }
      }
    ],
    fallbackSymptoms: [
      { id: "general_rash", text: "General skin rash or irritation" },
      { id: "itching", text: "Skin itching or burning" },
      { id: "skin_changes", text: "Changes in skin color or texture" }
    ]
  }
};

export const getSymptomContentForBodyPart = (bodyPart: string): SymptomContent | null => {
  return symptomContent[bodyPart] || null;
};