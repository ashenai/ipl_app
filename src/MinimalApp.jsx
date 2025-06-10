import React, { useState, useMemo } from 'react';
import { getTeamNames, formatTeamDisplay } from './fixDropdowns';

// Minimal version of the App component that incorporates core IPL functionality
export default function MinimalApp() {
  // Mock data directly included for simplicity
  const mockData = {
    "2008": [
      {
        "match_id": "335982",
        "description": "RCB vs KKR - 2008 Match 1"
      },
      {
        "match_id": "335983",
        "description": "CSK vs MI - 2008 Match 2"
      }
    ],
    "2023": [
      {
        "match_id": "1370353",
        "description": "GT vs CSK - 2023 Final"
      }
    ]
  };

  // Basic state management
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedMatch, setSelectedMatch] = useState("");
  const [message, setMessage] = useState("Select a season and match to start!");
  
  // Derived data
  const seasons = useMemo(() => Object.keys(mockData).sort((a,b) => b-a), []);
  const matchesForSeason = useMemo(() => 
    selectedSeason ? mockData[selectedSeason] : [], [selectedSeason]);
  
  // Basic handler
  const handleStartGame = () => {
    if (!selectedMatch) {
      setMessage("Please select a match.");
      return;
    }
    
    const match = matchesForSeason.find(m => m.match_id === selectedMatch);
    setMessage(`You selected ${match.description}. Game functionality is limited in this test version.`);
  };
  
  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-tight">IPL Predictor Challenge</h1>
          <p className="text-gray-300 mt-2">Simplified Version</p>
        </header>
        
        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700">
          <h2 className="text-xl text-white font-semibold text-center mb-4">Game Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="w-full">
              <label htmlFor="season" className="block text-sm font-medium text-gray-300 mb-1">1. Select Season</label>
              <select 
                id="season" 
                value={selectedSeason} 
                onChange={e => { setSelectedSeason(e.target.value); setSelectedMatch(""); }} 
                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">-- Choose Season --</option>
                {seasons.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="w-full">
              <label htmlFor="match" className="block text-sm font-medium text-gray-300 mb-1">2. Select Match</label>
              <select 
                id="match" 
                value={selectedMatch} 
                onChange={e => setSelectedMatch(e.target.value)} 
                disabled={!selectedSeason} 
                className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">-- Choose Match --</option>                {matchesForSeason.map(m => {
                  console.log("MinimalApp match:", m);                  // Use the utility function to get a consistent team display format
                  const displayValue = formatTeamDisplay(m);
                  
                  // Get the match ID based on the data structure
                  let matchId = "";
                  if (m.match_id) {
                    matchId = m.match_id;
                  } else if (Array.isArray(m) && m.length > 0 && m[0].match_id) {
                    matchId = m[0].match_id;
                  } else {
                    // Fallback
                    displayValue = `Match ${m.match_id || 'Unknown'}`;
                    matchId = m.match_id || 'unknown';
                  }
                  
                  return <option key={matchId} value={matchId}>{displayValue}</option>;
                })}
              </select>
            </div>
          </div>
          <button 
            onClick={handleStartGame} 
            className="w-full mt-4 bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-md hover:bg-yellow-400 transition-colors duration-300 shadow-lg text-lg"
          >
            Go
          </button>
        </div>
        
        <div className="mt-4 bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Status</h3>
          <p className="text-gray-200">{message}</p>
        </div>
      </div>
    </div>
  );
}
