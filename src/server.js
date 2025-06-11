// server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors'; // To allow requests from your React app
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001; // A port for our server

app.use(cors());

const dataDir = path.join(__dirname, '..', 'data');

// API Endpoint 1: Get all available seasons
app.get('/api/seasons', (req, res) => {
    // Reads the directories inside the 'data' folder (e.g., "2008", "2023")
    fs.readdir(dataDir, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error('Error reading seasons directory:', err);
            return res.status(500).json({ error: 'Failed to read seasons' });
        }
        const seasons = files
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        console.log(`Found ${seasons.length} seasons`);
        res.json(seasons);
    });
});

// API Endpoint 2: Get all matches for a given season
app.get('/api/matches/:season', (req, res) => {
    const season = req.params.season;
    const seasonDir = path.join(dataDir, season);
    
    // Check if directory exists
    if (!fs.existsSync(seasonDir)) {
        console.error(`Season directory not found: ${season}`);
        return res.status(404).json({ error: 'Season not found' });
    }
    
    fs.readdir(seasonDir, (err, files) => {
        if (err) {
            console.error(`Error reading season directory ${season}:`, err);
            return res.status(500).json({ error: 'Failed to read matches' });
        }
        
        // Read match data from each file to get proper match names
        const matchPromises = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const matchId = path.basename(file, '.json');
                const filePath = path.join(seasonDir, file);
                
                return new Promise((resolve) => {
                    fs.readFile(filePath, 'utf8', (err, data) => {
                        // Default match object with fallback description
                        let match = {
                            match_id: matchId,
                            description: `Match ${matchId} (Season ${season})`
                        };
                        
                        if (!err) {
                            try {
                                const matchData = JSON.parse(data);
                                
                                // Check if match has a direct "match" field with team names
                                if (matchData && typeof matchData === 'object' && matchData.match) {
                                    match.match = `${matchData.match} (${matchId})`;
                                }
                                // If no direct match field but has deliveries with team information
                                else if (matchData.deliveries && Array.isArray(matchData.deliveries) && matchData.deliveries.length > 0) {
                                    const delivery = matchData.deliveries.find(d => d.batting_team && d.bowling_team);
                                    if (delivery) {
                                        match.match = `${delivery.batting_team} vs ${delivery.bowling_team} (${matchId})`;
                                    }
                                }
                                // If it's an array of deliveries (old format)
                                else if (Array.isArray(matchData) && matchData.length > 0) {
                                    const delivery = matchData.find(d => d.batting_team && d.bowling_team);
                                    if (delivery) {
                                        match.match = `${delivery.batting_team} vs ${delivery.bowling_team} (${matchId})`;
                                    }
                                }
                                
                                // If still no match name, check if this is cricsheet format with "info" section
                                if (!match.match && matchData && matchData.info && matchData.info.teams) {
                                    match.match = `${matchData.info.teams[0]} vs ${matchData.info.teams[1]} (${matchId})`;
                                }
                                
                                // If we still don't have a match name, use the description as fallback
                                if (!match.match) {
                                    match.match = match.description;
                                }
                            } catch (parseErr) {
                                console.error(`Error parsing match ${matchId}:`, parseErr);
                            }
                        }
                        
                        resolve(match);
                    });
                });
            });
              
        // Wait for all match information to be processed
        Promise.all(matchPromises)
            .then(matches => {
                console.log(`Found ${matches.length} matches for season ${season}`);
                res.json(matches);
            })
            .catch(err => {
                console.error(`Error processing matches for season ${season}:`, err);
                res.status(500).json({ error: 'Failed to process matches' });
            });
    });
});

// API Endpoint 3: Get the data for a specific match
app.get('/api/data/:season/:match_id', (req, res) => {
    const season = req.params.season;
    const matchId = req.params.match_id;
    const filePath = path.join(dataDir, season, `${matchId}.json`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error(`Match file not found: Season ${season}, Match ID ${matchId}`);
        return res.status(404).json({ error: 'Match data not found' });
    }
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading match file: Season ${season}, Match ID ${matchId}`, err);
            return res.status(500).json({ error: 'Failed to read match data' });
        }
        
        try {
            const matchData = JSON.parse(data);
            console.log(`Successfully served data for match ${matchId} from season ${season}`);
            res.json(matchData);
        } catch (parseErr) {
            console.error(`Error parsing JSON for match ${matchId}:`, parseErr);
            return res.status(500).json({ error: 'Invalid match data format' });
        }
    });
});

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong' });
});

// 404 handler for undefined routes
app.use((req, res) => {
    console.log(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Data directory: ${dataDir}`);
});