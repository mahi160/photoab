import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../main";

const UploadScreen = () => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave" || e.type === "drop") setDragActive(false);
  };

  const handleFileChange = (e) =>
    e.target.files && setFiles(Array.from(e.target.files));

  const handleDrop = (e) => {
    handleDrag(e);
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      setFiles(Array.from(e.dataTransfer.files));
  };

  const handleUpload = async () => {
    if (files.length < 2) return alert("Upload at least 2 photos");
    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f));
    setIsUploading(true);
    try {
      await axios.post(API_BASE_URL + "/api/photos", formData);
      navigate("/duel");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl animate-fade-in">
      <h1 className="text-6xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
        Photo Duel
      </h1>
      <p className="text-gray-500 mb-10 text-lg">
        Find the champion among your photos
      </p>

      <div
        className={`w-full p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 relative group ${dragActive ? "border-blue-500 bg-blue-50 scale-105" : "border-gray-300 bg-white/50 hover:bg-white"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="text-center pointer-events-none transition-transform duration-300 group-hover:scale-110">
          <svg
            className={`w-20 h-20 mb-4 mx-auto ${dragActive ? "text-blue-500" : "text-gray-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
          <p className="text-2xl font-bold mb-2 text-gray-600">
            Drop photos here
          </p>
        </div>
      </div>

      <div
        className={`mt-8 transition-all duration-500 ${files.length ? "opacity-100" : "opacity-0 translate-y-4"}`}
      >
        <div className="bg-white px-6 py-3 rounded-full text-blue-600 font-medium shadow-md border border-gray-200">
          {files.length} photos ready
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={files.length < 2 || isUploading}
        className={`mt-10 w-full max-w-sm py-4 px-8 rounded-xl text-xl font-bold transition-all duration-300 transform ${files.length >= 2 && !isUploading ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-2xl hover:-translate-y-1" : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"}`}
      >
        {isUploading ? "Uploading..." : "Start Duel"}
      </button>

      <button
        onClick={async () => {
          if (
            window.confirm(
              "Are you sure you want to clear all photos and history?",
            )
          ) {
            try {
              await axios.post(API_BASE_URL + "/api/restart");
              setFiles([]);
              alert("System cleared!");
            } catch (e) {
              console.error(e);
            }
          }
        }}
        className="mt-6 text-gray-400 hover:text-red-500 text-sm font-medium transition-colors flex items-center gap-2"
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
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Clear All Data
      </button>
    </div>
  );
};

export default UploadScreen;
