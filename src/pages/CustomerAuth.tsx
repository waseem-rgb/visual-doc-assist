import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Lock, Mail, ArrowLeft, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CustomerAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear any error when component mounts or form inputs change
  useEffect(() => {
    setError("");
  }, [email, password, phone, otp, isSignUp, authMethod]);

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

      // Check if user has customer role, if not assign it
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      if (roleError && roleError.code !== 'PGRST116') {
        console.error("Error checking roles:", roleError);
      }

      const hasCustomerRole = roles?.some(r => r.role === 'customer');
      if (!hasCustomerRole) {
        const { error: insertRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'customer'
          });
        
        if (insertRoleError) {
          console.error("Error assigning customer role:", insertRoleError);
        }
      }

      toast({
        title: "Phone Verified!",
        description: "You've been signed in successfully.",
      });
      
      navigate("/customer/dashboard");
    } catch (error: any) {
      setError(error.message);
      console.error("OTP verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (isSignUp) {
        // Sign up new customer
        const redirectUrl = `${window.location.origin}/customer/dashboard`;
        console.log("Attempting signup with:", { email, redirectTo: redirectUrl });
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        console.log("Signup response:", { data, error: signUpError });

        if (signUpError) {
          console.error("Signup error details:", signUpError);
          throw signUpError;
        }

        // If user was created, assign customer role
        if (data.user) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'customer'
            });
          
          if (roleError) {
            console.error("Error assigning customer role:", roleError);
          }
        }

        toast({
          title: "Account Created",
          description: "Please check your email to confirm your account, then sign in.",
        });
        
        setIsSignUp(false);
      } else {
        // Sign in existing customer
        console.log("Attempting sign in with:", { email });
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log("Sign in response:", { data, error: signInError });

        if (signInError) {
          console.error("Sign in error details:", signInError);
          throw signInError;
        }

        if (!data.user) {
          throw new Error("Authentication failed");
        }

        // Check if user has customer role
        const { data: roles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        if (roleError) throw roleError;

        const hasCustomerRole = roles?.some(r => r.role === 'customer');
        if (!hasCustomerRole) {
          await supabase.auth.signOut();
          throw new Error("Access denied - Customer account required");
        }

        toast({
          title: "Welcome Back!",
          description: "You've been signed in successfully.",
        });
        
        navigate("/customer/dashboard");
      }
    } catch (error: any) {
      setError(error.message);
      console.error("Auth error:", error);
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
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isSignUp ? "Sign up to track your medical consultations" : "Sign in to access your medical dashboard"}
          </p>
        </CardHeader>

        <CardContent>
          <Tabs value={authMethod} onValueChange={(value) => {
            setAuthMethod(value as "email" | "phone");
            setError("");
            setOtpSent(false);
            setOtp("");
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="phone" className="space-y-4 mt-4">
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

            <TabsContent value="email" className="space-y-4 mt-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
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
                    placeholder="your@email.com"
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
                  {loading ? 
                    (isSignUp ? "Creating Account..." : "Signing In...") : 
                    (isSignUp ? "Create Account" : "Sign In")
                  }
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                </Button>
              </form>
            </TabsContent>

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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerAuth;