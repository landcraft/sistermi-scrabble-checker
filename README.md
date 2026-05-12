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

You can easily run the entire stack using Docker Compose. The Dockerfile uses a multi-stage build to compile the frontend, fetch the dictionary data, and prepare a minimal production image.

```bash
# Build and start the container
docker-compose up --build -d
```
The application will be available at `http://localhost:3000`.

## Deployment

The project is configured with GitHub Actions. On every push to the `main` branch, the CI/CD pipeline will automatically:
1. Build the Docker image.
2. Push it to the GitHub Container Registry (`ghcr.io`).

You can then deploy it on any server (e.g., a local NUC) by running:
```bash
docker pull ghcr.io/<your-username>/sistermi-scrabble-checker:latest
docker run -d -p 3000:3000 --name scrabble-checker --restart unless-stopped ghcr.io/<your-username>/sistermi-scrabble-checker:latest
```
*(Or use the provided `docker-compose.yml` on your server).*

## API

- `GET /api/check/:dictionary/:word`
  - `dictionary`: `US` or `UK`
  - `word`: The word to check (2-15 letters)
  - **Response:** `{ "word": "HELLO", "dictionary": "US", "isValid": true }`

## License
MIT
