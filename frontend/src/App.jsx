import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadScreen from "./components/UploadScreen";
import DuelArena from "./components/DuelArena";
import WinnerScreen from "./components/WinnerScreen";

const App = () => (
  <BrowserRouter>
    <div className="min-h-screen text-gray-900 flex flex-col items-center justify-center p-4 font-sans antialiased">
      <Routes>
        <Route path="/" element={<UploadScreen />} />
        <Route path="/duel" element={<DuelArena />} />
        <Route path="/winner" element={<WinnerScreen />} />
      </Routes>
    </div>
  </BrowserRouter>
);

export default App;
