
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Clock, CheckCircle, Stethoscope, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PrescriptionStatusProps {
  request: {
    id: string;
    status: 'pending' | 'in_progress' | 'completed';
    prescription_required: boolean;
    is_referral?: boolean;
    prescription?: {
      id: string;
      medications: string;
      instructions: string;
      pdf_url?: string;
      created_at: string;
    } | null;
  };
}

const PrescriptionStatus = ({ request }: PrescriptionStatusProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleViewPrescription = async () => {
    if (!request.prescription) return;
    
    setIsDownloading(true);
    try {
      // First check if PDF exists by checking pdf_url field
      if (!request.prescription.pdf_url) {
        toast({
          title: "PDF Generating",
          description: "Your prescription PDF is being generated. Please try again in a few moments.",
          variant: "default",
        });
        setIsDownloading(false);
        return;
      }

      // Use the new download function to get fresh signed URL
      const { data, error } = await supabase.functions.invoke('download-prescription', {
        body: { 
          prescriptionId: request.prescription.id,
          requestId: request.id 
        }
      });

      if (error) {
        console.error('Error downloading prescription:', error);
        
        // Handle specific error cases
        if (error.message?.includes('PDF not yet generated')) {
          toast({
            title: "PDF Generating",
            description: "Your prescription PDF is being generated. Please try again in a few moments.",
          });
        } else {
          toast({
            title: "Download Error", 
            description: "Failed to download prescription. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      if (!data?.success || !data?.downloadUrl) {
        toast({
          title: "Download Error",
          description: "Prescription file not ready. Please try again in a few moments.",
          variant: "destructive",
        });
        return;
      }

      // Download the file
      try {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName || `prescription-${request.prescription.id}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: "Your prescription is downloading...",
        });
      } catch (fetchError) {
        console.error('Error downloading file:', fetchError);
        // Fallback: try to open in new tab
        window.open(data.downloadUrl, '_blank');
      }
      
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast({
        title: "Download Error",
        description: "Failed to download prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const isReferral = !request.prescription_required;

  if (request.status === 'completed' && request.prescription) {
    // Check if PDF is ready - accept both file paths and signed URLs
    const hasValidPdf = request.prescription.pdf_url && 
      request.prescription.pdf_url.trim().length > 0 &&
      request.prescription.pdf_url !== 'null';
    
    if (!hasValidPdf) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="text-orange-600 border-orange-200 bg-orange-50"
        >
          <Clock className="h-4 w-4 mr-1" />
          {isReferral ? 'Generating Referral PDF' : 'Generating PDF'}
        </Button>
      );
    }
    
    return (
      <Button
        variant="default"
        size="sm"
        onClick={handleViewPrescription}
        disabled={isDownloading}
        className="bg-green-600 hover:bg-green-700"
      >
        <Download className="h-4 w-4 mr-1" />
        {isDownloading ? 'Loading...' : isReferral ? 'View Referral' : 'View Prescription'}
      </Button>
    );
  }

  if (request.status === 'completed' && !request.prescription) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="text-orange-600 border-orange-200"
      >
        <Clock className="h-4 w-4 mr-1" />
        {isReferral ? 'Generating Referral' : 'Generating Prescription'}
      </Button>
    );
  }

  if (request.status === 'pending') {
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
        <Clock className="h-3 w-3 mr-1" />
        Awaiting Doctor Review
      </Badge>
    );
  }

  if (request.status === 'in_progress') {
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
        <Stethoscope className="h-3 w-3 mr-1" />
        Doctor Reviewing
      </Badge>
    );
  }

  return null;
};

export default PrescriptionStatus;
