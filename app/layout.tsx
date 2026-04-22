"use client";

import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import Script from "next/script";
import "./globals.css";

// 🔹 NAVBAR COMPONENT
function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-8 py-4 border-b bg-white z-50">

      {/* LEFT LOGO */}
      <h1 className="text-xl font-bold">⚓ NAVIK</h1>

      {/* RIGHT AUTH */}
      <div>
        {status === "loading" ? (
          <p className="text-sm text-gray-400">...</p>
        ) : session ? (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() =>
              signIn("google", {
                callbackUrl: "/dashboard",
              })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Sign In
          </button>
        )}
      </div>

    </nav>
  );
}

// 🔹 ROOT LAYOUT
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative">

        {/* ✅ SESSION PROVIDER (CRITICAL) */}
        <SessionProvider>

          {/* NAVBAR */}
          <Navbar />

          {/* MAIN CONTENT */}
          <div className="pt-20">
            {children}
          </div>

        </SessionProvider>

        {/* ✅ RAZORPAY SCRIPT */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

      </body>
    </html>
  );
}
