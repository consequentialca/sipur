"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthScreen from "@/components/AuthScreen";
import StarField from "@/components/StarField";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") ?? "/";

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0818",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 20px",
    }}>
      <StarField />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            fontFamily: "'Cormorant SC', Georgia, serif",
            fontSize: 13, letterSpacing: "0.35em",
            color: "rgba(245,230,200,0.3)", marginBottom: 6,
          }}>סיפור</div>
          <div style={{
            fontFamily: "'Cormorant SC', Georgia, serif",
            fontSize: 36, fontWeight: 600, letterSpacing: "0.12em",
            color: "#f5e6c8", lineHeight: 1,
          }}>Sipur</div>
        </div>
        <AuthScreen
          mode="signin"
          onAuth={() => router.push(returnUrl)}
        />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0818" }} />}>
      <SignInContent />
    </Suspense>
  );
}
