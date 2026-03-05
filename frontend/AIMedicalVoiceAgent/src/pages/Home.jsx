import { doctors } from "../data/doctors";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">
            AI Medical Voice Consultation
          </h1>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            Speak directly with AI-powered medical specialists.
            Get instant consultation and a structured medical report.
          </p>
        </div>
      </section>

      {/* DOCTOR SECTION */}
      <section className="flex-1 py-16">
        <div className="max-w-6xl mx-auto px-6">

          <h2 className="text-3xl font-bold text-center mb-12">
            Choose Your Specialist
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 p-6 flex flex-col"
              >
                {/* IMAGE CONTAINER */}
                <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src={doc.image}
                    alt={doc.name}
                    className="h-full object-contain"
                  />
                </div>

                {/* DOCTOR INFO */}
                <div className="mt-6 flex-1">
                  <h3 className="text-xl font-semibold">
                    {doc.name}
                  </h3>
                  <p className="text-blue-600 font-medium">
                    {doc.specialty}
                  </p>
                </div>

                {/* BUTTON */}
                <button
                  onClick={() => navigate(`/consultation/${doc.id}`)}
                  className="mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Start Consultation
                </button>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-6">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <p>© 2026 AI Medical Voice Agent</p>
          <p>Secure • Private • Instant Consultation</p>
        </div>
      </footer>

    </div>
  );
}