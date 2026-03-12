require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const scrapeMaps = require("./scraper");
const exportData = require("./export");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  })
);

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/googlemapscraper";
const PORT = process.env.PORT || 5000;

const historySchema = new mongoose.Schema(
  {
    query: { type: String, required: true },
    location: { type: String, default: "" },
    fullQuery: { type: String, required: true },
    resultsCount: { type: Number, required: true },
    // store all scraped rows so they can be re-used from history
    results: { type: [mongoose.Schema.Types.Mixed], required: true }
  },
  { timestamps: true }
);

const SearchHistory = mongoose.model("SearchHistory", historySchema);

async function connectDb() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");
}

app.post("/api/search", async (req, res) => {
  const { query, location } = req.body || {};

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "query is required" });
  }

  const fullQuery = location ? `${query} in ${location}` : query;

  try {
    console.log("Scraping for:", fullQuery);
    const leads = await scrapeMaps(fullQuery);

    console.log(`Found ${leads.length} leads, exporting files...`);
    await exportData(leads);

    const historyItem = await SearchHistory.create({
      query,
      location: location || "",
      fullQuery,
      resultsCount: leads.length,
      results: leads
    });

    res.json({ id: historyItem._id, fullQuery, results: leads });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Failed to run scrape" });
  }
});

app.get("/api/history", async (req, res) => {
  try {
    const items = await SearchHistory.find({})
      .sort({ createdAt: -1 })
      .select({ results: 0 });

    res.json(items);
  } catch (err) {
    console.error("History list error:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

app.get("/api/history/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const item = await SearchHistory.findById(id);
    if (!item) {
      return res.status(404).json({ error: "History item not found" });
    }
    res.json(item);
  } catch (err) {
    console.error("History item error:", err);
    res.status(500).json({ error: "Failed to load history item" });
  }
});

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("Mongo connection failed:", err);
    process.exit(1);
  });
