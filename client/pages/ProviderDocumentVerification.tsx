import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Upload,
  FileText,
  Shield,
  Home,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Camera,
  X,
  Users,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface DocumentUpload {
  file: File | null;
  uploaded: boolean;
  preview?: string;
}

interface DocumentState {
  driversLicense: DocumentUpload;
  proofOfAddress: DocumentUpload;
  liabilityInsurance: DocumentUpload;
  licenses: DocumentUpload[];
}

export default function ProviderDocumentVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [providerId, setProviderId] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentState>({
    driversLicense: { file: null, uploaded: false },
    proofOfAddress: { file: null, uploaded: false },
    liabilityInsurance: { file: null, uploaded: false },
    licenses: [],
  });

  // Get business and provider info from location state or fetch from database
  useEffect(() => {
    const locationState = location.state as any;
    if (locationState?.businessId) {
      setBusinessId(locationState.businessId);
    }

    // Fetch provider info if user is logged in
    if (user?.id) {
      fetchProviderInfo();
    }
  }, [user, location.state]);

  const fetchProviderInfo = async () => {
    if (!user?.id) return;

    try {
      const { data: provider, error } = await supabase
        .from('providers')
        .select('id, business_id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (provider) {
        setProviderId(provider.id);
        if (!businessId) {
          setBusinessId(provider.business_id);
        }
      }
    } catch (error) {
      console.error('Error fetching provider info:', error);
      toast({
        title: "Error",
        description: "Failed to load provider information",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (
    documentType: keyof Omit<DocumentState, "licenses">,
    file: File,
  ) => {
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert("File size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          file,
          uploaded: true,
          preview: file.type.startsWith("image/") ? preview : undefined,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLicenseUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setDocuments((prev) => ({
        ...prev,
        licenses: [
          ...prev.licenses,
          {
            file,
            uploaded: true,
            preview: file.type.startsWith("image/") ? preview : undefined,
          },
        ],
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeLicense = (index: number) => {
    setDocuments((prev) => ({
      ...prev,
      licenses: prev.licenses.filter((_, i) => i !== index),
    }));
  };

  const removeDocument = (
    documentType: keyof Omit<DocumentState, "licenses">,
  ) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: { file: null, uploaded: false },
    }));
  };

  const allRequiredDocumentsUploaded = () => {
    return (
      documents.driversLicense.uploaded &&
      documents.proofOfAddress.uploaded &&
      documents.liabilityInsurance.uploaded
    );
  };

  const handleSubmit = async () => {
    if (!allRequiredDocumentsUploaded()) {
      alert("Please upload all required documents before proceeding.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate document upload process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navigate to provider onboarding for additional setup
      navigate("/provider-onboarding");
    } catch (error) {
      console.error("Error submitting documents:", error);
      alert("Error uploading documents. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentRequirements = [
    {
      type: "driversLicense",
      title: "Driver's License",
      description: "Valid government-issued photo ID",
      icon: CreditCard,
      required: true,
      document: documents.driversLicense,
    },
    {
      type: "proofOfAddress",
      title: "Proof of Address",
      description:
        "Utility bill, bank statement, or lease agreement (within 3 months)",
      icon: Home,
      required: true,
      document: documents.proofOfAddress,
    },
    {
      type: "liabilityInsurance",
      title: "Liability Insurance",
      description: "Professional liability insurance certificate",
      icon: Shield,
      required: true,
      document: documents.liabilityInsurance,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link
                  to="/provider-portal"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Portal</span>
                </Link>
              </Button>
            </div>

            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Document Verification</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Please upload the required documents to verify your identity and
              qualifications. All documents will be securely reviewed within
              24-48 hours.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-roam-blue rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">Registration</span>
              </div>
              <div className="w-16 h-0.5 bg-roam-blue"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-roam-blue rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-roam-blue">
                  Documents
                </span>
              </div>
              <div className="w-16 h-0.5 bg-border"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-border rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-foreground/50" />
                </div>
                <span className="text-sm text-foreground/50">Onboarding</span>
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold">Required Documents</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {documentRequirements.map((req) => (
                <Card key={req.type} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-roam-light-blue/20 rounded-lg flex items-center justify-center">
                        <req.icon className="w-5 h-5 text-roam-blue" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{req.title}</h3>
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/70 mb-4">
                      {req.description}
                    </p>

                    {req.document.uploaded ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {req.document.file?.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeDocument(
                                req.type as keyof Omit<
                                  DocumentState,
                                  "licenses"
                                >,
                              )
                            }
                            className="ml-auto text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {req.document.preview && (
                          <div className="w-full h-32 rounded-lg overflow-hidden border">
                            <img
                              src={req.document.preview}
                              alt={`${req.title} preview`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-foreground/70 mb-3">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-foreground/50 mb-3">
                          JPG, PNG, PDF up to 10MB
                        </p>
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                req.type as keyof Omit<
                                  DocumentState,
                                  "licenses"
                                >,
                                file,
                              );
                            }
                          }}
                          className="hidden"
                          id={`upload-${req.type}`}
                        />
                        <Label htmlFor={`upload-${req.type}`}>
                          <Button
                            variant="outline"
                            className="cursor-pointer"
                            asChild
                          >
                            <span>
                              <Camera className="w-4 h-4 mr-2" />
                              Choose File
                            </span>
                          </Button>
                        </Label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Professional Licenses & Certificates */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-roam-yellow/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-roam-yellow" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    Professional Licenses & Certificates
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70 mb-4">
                Upload any professional licenses, certifications, or training
                certificates related to the services you offer.
              </p>

              {/* Uploaded Licenses */}
              {documents.licenses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {documents.licenses.map((license, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {license.file?.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLicense(index)}
                        className="ml-auto text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-foreground/70 mb-3">
                  Click to upload licenses or certificates
                </p>
                <p className="text-xs text-foreground/50 mb-3">
                  JPG, PNG, PDF up to 10MB each
                </p>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleLicenseUpload(file);
                    }
                    e.target.value = ""; // Reset input to allow same file upload
                  }}
                  className="hidden"
                  id="upload-licenses"
                />
                <Label htmlFor="upload-licenses">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Add License/Certificate
                    </span>
                  </Button>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> All documents will be securely stored
              and reviewed by our verification team. You'll receive an email
              notification once your documents are approved. The verification
              process typically takes 24-48 hours.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button asChild variant="outline" size="lg">
              <Link to="/provider-portal">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </Link>
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!allRequiredDocumentsUploaded() || isSubmitting}
              className="bg-roam-blue hover:bg-roam-blue/90"
              size="lg"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Documents
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
