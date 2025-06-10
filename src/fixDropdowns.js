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
    return { batting_team: "Unknown", bowling_team: "Unknown" };
  }
  
  // Case 1: Object with innings array
  if (match.innings && match.innings[0]) {
    return {
      batting_team: match.innings[0].batting_team,
      bowling_team: match.innings[0].bowling_team
    };
  }
  
  // Case 2: Array of ball-by-ball data
  if (Array.isArray(match) && match.length > 0 && match[0].batting_team) {
    return {
      batting_team: match[0].batting_team,
      bowling_team: match[0].bowling_team
    };
  }
  
  // Case 3: Object with direct team names
  if (match.batting_team && match.bowling_team) {
    return {
      batting_team: match.batting_team,
      bowling_team: match.bowling_team
    };
  }
  
  // Case 4: Legacy object with description
  if (match.description) {
    const desc = match.description;
    // Try different separators
    for (const separator of [' vs ', ' VS ', ' v ']) {
      const parts = desc.split(separator);
      if (parts.length === 2) {
        return {
          batting_team: parts[0].trim(),
          bowling_team: parts[1].split(' - ')[0].trim()
        };
      }
    }
    
    // No clear separator found, return the whole description
    return {
      batting_team: desc,
      bowling_team: "Unknown"
    };
  }
  
  // Fallback
  return {
    batting_team: "Team 1",
    bowling_team: "Team 2"
  };
}

// Function to format team names for display
export function formatTeamDisplay(match) {
  const { batting_team, bowling_team } = getTeamNames(match);
  return `${batting_team} v ${bowling_team}`;
}
