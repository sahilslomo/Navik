"use client";

import { useEffect, useState, useRef } from "react";

type Question = {
  id: string;
  question: string;
  answer: string;
  labels?: string[];
  topic: string;
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
  const [topics, setTopics] = useState<string[]>([]);

  const [questions, setQuestions] = useState<Question[]>([]);

  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");

  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");

  const [filterLabel, setFilterLabel] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTopic, setNewTopic] = useState("");
  const [bulkData, setBulkData] = useState("");

  const questionRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);

  // normalize
  const getNormalizedClass = (input: string) => {
  const cleaned = input?.toLowerCase().replace(/\s/g, "");

  if (cleaned === "2" || cleaned === "meo2") return "meo2";
  if (cleaned === "4" || cleaned === "meo4") return "meo4";

  return "";
};

const normalizeClass = getNormalizedClass(className);

  const normalizeSubject = subject.trim().toLowerCase();

  // ================= LOAD =================
  const loadData = async () => {
    if (!normalizeClass || !normalizeSubject) return;

    const res = await fetch(
      `/api/questions?className=${normalizeClass}&subject=${normalizeSubject}`
    );

    const data = await res.json();
    if (!data.success) return;

    const all: Question[] = data.data;

    const uniqueTopics = Array.from(
      new Set(all.map((q) => q.topic).filter(Boolean))
    );

    setTopics(uniqueTopics);

    // stable topic fix
    if (!topic && uniqueTopics.length > 0) {
      setTopic(uniqueTopics[0]);
    }

    const activeTopic = topic || uniqueTopics[0];

    setQuestions(all.filter((q) => q.topic === activeTopic));
  };

  useEffect(() => {
    loadData();
  }, [className, subject, topic]);

  // ================= KEYBOARD =================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") handleSubmit();
      if (e.ctrlKey && e.key === "q") questionRef.current?.focus();
      if (e.ctrlKey && e.key === "a") answerRef.current?.focus();
      if (e.ctrlKey && e.key === "l") labelRef.current?.focus();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [questionText, answerText, labels]);

  // ================= LABELS =================
  const handleLabelKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const raw = labelInput.trim();
      if (!raw) return;

      if (!labels.includes(raw)) setLabels([...labels, raw]);
      setLabelInput("");
    }

    if (e.key === "Backspace" && !labelInput) {
      setLabels(labels.slice(0, -1));
    }
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const allLabels = Array.from(
    new Set(questions.flatMap((q) => q.labels || []))
  );

  const filteredQuestions = filterLabel
    ? questions.filter((q) => q.labels?.includes(filterLabel))
    : questions;

  // ================= TOPIC =================
  const handleAddTopic = async () => {
    if (!newTopic) return;

    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_TOPIC",
        className: normalizeClass,
        subject: normalizeSubject,
        topicName: newTopic.trim().toLowerCase(),
      }),
    });

    setNewTopic("");
    loadData();
  };

  const handleDeleteTopic = async (t: string) => {
    if (!confirm("Delete topic?")) return;

    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DELETE_TOPIC",
        className: normalizeClass,
        subject: normalizeSubject,
        topicName: t,
      }),
    });

    if (topic === t) setTopic("");

    loadData();
  };

  // ================= QUESTION =================
  const handleSubmit = async () => {
    if (!questionText || !answerText || !topic) return;

    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: editingId ? "UPDATE_QUESTION" : "ADD_QUESTION",
        className: normalizeClass,
        subject: normalizeSubject,
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
    setEditingId(null);

    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;

    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DELETE_QUESTION",
        className: normalizeClass,
        subject: normalizeSubject,
        topic,
        id,
      }),
    });

    loadData();
  };

  const handleEdit = (q: Question) => {
    setQuestionText(q.question);
    setAnswerText(q.answer);
    setLabels(q.labels || []);
    setEditingId(q.id);
  };

  // ================= BULK =================
  const handleBulkUpload = async () => {
    try {
      const parsed = JSON.parse(bulkData);

      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_ADD",
          className: normalizeClass,
          subject: normalizeSubject,
          topic,
          questions: parsed,
        }),
      });

      setBulkData("");
      loadData();
      alert("Bulk upload success");
    } catch {
      alert("Invalid JSON");
    }
  };

  // ================= UI =================
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">

      <h1 className="text-xl font-bold">Admin Panel</h1>

      {/* CLASS + SUBJECT */}
      <div className="grid grid-cols-2 gap-2">
        <input className="border p-2" placeholder="Class" onChange={(e) => setClassName(e.target.value)} />
        <input className="border p-2" placeholder="Subject" onChange={(e) => setSubject(e.target.value)} />
      </div>

      {/* TOPIC */}
      <div className="flex gap-2">
        <select className="border p-2 flex-1" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <input
          className="border p-2"
          placeholder="New Topic"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
        />
        <button onClick={handleAddTopic} className="bg-green-500 text-white px-3">
          Add
        </button>
      </div>

      {/* QUESTION */}
      <input
        ref={questionRef}
        className="border p-2 w-full"
        placeholder="Question"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />

      <textarea
        ref={answerRef}
        className="border p-2 w-full"
        placeholder="Answer"
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
      />

      {/* LABELS */}
      <div className="border p-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {labels.map((l) => (
            <span key={l} className={`${getLabelColor(l)} px-2 py-1 rounded`}>
              {l}
              <button onClick={() => removeLabel(l)}>❌</button>
            </span>
          ))}
        </div>

        <input
          ref={labelRef}
          className="w-full"
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
          onKeyDown={handleLabelKey}
        />
      </div>

      <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2">
        {editingId ? "Update" : "Add"}
      </button>

      {/* FILTER */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterLabel(null)}>All</button>
        {allLabels.map((l) => (
          <button key={l} onClick={() => setFilterLabel(l)} className={getLabelColor(l)}>
            {l}
          </button>
        ))}
      </div>

      {/* QUESTIONS */}
      {filteredQuestions.map((q) => (
        <div key={q.id} className="border p-3">
          <p className="font-semibold">{q.question}</p>
          <p>{q.answer}</p>

          <div className="flex gap-2 mt-2">
            <button onClick={() => handleEdit(q)} className="bg-yellow-400 px-2">
              Edit
            </button>
            <button onClick={() => handleDelete(q.id)} className="bg-red-500 text-white px-2">
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* BULK */}
      <textarea
        className="border p-2 w-full mt-4"
        placeholder="Bulk JSON"
        value={bulkData}
        onChange={(e) => setBulkData(e.target.value)}
      />
      <button onClick={handleBulkUpload} className="bg-purple-600 text-white px-4 py-2">
        Bulk Upload
      </button>
    </div>
  );
}