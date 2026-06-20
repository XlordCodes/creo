"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, Phone } from "lucide-react";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormData = z.infer<typeof signupSchema>;

type AuthMode = "default" | "phone_otp";

function getPlanRedirect(planParam: string | null): string {
  return planParam
    ? `/signup/plan?plan=${encodeURIComponent(planParam)}`
    : "/signup/plan";
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  async function registerBackendUser(user: {
    id: string;
    email: string;
    phone?: string;
    full_name: string;
    business_name?: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_id: user.id,
            email: user.email,
            phone: user.phone || null,
            full_name: user.full_name,
            business_name: user.business_name || null,
          }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        setError(result.detail || "Registration failed. Please try again.");
        return false;
      }
      return true;
    } catch {
      setError("Failed to connect to server. Please try again.");
      return false;
    }
  }

  async function onSubmit(data: SignupFormData) {
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: "client",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Failed to create account. Please try again.");
      setLoading(false);
      return;
    }

    const backendOk = await registerBackendUser({
      id: authData.user.id,
      email: data.email,
      phone: data.phone,
      full_name: data.fullName,
      business_name: data.businessName,
    });

    if (!backendOk) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    router.push(getPlanRedirect(params.get("plan")));
  }

  async function handleGoogleSignup() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      setError(error.message);
      setOtpLoading(false);
      return;
    }

    setOtpSent(true);
    setOtpLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (error) {
      setError(error.message);
      setOtpLoading(false);
      return;
    }

    if (data.user) {
      const meta = data.user.user_metadata || {};
      const backendOk = await registerBackendUser({
        id: data.user.id,
        email: data.user.email || `${phone}@phone.creo.app`,
        phone: phone,
        full_name: meta.full_name || "Phone User",
        business_name: meta.business_name,
      });

      if (!backendOk) {
        setOtpLoading(false);
        return;
      }
    }

    const params = new URLSearchParams(window.location.search);
    router.push(getPlanRedirect(params.get("plan")));
  }

  if (mode === "phone_otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-brand-dark">
              {otpSent ? "Enter verification code" : "Sign up with phone"}
            </CardTitle>
            <CardDescription>
              {otpSent
                ? `We sent a 6-digit code to ${phone}`
                : "Enter your phone number to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="phone-signup"
                    className="text-sm font-medium text-text"
                  >
                    Phone Number
                  </label>
                  <Input
                    id="phone-signup"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="border-border focus:border-brand focus:ring-brand"
                  />
                </div>

                {error && (
                  <div className="text-sm text-error bg-error-light p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand/90 text-white"
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="otp-signup"
                    className="text-sm font-medium text-text"
                  >
                    6-digit code
                  </label>
                  <Input
                    id="otp-signup"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="border-border focus:border-brand focus:ring-brand"
                  />
                </div>

                {error && (
                  <div className="text-sm text-error bg-error-light p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand/90 text-white"
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Create Account"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError(null);
                  }}
                  className="text-sm text-brand hover:underline w-full text-center"
                >
                  Use a different number
                </button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <button
              onClick={() => {
                setMode("default");
                setOtpSent(false);
                setOtp("");
                setPhone("");
                setError(null);
              }}
              className="text-sm text-brand hover:underline font-medium"
            >
              Back to email sign up
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-brand-dark">
            Create your account
          </CardTitle>
          <CardDescription>
            Start growing your brand with Creo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-text">
                Full Name <span className="text-error">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                {...register("fullName")}
                className="border-border focus:border-brand focus:ring-brand"
              />
              {errors.fullName && (
                <p className="text-sm text-error">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-text">
                Business Name
              </Label>
              <Input
                id="businessName"
                placeholder="Your Business (optional)"
                {...register("businessName")}
                className="border-border focus:border-brand focus:ring-brand"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-text">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210 (optional)"
                {...register("phone")}
                className="border-border focus:border-brand focus:ring-brand"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-text">
                Email <span className="text-error">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="border-border focus:border-brand focus:ring-brand"
              />
              {errors.email && (
                <p className="text-sm text-error">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-text">
                Password <span className="text-error">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                {...register("password")}
                className="border-border focus:border-brand focus:ring-brand"
              />
              {errors.password && (
                <p className="text-sm text-error">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="text-sm text-error bg-error-light p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-text-muted">
                Or sign up with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleGoogleSignup}
              className="border-border text-text"
            >
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMode("phone_otp");
                setError(null);
              }}
              className="border-border text-text"
            >
              <Phone className="mr-2 h-4 w-4" />
              Phone
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-text-muted">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-brand hover:underline font-medium"
            >
              Sign In
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
