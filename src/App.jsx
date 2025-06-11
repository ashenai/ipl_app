import React, { useState, useEffect, useMemo } from 'react';

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


// --- MOCK DATA INTEGRATION ---
// Data from your Google Drive link for the 2008 and 2023 seasons has been integrated.
// For a full-scale app, this would be loaded from a server/API.
const mockIplData = {
  "2008": [
    {
      "match": "RCB vs KKR - 2008 Match 1",
      "match_id": "335982",
      "deliveries": [
            {"ID":61,"season":2008,"match_id":335982,"inning":1,"over":0,"ball":1,"batter":"SC Ganguly","bowler":"P Kumar","non_striker":"BB McCullum","batsman_runs":0,"extra_runs":1,"total_runs":1,"extras_type":"legbyes","is_wicket":0,"player_dismissed":"NA","dismissal_kind":"NA","fielder":"NA"},
            {"ID":62,"season":2008,"match_id":335982,"inning":1,"over":0,"ball":2,"batter":"BB McCullum","bowler":"P Kumar","non_striker":"SC Ganguly","batsman_runs":0,"extra_runs":0,"total_runs":0,"extras_type":"NA","is_wicket":0,"player_dismissed":"NA","dismissal_kind":"NA","fielder":"NA"},
            {"ID":68,"season":2008,"match_id":335982,"inning":1,"over":1,"ball":2,"batter":"BB McCullum","bowler":"Z Khan","non_striker":"SC Ganguly","batsman_runs":4,"extra_runs":0,"total_runs":4,"extras_type":"NA","is_wicket":0,"player_dismissed":"NA","dismissal_kind":"NA","fielder":"NA"},
            {"ID":69,"season":2008,"match_id":335982,"inning":1,"over":1,"ball":3,"batter":"BB McCullum","bowler":"Z Khan","non_striker":"SC Ganguly","batsman_runs":4,"extra_runs":0,"total_runs":4,"extras_type":"NA","is_wicket":0,"player_dismissed":"NA","dismissal_kind":"NA","fielder":"NA"},
            {"ID":72,"season":2008,"match_id":335982,"inning":1,"over":1,"ball":6,"batter":"BB McCullum","bowler":"Z Khan","non_striker":"SC Ganguly","batsman_runs":6,"extra_runs":0,"total_runs":6,"extras_type":"NA","is_wicket":0,"player_dismissed":"NA","dismissal_kind":"NA","fielder":"NA"},
            {"ID":183,"season":2008,"match_id":335982,"inning":2,"over":2,"ball":2,"batter":"V Kohli","bowler":"AB Dinda","non_striker":"W Jaffer","batsman_runs":0,"extra_runs":0,"total_runs":0,"extras_type":"NA","is_wicket":1,"player_dismissed":"V Kohli","dismissal_kind":"bowled","fielder":"NA"},
            {"ID":195,"season":2008,"match_id":335982,"inning":2,"over":4,"ball":2,"batter":"MV Boucher","bowler":"AB Dinda","non_striker":"W Jaffer","batsman_runs":0,"extra_runs":1,"total_runs":1,"extras_type":"wides","is_wicket":0,"player_dismissed":"NA","dismissal_kind":"NA","fielder":"NA"}
      ]
    }
  ],
  "2023": [
    {
      "match": "GT vs CSK - 2023 Final",
      "match_id": "1370353",
      "deliveries": [
            { "ID": 1, "season": 2023, "match_id": 1370353, "inning": 1, "batting_team": "Gujarat Titans", "bowling_team": "Chennai Super Kings", "over": 0, "ball": 1, "batter": "WP Saha", "bowler": "DL Chahar", "non_striker": "Shubman Gill", "batsman_runs": 0, "extra_runs": 0, "total_runs": 0, "extras_type": "NA", "is_wicket": 0, "player_dismissed": "NA", "dismissal_kind": "NA", "fielder": "NA" },
            { "ID": 2, "season": 2023, "match_id": 1370353, "inning": 1, "batting_team": "Gujarat Titans", "bowling_team": "Chennai Super Kings", "over": 0, "ball": 2, "batter": "WP Saha", "bowler": "DL Chahar", "non_striker": "Shubman Gill", "batsman_runs": 4, "extra_runs": 0, "total_runs": 4, "extras_type": "NA", "is_wicket": 0, "player_dismissed": "NA", "dismissal_kind": "NA", "fielder": "NA" },
            { "ID": 5, "season": 2023, "match_id": 1370353, "inning": 1, "batting_team": "Gujarat Titans", "bowling_team": "Chennai Super Kings", "over": 6, "ball": 6, "batter": "Shubman Gill", "bowler": "RA Jadeja", "non_striker": "WP Saha", "batsman_runs": 0, "extra_runs": 0, "total_runs": 0, "extras_type": "NA", "is_wicket": 1, "player_dismissed": "Shubman Gill", "dismissal_kind": "stumped", "fielder": "MS Dhoni" },
            { "ID": 6, "season": 2023, "match_id": 1370353, "inning": 2, "batting_team": "Chennai Super Kings", "bowling_team": "Gujarat Titans", "over": 14, "ball": 6,"batter":"RA Jadeja","bowler":"MM Sharma","non_striker":"S Dube","batsman_runs":4,"extra_runs":0,"total_runs":4,"extras_type":"NA","is_wicket":0,"player_dismissed":"NA","dismissal_kind":"NA","fielder":"NA"}
      ]
    }
  ]
};

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

