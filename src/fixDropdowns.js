// Helper utility to read a data file directly and extract team names

// This is a direct approach to fix the undefined team names issue
export async function loadRawMatchData(season, matchId) {
  try {
    // Attempt to fetch the raw data file
    const response = await fetch(`/data/${season}/${matchId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load match data: ${response.status}`);
    }
    
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      // We have the raw data format - extract teams from first ball
      const firstBall = data[0];
      if (firstBall.batting_team && firstBall.bowling_team) {
        return {
          match_id: matchId,
          batting_team: firstBall.batting_team,
          bowling_team: firstBall.bowling_team
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error loading raw match data:", error);
    return null;
  }
}

// Helper function to safely extract team names from a match object in any format
export function getTeamNames(match) {
  // Match can be:
  // 1. An object with innings array
  // 2. An array of ball-by-ball data
  // 3. An object with batting_team and bowling_team directly
  // 4. A legacy object with description

  if (!match) {
    console.log("WARNING: No match data provided to getTeamNames");
    return { batting_team: "Unknown", bowling_team: "Unknown" };
  }
  
  console.log("getTeamNames input:", {
    type: typeof match,
    isArray: Array.isArray(match),
    hasInnings: match.innings ? true : false,
    firstElement: Array.isArray(match) && match.length > 0 ? 
      { 
        batting_team: match[0].batting_team, 
        bowling_team: match[0].bowling_team
      } : null,
    hasDescription: match.description ? true : false,
    matchId: match.match_id || (Array.isArray(match) && match.length > 0 ? match[0].match_id : 'unknown')
  });

  // Case 1: Object with innings array
  if (match.innings && Array.isArray(match.innings) && match.innings[0]) {
    const inning = match.innings[0];
    if (inning.batting_team && inning.bowling_team) {
      const names = {
        batting_team: inning.batting_team,
        bowling_team: inning.bowling_team
      };
      console.log("Using innings structure:", names);
      return names;
    }
    
    // If innings exists but doesn't have team names, check if it has deliveries with team info
    if (inning.deliveries && inning.deliveries.length > 0 && inning.deliveries[0].batting_team) {
      const names = {
        batting_team: inning.deliveries[0].batting_team,
        bowling_team: inning.deliveries[0].bowling_team
      };
      console.log("Using innings deliveries structure:", names);
      return names;
    }
  }
  
  // Case 2: Array of ball-by-ball data
  if (Array.isArray(match) && match.length > 0) {
    // Try to find the first entry with team information
    for (let i = 0; i < Math.min(match.length, 10); i++) {
      if (match[i].batting_team && match[i].bowling_team) {
        const names = {
          batting_team: match[i].batting_team,
          bowling_team: match[i].bowling_team
        };
        console.log("Using array of deliveries:", names);
        return names;
      }
    }
  }
  
  // Case 3: Object with direct team names
  if (match.batting_team && match.bowling_team) {
    const names = {
      batting_team: match.batting_team,
      bowling_team: match.bowling_team
    };
    console.log("Using direct team properties:", names);
    return names;
  }
  
  // Case 4: Legacy object with description
  if (match.description) {
    const desc = match.description;
    // Try different separators
    for (const separator of [' vs ', ' VS ', ' v ']) {
      const parts = desc.split(separator);
      if (parts.length === 2) {
        const names = {
          batting_team: parts[0].trim(),
          bowling_team: parts[1].split(' - ')[0].trim()
        };
        console.log("Using description with separator:", names);
        return names;
      }
    }
    
    // No clear separator found, return the whole description
    console.log("Using description without separator:", desc);
    return {
      batting_team: desc,
      bowling_team: "Unknown"
    };
  }
  
  // Fallback with better debugging
  console.log("No team information found, using fallback", match);
  
  // Try to extract match ID from various potential locations
  let matchId = null;
  if (match && match.match_id) {
    matchId = match.match_id;
  } else if (Array.isArray(match) && match.length > 0 && match[0].match_id) {
    matchId = match[0].match_id;
  }
  
  // If we have a match ID, try to find team names in the match description
  if (matchId && match.description) {
    return {
      batting_team: `Match ${matchId}: ${match.description}`,
      bowling_team: "Teams from description"
    };
  }
  
  return {
    batting_team: matchId ? `Team A (Match ${matchId})` : "Unknown Team",
    bowling_team: matchId ? `Team B (Match ${matchId})` : "Unknown Opponent"
  };
}

// Function to format team names for display
export function formatTeamDisplay(match) {
  // If the match has the new 'match' field, use it directly
  if (match && match.match) {
    console.log("Using match field for display:", match.match);
    return match.match;
  }
  
  // If the match has a description field that includes team details, use it
  if (match && match.description) {
    console.log("Using description field for display:", match.description);
    return match.description;
  }
  
  // Fallback to extracting team names using getTeamNames
  const { batting_team, bowling_team } = getTeamNames(match);
  
  // Clean up team names if they contain match IDs or other noise
  const cleanBattingTeam = batting_team.replace(/^Match \d+: /, '').split(' - ')[0].trim();
  const cleanBowlingTeam = bowling_team.replace(/^Match \d+: /, '').split(' - ')[0].trim();
  
  // Handle special cases
  if (cleanBattingTeam === "Unknown Team" || cleanBowlingTeam === "Unknown Opponent") {
    if (match.match_id) {
      return `Match ${match.match_id}`;
    }
  }
  
  return `${cleanBattingTeam} v ${cleanBowlingTeam}`;
}
