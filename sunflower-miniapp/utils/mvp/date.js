function pad(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

function formatDate(input) {
  const date = input instanceof Date ? input : new Date(input);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(dateStr) {
  const [year, month, day] = `${dateStr}`.split('-').map((value) => Number(value));
  return new Date(year, month - 1, day);
}

function addDays(dateInput, days) {
  const date = dateInput instanceof Date ? new Date(dateInput) : parseDate(dateInput);
  date.setDate(date.getDate() + days);
  return date;
}

function diffDays(startDate, endDate) {
  const start = startDate instanceof Date ? startDate : parseDate(startDate);
  const end = endDate instanceof Date ? endDate : parseDate(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

function getDefaultBookingDate() {
  const checkIn = addDays(new Date(), 1);
  const checkOut = addDays(checkIn, 1);
  return {
    checkIn: formatDate(checkIn),
    checkOut: formatDate(checkOut),
  };
}

function toWeekdayLabel(dateInput) {
  const date = dateInput instanceof Date ? dateInput : parseDate(dateInput);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `周${weekdays[date.getDay()]}`;
}

module.exports = {
  addDays,
  diffDays,
  formatDate,
  getDefaultBookingDate,
  parseDate,
  toWeekdayLabel,
};
