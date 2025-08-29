import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PatientData {
  name: string;
  age: string;
  gender: string;
  phone: string;
}

export interface ConsultationState {
  // Wizard progress
  currentStep: number;
  isCompleted: boolean;
  
  // Patient information
  patientData: PatientData;
  
  // Body part selection
  selectedBodyParts: string[];
  currentView: 'Front' | 'Back view';
  selectionStep: 'quadrant' | 'detailed';
  
  // Symptoms
  selectedSymptoms: string[];
  symptomNotes: string;
  
  // Medications and diagnosis
  medications: any[];
  diagnosis: string;
  
  // Actions
  setCurrentStep: (step: number) => void;
  setPatientData: (data: PatientData) => void;
  setSelectedBodyParts: (parts: string[]) => void;
  setCurrentView: (view: 'Front' | 'Back view') => void;
  setSelectionStep: (step: 'quadrant' | 'detailed') => void;
  setSelectedSymptoms: (symptoms: string[]) => void;
  setSymptomNotes: (notes: string) => void;
  setMedications: (medications: any[]) => void;
  setDiagnosis: (diagnosis: string) => void;
  resetConsultation: () => void;
}

const initialState = {
  currentStep: 0,
  isCompleted: false,
  patientData: { name: '', age: '', gender: 'male', phone: '' },
  selectedBodyParts: [],
  currentView: 'Front' as const,
  selectionStep: 'quadrant' as const,
  selectedSymptoms: [],
  symptomNotes: '',
  medications: [],
  diagnosis: '',
};

export const useConsultationStore = create<ConsultationState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setCurrentStep: (step: number) => set({ currentStep: step }),
      
      setPatientData: (data: PatientData) => 
        set({ patientData: data }),
      
      setSelectedBodyParts: (parts: string[]) => 
        set({ selectedBodyParts: parts }),
      
      setCurrentView: (view: 'Front' | 'Back view') => 
        set({ currentView: view }),
      
      setSelectionStep: (step: 'quadrant' | 'detailed') => 
        set({ selectionStep: step }),
      
      setSelectedSymptoms: (symptoms: string[]) => 
        set({ selectedSymptoms: symptoms }),
      
      setSymptomNotes: (notes: string) => 
        set({ symptomNotes: notes }),
      
      setMedications: (medications: any[]) => 
        set({ medications }),
      
      setDiagnosis: (diagnosis: string) => 
        set({ diagnosis }),
      
      resetConsultation: () => set(initialState),
    }),
    {
      name: 'consultation-store',
      // Only persist essential data, not temporary UI state
      partialize: (state) => ({
        patientData: state.patientData,
        selectedBodyParts: state.selectedBodyParts,
        selectedSymptoms: state.selectedSymptoms,
        symptomNotes: state.symptomNotes,
        medications: state.medications,
        diagnosis: state.diagnosis,
        currentStep: state.currentStep,
      }),
    }
  )
);