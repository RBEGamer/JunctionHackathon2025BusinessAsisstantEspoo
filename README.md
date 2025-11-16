# ESPI Funding Application Assistant

## Team

## Challenge






## DEMO

https://rbegamer.github.io/JunctionHackathon2025BusinessAsisstantEspoo/

## IDEA

A web-based application assistant that helps users complete funding applications step by step, with progress tracking and intelligent routing between tracks. The application provides a guided experience for startups and entrepreneurs to navigate through various funding opportunities in Finland, including Business Finland grants, Helsinki Startup Grants, and Startup Foundation grants.

## Purpose

The ESPI (Entrepreneurship Support Platform Interface) Backend serves as a comprehensive platform for:

- **Guided Application Process**: Step-by-step assistance for completing complex funding applications
- **Multi-Track Support**: Handles multiple funding tracks with intelligent routing between required and optional sections
- **Progress Tracking**: Visual feedback on application completion status
- **Centralized Configuration**: YAML-based track definitions for easy maintenance and updates
- **Modern Web Interface**: React-based frontend with responsive design and smooth user experience

## Features

- 📋 **Step-by-step question flow** - Answer questions one at a time with a clean, focused interface
- 📊 **Progress tracking** - Visual progress bar showing completion percentage
- 🔄 **Track routing** - Automatically routes users through required tracks and shows available options
- 💾 **Auto-save** - Answers are automatically saved to localStorage
- 🎨 **Modern UI** - Beautiful, responsive design with smooth animations
- 🚂 **Station-based navigation** - Roadmap view showing all stations and tracks
- 📝 **Submission management** - Review and manage application submissions

## Project Structure

```
espi-backend/
├── track_definitons/              # YAML track definitions and routing
│   ├── general/                   # General information tracks
│   │   ├── business_plan_basic.yaml
│   │   └── eligibility_criteria_basic.yaml
│   ├── funding/                   # Funding-specific tracks
│   │   ├── business_finland_yic.yaml
│   │   ├── helsinki_startup_grant.yaml
│   │   └── startup_foundation_individual_grant.yaml
│   ├── finanical/                 # Financial information tracks
│   │   ├── enterprise_form_basic.yaml
│   │   └── numbers_basic.yaml
│   ├── insurance/                 # Insurance-related tracks
│   │   └── insurance_basics.yaml
│   ├── submission/                # Submission configuration
│   │   └── submission.yaml
│   └── track_routing.yaml         # Track routing configuration
├── src_new_interface/             # React frontend source code
│   ├── components/                # React components
│   │   ├── AppointmentScheduling.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DashboardRoadmap.jsx
│   │   ├── FundingQuestionnaire.jsx
│   │   ├── Roadmap.jsx
│   │   ├── StationDetail.jsx
│   │   └── SubmissionsReview.jsx
│   ├── data/                      # Static data files
│   │   ├── stations.js
│   │   └── tracks.js
│   ├── App.jsx                    # Main React application component
│   └── main.jsx                   # React entry point
├── public/                        # Static web files and built assets
│   ├── index.html                 # Legacy HTML interface
│   ├── styles.css                 # Legacy styles
│   ├── app.js                     # Legacy JavaScript
│   └── new-interface/             # Built React application
│       ├── index.html
│       ├── bundle.js              # Bundled React app (built)
│       ├── bundle.js.map          # Source map
│       └── styles.css
├── server.js                      # Express.js server and API
├── package.json                   # Node.js dependencies and scripts
├── Dockerfile                     # Docker container configuration
├── docker-compose.yml             # Docker Compose configuration
├── .dockerignore                  # Docker build exclusions
└── .github/
    └── workflows/
        ├── deploy.yml             # GitHub Actions Docker deployment workflow
        └── pages.yml              # GitHub Actions Pages deployment workflow
```

## Installation

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (optional, for containerized deployment)

### Local Development Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Build the frontend application:
```bash
npm run build:new-interface
```

## Running the Application

### Local Development

Start the server:
```bash
npm start
```

Or use nodemon for development (auto-restart on changes):
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### Docker Deployment

#### Using Docker Compose (Recommended)

Build and start the container:
```bash
docker-compose up --build
```

Run in detached mode:
```bash
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f
```

Stop the container:
```bash
docker-compose down
```

#### Using Docker Directly

Build the image:
```bash
docker build -t espi-backend .
```

Run the container:
```bash
docker run -p 3000:3000 espi-backend
```

The application will be available at: **http://localhost:3000**

