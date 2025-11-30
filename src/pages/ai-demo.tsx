import { useState } from "react";
import AIChat from "../components/AIChat";

export default function AIDemo() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Google Gemini AI Demo
        </h1>
        <AIChat />
      </div>
    </div>
  );
}
