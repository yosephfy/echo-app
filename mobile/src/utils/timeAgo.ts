export type TimeAgoFormat = "short" | "medium" | "long";

export function timeAgo(
  dateString: string,
  format: TimeAgoFormat = "short"
): string {
  const then = new Date(dateString);
  const now = new Date();
  const diffMs =
    now.getTime() - then.getTime() + now.getTimezoneOffset() * 60 * 1000;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let value: number;
  let unit: string;

  if (years >= 1) {
    value = years;
    unit = "year";
  } else if (months >= 1) {
    value = months;
    unit = "month";
  } else if (weeks >= 1) {
    value = weeks;
    unit = "week";
  } else if (days >= 1) {
    value = days;
    unit = "day";
  } else if (hours >= 1) {
    value = hours;
    unit = "hour";
  } else if (minutes >= 1) {
    value = minutes;
    unit = "minute";
  } else {
    value = seconds;
    unit = "second";
  }

  const plural = value === 1 ? "" : "s";

  switch (format) {
    case "long":
      return `${value} ${unit}${plural} ago`;
    case "medium":
      return `${value} ${unit}${plural}`;
    case "short":
    default:
      const shortMap: Record<string, string> = {
        year: "y",
        month: "mo",
        week: "w",
        day: "d",
        hour: "h",
        minute: "m",
        second: "s",
      };
      return `${value}${shortMap[unit]}`;
  }
}
