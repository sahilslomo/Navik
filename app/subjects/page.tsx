"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

/* 🔹 MAIN CONTENT */
function SubjectsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();

  const courseClass = params.get("class");

  const [subjects, setSubjects] = useState<
    { name: string; total: number; completed: number }[]
  >([]);

  // 🔥 ICON MAP
  const subjectIcons: Record<string, string> = {
    Safety: "🛟",
    Electrical: "⚡",
    Motor: "🔧",
    Mep: "🏗️",
  };

  // 🔒 AUTH
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [session, status, router]);

  // ✅ LOAD SUBJECTS DATA
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const res = await fetch("/data/questions.json");
        const data = await res.json();

        const classKey = courseClass ? `meo${courseClass}` : "";
        const subjectList = ["safety", "electrical", "motor", "mep"];

        const result = subjectList.map((sub) => {
          const topics = data?.[classKey]?.[sub]?.topics ?? {};

          let total = 0;
          let completedTotal = 0;

          Object.entries(topics).forEach(([topicName, arr]: any) => {
            const questions = Array.isArray(arr) ? arr : [];
            total += questions.length;

            const key = `progress_${courseClass}_${sub}_${topicName}`;
            const saved = localStorage.getItem(key);
            const completed = saved ? JSON.parse(saved).length : 0;

            completedTotal += completed;
          });

          return {
            name: sub.charAt(0).toUpperCase() + sub.slice(1),
            total,
            completed: completedTotal,
          };
        });

        setSubjects(result);
      } catch (err) {
        console.error(err);
        setSubjects([]);
      }
    };

    if (courseClass) loadCounts();
  }, [courseClass]);

  const handleBack = () => {
    router.push("/dashboard");
  };

  if (status === "loading") {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!session) return null;

  if (!courseClass) {
    return <div className="p-10 text-center">Invalid URL</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-10">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-gray-800">
          MEO Class {courseClass}
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Select a subject to continue
        </p>
      </div>
{/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {subjects.map((sub) => {
          const progress =
            sub.total === 0 ? 0 : (sub.completed / sub.total) * 100;

          return (
            <div
              key={sub.name}
              onClick={() =>
                router.push(`/topics?class=${courseClass}&subject=${sub.name}`)
              }
              className="cursor-pointer bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border hover:scale-[1.03]"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {subjectIcons[sub.name] || "📘"}
                </span>
                <h3 className="text-sm font-semibold text-gray-800">
                  {sub.name}
                </h3>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                {sub.total} Questions
              </p>

              <p className="text-xs text-green-600 mt-1">
                ✅ {sub.completed} Completed
              </p>

              <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${progress}%`}}
                />
              </div>
            </div>
          );
        })}
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

/* 🔹 WRAPPER */
export default function Subjects() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SubjectsContent />
    </Suspense>
  );
}
