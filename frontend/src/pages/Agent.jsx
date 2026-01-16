import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from "react-router-dom";

const AIAgents = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-6">
      <div className="w-full max-w-5xl bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl p-12">

        {/* Title */}
        <div className="text-center text-white mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">
            AI Agents
          </h1>
          <p className="mt-3 text-lg opacity-90">
            Select an AI agent to continue
          </p>
        </div>

        {/* Agent Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Diagnostic Agent */}
          <div
            onClick={() => navigate("/agent/diagnostic")}
            className="bg-white rounded-2xl p-8 cursor-pointer hover:scale-105 transition shadow-lg"
          >
            <div className="text-5xl mb-4">🧠</div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Diagnostic AI Agent
            </h2>
            <p className="mt-3 text-gray-600">
              Answers ONLY diagnostic questions such as symptoms,
              medical reports and test results.
            </p>

            <button className="mt-6 w-full bg-indigo-500 text-white py-3 rounded-lg font-medium hover:bg-indigo-600">
              Open Chat →
            </button>
          </div>

          {/* MASC Agent */}
          <div
            onClick={() => navigate("/agent/masc")}
            className="bg-white rounded-2xl p-8 cursor-pointer hover:scale-105 transition shadow-lg"
          >
            <div className="text-5xl mb-4">💊</div>
            <h2 className="text-2xl font-semibold text-gray-800">
              MASC Agent
            </h2>
            <p className="mt-3 text-gray-600">
              Medical Adherence & Side Effects Coach.
              Handles medicines, reminders and safety.
            </p>

            <button className="mt-6 w-full bg-indigo-500 text-white py-3 rounded-lg font-medium hover:bg-indigo-600">
              Open Chat →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AIAgents;
