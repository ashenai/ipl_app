import React, { useState, useEffect, useMemo } from 'react';
import { getTeamNames, formatTeamDisplay } from './fixDropdowns';

// --- HELPER FUNCTION: DYNAMIC COMMENTARY GENERATION ---
const generateCommentary = (ball) => {
    if (ball.is_wicket === 1) {
        return `WICKET! ${ball.player_dismissed} is out, ${ball.dismissal_kind}! A huge blow delivered by ${ball.bowler}.`;
    }
    if (ball.extras_type !== 'NA' && ball.extras_type !== null) {
        return `${ball.extra_runs} ${ball.extras_type}! An extra run for the batting side.`;
    }
    if (ball.batsman_runs === 6) {
        return `SIX! What a magnificent shot by ${ball.batter}! It's sailed over the ropes.`;
    }
    if (ball.batsman_runs === 4) {
        return `FOUR! A glorious boundary from ${ball.batter}, pierced the field perfectly.`;
    }
    if (ball.batsman_runs > 0) {
        return `${ball.batter} takes a quick ${ball.batsman_runs} run${ball.batsman_runs > 1 ? 's' : ''}.`;
    }
    return `Dot ball. ${ball.bowler} to ${ball.batter}, no run.`;
};

// --- MOCK DATA FOR TESTING ---
const mockIplData = {
  "2008": [
    {
      "match_id": 335982,
      "description": "RCB vs KKR - 2008 Match 1",
      "innings": [
        {
          "inning": 1,
          "batting_team": "Kolkata Knight Riders",
          "bowling_team": "Royal Challengers Bangalore",
          "deliveries": [
            {"ID":61,"season":2008,"match_id":335982,"inning":1,"over":0,"ball":1,"batter":"SC Ganguly","bowler":"P Kumar","non_striker":"BB McCullum","batsman_runs":0,"extra_runs":1,"total_runs":1,"extras_type":"legbyes","is_wicket":0,"player_dismissed":"NA","dismissal_kind":"NA","fielder":"NA"},
            {"ID":62,"season":2008,"match_id":335982,"inning":1,"over":0,"ball":2,"batter":"BB McCullum","bowler":"P Kumar","non_striker":"SC Ganguly","batsman_runs":0,"extra_runs":0,"total_runs":0,"extras_type":"NA","is_wicket":0,"player_dismissed":"NA","dismissal_kind":"NA","fielder":"NA"}
          ]
        }
      ]
    }
  ],
  "2023": [
    {
      "match_id": 1370353,
      "description": "GT vs CSK - 2023 Final",
      "innings": [
        {
          "inning": 1,
          "batting_team": "Gujarat Titans",
          "bowling_team": "Chennai Super Kings",
          "deliveries": [
            { "ID": 1, "season": 2023, "match_id": 1370353, "inning": 1, "batting_team": "Gujarat Titans", "bowling_team": "Chennai Super Kings", "over": 0, "ball": 1, "batter": "WP Saha", "bowler": "DL Chahar", "non_striker": "Shubman Gill", "batsman_runs": 0, "extra_runs": 0, "total_runs": 0, "extras_type": "NA", "is_wicket": 0, "player_dismissed": "NA", "dismissal_kind": "NA", "fielder": "NA" }
          ]
        }
      ]
    }
  ]
};

// --- DATA INTEGRATION ---
// API URL constant (can be outside the component)
const API_URL = 'http://localhost:3001'; // Your server URL

