// utils/date.js

//Convert "YYYY-MM-DD" → "MM/DD/YYYY"
export function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
}
