"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// 🔀 Shuffle
const shuffleArray = (arr) => {
return [...arr].sort(() => Math.random() - 0.5);
};

function VivaTestContent() {
  const params = useSearchParams();
  const topic = params.get("topic");
  const subject = params.get("subject");
  const className = params.get("class");

  const [questions, setQuestions] = useState ([]);
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [time, setTime] = useState(10);
  const [weak, setWeak] = useState<string([]);

  // 📦 LOAD QUESTIONS
  useEffect(() => {
    if (!topic || !subject || !className) return;

    const loadData = async () => {
      try {
        const res = await fetch("/data/questions.json");
        const data = await res.json();
        const topicQuestions =
          data?.[className]?.[subject]?.topics?.[topic] || [];
        setQuestions(shuffleArray(topicQuestions));
      } catch {
        setQuestions([]);
      }
    };

    loadData();
  }, [className, subject, topic]);

  // ⏱️ TIMER
  useEffect(() => {
    if (finished || questions.length === 0) return;
    if (time === 0) {
      handleNext(false);
      return;
    }

    const timer = setTimeout(() => setTime((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [time, finished, questions]);

  const handleNext = (knewIt) => {
    if (knewIt) setScore((prev) => prev + 1);
    else setWeak((prev) => [...prev, questions[current].question]);

    setShowAnswer(false);
    setTime(10);

    if (current + 1 < questions.length) setCurrent((prev) => prev + 1);
    else setFinished(true);
  };

  // 🚨 EMPTY CASE
  if (questions.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-[#0A192F]">
        <p>No questions available for this topic</p>
      </main>
    );
  }

  // 🎯 RESULT
  if (finished) {
    return (
      <main className="min-h-screen bg-[#0A192F] text-white p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl mb-4">🎯 Viva Completed</h1>
        <p className="text-lg mb-4">
          Score: {score} / {questions.length}
        </p>
        {weak.length > 0 && (
          <div>
            <h2 className="text-red-400 mb-2">Weak Areas:</h2>
            <ul>
              {weak.map((q, i) => (
                <li key={i}>• {q}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    );
  }

  // 🎮 QUIZ UI
  return (
    <main className="min-h-screen bg-[#0A192F] text-white p-6">
      <h1 className="text-xl mb-2">
        {className?.toUpperCase()} | {subject} | {topic}
      </h1>

      <p className="mb-2">
        Question {current + 1} / {questions.length}
      </p>

      <p className="text-red-400 mb-4">⏱️ {time}s</p>

      <p className="text-lg mb-6">{questions[current].question}</p>

      {!showAnswer ? (
        <button
          onClick={() => setShowAnswer(true)}
          className="bg-blue-500 px-4 py-2 rounded-lg"
        >
          Show Answer
        </button>
      ) : (
        <div>
          <div className="bg-[#0A192F] border border-gray-600 p-4 rounded mb-4">
            {questions[current].answer}
          </div>

          <p className="mb-2">Did you know this?</p>

          <div className="flex gap-4">
            <button
              onClick={() => handleNext(true)}
              className="bg-green-500 px-4 py-2 rounded-lg"
            >
              ✅ I Knew It
            </button>

            <button
              onClick={() => handleNext(false)}
              className="bg-red-500 px-4 py-2 rounded-lg"
            >
              ❌ Didn’t Know
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
// 🔹 WRAPPER WITH SUSPENSE
export default function VivaTest() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white">Loading...</div>}>
      <VivaTestContent />
    </Suspense>
  );
}
