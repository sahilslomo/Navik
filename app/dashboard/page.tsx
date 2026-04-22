"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { motion } from "framer-motion";

// 🔹 MAIN CONTENT
function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  const courseClass = params.get("class");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [session, status, router]);

  const handleBack = () => {
    if (courseClass) router.push("/dashboard");
    else router.push("/");
  };

  if (status === "loading") {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!session) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-10">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {session.user?.name} 👋
        </h1>
        <p className="text-gray-500 mt-2">
          Continue your preparation
        </p>
      </motion.div>

      {/* COMMON DASHBOARD */}
      {!courseClass && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-6">
            Select Your Competency Exam
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {["2", "4"].map((cls) => (
              <motion.div
                key={cls}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/subjects?class=${cls}`)}
                className="cursor-pointer bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition border"
              >
                <h3 className="text-xl font-semibold text-gray-800">
                  MEO Class {cls}
                </h3>
                <p className="text-gray-500 mt-2 text-sm">
                  Start practicing questions
                </p>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <button
              onClick={handleBack}
              className="text-blue-600 hover:underline"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* CLASS DASHBOARD */}
      {courseClass && (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-8">
            MEO Class {courseClass}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {["Safety", "Electrical", "Motor", "MEP"].map((sub) => (
              <motion.div
                key={sub}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  router.push(`/subjects?class=${courseClass}&subject=${sub}`)
                }
                className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border text-center"
              >
                <h3 className="font-semibold text-gray-800">
                  {sub}
                </h3>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <button
              onClick={handleBack}
              className="text-blue-600 hover:underline"
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// 🔹 SUSPENSE WRAPPER
export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}