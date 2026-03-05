import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();

  const messages = location.state?.messages || null;
  const doctor = location.state?.doctor || null;

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!messages) {
      setLoading(false);
      return;
    }

    generateReport();
  }, []);

  async function generateReport() {
    try {
      const res = await fetch("http://localhost:5000/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });

      const data = await res.json();

      console.log("REPORT API RESPONSE:", data);

      if (data && data.report) {
        setReportData(data.report);
      } else {
        setReportData(null);
      }

      setLoading(false);
    } catch (err) {
      console.log("Report fetch error:", err);
      setReportData(null);
      setLoading(false);
    }
  }

  function downloadPDF() {
    if (!reportData) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Medical Consultation Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Doctor: ${doctor?.name || "N/A"}`, 20, 35);
    doc.text(`Specialty: ${doctor?.specialty || "N/A"}`, 20, 42);

    doc.line(20, 48, 190, 48);

    let y = 60;

    doc.text(`Patient Name: ${reportData.name || "Not Provided"}`, 20, y);
    y += 10;

    doc.text(`Patient Age: ${reportData.age || "Not Provided"}`, 20, y);
    y += 15;

    doc.text("Health Concern:", 20, y);
    y += 10;

    const concernLines = doc.splitTextToSize(
      reportData.concern || "Not Provided",
      170
    );
    doc.text(concernLines, 20, y);
    y += concernLines.length * 7 + 10;

    doc.text("Advice & Recommendation:", 20, y);
    y += 10;

    const adviceLines = doc.splitTextToSize(
      reportData.advice || "Not Provided",
      170
    );
    doc.text(adviceLines, 20, y);

    doc.save("Medical_Report.pdf");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-3xl w-full">

        <h1 className="text-3xl font-bold text-center mb-6">
          Medical Consultation Report
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">
            Generating report...
          </p>
        ) : !reportData ? (
          <p className="text-center text-red-500">
            Failed to generate structured report.
          </p>
        ) : (
          <>
            <div className="space-y-6">

              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Doctor Information
                </h2>
                <p className="text-gray-600">
                  {doctor?.name || "N/A"} ({doctor?.specialty || "N/A"})
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Patient Details
                </h2>
                <p><strong>Name:</strong> {reportData.name || "Not Provided"}</p>
                <p><strong>Age:</strong> {reportData.age || "Not Provided"}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Health Concern
                </h2>
                <p className="text-gray-600">
                  {reportData.concern || "Not Provided"}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Advice & Recommendation
                </h2>
                <p className="text-gray-600">
                  {reportData.advice || "Not Provided"}
                </p>
              </div>

            </div>

            <div className="mt-10 flex justify-center gap-6">
              <button
                onClick={downloadPDF}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg"
              >
                Download PDF
              </button>

              <button
                onClick={() => navigate("/")}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg"
              >
                Back to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}