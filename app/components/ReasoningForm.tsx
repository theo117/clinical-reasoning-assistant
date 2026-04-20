"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReasoningForm() {
  const [notes, setNotes] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Later: send to backend
    router.push("/results");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Enter your clinical reasoning (symptoms, risks, negatives, timeline)..."
        className="w-full h-48 p-4 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        required
      />

      <div className="text-sm text-gray-400">
        • Doctor-only input  
        • No patient audio recorded  
        • Assistive tool — not diagnostic
      </div>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium"
      >
        Generate Reasoning Support
      </button>
    </form>
  );
}
