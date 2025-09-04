import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Lock, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CustomerAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Clear any error when component mounts or form inputs change
  useEffect(() => {
    setError("");
  }, [email, password, isSignUp]);

  const handleAuth = async (e: React.FormEvent) => {
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
            // Don't fail the signup for role assignment errors
          }
        }

        if (data.user && !data.user.email_confirmed_at) {
          toast({
            title: "Account Created",
            description: "Please check your email to confirm your account, then sign in.",
          });
        } else if (data.user && data.user.email_confirmed_at) {
          toast({
            title: "Account Created & Confirmed",
            description: "You can now sign in with your credentials.",
          });
        } else {
          toast({
            title: "Signup Initiated",
            description: "Please check your email for further instructions.",
          });
        }
        
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
          
          // Handle specific token errors
          if (signInError.message?.includes('Invalid token') || signInError.message?.includes('signature is invalid')) {
            throw new Error('Authentication token is invalid. Please try signing up again or contact support.');
          }
          
          throw signInError;
        }

        if (!data.user) {
          throw new Error("Authentication failed");
        }

        // Check if email is confirmed (if confirmation is enabled)
        if (!data.user.email_confirmed_at) {
          throw new Error("Please confirm your email address before signing in");
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
        
        // Always redirect customer login to customer dashboard
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
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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

            <div className="pt-4 border-t">
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerAuth;