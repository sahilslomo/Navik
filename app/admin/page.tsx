"use client";

import { useEffect, useState, useRef } from "react";

type Question = {
  id: number;
  question: string;
  answer: string;
  labels?: string[];
};

// 🎨 LABEL COLORS
const LABEL_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-yellow-100 text-yellow-700",
  "bg-red-100 text-red-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
];

// 🎨 HASH COLOR
const getLabelColor = (label: string) => {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
};

export default function Admin() {
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [newTopic, setNewTopic] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");

  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");

  const [filterLabel, setFilterLabel] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [bulkData, setBulkData] = useState("");

  const questionRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);

  // ================= LOAD =================
  const loadData = async () => {
    if (!className || !subject) return;

    const res = await fetch("/api/questions-api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "LOAD", className, subject }),
    });

    const data = await res.json();

    setTopics(data.topics || []);
    if (topic && data.questions?.[topic]) {
      setQuestions(data.questions[topic]);
    } else {
      setQuestions([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [className, subject, topic]);

  // ================= KEYBOARD =================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmitQuestion();
      }
      if (e.ctrlKey && e.key === "q") questionRef.current?.focus();
      if (e.ctrlKey && e.key === "a") answerRef.current?.focus();
      if (e.ctrlKey && e.key === "l") labelRef.current?.focus();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [questionText, answerText, labels, topic]);

  // ================= LABEL HANDLER =================
  const handleLabelKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();

      const rawValue = labelInput.trim();
      if (!rawValue) return;

      const exists = labels.some(
        (l) => l.toLowerCase() === rawValue.toLowerCase()
      );

      if (!exists) {
        setLabels([...labels, rawValue]);
      }

      setLabelInput("");
    }

    if (e.key === "Backspace" && !labelInput) {
      setLabels(labels.slice(0, -1));
    }
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  // ================= FILTER =================
  const allLabels = Array.from(
    new Set(questions.flatMap((q) => q.labels || []))
  );

  const filteredQuestions = filterLabel
    ? questions.filter((q) =>
        q.labels?.some((l) => l === filterLabel)
      )
    : questions;

  // ================= TOPIC =================
  const handleAddTopic = async () => {
    if (!newTopic) return;

    await fetch("/api/questions-api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_TOPIC",
        className,
        subject,
        topicName: newTopic,
      }),
    });

    setNewTopic("");
    loadData();
  };

  const handleDeleteTopic = async (t: string) => {
    if (!confirm("Delete topic?")) return;

    await fetch("/api/questions-api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DELETE_TOPIC",
        className,
        subject,
        topicName: t,
      }),
    });

    if (topic === t) setTopic("");
    loadData();
  };

  // ================= SUBMIT =================
  const handleSubmitQuestion = async () => {
    if (!questionText || !answerText || !topic) {
      alert("Fill all fields");
      return;
    }

    await fetch("/api/questions-api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: editingId ? "UPDATE_QUESTION" : "ADD_QUESTION",
        className,
        subject,
        topic,
        id: editingId,
        question: questionText,
        answer: answerText,
        labels,
      }),
    });

    setQuestionText("");
    setAnswerText("");
    setLabels([]);
    setLabelInput("");
    setEditingId(null);

    questionRef.current?.focus();
    loadData();
  };

  // ================= BULK =================
  const handleBulkUpload = async () => {
    try {
      const parsed = JSON.parse(bulkData);

      await fetch("/api/questions-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_ADD",
          className,
          subject,
          topic,
          questions: parsed,
        }),
      });

      setBulkData("");
      loadData();
      alert("✅ Bulk added!");
    } catch {
      alert("Invalid JSON ❌");
    }
  };

  const handleEditQuestion = (q: Question) => {
    setQuestionText(q.question);
    setAnswerText(q.answer);
    setLabels(q.labels || []);
    setEditingId(q.id);
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm("Delete?")) return;

    await fetch("/api/questions-api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DELETE_QUESTION",
        className,
        subject,
        topic,
        id,
      }),
    });

    loadData();
  };

  // ================= UI =================
  return (
    <main className="min-h-screen bg-slate-100 p-10">
      <h1 className="text-3xl font-bold mb-8">⚙️ Admin</h1>

      <div className="grid md:grid-cols-2 gap-6">

        {/* LEFT */}
        <div className="bg-white p-6 rounded-xl shadow">

          <input placeholder="Class" value={className} onChange={(e) => setClassName(e.target.value)} className="border p-2 w-full mb-2" />
          <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="border p-2 w-full mb-2" />

          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="border p-2 w-full mb-2">
            <option value="">Select Topic</option>
            {topics.map((t) => <option key={t}>{t}</option>)}
          </select>

          <input placeholder="New Topic" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} className="border p-2 w-full mb-2" />
          <button onClick={handleAddTopic} className="bg-green-500 text-white px-4 py-2 mb-4">Add Topic</button>

          <input ref={questionRef} placeholder="Question" value={questionText} onChange={(e) => setQuestionText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), answerRef.current?.focus())} className="border p-2 w-full mb-2" />

          <textarea ref={answerRef} placeholder="Answer" value={answerText} onChange={(e) => setAnswerText(e.target.value)} onKeyDown={(e) => e.key === "Tab" && (e.preventDefault(), labelRef.current?.focus())} className="border p-2 w-full mb-2" />

          {/* LABEL INPUT */}
          <div className="border p-2 w-full mb-2 rounded">
            <div className="flex flex-wrap gap-2 mb-2">
              {labels.map((label) => (
                <span key={label} className={`${getLabelColor(label)} px-2 py-1 rounded flex items-center gap-1`}>
                  {label}
                  <button onClick={() => removeLabel(label)}>❌</button>
                </span>
              ))}
            </div>

            <input ref={labelRef} placeholder="Type label + Enter" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyDown={handleLabelKey} className="outline-none w-full" />
          </div>

          <button onClick={handleSubmitQuestion} className="bg-blue-600 text-white px-4 py-2 w-full">
            {editingId ? "Update" : "Add Question"}
          </button>

          <textarea placeholder='Bulk JSON [{"question":"Q1","answer":"A1"}]' value={bulkData} onChange={(e) => setBulkData(e.target.value)} className="border p-2 w-full mt-4" />
          <button onClick={handleBulkUpload} className="bg-purple-600 text-white px-4 py-2 w-full mt-2">Bulk Upload</button>
        </div>

        {/* RIGHT */}
        <div className="bg-white p-6 rounded-xl shadow">

          {/* FILTER */}
          <div className="mb-4">
            <p className="font-semibold mb-2">Filter by Label:</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterLabel(null)} className="px-2 py-1 border rounded">All</button>
              {allLabels.map((label) => (
                <button key={label} onClick={() => setFilterLabel(label)} className={`${getLabelColor(label)} px-2 py-1 rounded`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {topics.map((t) => (
            <div key={t} className="mb-4">
              <div className="flex justify-between">
                <b>{t}</b>
                <button onClick={() => handleDeleteTopic(t)}>🗑️</button>
              </div>

              {topic === t &&
                filteredQuestions.map((q) => (
                  <div key={q.id} className="border p-2 mt-2">
                    <p>{q.question}</p>
                    <p>{q.answer}</p>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {q.labels?.map((label) => (
                        <span key={label} className={`${getLabelColor(label)} px-2 py-1 rounded text-sm`}>
                          {label}
                        </span>
                      ))}
                    </div>

                    <button onClick={() => handleEditQuestion(q)}>Edit</button>
                    <button onClick={() => handleDeleteQuestion(q.id)}>Delete</button>
                  </div>
                ))}
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}