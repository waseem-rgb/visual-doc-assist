
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
      // Use the new download function to get fresh signed URL
      const { data, error } = await supabase.functions.invoke('download-prescription', {
        body: { 
          prescriptionId: request.prescription.id,
          requestId: request.id 
        }
      });

      if (error || !data?.success) {
        console.error('Error downloading prescription:', error);
        toast({
          title: "Download Error",
          description: "Failed to download prescription. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Open the fresh signed URL
      window.open(data.downloadUrl, '_blank');
      
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