### GitHub Actions Deployment

The repository includes a GitHub Actions workflow that automatically builds and deploys the Docker image to GitHub Container Registry (ghcr.io) on every push to the main/master branch.

#### Automatic Deployment

The workflow (`/.github/workflows/deploy.yml`) automatically:
- Builds the Docker image on every push to main/master
- Pushes the image to GitHub Container Registry
- Tags images with branch name, SHA, and semantic versioning
- Uses Docker layer caching for faster builds

#### Using the Deployed Image

After the workflow completes, you can pull and run the image:

```bash
# Pull the latest image
docker pull ghcr.io/YOUR_USERNAME/espi-backend:latest

# Run the container
docker run -p 3000:3000 ghcr.io/YOUR_USERNAME/espi-backend:latest
```

#### Manual Workflow Trigger

You can also manually trigger the workflow from the GitHub Actions tab in your repository.

#### Viewing the Image

The built images are available in your repository's Packages section on GitHub.

### GitHub Pages Deployment

The repository includes a GitHub Actions workflow that automatically builds and deploys the frontend to GitHub Pages on every push to the main/master branch.

#### Setup GitHub Pages

1. Go to your repository Settings → Pages
2. Under "Source", select "GitHub Actions"
3. The workflow will automatically deploy on the next push to main/master

#### Automatic Deployment

The workflow (`/.github/workflows/pages.yml`) automatically:
- Builds the React frontend application
- Deploys it to GitHub Pages
- Makes it available at `https://YOUR_USERNAME.github.io/espi-backend`

#### Accessing the Deployed Site

After the workflow completes, your site will be available at:
```
https://YOUR_USERNAME.github.io/espi-backend/
```

#### Important Notes

⚠️ **API Limitations**: GitHub Pages only serves static files. If your frontend makes API calls to `/api/*` endpoints, those will not work on GitHub Pages. You have two options:

1. **Use static data only**: The React app appears to use static data from `stations.js` and `tracks.js`, so it should work without a backend.

2. **Configure external API**: If you need API functionality, you can:
   - Deploy the backend separately (using Docker, Heroku, Railway, etc.)
   - Configure the frontend to use the external API URL
   - Update API calls to point to your backend server

⚠️ **React Router Basename**: The app currently uses `basename="/new-interface"` in the Router. For GitHub Pages, you may need to update this based on your repository name:
   - If your repo is `username/espi-backend`, GitHub Pages serves at `username.github.io/espi-backend/`
   - Update `basename` in `src_new_interface/App.jsx` to match your repository name, or set it to `"/"` if deploying to a custom domain

#### Manual Workflow Trigger

You can also manually trigger the workflow from the GitHub Actions tab in your repository.

## How It Works

1. **Entry Point**: Users start with the `business_plan_basic` track
2. **Question Flow**: Users answer questions one at a time, with progress tracking
3. **Auto-save**: Answers are saved to localStorage as users type
4. **Track Completion**: When a track is completed, users see available next tracks
5. **Routing**: The system follows the routing configuration to show appropriate next steps
6. **Station Navigation**: Users can navigate through a roadmap of stations and tracks
7. **Submission Review**: Completed applications can be reviewed and managed

## API Endpoints

- `GET /api/routing` - Get track routing configuration
- `GET /api/track/:trackId` - Get a specific track definition
- `GET /api/tracks` - Get all tracks with their configurations
- `GET /api/health` - Health check endpoint

## Track Flow

1. **business_plan_basic** (required)
   ↓
2. **eligibility_criteria_basic** (required)
   ↓
3. User selects from funding tracks:
   - startup_foundation_individual_grant
   - business_finland_yic
   - helsinki_startup_grant
   ↓
4. Additional tracks (financial, insurance, etc.) as needed
   ↓
5. Submission review and completion

## Technologies Used

- **Frontend**: 
  - React 19.2.0
  - React Router DOM 7.9.6
  - Lucide React (icons)
  - ESBuild (bundling)
- **Backend**: 
  - Node.js 20+
  - Express.js 4.18.2
- **Data Format**: YAML (js-yaml)
- **Storage**: localStorage (client-side)
- **Containerization**: Docker, Docker Compose

## Development Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon (auto-restart)
- `npm run build:new-interface` - Build the React frontend with ESBuild

## Future Enhancements

- Backend database for persistent storage
- User authentication and session management
- File upload handling
- Eligibility checking based on answers
- Export functionality for completed applications
- Email notifications
- Multi-language support

## License

ISC
