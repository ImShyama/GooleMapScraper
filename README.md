## Google Maps Scraper – Web UI + MongoDB

This project is a full-stack Google Maps leads scraper:

- **Backend (`server/`)**: Node.js, Express, Playwright, MongoDB  
- **Frontend (`client/`)**: React (Vite) with a modern UI  
- **Storage**:  
  - CSV + JSON exports on disk  
  - MongoDB for search history and full scraped rows  

You can search for businesses (for example, `restaurants` in `Birgunj`), view the scraped results in a table, and reopen any previous search from history without scraping again.

---

### 1. Prerequisites

- **Node.js**: v18+ recommended  
- **npm**: comes with Node  
- **MongoDB**:
  - Local instance (`mongodb://127.0.0.1:27017`) **or**
  - MongoDB Atlas cluster (connection string)  
- **Playwright browsers**:
  - Install once inside `server/`:
    ```bash
    cd server
    npx playwright install
    ```

> Scraping uses a real Chromium browser (non-headless) via Playwright, so a desktop environment is required.

---

### 2. Project Structure

```text
GoogleMapScraper/
  README.md           # this file
  package.json        # root helper scripts
  client/             # React UI (Vite)
  server/             # Express API + scraper + exports
    scraper.js        # Google Maps scraping logic (Playwright)
    export.js         # Writes leads.json + leads.csv
    index.js          # Express server + Mongo models + routes
    exports/          # Output CSV/JSON files
```

---

### 3. Backend Setup (`server/`)

1. **Install dependencies**

   ```bash
   cd server
   npm install
   ```

2. **Configure MongoDB**

   Create `server/.env`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/googlemapscraper
   CLIENT_ORIGIN=http://localhost:5173
   ```

   - Change `MONGODB_URI` if you use MongoDB Atlas or a different host.

3. **Install Playwright browsers** (if not already):

   ```bash
   npx playwright install
   ```

4. **Run the backend**

   From the project root:

   ```bash
   npm run server
   ```

   Or directly inside `server/`:

   ```bash
   cd server
   npm start
   ```

   You should see logs like:

   - `Connected to MongoDB`
   - `Server listening on http://localhost:5000`

---

### 4. Frontend Setup (`client/`)

1. **Install dependencies**

   ```bash
   cd client
   npm install
   ```

2. **Run the frontend (Vite dev server)**

   From project root:

   ```bash
   npm run client
   ```

   Or directly:

   ```bash
   cd client
   npm run dev
   ```

   Open the URL Vite prints (typically `http://localhost:5173`).

---

### 5. Root-level Helper Scripts

From the **project root** (`GoogleMapScraper/`):

```bash
# Start Express backend (server/index.js)
npm run server

# Start React frontend (client with Vite)
npm run client
```

Run both commands (in two terminals) to use the app.

---

### 6. How the App Works

#### 6.1 Search

In the UI:

1. Enter **Search query** (e.g. `restaurants`, `dentists`).
2. Enter **Location** (e.g. `Birgunj`, `Delhi`, `New York`).
3. Click **Run search**.

The backend then:

- Builds a full query string, e.g. `"restaurants in Birgunj"`.
- Launches Playwright (Chromium) and goes to Google Maps.
- Scrolls the results list to collect place URLs.
- Opens each place detail page and scrapes fields like:
  - `name`
  - `address`
  - `phone`
  - `website`
  - `rating`
  - `reviews`
  - `hours`
  - `mapsUrl` (direct link to the place on Google Maps)
- **Exports to disk** under `server/exports/`:
  - `leads.json` – full JSON array of all scraped rows
  - `leads.csv` – CSV file with the main columns
- **Stores in MongoDB**:
  - One `SearchHistory` document per search, containing:
    - `query`, `location`, `fullQuery`
    - `resultsCount`
    - `results` (array of all scraped rows)

The frontend then shows:

- A **results header**:
  - `Results for "restaurants in Birgunj"`  
  - A chip indicating e.g. `120 places`
- A **paginated table** (20 rows per page) with columns:
  - Name, Rating, Address, Phone, Website, Maps

#### 6.2 History

On the first row, to the right of the search form:

- A **Search history** panel lists past scrapes:
  - `fullQuery` text
  - `resultsCount`
  - Timestamp

When you click a history entry:

- The frontend calls `GET /api/history/:id`.
- The backend loads the saved document from MongoDB.
- The UI updates the table using the *stored* `results` (no fresh scraping).

---

### 7. API Overview

All APIs are served from the backend (`http://localhost:5000` by default).

- **`POST /api/search`**

  ```json
  // Request body
  {
    "query": "restaurants",
    "location": "Birgunj"
  }
  ```

  ```json
  // Response
  {
    "id": "664d…",          // MongoDB _id for this search
    "fullQuery": "restaurants in Birgunj",
    "results": [ { /* scraped place */ }, ... ]
  }
  ```

- **`GET /api/history`**

  - Returns an array of history items (without the heavy `results` array).

- **`GET /api/history/:id`**

  - Returns a single history document including all `results`.

---

### 8. Expected Output

After running a search such as:

- **Query**: `restaurants`  
- **Location**: `Birgunj`

You will get:

- **On disk (`server/exports/`)**:
  - `leads.json` – full JSON of all scraped restaurants.
  - `leads.csv` – easy to open in Excel or import into your CRM.
- **In MongoDB**:
  - A `SearchHistory` document storing:
    - `fullQuery: "restaurants in Birgunj"`
    - `resultsCount: 120` (example)
    - `results: [ { name, address, phone, website, rating, reviews, hours, mapsUrl }, … ]`
- **In the UI**:
  - A clean table of results with links:
    - `Website` → business website (if present)
    - `Maps` → opens that place in Google Maps
  - A searchable history of previous queries you can reopen any time.

---

### 9. Notes & Troubleshooting

- **CORS**: Backend allows requests from `CLIENT_ORIGIN` (default `http://localhost:5173`).  
  If you change the frontend port or host, update `CLIENT_ORIGIN` in `server/.env`.
- **Playwright timeouts / blocking**:
  - Scraping depends on Google Maps markup and network speed;  
    if pages hang, check the server console for errors.
- **MongoDB connection issues**:
  - If the server exits with `Mongo connection failed`, verify:
    - MongoDB is running.
    - `MONGODB_URI` is correct and accessible.

---

### 10. License

This project is provided under the **ISC** license (see `server/package.json`).

