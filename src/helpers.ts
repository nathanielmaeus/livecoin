export function round(value: number, withK: boolean): number | string {
  if (withK) {
    return `${Math.round(value / 1000)}k`;
  }
  return Math.round(value * 100) / 100;
}

export function parseDate(): string {
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, "0");
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const year = currentDate.getFullYear();

  return `${day}-${month}-${year}`;
}
