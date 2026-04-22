"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session } = useSession();

  const text = "Faster with NAVIK";
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i === text.length) clearInterval(interval);
      }, 120);

      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  const handleStart = () => {
    const targetUrl = "/dashboard";

    if (session) {
      window.location.href = targetUrl;
      return;
    }

    signIn("google", {
      callbackUrl: targetUrl,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20">

      {/* HERO */}
      <section className="text-center px-5 py-16 bg-gradient-to-b from-white to-slate-50">

        <div className="border border-slate-300 bg-slate-50 shadow-sm px-6 py-10 md:py-12 rounded-none">

          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-5 leading-tight">
            Crack MEO Class 4 & Class 2

            <br />

            <span className="block mt-2">
              <span className="premium-text">{displayed}</span>
            </span>
          </h1>

          <p className="text-slate-500 max-w-xl mx-auto mb-8 text-sm md:text-base">
            🚢 Surveyor-focused notes, past questions, and smart AI tools designed
            to help you clear your exams with confidence.
          </p>

          <button
            onClick={handleStart}
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-3 text-base shadow-md w-full md:w-auto"
          >
            ⚓ Start the Engine
          </button>

        </div>

      </section>

      {/* MAIN BOX */}
      <section className="max-w-6xl mx-auto px-5">

        <div className="border border-slate-300 bg-slate-100 shadow-md p-6 md:p-10 rounded-none space-y-12">

          {/* CLASS BOXES */}
          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-white p-5 md:p-6 border border-slate-300">
              <h3 className="text-lg font-bold mb-2 text-slate-800">
                ⚙️ MEO Class 4
              </h3>
              <p className="text-slate-500 mb-2 text-sm">
                🧭 For junior marine engineers preparing for operational level exams.
              </p>
              <p className="text-slate-400 text-xs">
                📘 Covers engineering fundamentals, electrical systems, safety, and DG Shipping exam preparation.
              </p>
            </div>

            <div className="bg-white p-5 md:p-6 border border-slate-300">
              <h3 className="text-lg font-bold mb-2 text-slate-800">
                ⚓ MEO Class 2
              </h3>
              <p className="text-slate-500 mb-2 text-sm">
                🧭 For senior marine engineers preparing for management level exams.
              </p>
              <p className="text-slate-400 text-xs">
                📘 Advanced engineering systems, troubleshooting, management duties, and oral + written preparation.
              </p>
            </div>

          </div>

          {/* FEATURE STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">

            <div className="border border-slate-300 bg-white p-3 md:p-4">
              <p className="font-bold text-base md:text-lg text-slate-800">📊 500+</p>
              <p className="text-slate-500 text-xs">Questions</p>
            </div>

            <div className="border border-slate-300 bg-white p-3 md:p-4">
              <p className="font-bold text-base md:text-lg text-slate-800">📚 Topic-wise</p>
              <p className="text-slate-500 text-xs">Structured</p>
            </div>
<div className="border border-slate-300 bg-white p-3 md:p-4">
              <p className="font-bold text-base md:text-lg text-slate-800">🎯 Oral + Written</p>
              <p className="text-slate-500 text-xs">Exam Ready</p>
            </div>

            <div className="border border-slate-300 bg-white p-3 md:p-4">
              <p className="font-bold text-base md:text-lg text-slate-800">⚓ DG Shipping</p>
              <p className="text-slate-500 text-xs">Updated</p>
            </div>

          </div>

          {/* WHY NAVIK */}
          <div className="text-center">

            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">
              🚢 Why NAVIK
            </h2>

            <div className="grid md:grid-cols-4 gap-4">

              <div className="p-5 md:p-6 bg-white border border-slate-300">
                <p className="font-semibold mb-1">🤖 AI Powered</p>
                <p className="text-xs text-slate-500">Smarter explanations</p>
              </div>

              <div className="p-5 md:p-6 bg-white border border-slate-300">
                <p className="font-semibold mb-1">📚 Structured</p>
                <p className="text-xs text-slate-500">Clean learning flow</p>
              </div>

              <div className="p-5 md:p-6 bg-white border border-slate-300">
                <p className="font-semibold mb-1">🔍 Fast Search</p>
                <p className="text-xs text-slate-500">Instant answers</p>
              </div>

              <div className="p-5 md:p-6 bg-white border border-slate-300">
                <p className="font-semibold mb-1">🎯 Exam Focus</p>
                <p className="text-xs text-slate-500">DG Shipping aligned</p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER (ADDED ONLY) */}
      <footer className="mt-16 border-t border-slate-300 bg-slate-50 py-10">

        <div className="max-w-6xl mx-auto px-5 text-center space-y-4">

          <div className="flex justify-center gap-6 text-xl">

            <a href="#" className="hover:text-blue-600 transition">✈️</a>
            <a href="#" className="hover:text-red-600 transition">▶️</a>
            <a href="#" className="hover:text-pink-600 transition">📸</a>

          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} NAVIK Training Portal. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}
