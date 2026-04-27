function formatDateISO(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function getWeekBounds(dateValue = new Date()) {
  const date = new Date(dateValue);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diffToMonday));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    start: formatDateISO(start),
    end: formatDateISO(end)
  };
}

function getMonthBounds(dateValue = new Date()) {
  const date = new Date(dateValue);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

  return {
    start: formatDateISO(start),
    end: formatDateISO(end)
  };
}

function isWithinRange(dateString, start, end) {
  return dateString >= start && dateString <= end;
}

module.exports = {
  formatDateISO,
  getWeekBounds,
  getMonthBounds,
  isWithinRange
};