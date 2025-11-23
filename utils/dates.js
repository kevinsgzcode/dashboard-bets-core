//converts 'YYYY-MM-DD' to 'MM/DD/YYYY'
export function formatDateDisplay(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;

  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;

  const [year, month, day] = parts;

  //Validation
  if (month.length !== 2 || day.length !== 2 || year.length !== 4) {
    return null;
  }

  return `${month}/${day}/${year}`;
}
