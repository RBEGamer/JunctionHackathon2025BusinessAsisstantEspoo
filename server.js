const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve YAML files as JSON
async function loadYAMLFile(filePath) {
    try {
        // Handle relative paths (../submission/submission.yaml) and absolute paths
        let fullPath;
        if (filePath.startsWith('../')) {
            // Path goes up from track_definitons, resolve from project root
            fullPath = path.join(__dirname, filePath);
        } else {
            // Path is relative to track_definitons folder
            fullPath = path.join(__dirname, 'track_definitons', filePath);
        }
        const fileContents = await fs.readFile(fullPath, 'utf8');
        return yaml.load(fileContents);
    } catch (error) {
        console.error(`Error loading YAML file ${filePath}:`, error);
        throw error;
    }
}

// API Routes

// Get routing configuration
app.get('/api/routing', async (req, res) => {
    try {
        const routing = await loadYAMLFile('track_routing.yaml');
        res.json(routing);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load routing configuration' });
    }
});

// Get track by ID
app.get('/api/track/:trackId', async (req, res) => {
    try {
        const { trackId } = req.params;
        
        // Load routing to find track file
        const routing = await loadYAMLFile('track_routing.yaml');
        const trackConfig = routing.routing.find(r => r.track_id === trackId);
        
        if (!trackConfig) {
            return res.status(404).json({ error: 'Track not found' });
        }
        
        // Load track YAML file
        const trackData = await loadYAMLFile(trackConfig.file);
        res.json(trackData);
    } catch (error) {
        console.error('Error loading track:', error);
        res.status(500).json({ error: 'Failed to load track' });
    }
});

// Get all tracks
app.get('/api/tracks', async (req, res) => {
    try {
        const routing = await loadYAMLFile('track_routing.yaml');
        const tracks = [];
        
        for (const trackConfig of routing.routing) {
            try {
                const trackData = await loadYAMLFile(trackConfig.file);
                tracks.push({
                    id: trackConfig.track_id,
                    config: trackConfig,
                    data: trackData
                });
            } catch (error) {
                console.error(`Error loading track ${trackConfig.track_id}:`, error);
            }
        }
        
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load tracks' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ESPI Backend server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from ./public`);
    console.log(`📋 Loading track definitions from ./track_definitons`);
});

