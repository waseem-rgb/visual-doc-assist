import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useConsultationStore } from '@/store/consultationStore';

interface ConsultationImportData {
  analysis_id: string;
  patient_name: string;
  token: string;
}

interface ConsultationAnalysis {
  analysis_id: string;
  patient_data: {
    name: string;
    age: string;
    gender: string;
    phone?: string;
  };
  analysis_results: any;
  analysis_pdf_url?: string;
  test_report_pdf_url?: string;
}

export const useConsultationImport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setPatientData, setSelectedSymptoms, setSymptomNotes, setDiagnosis } = useConsultationStore();
  const [isImporting, setIsImporting] = useState(false);

  const importConsultationData = async (data: ConsultationImportData) => {
    try {
      setIsImporting(true);
      
      // Call the API to get consultation data
      const response = await fetch('https://opvssqukuyemcxgoflzz.supabase.co/functions/v1/get-consultation-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_id: data.analysis_id,
          token: data.token,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch consultation data');
      }

      const consultationData: ConsultationAnalysis = await response.json();

      // Populate consultation store with imported data
      setPatientData({
        name: consultationData.patient_data.name,
        age: consultationData.patient_data.age,
        gender: consultationData.patient_data.gender,
        phone: consultationData.patient_data.phone || '',
        isPregnant: undefined
      });

      // Set symptoms and diagnosis if available
      if (consultationData.analysis_results?.symptoms) {
        setSelectedSymptoms(Array.isArray(consultationData.analysis_results.symptoms) 
          ? consultationData.analysis_results.symptoms 
          : [consultationData.analysis_results.symptoms]);
      }

      if (consultationData.analysis_results?.notes) {
        setSymptomNotes(consultationData.analysis_results.notes);
      }

      if (consultationData.analysis_results?.diagnosis) {
        setDiagnosis(consultationData.analysis_results.diagnosis);
      }

      // Create prescription request with the imported data
      const { data: prescriptionRequest, error } = await supabase
        .from('prescription_requests')
        .insert({
          external_source: 'daigasst-health-ai',
          external_id: consultationData.analysis_id,
          patient_name: consultationData.patient_data.name,
          patient_age: consultationData.patient_data.age,
          patient_gender: consultationData.patient_data.gender,
          patient_phone: consultationData.patient_data.phone,
          body_part: 'General Analysis', // Default value, can be updated by doctor
          symptoms: JSON.stringify(consultationData.analysis_results),
          probable_diagnosis: consultationData.analysis_results?.diagnosis || '',
          short_summary: 'Imported analysis from DAIGASST Health AI',
          prescription_required: true,
          status: 'pending',
          analysis_pdf_url: consultationData.analysis_pdf_url,
          test_report_pdf_url: consultationData.test_report_pdf_url,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: 'Consultation Imported',
        description: `Analysis for ${consultationData.patient_data.name} has been imported successfully.`,
      });

      // Clean URL and navigate to doctor dashboard or consultation view
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Navigate to the consultation page with imported data
      navigate('/consultation?imported=true');

    } catch (error) {
      console.error('Error importing consultation:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import consultation data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const consultationFrom = searchParams.get('consultation_from');
    
    if (consultationFrom === 'daigasst') {
      const analysis_id = searchParams.get('analysis_id');
      const patient_name = searchParams.get('patient_name');
      const token = searchParams.get('token');
      
      if (analysis_id && patient_name && token) {
        importConsultationData({
          analysis_id,
          patient_name,
          token,
        });
      } else {
        toast({
          title: 'Invalid Consultation Link',
          description: 'Missing required parameters for consultation import.',
          variant: 'destructive',
        });
      }
    }
  }, [location.search]);

  return { isImporting };
};