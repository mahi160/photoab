import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../main";

const DuelArena = () => {
  const [duelData, setDuelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const navigate = useNavigate();

  const fetchDuel = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE_URL + "/api/duel");
      res.data.type === "winner"
        ? navigate("/winner", { state: { winner: res.data.winner } })
        : setDuelData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuel();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
        return;
      }

      if (!duelData || loading || previewImage) return;

      const key = e.key.toLowerCase();
      if (key === "a") {
        setPreviewImage(API_BASE_URL + `/uploads/${duelData.left.filename}`);
      } else if (key === "b") {
        setPreviewImage(API_BASE_URL + `/uploads/${duelData.right.filename}`);
      } else if (key === "arrowleft") {
        handleVote(duelData.left.id, duelData.right.id);
      } else if (key === "arrowright") {
        handleVote(duelData.right.id, duelData.left.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duelData, loading, previewImage]);

  const handleVote = async (winnerId, loserId) => {
    if (voting) return;
    setVoting(true);
    try {
      await axios.post(API_BASE_URL + "/api/vote", { winnerId, loserId });
      setCanUndo(true);
      await fetchDuel();
    } catch (e) {
      console.error(e);
    } finally {
      setVoting(false);
    }
  };

  const handleUndo = async () => {
    try {
      await axios.post(API_BASE_URL + "/api/undo");
      setCanUndo(false);
      fetchDuel();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset tournament? All progress will be lost.")) return;
    try {
      await axios.post(API_BASE_URL + "/api/restart");
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !duelData)
    return (
      <div className="flex flex-col items-center justify-between min-h-[50vh] animate-pulse-slow">
        <div className="text-3xl font-bold text-blue-600 mb-4">
          Finding Contenders...
        </div>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (!duelData)
    return <div className="text-xl text-red-500">No active duel found.</div>;

  const { left, right } = duelData;
  return (
    <>
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Full Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-gray-800 hover:text-red-500 p-2"
            onClick={() => setPreviewImage(null)}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-6xl animate-fade-in px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-gray-200 shadow-md flex flex-col items-center">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-wider uppercase">
              Round {left.round}
            </h2>
            {duelData.matchesRemaining !== undefined && (
              <span className="text-xs text-gray-500 font-medium tracking-widest mt-0.5">
                {duelData.matchesRemaining} Matches Left
              </span>
            )}
          </div>

          {canUndo && (
            <button
              onClick={handleUndo}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 rounded-full border border-gray-300 shadow-sm transition-all flex items-center gap-2 text-sm font-bold"
              title="Undo last vote"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              Undo
            </button>
          )}

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full border border-red-200 transition-all flex items-center gap-2 text-sm font-bold"
            title="Reset Tournament"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8 md:gap-12">
          {[left, right].map((item, idx) => (
            <div
              key={item.id}
              className="relative flex-1 w-full max-w-2xl group"
            >
              <div
                className={`relative w-full cursor-pointer overflow-hidden rounded-2xl shadow-xl border-0 ring-4 ring-transparent transition-all duration-500 transform hover:scale-[1.02] ${idx === 0 ? "hover:ring-blue-400/50 hover:-rotate-1" : "hover:ring-purple-400/50 hover:rotate-1"}`}
                onClick={() =>
                  handleVote(item.id, idx === 0 ? right.id : left.id)
                }
              >
                <img
                  src={API_BASE_URL + `/uploads/${item.filename}`}
                  alt="Contender"
                  className="w-full h-full object-contain bg-gray-50 transition-transform duration-700 group-hover:scale-105 rounded-2xl"
                />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span
                    className={`${idx === 0 ? "bg-blue-600 hover:bg-blue-500" : "bg-purple-600 hover:bg-purple-500"} text-white px-8 py-3 rounded-full font-bold text-xl shadow-lg transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300 flex flex-col items-center`}
                  >
                    <span>Vote {idx === 0 ? "Left" : "Right"}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImage(API_BASE_URL + `/uploads/${item.filename}`);
                }}
                className="absolute top-4 right-4 px-3 py-1 bg-white/90 hover:bg-white rounded-full text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 backdrop-blur-sm text-xs font-bold flex items-center gap-1"
                title="View Full Size"
              >
                <span className="bg-gray-200 px-1.5 rounded text-[10px] border border-gray-300">
                  {idx === 0 ? "A" : "B"}
                </span>
                <span>View</span>
              </button>
            </div>
          ))}
          {/* VS Badge */}
          <div className="flex-shrink-0 z-10 relative order-first md:order-none md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
            <div className="bg-white text-red-600 text-3xl font-black rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-xl border-4 border-red-500 animate-bounce-slight relative z-10">
              <span className="italic transform -skew-x-12">VS</span>
            </div>
          </div>
        </div>
        <p className="mt-12 text-gray-400 text-sm uppercase tracking-widest font-semibold">
          Click to vote • Press{" "}
          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold mx-1 border border-gray-300">
            A
          </span>{" "}
          /{" "}
          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold mx-1 border border-gray-300">
            B
          </span>{" "}
          to preview full size
        </p>
      </div>
    </>
  );
};

export default DuelArena;
