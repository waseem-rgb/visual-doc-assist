import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Stethoscope, Lock, Mail, ArrowLeft, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DoctorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear any error when component mounts or form inputs change
  useEffect(() => {
    setError("");
  }, [email, password, phone, otp]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Only allow sign in - no signup functionality
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!data.user) {
        throw new Error("Authentication failed");
      }

      // Check if user has doctor role
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      if (roleError) throw roleError;

      const hasDocRole = roles?.some(r => r.role === 'doctor');
      if (!hasDocRole) {
        await supabase.auth.signOut();
        throw new Error("Access denied - Doctor role required. Contact administrator for account creation.");
      }

      toast({
        title: "Login Successful",
        description: "Welcome back, Doctor!",
      });
      
      navigate("/doctor/dashboard");
    } catch (error: any) {
      setError(error.message);
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Format phone number to E.164 format
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        // Assume India if no country code, remove leading 0 if present
        formattedPhone = '+91' + formattedPhone.replace(/^0/, '');
      }

      console.log("Sending OTP to:", formattedPhone);

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.error("OTP send error:", error);
        throw error;
      }

      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code.",
      });
    } catch (error: any) {
      setError(error.message);
      console.error("OTP send error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP code");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // Format phone number to E.164 format
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone.replace(/^0/, '');
      }

      console.log("Verifying OTP for:", formattedPhone);

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });

      if (error) {
        console.error("OTP verification error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("Verification failed");
      }

      // Check user roles
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      if (roleError && roleError.code !== 'PGRST116') {
        console.error("Error checking roles:", roleError);
      }

      const hasDocRole = roles?.some(r => r.role === 'doctor');
      const hasCustomerRole = roles?.some(r => r.role === 'customer');
      
      // Special exception for phone number 7993448425 - can have both roles
      const isSpecialNumber = phone.replace(/\D/g, '').endsWith('7993448425');
      
      if (isSpecialNumber) {
        // For special number, assign both roles if they don't exist
        if (!hasDocRole) {
          const { error: insertDocRoleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'doctor'
            });
          
          if (insertDocRoleError) {
            console.error("Error assigning doctor role:", insertDocRoleError);
          }
        }
        
        if (!hasCustomerRole) {
          const { error: insertCustomerRoleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'customer'
            });
          
          if (insertCustomerRoleError) {
            console.error("Error assigning customer role:", insertCustomerRoleError);
          }
        }
      } else {
        // For regular numbers, only allow doctor role
        if (!hasDocRole) {
          await supabase.auth.signOut();
          throw new Error("Access denied - Doctor role required. Contact administrator for account creation.");
        }
      }

      toast({
        title: "Phone Verified!",
        description: "Welcome back, Doctor!",
      });
      
      navigate("/doctor/dashboard");
    } catch (error: any) {
      setError(error.message);
      console.error("OTP verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Doctor Login
          </CardTitle>
          <p className="text-muted-foreground">
            Access your medical dashboard
          </p>
          <Alert>
            <AlertDescription>
              Doctor accounts are created by system administrators only. 
              Phone number 7993448425 has special access privileges.
            </AlertDescription>
          </Alert>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email Login</TabsTrigger>
              <TabsTrigger value="phone">Phone Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    required
                    className="transition-smooth"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="transition-smooth"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210 or +919876543210"
                      required
                      className="transition-smooth"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your 10-digit mobile number (India +91 is default)
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-center block">
                      Enter 6-digit OTP sent to {phone}
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        className="justify-center"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setError("");
                    }}
                  >
                    Change Phone Number
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t mt-4">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorLogin;