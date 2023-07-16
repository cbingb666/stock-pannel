import dayjs from "dayjs";

/** 是否今日 */
export const isToday = (d: dayjs.ConfigType) => dayjs().isSame(d, "D");

/** 是否相同一天 */
export const isSameDay = (d1: dayjs.ConfigType, d2: dayjs.ConfigType) =>
  dayjs(d1).isSame(d2, "D");

// 获取中文星期
export const getWeek = (d: dayjs.ConfigType) => {
  const day = dayjs(d).day();
  const weeks = ["日", "一", "二", "三", "四", "五", "六"];
  return "星期" + weeks[day];
};

/** 是否周末 */
export const isWeekend = (d: dayjs.ConfigType) => {
  const day = dayjs(d);
  return day.day() === 0 || day.day() === 6;
};

/** 格式化日期 yyyyMMdd */
export const yyyyMMdd = (d: dayjs.ConfigType) => dayjs(d).format("YYYY-MM-DD");

/** 格式化日期 yyyyMMddHHmmss */
export const yyyyMMddHHmmss = (d: dayjs.ConfigType) =>
  dayjs(d).format("YYYY-MM-DD HH:mm:ss");

/** unix to posix */
export const unix2posix = (d: number) => d * 1000;

/** 格式化日期 hhMM */
export const hhMM = (d: dayjs.ConfigType) => dayjs(d).format("HH:mm");


export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));