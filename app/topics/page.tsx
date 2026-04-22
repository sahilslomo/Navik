"use client";

export const dynamic = "force-dynamic";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";

type Topic = {
  name: string;
  count: number;
  completed: number;
};

function TopicsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();

  const courseClass = params.get("class");
  const subject = params.get("subject");

  const [topics, setTopics] = useState<Topic[]>([]);
  const [resume, setResume] = useState<any>(null);

  // 🔒 AUTH
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [session, status, router]);

  // ✅ SUBJECT-WISE CONTINUE
  useEffect(() => {
    if (!courseClass || !subject) return;

    const resumeKey = `navik_resume_${courseClass}_${subject.toLowerCase()}`;
    const saved = localStorage.getItem(resumeKey);

    if (saved) {
      setResume(JSON.parse(saved));
    }
  }, [courseClass, subject]);

  // ✅ LOAD TOPICS
  useEffect(() => {
    if (!courseClass || !subject) return;

    const loadTopics = async () => {
      try {
        const res = await fetch("/data/questions.json");
        const data = await res.json();

        const classKey = `meo${courseClass}`;
        const subjectKey = subject.toLowerCase();

        const topicObj =
          data?.[classKey]?.[subjectKey]?.topics ?? {};

        const list: Topic[] = Object.entries(topicObj).map(
          ([name, questions]: any) => {
            const total = Array.isArray(questions)
              ? questions.length
              : 0;

            const key = `progress_${courseClass}_${subjectKey}_${name}`;
            const saved = localStorage.getItem(key);
            const completed = saved
              ? JSON.parse(saved).length
              : 0;

            return {
              name,
              count: total,
              completed,
            };
          }
        );

        setTopics(list);
      } catch {
        setTopics([]);
      }
    };

    loadTopics();
  }, [courseClass, subject]);

  const handleBack = () => {
    router.push(`/subjects?class=${courseClass}`);
  };

  if (status === "loading") {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!session) return null;

  if (!courseClass || !subject) {
    return <div className="p-10 text-center">Invalid URL</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-10">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-xl font-bold text-gray-800 capitalize">
          {subject} - Class {courseClass}
        </h1>
        <p className="text-gray-500 text-xs mt-1">
          Select a topic
        </p>
      </motion.div>

      {/* ✅ CONTINUE */}
      {resume && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-5xl mx-auto mb-6"
        >
          <div
            onClick={() =>
              router.push(
                `/topic-view?class=${resume.class}&subject=${resume.subject}&topic=${resume.topic}`
              )
            }
            className="cursor-pointer bg-green-500 text-white px-4 py-3 rounded-xl shadow-sm hover:bg-green-600 transition"
          >
            ▶ Continue: {resume.topic}
          </div>
        </motion.div>
      )}

      {/* TOPICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {topics.map((topic) => {
          const progress =
            topic.count === 0
              ? 0
              : (topic.completed / topic.count) * 100;

          return (
            <motion.div
              key={topic.name}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                router.push(
                  `/topic-view?class=${courseClass}&subject=${subject}&topic=${topic.name}`
                )
              }
              className="cursor-pointer bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border"
            >
              <h3 className="text-sm font-bold text-gray-800">
                {topic.name}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {topic.count} Questions
              </p>

              <p className="text-xs text-green-600 mt-1">
                ✅ {topic.completed} Completed
              </p>

              <div className="w-full bg-gray-200 h-1.5 rounded mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-green-500 h-1.5 rounded"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* BACK */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handleBack}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back
        </button>
      </div>

    </main>
  );
}

export default function TopicsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <TopicsContent />
    </Suspense>
  );
}