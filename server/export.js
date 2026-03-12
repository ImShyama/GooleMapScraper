const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

async function exportData(data) {
  if (!fs.existsSync("./exports")) {
    fs.mkdirSync("./exports");
  }

  fs.writeFileSync("./exports/leads.json", JSON.stringify(data, null, 2));

  const csvWriter = createCsvWriter({
    path: "./exports/leads.csv",
    header: [
      { id: "name", title: "Name" },
      { id: "rating", title: "Rating" },
      { id: "address", title: "Address" },
      { id: "phone", title: "Phone" },
      { id: "website", title: "Website" },
      { id: "url", title: "Maps URL" }
    ]
  });

  await csvWriter.writeRecords(data);

  console.log("Export complete");
}

module.exports = exportData;
