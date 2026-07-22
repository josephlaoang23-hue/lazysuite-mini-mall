// Parses a markdown pipe-table (the | col | col | format) out of raw AI output
// and triggers a browser download as a real .csv file — no server involved.

function extractMarkdownTable(rawText: string): string[][] | null {
    const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.startsWith("|"));
    if (lines.length < 2) return null;
  
    // Skip the header-separator row (the |---|---| line)
    const dataLines = lines.filter(l => !/^\|[\s:|-]+\|$/.test(l));
  
    const rows = dataLines.map(line =>
      line
        .split("|")
        .slice(1, -1) // remove empty strings from leading/trailing pipes
        .map(cell => cell.trim())
    );
  
    return rows.length > 0 ? rows : null;
  }
  
  function escapeCsvCell(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  
  export function downloadMarkdownTableAsCsv(rawText: string, filename: string): boolean {
    const rows = extractMarkdownTable(rawText);
    if (!rows) return false;
  
    const csvContent = rows.map(row => row.map(escapeCsvCell).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  
    return true;
  }