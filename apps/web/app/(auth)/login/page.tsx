"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, Phone } from "lucide-react";

type AuthMode = "default" | "phone_otp";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("default");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  async function handleGoogleLogin() {
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

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (error) {
      setError(error.message);
      setOtpLoading(false);
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  if (mode === "phone_otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-brand-dark">
              {otpSent ? "Enter verification code" : "Sign in with phone"}
            </CardTitle>
            <CardDescription>
              {otpSent
                ? `We sent a 6-digit code to ${phone}`
                : "Enter your phone number to receive a code"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="phone-login"
                    className="text-sm font-medium text-text"
                  >
                    Phone Number
                  </label>
                  <Input
                    id="phone-login"
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
                    htmlFor="otp-login"
                    className="text-sm font-medium text-text"
                  >
                    6-digit code
                  </label>
                  <Input
                    id="otp-login"
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
                    "Verify & Sign In"
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
              Back to email sign in
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-brand-dark">
            Welcome back to Creo
          </CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-text"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-border focus:border-brand focus:ring-brand"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-text"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-text-muted">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
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
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-brand hover:underline font-medium"
            >
              Get Started
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
