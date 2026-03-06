import { useParams, useNavigate } from "react-router-dom";
import { doctors } from "../data/doctors";
import { useEffect, useRef, useState } from "react";

export default function Consultation() {
  const { id } = useParams();
  const doctor = doctors.find(d => d.id === Number(id));
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const callActiveRef = useRef(true);
  const isDoctorSpeakingRef = useRef(false);

  const voiceModel = doctor.voice;

  /* ============================= */
  useEffect(() => {
    callActiveRef.current = true;
    initializeRecognition();
    greet();

    return () => {
      callActiveRef.current = false;
      recognitionRef.current?.stop();
      audioRef.current?.pause();
    };
  }, []);

  /* ============================= */
  function initializeRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      if (!callActiveRef.current) return;
      if (isDoctorSpeakingRef.current) return;

      const transcript = event.results[0][0].transcript.trim();

      // Ignore noise / echo
      if (!transcript || transcript.length < 3) {
        restartListening();
        return;
      }

      recognition.stop();

      setMessages(prev => {
        const updated = [
          ...prev,
          { role: "user", content: transcript }
        ];
        sendToAI(updated);
        return updated;
      });
    };

    recognitionRef.current = recognition;
  }

  /* ============================= */
  async function greet() {
    const greeting = `Hello, I am ${doctor.name}, your ${doctor.specialty}. Please tell me your name, age and health concern.`;

    setMessages([{ role: "assistant", content: greeting }]);

    await speak(greeting);
  }

  /* ============================= */
  function restartListening() {
    if (!callActiveRef.current) return;
    if (isDoctorSpeakingRef.current) return;

    setTimeout(() => {
      if (callActiveRef.current && !isDoctorSpeakingRef.current) {
        recognitionRef.current?.start();
      }
    }, 400); // 🔥 buffer prevents echo capture
  }

  /* ============================= */
  async function sendToAI(updatedMessages) {
    try {
      if (!callActiveRef.current) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });

      const data = await res.json();
      const reply = data.reply || "No response.";

      await speak(reply);

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: reply }
      ]);

    } catch (err) {
      console.log("AI error:", err);
    }
  }

  /* ============================= */
  async function speak(text) {
    if (!callActiveRef.current) return;

    try {
      isDoctorSpeakingRef.current = true;

      recognitionRef.current?.stop();

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: voiceModel
        })
      });

      if (!res.ok) {
        isDoctorSpeakingRef.current = false;
        restartListening();
        return;
      }

      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;

      audio.onended = () => {
        isDoctorSpeakingRef.current = false;
        restartListening();
      };

      await audio.play();

    } catch (err) {
      console.log("TTS error:", err);
      isDoctorSpeakingRef.current = false;
      restartListening();
    }
  }

  /* ============================= */
  function endCall() {
    callActiveRef.current = false;

    recognitionRef.current?.stop();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    navigate("/report", { state: { messages, doctor } });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      <div className="bg-white shadow p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="h-full object-contain"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold">{doctor.name}</h2>
            <p className="text-blue-600 font-medium">
              {doctor.specialty}
            </p>
            <p className="text-gray-500 mt-1">
              AI Telemedicine Consultation
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}
          >
            <div className="inline-block bg-white shadow px-4 py-3 rounded-xl max-w-xl">
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white text-center">
        <button
          onClick={endCall}
          className="bg-red-600 text-white px-8 py-3 rounded-full text-lg"
        >
          End Call
        </button>
      </div>
    </div>
  );
}