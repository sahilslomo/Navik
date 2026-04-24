"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type Question = {
  id: string;
  question: string;
  answer: string;
  labels?: string[];
};

function TopicViewContent() {
  const params = useSearchParams();
  const topic = params.get("topic");
  const subject = params.get("subject");
  const courseClass = params.get("class");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Record<string, string[]>>({});
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [aiData, setAiData] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState<string | null>(null);

  const [darkMode, setDarkMode] = useState(false);
  const freeLimit = 12;
  const [remaining, setRemaining] = useState(freeLimit);
  const [locked, setLocked] = useState(false);

  const safeParse = (data: string | null, fallback: any) => {
    try { return data ? JSON.parse(data) : fallback; } catch { return fallback; }
  };

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
  }, []);
  useEffect(() => { localStorage.setItem("theme", darkMode ? "dark" : "light"); }, [darkMode]);
  useEffect(() => {applyFilters();}, [selectedLabels, showBookmarks, questions]);
  // Free topic tracking
  useEffect(() => {
    if (!courseClass) return;
    const key = `question_clicks_${courseClass}_${subject}_${topic}`;
    const clicks = safeParse(localStorage.getItem(key), {});
    setRemaining(Math.max(freeLimit - Object.keys(clicks).length, 0));
    setLocked(Object.keys(clicks).length >= freeLimit);
  }, [courseClass]);

  const incrementTopicClick = () => {
    if (!courseClass || !topic) return;
    const key = `topic_clicks_${courseClass}`;
    const clicks = safeParse(localStorage.getItem(key), {});
    if (!clicks[topic]) {
      clicks[topic] = 1;
      localStorage.setItem(key, JSON.stringify(clicks));
      setRemaining(Math.max(freeLimit - Object.keys(clicks).length, 0));
      setLocked(Object.keys(clicks).length >= freeLimit);
    }
  };

  // Load questions
  useEffect(() => {
    if (!courseClass || !subject || !topic) return;
    const loadData = async () => {
    const safeClassName = (() => {
    const cleaned = courseClass?.toLowerCase().replace(/\s/g, "");

  if (cleaned === "2" || cleaned === "meo2") return "meo2";
  if (cleaned === "4" || cleaned === "meo4") return "meo4";

  return "";
})();
  
  const cacheKey = `cache_${safeClassName}_${subject}_${topic}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
  const parsed = JSON.parse(cached);
  setQuestions(parsed);
  setFilteredQuestions(parsed);
}

const res = await fetch(
  `/api/questions?className=${safeClassName}&subject=${subject.toLowerCase()}&topic=${topic.toLowerCase()}`
);

const result = await res.json();

if (!result.success) return;

const topicData: Question[] = result.data;

localStorage.setItem(cacheKey, JSON.stringify(topicData));

      const orderKey = `order_${courseClass}_${subject}_${topic}`;
      const savedOrder: string[] = safeParse(localStorage.getItem(orderKey), []);
      const orderedData = savedOrder.length
      ? savedOrder
      .map((id: string) => topicData.find(q => q.id === id))
      .filter(Boolean) as Question[]
      : topicData;
      if (topicData.length > 0) {
      setQuestions(orderedData);
      setFilteredQuestions(orderedData);
      }
      setLabels(Array.from(new Set(topicData.flatMap(q => q.labels || []))));
      setCompleted(safeParse(localStorage.getItem(`progress_${courseClass}_${subject}_${topic}`), []));
      setBookmarked(safeParse(localStorage.getItem(`bookmark_${courseClass}_${subject}_${topic}`), []));
      
      // Load shared notes
      const notesCache: Record<string, string[]> = {};
      orderedData.forEach(q => {
        const key = `shared_notes_${courseClass}_${subject}_${topic}_${q.id}`;
        notesCache[q.id] = safeParse(localStorage.getItem(key), []);
      });
      setSharedNotes(notesCache);

      const aiCache: Record<string, string> = {};
      orderedData.forEach(q => {
        const key = `ai_${courseClass}_${subject}_${topic}_${q.id}`;
        const stored = localStorage.getItem(key);
        if (stored) aiCache[q.id] = stored;
      });
      setAiData(aiCache);
    };
    loadData();
  }, [courseClass, subject, topic]);

  // Completion, Bookmark
  const toggleComplete = (id: string) => {
    const key = `progress_${courseClass}_${subject}_${topic}`;
    const updated = completed.includes(id) ? completed.filter(i => i !== id) : [...completed, id];
    setCompleted(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };
  const toggleBookmark = (id: string) => {
    const key = `bookmark_${courseClass}_${subject}_${topic}`;
    const updated = bookmarked.includes(id) ? bookmarked.filter(i => i !== id) : [...bookmarked, id];
    setBookmarked(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const toggleLabel = (label: string) => {
  setSelectedLabels(prev =>
    prev.includes(label)
      ? prev.filter(l => l !== label) // remove if already selected
      : [...prev, label] // add if not selected
  );
};

  // Shared Notes Save
  const saveComment = (qId: string) => {
    if (!noteInput[qId] || noteInput[qId].trim() === "") return;
    const key = `shared_notes_${courseClass}_${subject}_${topic}_${qId}`;
    const updated = [...(sharedNotes[qId] || []), noteInput[qId]];
    setSharedNotes(prev => ({ ...prev, [qId]: updated }));
    localStorage.setItem(key, JSON.stringify(updated));
    setNoteInput(prev => ({ ...prev, [qId]: "" }));
  };

  // AI
  const askAI = async (q: Question) => {
    if (locked || loadingAI === q.id) return;
    const key = `ai_${courseClass}_${subject}_${topic}_${q.id}`;
    const cached = localStorage.getItem(key);
    if (cached) { setAiData(prev => ({ ...prev, [q.id]: cached })); return; }

    setLoadingAI(q.id);
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q.question, answer: q.answer }) });
      const data = await res.json();
      if (!data?.result) throw new Error("AI failed");
      localStorage.setItem(key, data.result);
      setAiData(prev => ({ ...prev, [q.id]: data.result }));
    } catch { alert("AI failed"); }
    setLoadingAI(null);
  };

  // Filter & bookmarks
  const applyFilters = () => {
  let list = questions;

  // ✅ Multi-label filtering
  if (selectedLabels.length > 0) {
    list = list.filter(q =>
      selectedLabels.every(l => q.labels?.includes(l))
    );
  }

  // ✅ Bookmark filter
  if (showBookmarks) {
    list = list.filter(q => bookmarked.includes(q.id));
  }

  setFilteredQuestions(list);
};
  const toggleShowBookmarks = () => {
  setShowBookmarks(prev => !prev);
};
  
  // Drag & Drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(questions);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setQuestions(reordered);
    localStorage.setItem(`order_${courseClass}_${subject}_${topic}`, JSON.stringify(reordered.map(q => q.id)));
    applyFilters();
  };

  const progress = questions.length ? Math.round((completed.length / questions.length) * 100) : 0;
  if (!topic) return <div>Invalid Topic</div>;

  // Uniform button style
  const btnClass = "px-2 py-2 rounded-lg font-semibold w-36 text-center transition";

  return (
    <main className={`select-none ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"} min-h-screen p-4 md:p-6`}>
      <div className="flex justify-between flex-wrap gap-2 mb-4">
        <button onClick={() => setDarkMode(!darkMode)} className={`${btnClass} ${darkMode ? "bg-gray-200 text-gray-900 hover:bg-gray-300" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
        <button onClick={toggleShowBookmarks} className={`${btnClass} bg-yellow-100 text-yellow-900 hover:bg-yellow-200`}>
          {showBookmarks ? "Show All" : `Bookmarks (${bookmarked.length})`}
        </button>
        <button onClick={() => setDragActive(!dragActive)} className={`${btnClass} bg-gray-300 text-gray-900 hover:bg-gray-400`}>
          {dragActive ? "Disable Reorder" : "Enable Reorder"}
        </button>
        <button
        onClick={() => setShowFilters(prev => !prev)}className={`${btnClass} bg-purple-200 text-purple-900 hover:bg-purple-300`}> 🏷 Filters
        </button>
        {/* NEW BUTTON */}
  <div className={`${btnClass} bg-blue-100 text-blue-900 flex items-center justify-center`}>
    📊 Questions: {questions.length}
  </div>
      </div>

      {/* ✅ TOPIC HEADER */}
<div className="text-center mb-6">
  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
    📘 {topic}
  </h1>
  <p className="text-sm opacity-70 mt-1">
    {subject} • MEO Class {courseClass}
  </p>
</div>

      <div className="text-center mb-4 font-semibold">
        {locked ? <>🔒 Limit reached <button onClick={() => alert("Payment")} className="ml-2 text-blue-600 underline hover:text-blue-800">Upgrade</button></> : `⚡ ${remaining} Free Topics Left`}
      </div>

      <div className="max-w-3xl mx-auto mb-4">
        <div className="flex justify-between text-xs mb-1"><span>Progress</span><span>{progress}%</span></div>
        <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
          <div className="bg-green-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

   {showFilters && (
  <div
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    onClick={() => setShowFilters(false)}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex flex-col w-[90%] max-w-md max-h-[80vh] rounded-xl shadow-xl ${
        darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
      }`}
    >

      {/* HEADER */}
      <div className="p-4 border-b text-center font-bold text-lg">
        Select Filters
      </div>

      {/* 🔥 SCROLLABLE LABEL AREA */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {labels.map(label => (
            <button
              key={label}
              onClick={() => toggleLabel(label)}
              className={`px-3 py-1 rounded-full text-sm border transition
                ${
                  selectedLabels.includes(label)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : darkMode
                    ? "bg-gray-700 text-gray-100 border-gray-600"
                    : "bg-gray-100 text-gray-800 border-gray-300"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 🔥 FIXED BUTTON */}
      <div className="p-4 border-t">
        <button
          onClick={() => setShowFilters(false)}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Apply & Close
        </button>
      </div>

    </div>
  </div>
)}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions" isDropDisabled={!dragActive}>
          {provided => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="max-w-3xl mx-auto space-y-4">
              {filteredQuestions.map((q, index) => (
                <Draggable key={q.id} draggableId={q.id.toString()} index={index} isDragDisabled={!dragActive}>
                  {provided => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={`border p-4 rounded-xl shadow-md hover:shadow-lg transition ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="font-bold text-lg cursor-pointer font-[Aptos]" onClick={() => {
                            const scrollY = window.scrollY;
                            setOpenIndex(openIndex === index ? null : index);
                            incrementTopicClick();requestAnimationFrame(() => {window.scrollTo({ top: scrollY });});}}>
                            Q{index + 1}. {q.question}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button onClick={() => toggleComplete(q.id)} className={`px-2 py-1 rounded text-sm ${completed.includes(q.id) ? "bg-green-200 text-green-900" : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"}`}>
                              {completed.includes(q.id) ? "✔ Completed" : "Mark Complete"}
                            </button>
                            <button onClick={() => toggleBookmark(q.id)} className={`px-2 py-1 rounded text-sm ${bookmarked.includes(q.id) ? "bg-yellow-200 text-yellow-900" : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"}`}>
                              {bookmarked.includes(q.id) ? "★ Bookmark" : "☆ Bookmark"}
                            </button>
                          </div>
                        </div>

                       
                          {openIndex === index && (
                            <motion.div
  initial={false}
  animate={{
    height: openIndex === index ? "auto" : 0,
    opacity: openIndex === index ? 1 : 0
  }}
  transition={{ duration: 0.25, ease: "easeInOut" }}
  style={{ overflow: "hidden" }}
  className="mt-3"
>
                              <div className={`font-bold font-[Aptos] ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{q.answer}</div>
                              <div className="flex flex-wrap gap-2 mt-2">{q.labels?.map((l, idx) => <span key={idx} className={`${darkMode ? "bg-indigo-700 text-indigo-100" : "bg-indigo-100 text-indigo-800"} px-2 py-1 rounded-full text-sm`}>{l}</span>)}</div>

                              {/* Shared Notes */}
                              <div className="mt-2">
                                <textarea placeholder="Your Notes Here..." value={noteInput[q.id] || ""} onChange={e => setNoteInput(prev => ({ ...prev, [q.id]: e.target.value }))} className={`w-full p-2 rounded-md border ${darkMode ? "bg-gray-700 text-gray-100 border-gray-600" : "bg-gray-50 text-gray-900 border-gray-300"}`} />
                                <button onClick={() => saveComment(q.id)} className="mt-1 px-3 py-1 bg-green-400 text-white rounded hover:bg-green-500 transition">📝 Save to Revise</button>
                                {sharedNotes[q.id]?.length > 0 && <div className="mt-2 space-y-1">
                                  {sharedNotes[q.id].map((c, i) => <div key={i} className={`p-2 rounded ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-100 text-gray-900"} font-mono text-sm`}>{c}</div>)}
                                </div>}
                              </div>

                              {/* AI */}
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <button onClick={e => { e.stopPropagation(); askAI(q); }} className="bg-blue-400 text-white px-3 py-1 rounded hover:bg-blue-500 transition">🤖 Ask AI</button>
                                {loadingAI === q.id && <span className="text-yellow-500">Thinking...</span>}
                              </div>
                              {aiData[q.id] && <div className={`font-mono mt-2 text-sm whitespace-pre-line p-2 rounded ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-100 text-gray-900"}`}>{aiData[q.id]}</div>}
                            </motion.div>
                          )}
                      </motion.div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TopicViewContent />
    </Suspense>
  );
}