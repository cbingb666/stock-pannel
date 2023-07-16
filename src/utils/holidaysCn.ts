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

/**
 * 中国节假日
 */
export class HolidaysCn {

  holidaysData: { [key in string]: IHolidaysData[] } = {};

  /** 获取节假日数据 */
  async fetchHolidays(year: number) {
    const url = `https://ghproxy.com/https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${year}.json`;
    const response = await axios.get(url);
    this.holidaysData[year] = response.data.days;
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
    return this.holidaysData[year] ?? await this.fetchHolidays(year);
  }
}

export const holidaysCn = new HolidaysCn();