// Direct data loader function for IPL app
export async function loadMatchesForSeason(season) {
  try {
    // In a real app, this would fetch from an API
    // For direct file access, we'd include a list of match IDs
    const response = await fetch(`/data/${season}/matches.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const matchIds = await response.json();
    return matchIds;
  } catch (error) {
    console.error("Error loading match IDs:", error);
    return [];
  }
}

export async function loadMatchData(season, matchId) {
  try {
    const response = await fetch(`/data/${season}/${matchId}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const ballByBall = await response.json();
    // Process the data to create the required structure
    const innings = {};
    ballByBall.forEach(ball => {
      const inningNum = ball.inning;
      if (!innings[inningNum]) {
        innings[inningNum] = {
          inning: inningNum,
          batting_team: ball.batting_team,
          bowling_team: ball.bowling_team,
          deliveries: []
        };
      }
      innings[inningNum].deliveries.push(ball);
    });
    
    // Sort deliveries within each inning
    Object.values(innings).forEach(inning => {
      inning.deliveries.sort((a, b) => {
        if (a.over !== b.over) return a.over - b.over;
        return a.ball - b.ball;
      });
    });
    
    return {
      match_id: matchId,
      innings: Object.values(innings)
    };
  } catch (error) {
    console.error(`Error loading match ${matchId}:`, error);
    return null;
  }
}
