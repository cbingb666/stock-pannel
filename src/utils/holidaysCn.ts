import axios from "axios";
import dayjs from "dayjs";
import { isSameDay } from "./time";

export type IHolidaysData = {
  /** 节假日名称 */
  name: string;
  /** 日期 1997-01-01 */
  date: string;
  /** 是否休息日 */
  isOffDay: boolean;
};

const HOLIDAYS_KEY = "holidays";

/**
 * 中国节假日
 */
export class HolidaysCn {
  holidaysData: { [key in string]: IHolidaysData[] } = {};

  cacheLocalKey(year: number) {
    return `${HOLIDAYS_KEY}_${year}`;
  }

  setCacheLocalData(year: number, data: any) {
    localStorage.setItem(this.cacheLocalKey(year), JSON.stringify(data));
  }

  getCacheLocalData(year: number) {
    const data = localStorage.getItem(this.cacheLocalKey(year));
    return data ? JSON.parse(data) : data;
  }

  /** 获取节假日数据 */
  async fetchHolidays(year: number, cache = true) {
    if (cache) {
      const cacheData = this.getCacheLocalData(year);
      if (cacheData) {
        this.holidaysData[year] = cacheData;
        return this.holidaysData[year];
      }
    }

    const url = `https://ghproxy.com/https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${year}.json`;
    const response = await axios.get(url);
    const days = response?.data?.days;
    this.holidaysData[year] = days;
    this.setCacheLocalData(year, days);
    return this.holidaysData[year];
  }

  /** 判断是否节假日 */
  async isHoliday(date: dayjs.ConfigType) {
    const year = dayjs(date).year();
    if (!this.holidaysData[year]) {
      await this.fetchHolidays(year);
    }

    const holiday = this.holidaysData[year].find((item) =>
      isSameDay(item.date, date)
    );

    return holiday;
  }

  /** 获取指定年份节假日 */
  async getHoliday(year: number) {
    return this.holidaysData[year] ?? (await this.fetchHolidays(year));
  }
}

export const holidaysCn = new HolidaysCn();
