import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function App() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [selectedHistoryMeta, setSelectedHistoryMeta] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  async function fetchHistory() {
    try {
      const res = await fetch(`${API_BASE}/api/history`);
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  async function handleSearch(e) {
    e?.preventDefault();
    setError("");

    if (!query.trim() || !location.trim()) {
      setError("Please enter both search query and location.");
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedHistoryId(null);
    setSelectedHistoryMeta(null);
    setHistoryOpen(false);
    setCurrentPage(1);

    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), location: location.trim() })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Search failed");
      }

      const data = await res.json();
      const newResults = data.results || [];
      setResults(newResults);
      setCurrentPage(1);
      setSelectedHistoryMeta({ id: data.id, fullQuery: data.fullQuery });
      await fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleHistoryClick(item) {
    setError("");
    setLoading(true);
    setResults([]);
    setSelectedHistoryId(item._id);
    setSelectedHistoryMeta({ id: item._id, fullQuery: item.fullQuery });

    try {
      const res = await fetch(`${API_BASE}/api/history/${item._id}`);
      if (!res.ok) throw new Error("Failed to load history item");
      const data = await res.json();
      const newResults = data.results || [];
      setResults(newResults);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load history item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Google Maps Scraper
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Search places in a location, scrape details, and quickly revisit past
              searches.
            </p>
          </div>
          {/* Dark / light mode toggle temporarily disabled
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium bg-white/60 dark:bg-slate-900/70 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <span className="hidden sm:inline">
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </span>
            <span aria-hidden="true">
              {theme === "dark" ? "🌙" : "☀️"}
            </span>
          </button>
          */}
        </header>

        <main className="space-y-4">
          <section className="w-full">
            <div className="flex items-start justify-between gap-4">
              <form
                onSubmit={handleSearch}
                className="flex-1 max-w-[60%] rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-slate-900/60"
              >
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-end gap-3">
                  <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Search query
                    </label>
                    <input
                      type="text"
                      placeholder='e.g. "restaurants", "dentists"'
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder='e.g. "Delhi", "New York"'
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-wait"
                    >
                      {loading ? "Running..." : "Run search"}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-100">
                    {error}
                  </div>
                )}
              </form>

              <div className="relative flex-shrink-0">
              <button
                type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 shadow-md shadow-slate-300/70 hover:bg-slate-100 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-900/60 dark:hover:bg-slate-800"
                onClick={() => setHistoryOpen(open => !open)}
              >
                  <span className="sr-only">Toggle history</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      className="fill-none stroke-slate-300"
                    />
                    <path
                      d="M12 7v5l3 3"
                      className="fill-none stroke-slate-300"
                    />
                  </svg>
              </button>

              {historyOpen && (
                <div className="absolute right-full mr-4 top-0 z-20 w-80 max-h-[40vh] overflow-y-auto rounded-xl border border-slate-200 bg-white/98 shadow-xl shadow-slate-300/70 dark:border-slate-700 dark:bg-slate-950/95 dark:shadow-slate-900/70">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Search history
                    </span>
                    {history.length > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full border border-slate-400 px-2 py-0.5 text-[10px] text-slate-700 dark:border-slate-600 dark:text-slate-200">
                        {history.length}
                      </span>
                    )}
                  </div>
                  {history.length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                      No history yet. Run a search to get started.
                    </p>
                  )}
                  <ul className="divide-y divide-slate-200 text-xs dark:divide-slate-800">
                    {history.map(item => (
                      <li
                        key={item._id}
                        className={`px-3 py-2 cursor-pointer hover:bg-slate-100 ${
                          selectedHistoryId === item._id
                            ? "bg-slate-100 dark:bg-slate-800/90"
                            : ""
                        }`}
                        onClick={() => handleHistoryClick(item)}
                      >
                        <div className="flex justify-between gap-2">
                          <span className="truncate text-slate-800 dark:text-slate-100">
                            {item.fullQuery}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.resultsCount} results
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-500">
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short"
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-slate-900/40">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {selectedHistoryMeta
                  ? `Results for "${selectedHistoryMeta.fullQuery}"`
                  : "Results"}
              </h2>
              {loading && (
                <span className="inline-flex rounded-full border border-sky-400/70 px-2 py-0.5 text-[11px] text-sky-700 dark:text-sky-300">
                  Scraping...
                </span>
              )}
              {!loading && results.length > 0 && (
                <span className="inline-flex rounded-full border border-slate-400/70 px-2 py-0.5 text-[11px] text-slate-700 dark:border-slate-500/70 dark:text-slate-200">
                  {results.length} places
                </span>
              )}
            </div>

            {results.length === 0 && !loading && (
              <p className="text-xs text-slate-500">
                No results yet. Run a new search or pick one from the history.
              </p>
            )}

            {results.length > 0 && (
              <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
                <table className="w-full border-collapse text-xs text-slate-800 dark:text-slate-100">
                  <thead className="bg-slate-100 text-slate-900 dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-900">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Rating
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Address
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Phone
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Website
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Maps
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .slice(
                        (currentPage - 1) * pageSize,
                        currentPage * pageSize
                      )
                      .map((place, idx) => (
                        <tr
                          key={idx}
                          className={
                            idx % 2 === 0
                              ? "bg-white dark:bg-slate-900"
                              : "bg-slate-50 dark:bg-slate-950/60"
                          }
                        >
                          <td className="px-3 py-2">
                            {place.name || "Unnamed place"}
                          </td>
                          <td className="px-3 py-2">{place.rating || "-"}</td>
                          <td className="px-3 py-2">{place.address || "-"}</td>
                          <td className="px-3 py-2">{place.phone || "-"}</td>
                          <td className="px-3 py-2">
                            {place.website ? (
                              <a
                                href={place.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:underline dark:text-sky-300"
                              >
                                Website
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {place.mapsUrl ? (
                              <a
                                href={place.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:underline dark:text-sky-300"
                              >
                                Maps
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {results.length > pageSize && (
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                    <div>
                      Showing{" "}
                      {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, results.length)} of{" "}
                      {results.length}
                    </div>
                    <div className="space-x-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage(p => Math.max(1, p - 1))
                        }
                        className="rounded-full border border-slate-600 px-2 py-0.5 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        disabled={currentPage * pageSize >= results.length}
                        onClick={() =>
                          setCurrentPage(p =>
                            p * pageSize >= results.length ? p : p + 1
                          )
                        }
                        className="rounded-full border border-slate-600 px-2 py-0.5 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
