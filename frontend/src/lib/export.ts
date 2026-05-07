// Utility functions for exporting data

export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn("No data provided to export");
    return;
  }

  // Generate Headers
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add Header Row
  csvRows.push(headers.join(","));

  // Add Data Rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape quotes and stringify
      const escaped = (val !== null && val !== undefined ? String(val) : "").replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  // Create Data URI with BOM for Excel compatibility
  const csvContent = "\uFEFF" + csvRows.join("\n");
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  
  // Create Download Link
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const finalFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute("download", finalFilename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
