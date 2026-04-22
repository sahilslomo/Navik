"use client";

import { useEffect, useState } from "react";

const DAILY_LIMIT = 5;

export default function useUsage() {
  const [used, setUsed] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();

    const stored = localStorage.getItem("usage");

    if (stored) {
      const data = JSON.parse(stored);

      if (data.date === today) {
        setUsed(data.used);
      } else {
        localStorage.setItem(
          "usage",
          JSON.stringify({ date: today, used: 0 })
        );
        setUsed(0);
      }
    } else {
      localStorage.setItem(
        "usage",
        JSON.stringify({ date: today, used: 0 })
      );
    }
  }, []);

  const increment = () => {
    const today = new Date().toDateString();
    const newUsed = used + 1;

    setUsed(newUsed);

    localStorage.setItem(
      "usage",
      JSON.stringify({ date: today, used: newUsed })
    );
  };

  const remaining = DAILY_LIMIT - used;
  const isLocked = remaining <= 0;

  return { used, remaining, increment, isLocked };
}
