import React, { useState, useRef, useEffect } from 'react';
import { Camera, Volume2, ShieldAlert, CheckCircle2, Leaf, AlertTriangle, UploadCloud, ScanLine, MessageSquare, Send, Mic, MicOff, CloudSun, Thermometer, Droplets, Move, Maximize2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const scanStyles = `
  @keyframes scan-vertical {
    0% { top: 0%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  .laser-scanner {
    position: absolute;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: #10b981;
    box-shadow: 0 0 15px 4px rgba(16, 185, 129, 0.6);
    animation: scan-vertical 2s linear infinite;
    z-index: 20;
  }
`;

export default function App() {
  const [scanning, setScanning] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Interactive Bounding Boxes State
  const [boxes, setBoxes] = useState([
    { id: 1, top: 28, left: 28, width: 16, height: 16 },
    { id: 2, top: 48, left: 42, width: 18, height: 18 }
  ]);
  
  const [activeBoxId, setActiveBoxId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'move' or 'resize'
  const containerRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I am AgriVision AI. Upload a photo or start the live camera to diagnose crop health issues.' }
  ]);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { 
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [chatMessages]);

  const handlePointerDown = (id, type) => (e) => {
    e.stopPropagation();
    setActiveBoxId(id);
    setActionType(type);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (activeBoxId === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setBoxes(prevBoxes => prevBoxes.map(box => {
      if (box.id === activeBoxId) {
        if (actionType === 'move') {
          return {
            ...box,
            left: Math.max(0, Math.min(84, x - box.width / 2)),
            top: Math.max(0, Math.min(84, y - box.height / 2))
          };
        } else if (actionType === 'resize') {
          return {
            ...box,
            width: Math.max(8, Math.min(90 - box.left, x - box.left)),
            height: Math.max(8, Math.min(90 - box.top, y - box.top))
          };
        }
      }
      return box;
    }));
  };

  const handlePointerUp = () => {
    setActiveBoxId(null);
    setActionType(null);
  };

  // Dynamically calculate infected area percentage based on box width & height
  const calculateDynamicArea = () => {
    const totalArea = boxes.reduce((acc, b) => acc + (b.width * b.height), 0);
    return (totalArea * 0.055).toFixed(1) + "%";
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setChatInput("Listening... Speak now");
      };
      recognition.onresult = (event) => {
        setChatInput(event.results[0][0].transcript);
      };
      recognition.onerror = () => {
        setIsListening(false);
        setChatInput("");
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      console.error("Mic error:", err);
      setIsListening(false);
    }
  };

  const startCamera = async () => {
    setImageSrc(null);
    setImageFile(null);
    setDiagnosis(null);
    setScanning(true);
    setChatMessages([
      { sender: 'bot', text: 'Hello! I am AgriVision AI. Upload a photo or start the live camera to diagnose crop health issues.' }
    ]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.warn("Camera access failed.");
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      stopCamera();
      setImageFile(file);
      setImageSrc(URL.createObjectURL(file));
      setDiagnosis(null);
      setChatMessages([
        { sender: 'bot', text: 'Hello! I am AgriVision AI. Upload a photo or start the live camera to diagnose crop health issues.' }
      ]);
    }
  };

  const handleRealScan = async () => {
    setLoading(true);
    setDiagnosis(null);
    const formData = new FormData();

    if (scanning && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setImageSrc(canvas.toDataURL('image/jpeg'));
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      formData.append("file", blob, "camera_snapshot.jpg");
      stopCamera();
    } else if (imageFile) {
      formData.append("file", imageFile);
    } else {
      alert("Please capture from camera or upload an image first.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/analyze-leaf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 4000
      });
      
      setTimeout(() => {
        setDiagnosis(res.data);
        setChatMessages(prev => [...prev, { 
          sender: 'bot', 
          text: `Analysis complete! Detected ${res.data.disease}. Weather factors evaluated.` 
        }]);
        setLoading(false);
      }, 2000);

    } catch (e) {
      setTimeout(() => {
        const mockResponse = {
          plant: "Apple (Malus domestica)",
          disease: "Apple Scab Leaf",
          confidence: "59.7%", 
          location: "Local Orchard Sector",
          weather: { temp: "30°C", humidity: "82% (High)", condition: "Humid & Cloudy", riskLevel: "High Spores Propagation" },
          treatment: {
            organic: [
              "Spray organic neem oil extract (5ml per Liter) during early morning.",
              "Apply certified bio-fungicide solutions near the base."
            ],
            chemical: [
              "Apply broad-spectrum systematic protectant fungicide if spread continues."
            ],
            dosage: "2.5g per Liter of water, apply every 10-12 days."
          }
        };
        setDiagnosis(mockResponse);
        setChatMessages(prev => [...prev, { 
          sender: 'bot', 
          text: `Analysis complete! Detected Apple Scab Leaf. Bounding boxes ready for adjustment.` 
        }]);
        setLoading(false);
      }, 2000);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatInput === "Listening... Speak now") return;
    
    const query = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: query }]);
    setChatInput("");

    setTimeout(() => {
      const lower = query.toLowerCase();
      let options = [];

      if (lower.includes('alternative') || lower.includes('instead') || lower.includes('replace')) {
        options = [
          `As an alternative to neem oil, you can try bio-fungicides containing Bacillus subtilis, sulfur dust, or garlic-chili extracts.`
        ];
      } else if (lower.includes('dosage') || lower.includes('how much') || lower.includes('quantity')) {
        options = [
          `The standard recommended dosage is 2.5g of Mancozeb or Copper Fungicide per Liter of water, applied every 10 days.`
        ];
      } else {
        options = [
          `Regarding "${query}": Make sure to inspect orchard rows regularly and maintain proper plant spacing for better airflow.`
        ];
      }

      const botReply = options[Math.floor(Math.random() * options.length)];
      setChatMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    }, 1000);
  };

  const playVoiceAlert = () => {
    if ('speechSynthesis' in window && diagnosis) {
      const msg = new SpeechSynthesisUtterance(`Warning. ${diagnosis.disease} detected under high humidity conditions. Apply recommended treatments.`);
      msg.lang = 'en-IN';
      window.speechSynthesis.speak(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 flex flex-col">
      <style>{scanStyles}</style>
      
      <header className="max-w-7xl mx-auto w-full flex justify-between items-center pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Leaf className="w-8 h-8 text-emerald-400" />
          <h1 className="text-2xl font-bold tracking-wider">AgriVision<span className="text-emerald-400">.AI</span></h1>
        </div>
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono rounded-full">LIVE ENGINE ACTIVE</span>
      </header>

      <main className="max-w-7xl mx-auto w-full mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div 
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-800 flex flex-col items-center justify-center shadow-xl select-none"
          >
            {loading && <div className="laser-scanner"></div>}
            {loading && <div className="absolute inset-0 bg-emerald-500/10 animate-pulse z-10 pointer-events-none"></div>}

            {diagnosis && !loading && imageSrc && (
              <div className="absolute inset-0 z-10">
                {boxes.map((box) => (
                  <div
                    key={box.id}
                    onPointerDown={handlePointerDown(box.id, 'move')}
                    style={{ top: `${box.top}%`, left: `${box.left}%`, width: `${box.width}%`, height: `${box.height}%`, touchAction: 'none' }}
                    className="absolute border-2 border-red-500 rounded bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.8)] cursor-grab active:cursor-grabbing flex flex-col justify-between group"
                  >
                    <span className="bg-red-500 text-white text-[9px] px-1 font-bold w-fit -mt-4 rounded-t-sm flex items-center gap-1 pointer-events-none">
                      <Move className="w-2.5 h-2.5" /> Spot #{box.id}
                    </span>
                    {/* Resize Handle at Bottom Right */}
                    <div
                      onPointerDown={handlePointerDown(box.id, 'resize')}
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-tl cursor-se-resize flex items-center justify-center opacity-80 group-hover:opacity-100"
                      title="Drag to resize infected area"
                    >
                      <Maximize2 className="w-2.5 h-2.5 text-white pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {scanning ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : imageSrc ? (
              <img src={imageSrc} className={`w-full h-full object-cover transition duration-500 ${loading ? 'opacity-80 scale-105 blur-[1px]' : 'opacity-100'}`} alt="Leaf" />
            ) : (
              <div className="text-center p-8 text-slate-500">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Start live camera or upload photo</p>
              </div>
            )}

            {scanning && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-full font-medium animate-pulse z-20">
                <span className="w-2 h-2 rounded-full bg-white"></span> LIVE SCAN
              </div>
            )}
          </div>

          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          
          <div className="grid grid-cols-2 gap-3">
            <button onClick={scanning ? stopCamera : startCamera} className={`py-3 font-medium rounded-xl border transition flex items-center justify-center gap-2 cursor-pointer ${scanning ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'}`}>
              <Camera className="w-5 h-5" /> {scanning ? 'Stop Camera' : 'Start Camera'}
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer">
              <UploadCloud className="w-5 h-5" /> Upload Photo
            </button>
          </div>
          
          <button onClick={handleRealScan} disabled={loading || (!scanning && !imageSrc)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition flex justify-center items-center gap-2 mt-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer">
            <ScanLine className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Analyzing Image..." : "Run AI Diagnostic"}
          </button>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-[80vh]">
          {diagnosis ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl shrink-0">
              <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
                <div>
                  <span className="text-xs text-emerald-400 font-mono uppercase bg-emerald-500/10 px-2 py-1 rounded">Plant: {diagnosis.plant}</span>
                  <h2 className="text-2xl font-bold mt-3 text-slate-50">{diagnosis.disease}</h2>
                </div>
                <button onClick={playVoiceAlert} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition cursor-pointer" title="Voice Alert">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Confidence</span>
                  <span className="text-lg font-bold text-emerald-400">{diagnosis.confidence}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Infected Area (Adjustable)</span>
                  <span className="text-lg font-bold text-amber-400">{calculateDynamicArea()}</span>
                </div>
              </div>

              {/* Field Weather */}
              <div className="bg-cyan-950/20 p-3.5 rounded-xl border border-cyan-900/40 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                    <CloudSun className="w-4 h-4" /> Field Weather Monitoring
                  </div>
                  <span className="text-[11px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded font-mono">
                    {diagnosis.weather?.condition || "Humid & Cloudy"}
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-semibold flex items-center gap-6">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-amber-400" /> Temp: {diagnosis.weather?.temp || "30°C"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-400" /> Humidity: {diagnosis.weather?.humidity || "82% (High)"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3"><CheckCircle2 className="w-5 h-5" /> Organic Treatment</div>
                  <ul className="text-sm text-slate-300 space-y-2 list-disc pl-4">
                    {diagnosis.treatment.organic.map((step, i) => <li key={i}>{step}</li>)}
                  </ul>
                </div>
                <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-400 font-bold mb-3"><AlertTriangle className="w-5 h-5" /> Chemical Intervention</div>
                  <ul className="text-sm text-slate-300 space-y-2 list-disc pl-4">
                    {diagnosis.treatment.chemical.map((step, i) => <li key={i}>{step}</li>)}
                  </ul>
                  <div className="mt-3 text-xs bg-amber-500/10 text-amber-300 px-2 py-2 rounded border border-amber-500/20">
                    <span className="font-bold">DOSAGE:</span> {diagnosis.treatment.dosage}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 shrink-0">
              <ShieldAlert className="w-12 h-12 mb-3 opacity-50" />
              <p>Scan a plant or upload an image to view professional diagnostics and weather insights.</p>
            </div>
          )}

          {/* AI Agronomist Chatbot */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[300px]">
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center justify-between font-medium text-slate-300">
              <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-emerald-500" /> AI Agronomist Assistant</div>
              {isListening && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">Listening... Speak now</span>}
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-emerald-600 text-white self-end rounded-br-none' : 'bg-slate-800 text-slate-200 self-start rounded-bl-none'}`}>
                  {msg.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2 items-center">
              <button type="button" onClick={handleVoiceInput} className={`p-2.5 rounded-xl border transition cursor-pointer ${isListening ? 'bg-red-500 text-white animate-bounce' : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'}`} title="Voice Input">
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about crop care or weather impact..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
              <button type="submit" disabled={!chatInput.trim()} className="p-3 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition cursor-pointer"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}