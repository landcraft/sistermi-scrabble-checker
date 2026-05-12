# Sistermi's Scrabble Word Checker

A minimalist, high-performance PWA-ready application to check Scrabble words against US (TWL06) and UK (SOWPODS) dictionaries. 

## Tech Stack

- **Backend:** Node.js, Express, SQLite3 (fast, in-memory-like reads)
- **Frontend:** React (PWA-ready)
- **Deployment:** Docker, GitHub Actions CI/CD to GitHub Container Registry (GHCR)

## How It Works

The application downloads the official TWL06 (US) and SOWPODS (UK) dictionary text files during the build process, ingests them into a local SQLite database with proper indexing, and serves a minimal REST API and a React frontend to query them. The SQLite database makes word lookups virtually instantaneous.

## Running Locally (Without Docker)

### 1. Build the Database
First, you need to download the dictionaries and build the SQLite database. From the root directory:

```bash
npm install
node scripts/fetch_words.js
```
This will create a `data/words.db` file.

### 2. Build the Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Start the Server
```bash
npm start
# or manually:
node server.js
```
The application will be available at `http://localhost:3000`.

## Running with Docker

The easiest way to run the application is using Docker Compose. The provided `Dockerfile` uses a multi-stage build to compile the frontend, fetch dictionary data, and serve the app from a lightweight Alpine image.

### 1. Build and Start Locally
To build the image for your local architecture and start the container:
```bash
docker compose up --build -d
```
The application will be available at `http://localhost:3000`.

### 2. Stop the Application
```bash
docker compose down
```

## Deployment (CI/CD)

This project uses GitHub Actions to automate deployments. On every push to the `main` branch, the pipeline:
1.  **Builds** a multi-platform image (`linux/amd64` and `linux/arm64`).
2.  **Pushes** it to the GitHub Container Registry (GHCR).

### Deploying to a Server (e.g., NUC)
To deploy the pre-built image on a remote server:
1.  Copy `docker-compose.yml` to your server.
2.  Run:
    ```bash
    docker compose pull
    docker compose up -d
    ```
Because of the multi-platform build, the same command works seamlessly on both Apple Silicon (ARM) and traditional Intel/AMD (x86) servers.

## API

- `GET /api/check/:dictionary/:word`
  - `dictionary`: `US` or `UK`
  - `word`: The word to check (2-15 letters)
  - **Response:** `{ "word": "HELLO", "dictionary": "US", "isValid": true }`

## License
MIT
