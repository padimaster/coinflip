"use client";

import { useAuthenticate, useMiniKit } from "@coinbase/onchainkit/minikit";
import { useState } from "react";

export default function AuthButton() {
  const { signIn } = useAuthenticate();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { context } = useMiniKit();

  const user = context?.user;

  const handleAuth = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signIn();

      if (!result) {
        throw new Error("Authentication failed", { cause: result });
      }
    } catch (error) {
      console.error("Authentication failed:", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (context?.user) {
    return (
      <div>
        <p>✅ Authenticated as FID: {user?.fid}</p>
        <button onClick={() => window.location.reload()}>Sign Out</button>
      </div>
    );
  }

  return (
    <button onClick={handleAuth} disabled={isAuthenticating}>
      {isAuthenticating ? "Authenticating..." : "Sign In with Farcaster"}
    </button>
  );
}
