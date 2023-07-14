import dayjs from "dayjs";

export const isToday = (d: dayjs.ConfigType) => dayjs().isSame(d,'D');
