// app/page.tsx

"use client";

import "./page.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setCheckingSession(false), 4000);
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          if (data?.role === "admin") {
            router.replace("/members/dashboard");
          } else if (data?.role === "member") {
            router.replace("/member-portal");
          } else {
            setCheckingSession(false);
          }
        } else {
          setCheckingSession(false);
        }
      } catch (e) {
        setCheckingSession(false);
      } finally {
        clearTimeout(timeout);
      }
    })();
  }, []);

  const handleLogin = async () => {
    setError(""); setSuccess("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role === "admin") {
      router.replace("/members/dashboard");
    } else {
      router.replace("/member-portal");
    }
  };

  const handleRegister = async () => {
    setError(""); setSuccess("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess("Account created! You can now sign in.");
    setMode("login");
    setPassword("");
  };

  const handleSubmit = () => mode === "login" ? handleLogin() : handleRegister();

  if (checkingSession) return (
    <div style={{ minHeight: "100vh", background: "#eef2f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: "2.5px solid rgba(30,45,90,0.15)", borderTopColor: "#3b5bdb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  return (
    <>
      <div className="land-root">
        <div className="land-orb land-orb-1" />
        <div className="land-orb land-orb-2" />
        <div className="land-orb land-orb-3" />

        {/* LEFT PANEL */}
        <div className="land-left">
          <div className="land-badge">
            <div className="land-badge-dot" />
            Church Membership Directory
          </div>
          <h1 className="land-headline">
            Welcome to<br />our church<br /><span>family.</span>
          </h1>
          <p className="land-desc">
            Keeping our congregation connected — one family at a time. This is the membership home of the{" "}
            <strong style={{ color: "#1e2d5a" }}>United Church of Christ in the Philippines, Iligan City</strong>.
          </p>

          <div className="land-divider">
            <div className="land-divider-line" />
            <span className="land-divider-text">Members portal</span>
            <div className="land-divider-line" />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="land-right">
          <div className="land-form-wrap">

            <div className="land-form-logo">
              <div className="land-form-logo-box">
                <Image src="/uccp-logo.png" alt="UCCP" width={26} height={26} />
              </div>
              <div>
                <div className="land-form-logo-name">United Church of Christ<br/> in the Philippines</div>
                <div className="land-form-logo-sub">Iligan City Church</div>
              </div>
            </div>

            <div className="land-form-heading">
              {mode === "login" ? "Welcome back" : "Join the directory"}
            </div>
            <div className="land-form-sub">
              {mode === "login"
                ? "Sign in to access the membership portal."
                : "Create an account to get connected with the congregation."}
            </div>

            <div className="land-tabs">
              <button
                className={`land-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
                Sign In
              </button>
              <button
                className={`land-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>
                Register
              </button>
            </div>

            {error && <div className="land-error">⚠ {error}</div>}
            {success && <div className="land-success">✓ {success}</div>}

            <div className="land-field">
              <label className="land-label">Email Address</label>
              <input
                className="land-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <div className="land-field">
              <label className="land-label">Password</label>
              <div className="land-input-wrap">
                <input
                  className="land-input has-eye"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                <button className="land-eye" type="button" onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button className="land-btn" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><div className="land-spinner" />{mode === "login" ? "Signing in…" : "Creating account…"}</>
                : mode === "login" ? "Sign In" : "Create Account"
              }
            </button>

            <p className="land-hint">
              {mode === "login"
                ? "We're glad you're here."
                : "Joining the directory helps us stay connected as a congregation."}
            </p>

          </div>
        </div>
      </div>
    </>
  );
}