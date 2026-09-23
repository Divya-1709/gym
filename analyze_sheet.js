import fs from "fs";

const content = fs.readFileSync("sheet_data.csv", "utf-8");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      row.push(current.trim());
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some((c) => c !== "")) rows.push(row);
  }
  return rows;
}

const rows = parseCSV(content);
const data = rows.slice(1, -1);

const pkgs = new Set();
data.forEach((r) => {
  if (r[2]) {
    r[2].split("\n").forEach((p) => {
      const trimmed = p.trim();
      if (trimmed) pkgs.add(trimmed);
    });
  }
});

console.log("Unique packages count:", pkgs.size);
console.log("Unique individual packages:", Array.from(pkgs));
