import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';

const WinnerScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [winner, setWinner] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const winnerCardRef = useRef(null);

  useEffect(() => {
    if (location.state?.winner) setWinner(location.state.winner);
    axios.get('http://localhost:3001/api/leaderboard')
         .then(res => setLeaderboard(res.data))
         .catch(console.error);
  }, [location.state]);

  const handleRestart = async () => {
    if (!window.confirm("Delete all and restart?")) return;
    try {
      await axios.post('http://localhost:3001/api/restart');
      navigate('/');
    } catch (e) { console.error(e); }
  };

  const handleDownload = async () => {
    if (!winnerCardRef.current) return;
    const canvas = await html2canvas(winnerCardRef.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement('a');
    link.download = `champion-${displayWinner.original_name}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const displayWinner = winner || leaderboard[0];

  return (
    <div className="flex flex-col items-center w-full max-w-5xl py-12 px-4 animate-fade-in">
      {displayWinner && (
        <div className="flex flex-col items-center mb-20 animate-fade-in-up w-full">
          <div ref={winnerCardRef} className="flex flex-col items-center p-8 rounded-3xl bg-gray-900/50 backdrop-blur-sm border border-gray-800/50">
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-500 to-red-500 mb-6 drop-shadow-sm text-center">THE CHAMPION</h1>
            <h2 className="text-2xl font-bold text-white mb-8 tracking-wider">{displayWinner.original_name}</h2>
            
            <div className="relative group perspective-1000">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
              <div className="relative p-1 bg-gray-900 rounded-3xl">
                <img src={`http://localhost:3001/uploads/${displayWinner.filename}`} alt="Winner" className="w-[16rem] h-[16rem] md:w-[20rem] md:h-[20rem] object-cover rounded-2xl shadow-2xl" />
              </div>
              <div className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-gray-900 transform rotate-12 group-hover:rotate-0 transition-all duration-300 z-10">
                  <span className="text-xs md:text-sm font-bold uppercase tracking-wider opacity-80">Wins</span>
                  <span className="text-3xl md:text-5xl font-black">{displayWinner.wins}</span>
               </div>
               <div className="absolute -top-6 -left-6 text-6xl animate-bounce-slight z-20">👑</div>
            </div>
            <div className="mt-8 flex gap-4">
               <div className="px-6 py-2 bg-gray-800 rounded-full border border-gray-700 text-gray-300 font-medium">Round {displayWinner.round} Survivor</div>
            </div>
          </div>
          
          <button onClick={handleDownload} className="mt-6 flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download Winner Card
          </button>
        </div>
      )}

      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Hall of Fame</h2>
            <div className="h-px bg-gray-700 flex-1 ml-8"></div>
        </div>
        <div className="space-y-4">
          {leaderboard.map((photo, index) => (
            <div key={photo.id} className="group flex items-center bg-gray-800/50 hover:bg-gray-800 p-4 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg backdrop-blur-sm">
              <div className={`text-2xl font-black w-12 text-center flex-shrink-0 ${index === 0 ? 'text-yellow-400 text-4xl' : index === 1 ? 'text-gray-300 text-3xl' : index === 2 ? 'text-amber-600 text-3xl' : 'text-gray-600'}`}>#{index + 1}</div>
              <div className="w-20 h-20 flex-shrink-0 mx-6 relative overflow-hidden rounded-lg">
                  <img src={`http://localhost:3001/uploads/${photo.filename}`} alt="Ranked" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-white truncate mb-1 group-hover:text-blue-400 transition-colors">{photo.original_name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="bg-gray-700/50 px-2 py-0.5 rounded text-gray-300">Round {photo.round}</span>
                    {photo.status === 'active' && <span className="text-green-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> Active</span>}
                </div>
              </div>
              <div className="text-right pl-4">
                <span className="block text-2xl font-black text-white group-hover:text-blue-400 transition-colors">{photo.wins}</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wins</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleRestart} className="mt-16 group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-red-600 font-lg rounded-xl hover:bg-red-500 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 focus:ring-offset-gray-900">
        <span className="absolute left-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
        <span className="relative flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Start New Tournament
        </span>
      </button>
      <p className="mt-4 text-gray-500 text-sm">This will clear all current photos and data.</p>
    </div>
  );
};

export default WinnerScreen;
