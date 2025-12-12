import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import { API_BASE_URL } from "../main";

const WinnerScreen = () => {
  const location = useLocation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [winner] = useState(location.state?.winner || null);
  const winnerCardRef = useRef(null);

  useEffect(() => {
    // Only fetch leaderboard, winner is set initially from location state
    axios
      .get(API_BASE_URL + "/api/leaderboard")
      .then((res) => setLeaderboard(res.data))
      .catch(console.error);
  }, []);

  const handleRestart = async () => {
    if (!window.confirm("Delete all and restart?")) return;
    try {
      await axios.post(API_BASE_URL + "/api/restart");
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      alert("Failed to restart: " + (e.response?.data?.error || e.message));
    }
  };

  const handleDownload = async () => {
    if (!winnerCardRef.current) return;
    try {
      const canvas = await html2canvas(winnerCardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#111827",
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `champion-${displayWinner.original_name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download winner card.");
    }
  };

  const displayWinner = winner || leaderboard[0];

  return (
    <div className="flex flex-col items-center w-full max-w-5xl py-12 px-4 animate-fade-in">
      {displayWinner && (
        <div className="flex flex-col items-center mb-20 animate-fade-in-up w-full">
          <div
            ref={winnerCardRef}
            className="flex flex-col items-center p-12 rounded-[2.5rem] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

            <h1 className="relative z-10 text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 mb-2 drop-shadow-sm text-center tracking-tighter filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              CHAMPION
            </h1>
            <h2 className="relative z-10 text-2xl md:text-3xl font-bold text-gray-300 mb-10 tracking-[0.2em] uppercase text-center">
              {displayWinner.original_name}
            </h2>

            <div className="relative group perspective-1000 z-10">
              <div className="absolute -inset-4 bg-gradient-to-tr from-yellow-500 via-orange-500 to-red-600 rounded-[2rem] blur-lg opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse-slow"></div>
              <div className="relative p-2 bg-gradient-to-b from-gray-800 to-gray-950 rounded-[2rem] shadow-2xl ring-1 ring-white/10">
                <img
                  src={API_BASE_URL + `/uploads/${displayWinner.filename}`}
                  alt="Winner"
                  className="w-[22rem] h-[22rem] md:w-[32rem] md:h-[32rem] object-contain bg-transparent rounded-[1.8rem] shadow-inner"
                  crossOrigin="anonymous"
                />
              </div>

              <div className="absolute -bottom-8 -right-8 bg-gradient-to-br from-yellow-400 to-amber-600 text-gray-900 w-24 h-24 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.5)] border-4 border-gray-900 transform rotate-12 group-hover:rotate-6 transition-all duration-300 z-20">
                <span className="text-xs md:text-sm font-extrabold uppercase tracking-widest opacity-75">
                  Wins
                </span>
                <span className="text-4xl md:text-5xl font-black leading-none">
                  {displayWinner.wins}
                </span>
              </div>
              <div className="absolute -top-10 -left-10 text-7xl md:text-8xl filter drop-shadow-2xl animate-bounce-slight z-30 transform -rotate-12">
                👑
              </div>
            </div>

            <div className="relative z-10 mt-12 flex gap-4">
              <div className="px-8 py-3 bg-gray-950/80 rounded-full border border-yellow-500/30 text-yellow-500 font-bold tracking-wider shadow-lg backdrop-blur-md">
                SURVIVED{" "}
                <span className="text-white ml-1">{displayWinner.round}</span>{" "}
                ROUNDS
              </div>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="mt-8 group relative px-8 py-3 bg-white text-gray-900 font-bold rounded-xl overflow-hidden shadow-lg transition-all hover:scale-105 hover:shadow-yellow-500/20 border border-gray-200"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gray-100 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            <span className="relative flex items-center gap-2">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Save Champion Card
            </span>
          </button>
        </div>
      )}

      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Hall of Fame</h2>
          <div className="h-px bg-gray-300 flex-1 ml-8"></div>
        </div>
        <div className="space-y-4">
          {leaderboard.map((photo, index) => (
            <div
              key={photo.id}
              className="group flex items-center bg-white hover:bg-white/80 p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg backdrop-blur-sm"
            >
              <div
                className={`text-2xl font-black w-12 text-center flex-shrink-0 ${index === 0 ? "text-yellow-500 text-4xl" : index === 1 ? "text-gray-400 text-3xl" : index === 2 ? "text-amber-700 text-3xl" : "text-gray-400"}`}
              >
                #{index + 1}
              </div>
              <div className="w-32 h-32 flex-shrink-0 mx-6 relative overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={API_BASE_URL + `/uploads/${photo.filename}`}
                  alt="Ranked"
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
                  {photo.original_name}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                    Round {photo.round}
                  </span>
                  {photo.status === "active" && (
                    <span className="text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>{" "}
                      Active
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right pl-4">
                <span className="block text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                  {photo.wins}
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Wins
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleRestart}
        className="mt-16 group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-red-600 font-lg rounded-xl hover:bg-red-500 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 focus:ring-offset-white"
      >
        <span className="absolute left-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
        <span className="relative flex items-center gap-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            ></path>
          </svg>
          Start New Tournament
        </span>
      </button>
      <p className="mt-4 text-gray-500 text-sm">
        This will clear all current photos and data.
      </p>
    </div>
  );
};

export default WinnerScreen;
