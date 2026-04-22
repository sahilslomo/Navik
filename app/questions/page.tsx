"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

/* ✅ MAIN COMPONENT (uses search params) */
function QuestionsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();

  const courseClass = params.get("class");
  const subject = params.get("subject");
  const topic = params.get("topic");
  const type = params.get("type");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [session, status, router]);

  const handleBack = () => {
    router.push(
      `/topics?class=${courseClass}&subject=${subject}`
    );
  };

  if (status === "loading") {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!session) return null;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 max-w-4xl mx-auto">

      {/* HEADER */}
      <h2 className="text-2xl font-semibold mb-2 text-center">
        {topic} - {type}
      </h2>

      <p className="text-center text-gray-500 mb-8">
        {subject} | MEO Class {courseClass}
      </p>

      {/* QUESTIONS */}
      <div className="space-y-4">
        {[
          "Explain the working principle of boiler safety valve.",
          "What are the causes of crankcase explosion?",
          "Define scavenge fire and how to prevent it."
        ].map((q, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition"
          >
            <p className="font-medium text-gray-800">
              Q{index + 1}. {q}
            </p>

            <button
              className="mt-3 text-blue-600 text-sm hover:underline"
              onClick={() => alert("Answer feature coming soon 🚀")}
            >
              Show Answer
            </button>
          </div>
        ))}
      </div>

      {/* BACK */}
      <div className="flex justify-center mt-10">
        <button
          onClick={handleBack}
          className="text-blue-600 hover:underline"
        >
          ← Back
        </button>
      </div>

    </main>
  );
}

/* ✅ WRAPPER WITH SUSPENSE (THIS FIXES YOUR ERROR) */
export default function Questions() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <QuestionsContent />
    </Suspense>
  );
}