const LoadingIndicator = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
        </div>
    </div>
);

// --- MAIN APP COMPONENT ---
export default function App() {
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

    // Check if the environment variable is defined, if not default to false (production mode)
    const isTestMode = import.meta.env.VITE_APP_MODE === 'test' ? true : false;
    const API_URL = 'http://localhost:3001'; // Your server URL
    
    const [seasons, setSeasons] = useState([]);
    const [matchesForSeason, setMatchesForSeason] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // For loading indicators

    // Use memoized values for UI rendering - only used in test mode
    const availableSeasons = useMemo(() => 
        isTestMode ? Object.keys(mockIplData).sort((a,b) => b-a) : seasons, 
        [isTestMode, seasons]
    );
    
    // memoized matches for selected season
    const availableMatchesForSeason = useMemo(() => 
        isTestMode ? (selectedSeason ? mockIplData[selectedSeason] || [] : []) : matchesForSeason, 
        [isTestMode, selectedSeason, matchesForSeason]
    );

    useEffect(() => {
        if (gameData) {
            updateGameState();
        }
    }, [currentBallIndex, gameData, currentInningIndex]);

    // Fetch seasons when component mounts
    useEffect(() => {
        if (isTestMode) {
            // In test mode, use the mock data
            console.log("Running in TEST mode with mockIplData");
            return;
        }

        console.log("Running in API mode - fetching seasons from server");
        setIsLoading(true);
        fetch(`${API_URL}/api/seasons`)
            .then(res => res.json())
            .then(data => {
                console.log("Received seasons from API:", data);
                setSeasons(data.sort((a, b) => b - a)); // Sort descending
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching seasons:", err);
                setIsLoading(false);
            });
    }, [isTestMode]);

    // Fetch matches for the selected season
    useEffect(() => {
        if (!selectedSeason) {
            return;
        }

        if (isTestMode) {
            // In test mode, the matchesForSeason is set via the availableMatchesForSeason memo
            console.log(`TEST mode - Using mock data for season ${selectedSeason}`);
            return;
        }

        console.log(`API mode - Fetching matches for season ${selectedSeason}`);
        setIsLoading(true);
        fetch(`${API_URL}/api/matches/${selectedSeason}`)
            .then(res => res.json())
            .then(data => {
                console.log("Received matches from API:", data);
                // Add a formatted match display name if not provided by the API
                const formattedMatches = data.map(match => {
                    if (!match.match && match.match_id) {
                        // Create a default match name if none exists
                        match.match = `Match ${match.match_id} (Season ${selectedSeason})`;
                    }
                    return match;
                });
                setMatchesForSeason(formattedMatches);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(`Error fetching matches for season ${selectedSeason}:`, err);
                setIsLoading(false);
            });
    }, [selectedSeason, isTestMode]);

    const handleStartGame = () => {
        if (!selectedMatch) {
            setMessage("Please select a match.");
            return;
        }
        
        // Test mode - use mock data directly
        if (isTestMode) {
            // The selected match might have suffix (match_id) appended, so extract the match ID from the selectedMatch
            // or look for a partial match of the team names
            let matchData;
            
            // First try to find by direct match
            matchData = availableMatchesForSeason.find(m => (m.match || m.description) === selectedMatch);
            
            // If not found, try to match without the ID suffix
            if (!matchData && selectedMatch.includes('(')) {
                const matchNameWithoutId = selectedMatch.split(' (')[0];
                matchData = availableMatchesForSeason.find(m => 
                    (m.match && m.match.includes(matchNameWithoutId)) || 
                    (m.description && m.description.includes(matchNameWithoutId))
                );
            }
            
            // If still not found, try matching by match_id
            if (!matchData && selectedMatch.includes('(')) {
                const matchIdInParentheses = selectedMatch.match(/\(([^)]+)\)/);
                if (matchIdInParentheses && matchIdInParentheses[1]) {
                    const matchId = matchIdInParentheses[1];
                    matchData = availableMatchesForSeason.find(m => m.match_id?.toString() === matchId);
                }
            }
            
            if (!matchData) {
                setMessage("Error: Could not find match data. Please try another match.");
                return;
            }
            
            // Process the match data into the expected format with innings structure
            const processedData = processMatchData(matchData);
            
            setGameData(processedData);
            setCurrentBallIndex(0);
            setCurrentInningIndex(0);
            setUserPoints(50);
            setPrediction(null);
            setIsGameOver(false);
            setMessage(`Game started: ${matchData.match || matchData.description || `Match ${selectedMatch}`}. Make your prediction or press 'Bowl Next Ball' to continue.`);
            return;
        }
        
        // API mode - fetch match data from server
        // The selected match might have suffix (match_id) appended, so we need to extract it
        let matchInfo;
        
        // First try to find by direct match
        matchInfo = matchesForSeason.find(m => (m.match || m.description) === selectedMatch);
        
        // If not found, try to match without the ID suffix
        if (!matchInfo && selectedMatch.includes('(')) {
            const matchNameWithoutId = selectedMatch.split(' (')[0];
            matchInfo = matchesForSeason.find(m => 
                (m.match && m.match.includes(matchNameWithoutId)) || 
                (m.description && m.description.includes(matchNameWithoutId))
            );
        }
        
        // If still not found, try matching by match_id
        if (!matchInfo && selectedMatch.includes('(')) {
            const matchIdInParentheses = selectedMatch.match(/\(([^)]+)\)/);
            if (matchIdInParentheses && matchIdInParentheses[1]) {
                const matchId = matchIdInParentheses[1];
                matchInfo = matchesForSeason.find(m => m.match_id?.toString() === matchId);
            }
        }
        
        if (!matchInfo) {
            setMessage("Error: Could not find match data. Please try another match.");
            return;
        }
        const matchId = matchInfo.match_id;

        console.log(`API mode - Fetching data for match ${matchId}`);
        setIsLoading(true);
        
        fetch(`${API_URL}/api/data/${selectedSeason}/${matchId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch match data (${res.status})`);
                }
                return res.json();
            })
            .then(responseData => {
                console.log("Received match data from API:", responseData);
                
                // Get match metadata
                const matchMetadata = matchesForSeason.find(m => m.match_id?.toString() === matchId);
                let matchData;
                
                // Check what format the response is in
                if (Array.isArray(responseData)) {
                    // If it's an array, it's probably the raw deliveries
                    matchData = {
                        match_id: matchId,
                        match: matchMetadata?.match,
                        description: matchMetadata?.description,
                        deliveries: responseData
                    };
                } else if (responseData.deliveries) {
                    // If it has a deliveries property, it's already structured
                    matchData = {
                        ...responseData,
                        match: responseData.match || matchMetadata?.match,
                        description: responseData.description || matchMetadata?.description
                    };
                } else if (responseData.match) {
                    // If it has a match property, it might be a different format
                    matchData = responseData;
                } else {
                    // Unexpected format, try to adapt
                    console.warn("Unexpected match data format:", responseData);
                    matchData = {
                        match_id: matchId,
                        match: matchMetadata?.match,
                        description: matchMetadata?.description,
                        deliveries: responseData.data || responseData // Try to extract data or use as is
                    };
                }
                
                // Process into the proper format
                const processedData = processMatchData(matchData);
                
                if (!processedData || !processedData.innings || processedData.innings.length === 0) {
                    throw new Error("Failed to process match data into required format");
                }
                
                setGameData(processedData);
                setCurrentBallIndex(0);
                setCurrentInningIndex(0);
                setUserPoints(50);
                setPrediction(null);
                setIsGameOver(false);
                
                const matchName = matchMetadata?.match || matchMetadata?.description || `Match ${matchId}`;
                setMessage(`Game started: ${matchName}. Make your prediction or press 'Bowl Next Ball' to continue.`);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(`Error fetching match data for match ${selectedMatch}:`, err);
                setMessage(`Error: Could not load match data: ${err.message}`);
                setIsLoading(false);
            });
    };

    const updateGameState = () => {
        const inningData = gameData.innings[currentInningIndex];
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
            
            // Determine the outcome of this ball
            let outcome = "";
            if (ball.is_wicket === 1) outcome = 'wicket';
            else if (ball.batsman_runs === 4) outcome = '4';
            else if (ball.batsman_runs === 6) outcome = '6';

            resultMessage = `Result: ${commentary} `;
            
            // Points logic: Only deduct points for wrong predictions, add bonus for correct predictions
            if (prediction === outcome) {
                // Correct prediction bonus
                let bonus = 0;
                if (prediction === '4') bonus = 2;
                else if (prediction === '6') bonus = 5;
                else if (prediction === 'wicket') bonus = 10;
                
                newPoints += bonus;
                resultMessage += `Correct prediction! You earned ${bonus} points!`;
            } else {
                // Wrong prediction penalty
                newPoints -= 1;
                resultMessage += "Your prediction was incorrect. You lost 1 point.";
            }
        } else {
             resultMessage = `Result: ${commentary}`;
        }


        setUserPoints(newPoints);
        setMessage(resultMessage);
        
        if (newPoints <= 0) {
            setIsGameOver(true);
            setMessage(resultMessage + " Game Over! You've run out of points.");
            return;
        }

        setCurrentBallIndex(prev => prev + 1);
        setPrediction(null);
    };

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

    // Function to process match data into the expected format
    const processMatchData = (matchData) => {
        if (!matchData) {
            console.error("No match data provided to processMatchData");
            return null;
        }
        
        console.log("Processing match data:", matchData);
        
        // Check if the data already has the innings structure
        if (matchData.innings) {
            console.log("Match already has innings structure");
            return matchData;
        }
        
        // Process raw deliveries data into innings
        const innings = {};
        const deliveries = matchData.deliveries || [];
        
        if (deliveries.length === 0) {
            console.warn("No deliveries found in match data");
            console.error("Match data structure:", JSON.stringify(matchData, null, 2));
        }
        
        console.log(`Processing ${deliveries.length} deliveries into innings structure`);
        
        // Group deliveries by innings
        deliveries.forEach(delivery => {
            const inningNum = delivery.inning;
            if (!innings[inningNum]) {
                innings[inningNum] = {
                    inning: inningNum,
                    batting_team: delivery.batting_team || `Batting Team (Inning ${inningNum})`,
                    bowling_team: delivery.bowling_team || `Bowling Team (Inning ${inningNum})`,
                    deliveries: []
                };
            }
            innings[inningNum].deliveries.push(delivery);
        });
        
        // Sort deliveries by over and ball
        Object.values(innings).forEach(inning => {
            inning.deliveries.sort((a, b) => {
                // Convert over and ball to numbers to ensure proper sorting
                const aOver = Number(a.over) || 0;
                const bOver = Number(b.over) || 0;
                if (aOver !== bOver) return aOver - bOver;
                
                const aBall = Number(a.ball) || 0;
                const bBall = Number(b.ball) || 0;
                return aBall - bBall;
            });
        });
        
        // Convert to array and sort by inning number
        const inningsArray = Object.values(innings).sort((a, b) => {
            const aInning = Number(a.inning) || 0;
            const bInning = Number(b.inning) || 0;
            return aInning - bInning;
        });
        
        console.log(`Created ${inningsArray.length} innings from deliveries`);
        
        // Get match ID reliably
        let match_id = matchData.match_id;
        if (!match_id && deliveries.length > 0) {
            match_id = deliveries[0].match_id;
        }
        
        // Use the match field for description if available
        const displayName = matchData.match || matchData.description || `Match ${match_id || ''}`;
        
        // Return the processed data in the expected format
        return {
            match_id: match_id || 'unknown',
            description: displayName,
            match: matchData.match || null,
            innings: inningsArray
        };
    };

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 md:p-8" style={{
            backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.95)), url('https://placehold.co/1920x1080/001100/FFFFFF?text=Cricket+Stadium')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
            {isLoading && <LoadingIndicator />}
            
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-tight">IPL Predictor Challenge</h1>
                    <p className="text-gray-300 mt-2">
                        {isTestMode ? "(TEST MODE) " : "(API MODE) "}
                        Relive classic matches and test your cricket instincts!
                    </p>
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
                                    {availableMatchesForSeason.map((m, idx) => (
                                        <option 
                                            key={m.match_id || `match-${idx}`}
                                            value={m.match || m.description || `Match ${idx + 1}`}
                                        >
                                            {m.match || m.description || `Match ${idx + 1}`}
                                        </option>
                                    ))}
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
                                   {['4', '6', 'Wicket'].map(p => (
                                       <button key={p} onClick={() => setPrediction(p.toLowerCase())} className={`p-4 rounded-lg text-xl font-bold transition-all duration-200 ${prediction === p.toLowerCase() ? 'bg-green-500 text-white ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                           {p}
                                       </button>
                                   ))}
                               </div>
                               <button onClick={handleNextBall} disabled={isGameOver} className="w-full mt-4 bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed shadow-lg text-lg">
                                   {prediction ? 'Confirm Prediction' : 'Bowl Next Ball'}
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

                {isLoading && <LoadingIndicator />}
            </div>
        </div>
    );
}
