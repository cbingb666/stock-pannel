import dayjs from "dayjs";
import { isWeekend, getWeek, yyyyMMdd } from "./time";
import { holidaysCn, IHolidaysData } from "./holidaysCn";

/** 获取最近交易日 */
export interface RecentTradingDay {
  date: string;
  holiday: IHolidaysData | undefined;
  isWeekend: boolean;
  isTradingDay: boolean;
  week: string;
}
export const recentTradingDay = async (days: number) => {
  const result: RecentTradingDay[] = [];
  const today = dayjs();
  let i = 0;

  while (i < days) {
    const day = today.subtract(i, "day");
    const date = yyyyMMdd(day);
    const _isWeekend = isWeekend(day);
    const holiday = await holidaysCn.isHoliday(yyyyMMdd(day));
    const isTradingDay = !_isWeekend && !holiday;
    result.push({
      date,
      holiday,
      isWeekend: _isWeekend,
      isTradingDay,
      week: getWeek(day),
    });

    if (_isWeekend || holiday) {
      days++;
    }
    i++;
  }
  return result;
};
