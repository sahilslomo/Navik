"use client";

import { useEffect, useState, useRef } from "react";

type Question = {
  id: string;
  question: string;
  answer: string;
  labels?: string[];
  topic: string;
};

export default function Admin() {
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const questionRef = useRef<HTMLInputElement>(null);

  const normalizeClass = className.startsWith("meo")
    ? className
    : className
    ? `meo${className}`
    : "";

  // ✅ SINGLE SOURCE OF TRUTH
  const loadData = async () => {
    if (!normalizeClass || !subject) return;

    const res = await fetch(
      `/api/questions?className=${normalizeClass}&subject=${subject}`
    );

    const data = await res.json();
    if (!data.success) return;

    const all: Question[] = data.data;

    const uniqueTopics = Array.from(
      new Set(all.map((q) => q.topic).filter(Boolean))
    );

    setTopics(uniqueTopics);

    const activeTopic =
      topic && uniqueTopics.includes(topic)
        ? topic
        : uniqueTopics[0] || "";

    setTopic(activeTopic);

    const filtered = activeTopic
      ? all.filter((q) => q.topic === activeTopic)
      : [];

    setQuestions(filtered);
  };

  useEffect(() => {
    loadData();
  }, [className, subject]);

  // ADD / UPDATE
  const handleSubmit = async () => {
    if (!questionText || !answerText || !topic) return;

    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: editingId ? "UPDATE_QUESTION" : "ADD_QUESTION",
        className: normalizeClass,
        subject,
        topic: topic.trim().toLowerCase(),
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
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DELETE_QUESTION",
        className: normalizeClass,
        subject: subject.trim().toLowerCase(),
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

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold">Admin</h1>

      <input
        placeholder="Class"
        onChange={(e) => setClassName(e.target.value)}
      />

      <input
        placeholder="Subject"
        onChange={(e) => setSubject(e.target.value)}
      />

      <select value={topic} onChange={(e) => setTopic(e.target.value)}>
        <option value="">Select Topic</option>
        {topics.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <input
        ref={questionRef}
        placeholder="Question"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />

      <textarea
        placeholder="Answer"
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
      />

      <button onClick={handleSubmit}>
        {editingId ? "Update" : "Add"}
      </button>

      {questions.map((q) => (
        <div key={q.id}>
          <h3>{q.question}</h3>
          <p>{q.answer}</p>

          <button onClick={() => handleEdit(q)}>Edit</button>
          <button onClick={() => handleDelete(q.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}