// --- HELPER COMPONENTS ---
const Scoreboard = ({ gameState }) => {
    if (!gameState) return null;
    const { score, wickets, overs, currentBatsman, currentBowler, battingTeam } = gameState;
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-700 w-full">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-2xl font-bold text-white">{battingTeam}</h2>
                <h2 className="text-3xl font-extrabold text-yellow-400">{score}-{wickets}</h2>
            </div>
            <div className="flex justify-between items-center text-lg">
                <p className="text-white">Overs: <span className="font-bold">{overs}</span></p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row justify-between text-sm sm:text-base">
                <p className="text-gray-300 font-semibold mb-1 sm:mb-0">Batsman: <span className="text-white">{currentBatsman}</span></p>
                <p className="text-gray-300 font-semibold">Bowler: <span className="text-white">{currentBowler}</span></p>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
    console.log('App component rendering');
    try {
        console.log('mockIplData available:', !!mockIplData);
        console.log('mockIplData seasons:', Object.keys(mockIplData));
    } catch (err) {
        console.error('Error accessing mockIplData:', err);
    }
    
    // All state hooks inside the component function
    const [seasons, setSeasons] = useState([]);
    const [matchesForSeason, setMatchesForSeason] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // For loading indicators
    const [selectedSeason, setSelectedSeason] = useState("");
    const [selectedMatch, setSelectedMatch] = useState("");
    const [gameData, setGameData] = useState(null);
    const [currentBallIndex, setCurrentBallIndex] = useState(0);
    const [currentInningIndex, setCurrentInningIndex] = useState(0);
    const [gameState, setGameState] = useState(null);
    const [userPoints, setUserPoints] = useState(50);
    const [prediction, setPrediction] = useState(null);
    const [message, setMessage] = useState("Select a season and match to start!");
    const [isGameOver, setIsGameOver] = useState(false);

    // --- Logic for handling test mode vs. real data ---
    // Check if the environment variable is defined, if not default to test mode
    const isTestMode = import.meta.env.VITE_APP_MODE ? import.meta.env.VITE_APP_MODE === 'test' : true;
    
    // Use memoized values for UI rendering - only used in test mode
    const availableSeasons = useMemo(() => isTestMode ? Object.keys(mockIplData).sort((a,b) => b-a) : seasons, [isTestMode, seasons]); // Sort seasons descending
    const availableMatchesForSeason = useMemo(() => {
        let result = [];
        if (isTestMode) {
            result = selectedSeason ? mockIplData[selectedSeason] : [];
            // Debug logging for test mode data
            if (result.length > 0) {
                console.log(`DETAILED TEST MODE DATA CHECK for ${selectedSeason}:`);
                result.forEach((match, idx) => {
                    console.log(`Match ${idx + 1}:`, {
                        match_id: match.match_id,
                        description: match.description,
                        hasInnings: !!match.innings,
                        inningsCount: match.innings ? match.innings.length : 0,
                        firstInning: match.innings && match.innings[0] ? {
                            batting_team: match.innings[0].batting_team,
                            bowling_team: match.innings[0].bowling_team
                        } : 'None'
                    });
                });
            }
        } else {
            result = matchesForSeason;
        }
        console.log(`Available matches for season ${selectedSeason}:`, result);
        return result;
    }, [isTestMode, selectedSeason, matchesForSeason]);

    // Effect hook to update game state when ball index changes
    useEffect(() => {
        if (gameData) {
            updateGameState();
        }
    }, [currentBallIndex, gameData, currentInningIndex]);

    // 1. Fetch all available seasons when the app loads
    useEffect(() => {
        if (isTestMode) {
            // In test mode, use mock seasons
            setSeasons(Object.keys(mockIplData));
            return;
        }

        setIsLoading(true);
        fetch(`${API_URL}/api/seasons`)
            .then(res => res.json())
            .then(data => {
                setSeasons(data.sort((a,b) => b-a));
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [isTestMode]);

    // 2. Fetch matches when a season is selected
    useEffect(() => {
        if (!selectedSeason) {
            console.log("No season selected, clearing matches");
            setMatchesForSeason([]);
            return;
        };
        if (isTestMode){
            const mockMatches = mockIplData[selectedSeason];
            console.log(`Setting ${mockMatches?.length || 0} matches for test mode, season ${selectedSeason}`);
            // Verify we have the expected structure
            if (mockMatches && mockMatches.length > 0) {
                console.log("Example match structure:", mockMatches[0]);
                if (mockMatches[0].innings && mockMatches[0].innings[0]) {
                    console.log("Team names from first match:", {
                        batting_team: mockMatches[0].innings[0].batting_team,
                        bowling_team: mockMatches[0].innings[0].bowling_team
                    });
                }
            }
            setMatchesForSeason(mockMatches || []);
            return;
        }

        setIsLoading(true);
        fetch(`${API_URL}/api/matches/${selectedSeason}`)
            .then(res => res.json())
            .then(data => {
                console.log(`API mode - Fetched matches for season ${selectedSeason}:`, data);
                
                // Process the data based on its format
                if (data && data.length > 0) {
                    console.log("Data structure check:", {
                        isArray: Array.isArray(data),
                        firstItemType: typeof data[0],
                        isFirstItemArray: Array.isArray(data[0]),
                        hasInnings: data[0] && data[0].innings !== undefined,
                        hasMatchId: data[0] && data[0].match_id !== undefined,
                        hasBattingTeam: data[0] && data[0].batting_team !== undefined,
                        hasBattingTeamValue: data[0] && data[0].batting_team
                    });
                    
                    if (Array.isArray(data[0])) {
                        // Data is grouped by matches already
                        console.log("Data is already grouped by matches");
                        setMatchesForSeason(data);
                    } else if (data[0] && data[0].match_id) {
                        // Data is in raw format (flat array of deliveries)
                        console.log("Processing raw delivery data:", data[0]);
                        
                        // Group by match_id
                        const matchMap = {};
                        data.forEach(ball => {
                            const matchId = ball.match_id;
                            if (!matchMap[matchId]) {
                                matchMap[matchId] = [];
                            }
                            matchMap[matchId].push(ball);
                        });
                        
                        console.log(`Found ${Object.keys(matchMap).length} unique matches`);
                        
                        // Either keep as arrays of balls (simpler), or group into innings structure
                        const keepSimpleFormat = true; // Set to true to keep as arrays for simpler access
                        
                        if (keepSimpleFormat) {
                            // Just group by match_id, keep as arrays of deliveries
                            const simpleProcessedData = Object.entries(matchMap).map(([matchId, deliveries]) => {
                                // Sort deliveries by inning, over, ball for proper game flow
                                const sortedDeliveries = [...deliveries].sort((a, b) => {
                                    if (a.inning !== b.inning) return a.inning - b.inning;
                                    if (a.over !== b.over) return a.over - b.over;
                                    return a.ball - b.ball;
                                });
                                
                                if (sortedDeliveries.length > 0) {
                                    console.log(`Match ${matchId} - Team names:`, {
                                        batting_team: sortedDeliveries[0].batting_team, 
                                        bowling_team: sortedDeliveries[0].bowling_team
                                    });
                                }
                                
                                return sortedDeliveries;
                            });
                            
                            console.log(`Processed ${simpleProcessedData.length} matches in simple format`);
                            setMatchesForSeason(simpleProcessedData);
                        } else {
                            // Convert to array of structured matches with innings
                            const processedData = Object.keys(matchMap).map(matchId => {
                                const matchDeliveries = matchMap[matchId];
                                // Group deliveries by innings
                                const innings = {};
                                matchDeliveries.forEach(d => {
                                    if (!innings[d.inning]) {
                                        innings[d.inning] = {
                                            inning: d.inning,
                                            batting_team: d.batting_team,
                                            bowling_team: d.bowling_team,
                                            deliveries: []
                                        };
                                    }
                                    innings[d.inning].deliveries.push(d);
                                });
                                
                                return {
                                    match_id: parseInt(matchId),
                                    innings: Object.values(innings)
                                };
                            });
                            
                            console.log(`Processed ${processedData.length} matches in structured format`);
                            setMatchesForSeason(processedData);
                        }
                    } else {
                        // Data is already in the expected format
                        console.log("Data is already in expected format");
                        setMatchesForSeason(data);
                    }
                } else {
                    // Empty or invalid data
                    console.log("No valid match data received");
                    setMatchesForSeason([]);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [selectedSeason, isTestMode]);

    // Function to update the game state based on current ball
    const updateGameState = () => {
        if (!gameData || !gameData.innings || gameData.innings.length === 0) return;
        
        const inningData = gameData.innings[currentInningIndex];
        if (!inningData || !inningData.deliveries) return;
        
        const deliveries = inningData.deliveries;
        
        let score = 0;
        let wickets = 0;
        for (let i = 0; i < currentBallIndex; i++) {
            score += deliveries[i].total_runs;
            wickets += deliveries[i].is_wicket;
        }

        const currentBallData = deliveries[currentBallIndex];
        if (!currentBallData) {
            if (currentInningIndex < gameData.innings.length - 1) {
                 setCurrentInningIndex(prev => prev + 1);
                 setCurrentBallIndex(0);
                 setMessage(`Innings break! ${gameData.innings[currentInningIndex + 1].batting_team} are batting.`);
            } else {
                 setIsGameOver(true);
                 setMessage("Match Over! Thanks for playing.");
            }
            return;
        }
        
        const overNumber = Math.floor(currentBallData.over) + "." + currentBallData.ball;
        
        setGameState({
            score,
            wickets,
            overs: overNumber,
            currentBatsman: currentBallData.batter,
            currentBowler: currentBallData.bowler,
            battingTeam: inningData.batting_team
        });
    };

    // The handleStartGame function to start a match
    const handleStartGame = () => {
        if (!selectedMatch || !selectedSeason) {
            setMessage("Please select a season and match.");
            return;
        }
        
        if (isTestMode){
            // In test mode, use the mock data
            const matchData = matchesForSeason.find(m => m.match_id.toString() === selectedMatch);
            setGameData(matchData);
            setCurrentBallIndex(0);
            setCurrentInningIndex(0);
            setUserPoints(50);
            setPrediction(null);
            setIsGameOver(false);
            
            // Use the fixDropdowns utility to get consistent team name display
            const displayName = formatTeamDisplay(matchData);
                
            console.log(`Test Mode - Game started: ${displayName}`);
            setMessage(`Game started: ${displayName}. Make your prediction or press 'Bowl Next Ball' to continue.`);
            return;
        }

        setIsLoading(true);
        fetch(`${API_URL}/api/data/${selectedSeason}/${selectedMatch}`)
            .then(res => res.json())
            .then(deliveries => {
                console.log("API Mode - Raw deliveries data received:", deliveries.length, "deliveries");
                
                // Find the selected match from the available matches
                let matchData;
                
                // Look for the match in our prepared matchesForSeason array
                const matchFromSeason = matchesForSeason.find(m => {
                    if (m.match_id && m.match_id.toString() === selectedMatch) {
                        return true;
                    } else if (Array.isArray(m) && m.length > 0 && m[0].match_id.toString() === selectedMatch) {
                        return true;
                    }
                    return false;
                });
                
                console.log("Found match in available matches:", matchFromSeason ? "yes" : "no");
                
                if (matchFromSeason) {
                    // If we found the match in our processed data
                    if (Array.isArray(matchFromSeason)) {
                        // It's in raw array format, convert to structured format for game mechanics
                        matchData = {
                            match_id: selectedMatch,
                            innings: groupDeliveriesIntoInnings(matchFromSeason)
                        };
                    } else {
                        // It's already in structured format
                        matchData = matchFromSeason;
                    }
                } else if (Array.isArray(deliveries) && deliveries.length > 0) {
                    // Process the raw deliveries from the API
                    matchData = {
                        match_id: selectedMatch,
                        innings: groupDeliveriesIntoInnings(deliveries)
                    };
                } else {
                    // Fallback with minimal structure
                    console.warn("No valid match data found, using empty structure");
                    matchData = {
                        match_id: selectedMatch,
                        innings: []
                    };
                }
                console.log("API Mode - Constructed match data:", matchData);
                setGameData(matchData);
                setCurrentBallIndex(0);
                setCurrentInningIndex(0);
                setUserPoints(50);
                setPrediction(null);
                setIsGameOver(false);
                
                // Use the fixDropdowns utility to get consistent team name display
                const displayName = formatTeamDisplay(matchData);
                    
                console.log(`API Mode - Game started: ${displayName}`);
                setMessage(`Game started: ${displayName}. Make your prediction or press 'Bowl Next Ball' to continue.`);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    };
    
    // Handle next ball action
    const handleNextBall = () => {
        if (isGameOver || !gameData) return;

        let newPoints = userPoints;
        let resultMessage = "";
        
        const ball = gameData.innings[currentInningIndex].deliveries[currentBallIndex];
        const commentary = generateCommentary(ball);
        
        if (prediction) {
            if (userPoints <= 0) {
                setIsGameOver(true);
                setMessage("Game Over! You've run out of points.");
                return;
            }
            
            newPoints -= 1;
            
            let outcome = "";
            if (ball.is_wicket === 1) outcome = 'wicket';
            else if (ball.batsman_runs === 4) outcome = '4';
            else if (ball.batsman_runs === 6) outcome = '6';

            resultMessage = `Result: ${commentary} `;
            if (prediction === outcome) {
                // Calculate net gain based on correct prediction
                if (prediction === '4') {
                    // For correct '4' prediction: cost+3 = -1+3 = +2 points
                    newPoints = userPoints + 3;
                    resultMessage += `Correct! You predicted a 4 and gained 2 points.`;
                }
                else if (prediction === '6') {
                    // For correct '6' prediction: cost+6 = -1+6 = +5 points
                    newPoints = userPoints + 6;
                    resultMessage += `Correct! You predicted a 6 and gained 5 points.`;
                }
                else if (prediction === 'wicket') {
                    // For correct 'wicket' prediction: cost+11 = -1+11 = +10 points
                    newPoints = userPoints + 11;
                    resultMessage += `Correct! You predicted a wicket and gained 10 points.`;
                }
            } else {
                resultMessage += "Your prediction was incorrect. You lost 1 point.";
            }
        } else {
             resultMessage = `Result: ${commentary}`;
        }

        setUserPoints(newPoints);
        setMessage(resultMessage);
        
        if (newPoints <= 0 && prediction) {
            setIsGameOver(true);
            setMessage(resultMessage + " Game Over! You've run out of points.");
            return;
        }

        setCurrentBallIndex(prev => prev + 1);
        setPrediction(null);
    };

    // Reset the game
    const resetGame = () => {
        setSelectedSeason("");
        setSelectedMatch("");
        setGameData(null);
        setCurrentBallIndex(0);
        setCurrentInningIndex(0);
        setGameState(null);
        setUserPoints(50);
        setPrediction(null);
        setMessage("Select a season and match to start!");
        setIsGameOver(false);
    };

    // Function to group deliveries by innings
    function groupDeliveriesIntoInnings(deliveries) {
        const innings = {};
        deliveries.forEach(d => {
            if (!innings[d.inning]) {
                innings[d.inning] = {
                    inning: d.inning,
                    batting_team: d.batting_team,
                    bowling_team: d.bowling_team,
                    deliveries: []
                };
            }
            innings[d.inning].deliveries.push(d);
        });
        return Object.values(innings);
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 md:p-8" style={{
            backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.95)), url('https://placehold.co/1920x1080/001100/FFFFFF?text=Cricket+Stadium')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-tight">IPL Predictor Challenge</h1>
                    <p className="text-gray-300 mt-2">Relive classic matches and test your cricket instincts!</p>
                </header>
                
                {!gameData && (
                    <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700">
                        <h2 className="text-xl text-white font-semibold text-center mb-4">Game Setup</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                             <div className="w-full">
                                <label htmlFor="season" className="block text-sm font-medium text-gray-300 mb-1">1. Select Season</label>
                                <select id="season" value={selectedSeason} onChange={e => { setSelectedSeason(e.target.value); setSelectedMatch(""); }} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-yellow-500 focus:border-yellow-500">
                                    <option value="">-- Choose Season --</option>
                                    {availableSeasons.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div className="w-full">
                                <label htmlFor="match" className="block text-sm font-medium text-gray-300 mb-1">2. Select Match</label>
                                <select id="match" value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)} disabled={!selectedSeason} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-yellow-500 focus:border-yellow-500">
                                    <option value="">-- Choose Match --</option>
                                    {availableMatchesForSeason.map((m, idx) => {
                                        // For debugging the raw object
                                        console.log(`Match ${idx}:`, m);
                                        
                                        // Use the utility function to get a consistent team display format
                                        const displayValue = formatTeamDisplay(m);
                                        
                                        // Create a unique key and value for the option
                                        let key = '';
                                        let value = '';
                                        
                                        if (Array.isArray(m) && m.length > 0) {
                                            key = `match-${m[0].match_id}`;
                                            value = m[0].match_id.toString();
                                        } else if (m && m.match_id) {
                                            key = `match-${m.match_id}`;
                                            value = m.match_id.toString();
                                        } else {
                                            key = `match-unknown-${idx}`;
                                            value = `unknown-${idx}`;
                                        }
                                        
                                        // Log what we're actually rendering
                                        console.log(`Rendering option ${idx}:`, {key, value, displayValue});
                                        
                                        return <option key={key} value={value}>
                                            {displayValue}
                                        </option>;
                                    })}
                                </select>
                            </div>
                        </div>
                         <button onClick={handleStartGame} className="w-full mt-4 bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-md hover:bg-yellow-400 transition-colors duration-300 shadow-lg text-lg">
                                Go
                            </button>
                    </div>
                )}
                
                {gameData && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                           <Scoreboard gameState={gameState} />
                           <div className="text-center md:text-right bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 w-full md:w-auto">
                               <p className="text-lg text-gray-300">Your Points</p>
                               <p className={`text-5xl font-black ${userPoints < 10 ? 'text-red-500' : 'text-green-400'}`}>{userPoints}</p>
                           </div>
                        </div>

                        <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700">
                           <h3 className="text-lg font-semibold text-yellow-400 mb-2">Commentary & Result</h3>
                           <p className="text-gray-200 min-h-[4rem]">{message}</p>
                        </div>
                        
                        {!isGameOver && (
                           <div className="bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700">
                               <h3 className="text-center text-xl font-bold text-white mb-4">Predict the Next Ball!</h3>
                               <div className="grid grid-cols-3 gap-4 mb-4">
                                   {['4', '6', 'wicket'].map(p => (
                                       <button key={p} onClick={() => setPrediction(p.toLowerCase())} className={`p-4 rounded-lg text-xl font-bold transition-all duration-200 ${prediction === p.toLowerCase() ? 'bg-green-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                           {p === 'wicket' ? 'Wicket' : p}
                                       </button>
                                   ))}
                               </div>
                               <button onClick={handleNextBall} disabled={isGameOver} className="w-full mt-4 bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed shadow-lg text-lg">
                                   {prediction ? 'Confirm Prediction (-1 Point)' : 'Bowl Next Ball (Free)'}
                               </button>
                           </div>
                        )}
                        
                        <div className="text-center mt-6">
                          <button onClick={resetGame} className="bg-red-600 text-white font-bold py-2 px-6 rounded-md hover:bg-red-500 transition-colors duration-300">
                            {isGameOver || gameData ? "Play Another Game" : "Reset"}
                          </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
