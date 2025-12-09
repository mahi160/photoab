import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
      const res = await axios.get("http://localhost:3001/api/duel");
      res.data.type === "winner" ? navigate("/winner", { state: { winner: res.data.winner } }) : setDuelData(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDuel(); }, []);

  const handleVote = async (winnerId, loserId) => {
    if (voting) return;
    setVoting(true);
    try {
      await axios.post("http://localhost:3001/api/vote", { winnerId, loserId });
      setCanUndo(true);
      await fetchDuel();
    } catch (e) { console.error(e); } finally { setVoting(false); }
  };

  const handleUndo = async () => {
    try {
      await axios.post("http://localhost:3001/api/undo");
      setCanUndo(false);
      fetchDuel();
    } catch (e) { console.error(e); }
  };

  if (loading && !duelData) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse-slow">
         <div className="text-3xl font-bold text-blue-400 mb-4">Finding Contenders...</div>
         <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
  );
  if (!duelData) return <div className="text-xl text-red-500">No active duel found.</div>;

  const { left, right } = duelData;
  return (
    <>
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Full Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          <button className="absolute top-4 right-4 text-white hover:text-red-400 p-2" onClick={() => setPreviewImage(null)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      
      <div className="flex flex-col items-center w-full max-w-4xl animate-fade-in px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gray-800/60 backdrop-blur-md px-6 py-2 rounded-full border border-gray-700 shadow-xl flex flex-col items-center">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-wider uppercase">Round {left.round}</h2>
            {duelData.matchesRemaining !== undefined && (
               <span className="text-xs text-gray-400 font-medium tracking-widest mt-0.5">{duelData.matchesRemaining} Matches Left</span>
            )}
          </div>
          
          {canUndo && (
            <button 
              onClick={handleUndo}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full border border-gray-600 transition-all flex items-center gap-2 text-sm font-bold"
              title="Undo last vote"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              Undo
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8">
          {[left, right].map((item, idx) => (
              <div key={item.id} className="relative flex-1 w-full max-w-md group">
                <div 
                  className={`relative w-full aspect-[4/5] md:aspect-square cursor-pointer overflow-hidden rounded-2xl shadow-2xl border-0 ring-4 ring-transparent transition-all duration-500 transform hover:scale-[1.02] ${idx === 0 ? 'hover:ring-blue-500/50 hover:-rotate-1' : 'hover:ring-purple-500/50 hover:rotate-1'}`}
                  onClick={() => handleVote(item.id, idx === 0 ? right.id : left.id)}
                >
                  <img src={`http://localhost:3001/uploads/${item.filename}`} alt="Contender" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] bg-black/20">
                    <span className={`${idx === 0 ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white px-8 py-3 rounded-full font-bold text-xl shadow-lg transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300`}>
                      Vote {idx === 0 ? 'Left' : 'Right'}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setPreviewImage(`http://localhost:3001/uploads/${item.filename}`); }}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 backdrop-blur-sm"
                  title="View Full Size"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </button>
              </div>
          ))}
          {/* VS Badge */}
           <div className="flex-shrink-0 z-10 relative order-first md:order-none md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
              <div className="bg-red-600 text-white text-3xl font-black rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] border-4 border-gray-900 animate-bounce-slight relative z-10">
                  <span className="italic transform -skew-x-12">VS</span>
              </div>
          </div>
        </div>
        <p className="mt-12 text-gray-500 text-sm uppercase tracking-widest font-semibold">Click your favorite to eliminate the other</p>
      </div>
    </>
  );
};

export default DuelArena;
