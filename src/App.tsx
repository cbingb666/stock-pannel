import { useEffect, useRef, useState } from "react";
import style from "./App.module.less";
import { Table } from "antd";
import dayjs from "dayjs";
import { IconFont } from "./components/Iconfont/Iconfont";
import {
  getIndexZhAHistMinEm,
  getKlineFromXgb,
  getRiseCountFromXgb,
} from "./api";
import { RecentTradingDay, recentTradingDay } from "./utils/stock";
import {
  hhMM,
  isToday,
  unix2posix,
  yyyyMMdd,
  yyyyMMddHHmmss,
} from "./utils/time";
import { INDEX_CODES, marketPreffix, marketSuffix } from "./constants/stock";
import Big from "big.js";
import classnames from "classnames";
import { setInterval, clearInterval } from "worker-timers";
import { marketCode } from "./utils/code";
import { IMarketIndicatorData } from "./api/index.types";
import _ from "lodash";

/** 分时数据 */
type TimeSegment = {
  /** 成交额 */
  turnover?: number;
  /** 上涨家数 */
  rise_count?: number;
};

interface IData {
  day: RecentTradingDay;
  timeSegments: TimeSegment[];
}

interface TurnoverData {
  turnover_value: number;
  tick_at: number;
  date: string;
}

// 获取最近交易日天数
const RECENT_TRADING_DAY = 10;

// 时间分段
const TIME_SEGMENT = [
  "09:25",
  "09:35",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "14:30",
  "15:00",
] as const;

// 末日时间
const DOOMSDAY_TIME = '20990101'

// 获取涨跌数颜色
function getRiseCountColor(rise_count?: number) {
  let color = "";
  if (rise_count !== undefined && rise_count !== null) {
    if (rise_count <= 1000) {
      color = style.low;
    } else if (rise_count >= 3000) {
      color = style.high;
    }
  }
  return color;
}

// 自动占空符
function autoEmptySymbol(value?: number | string) {
  return value ?? "-";
}

// ICON 今日
const IconToday = () => {
  return (
    <IconFont
      className={style.icon}
      type="icon-jintian"
      style={{ fontSize: "20px" }}
    ></IconFont>
  );
};

// 时间段 Column
const TimeSegmentColumns = TIME_SEGMENT.map((time, index) => ({
  title: time,
  dataIndex: "timeSegments",
  key: time,
  className: style.time,
  render: (timeSegments?: TimeSegment[]) => {
    let info = timeSegments?.[index];
    let color = getRiseCountColor(info?.rise_count);
    return (
      <>
        <div className={classnames(style.riseCount, color)}>
          {autoEmptySymbol(info?.rise_count)}
        </div>
        <div className={style.turnover}>{autoEmptySymbol(info?.turnover)}</div>
      </>
    );
  },
}));

// 日期 Column
const DateColumn = {
  title: "日期",
  dataIndex: "day",
  key: "day",
  width: "160px",
  render: (day: RecentTradingDay) => {
    return (
      <>
        <div className={style.date}>
          {day.date}
          {isToday(day.date) ? <IconToday></IconToday> : <></>}
        </div>
        <div>{day.week}</div>
      </>
    );
  },
};

// Column
const columns = [DateColumn, ...TimeSegmentColumns];

function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IData[]>([]);
  const renderedRef = useRef(false);
  const timer = useRef<any>(null);

  /** 合计成交额 */
  const calculateTotalTurnover = (
    data: TurnoverData[],
    startDate: dayjs.ConfigType,
    endDate: dayjs.ConfigType
  ): number => {
    const startUnix = dayjs(startDate).unix();
    const endUnix = dayjs(endDate).unix();

    let total = new Big(0);
    for (const item of data) {
      const itemUnix = item.tick_at;
      if (itemUnix >= startUnix && itemUnix <= endUnix) {
        total = total.add(item.turnover_value);
      }
    }

    return total.div(10e7).toNumber();
  };

  /** 定时刷新 */
  const refreshAtIntervals = async (dates: RecentTradingDay[]) => {
    let refreshTime = Date.now();
    timer.current = setInterval(() => {
      const timeSegments = TIME_SEGMENT.map((time) =>
        dayjs(`${yyyyMMdd(dayjs())} ${time}`).valueOf()
      ).filter((time) => time > refreshTime);
      const nextRreshTime = timeSegments.find(
        (time) => Date.now() >= time + 30000
      );
      if (nextRreshTime) {
        console.log("refresh");
        refreshTime = nextRreshTime;
        fetchTimeSegmentData(dates);
      }
    }, 60);
  };

  /** 获取近期交易日 */
  const fetchRecentTradingDay = async () => {
    const res = await recentTradingDay(RECENT_TRADING_DAY);
    return res.filter((item) => item.isTradingDay);
  };

  /** 获取单日涨家数 */
  const fetchRiseCount = async (date: dayjs.ConfigType) => {
    const res = await getRiseCountFromXgb(yyyyMMdd(date));
    return res.data.data
      .filter((item) => {
        return TIME_SEGMENT.includes(hhMM(unix2posix(item.timestamp)) as any);
      })
      .map((i) => i.rise_count);
  };

  /** 获取跌家数 */
  const fetchRiseCountInRange = (dates: RecentTradingDay[]) =>
    Promise.all(dates.map((date) => fetchRiseCount(date.date)));

  /** 获取交易额 - 选股宝 */
  const fetchTurnoverFromXbg = async (code: string) => {
    code = marketSuffix(code)
    const res = await getKlineFromXgb({ prod_code: [code] });
    const data = res.data.data;
    const line = _.map(
      data.candle[code].lines,
      (item) => _.zipObject(data.fields, item) as unknown as TurnoverData
    );
    return line;
  };

  /** 获取交易额 - 东方财富 */
  const fetchTurnoverFromEm = async (code: string) => {
    const data = await getIndexZhAHistMinEm({
      code: marketPreffix(code),
      period: 5,
      start_date: "0",
      end_date: DOOMSDAY_TIME,
    });
    return data.map(item => {
      return {
        turnover_value: item.cje,
        tick_at: dayjs(item.date).unix(),
        date: item.date
      } as unknown as TurnoverData
    })
  };

  /** 获取交易额 */
  const fetchTurnover = async (dates: RecentTradingDay[]) => {
    const lines = await Promise.all(
      [INDEX_CODES.SH, INDEX_CODES.SZ].map(async (code) => {
        // return fetchTurnoverFromXbg(code);
        return fetchTurnoverFromEm(code)
      })
    );

    // 日
    const d = dates.map((date) => {
      // 分时
      return TIME_SEGMENT.map((time) => {
        const start = dayjs(`${date.date} 09:00`);
        const end = dayjs(`${date.date} ${time}`);

        if (end.unix() > dayjs().unix()) {
          return undefined;
        }

        // 指数
        return Number(
          lines
            .reduce((acc, cur) => {
              const val = calculateTotalTurnover(cur, start, end);
              acc = acc.add(val);
              return acc;
            }, new Big(0))
            .toFixed(0)
        );
      });
    });
    return d;
  };

  /** 渲染日历 */
  const renderTradingDay = (
    tradingDays: RecentTradingDay[],
    riseCountData?: (number | undefined)[][],
    turnoverData?: (number | undefined)[][]
  ) => {
    const data = tradingDays.map((day, dateIndex) => {
      return {
        key: day.date,
        day: day,
        timeSegments: TIME_SEGMENT.map((_, timeIndex) => {
          return {
            rise_count: riseCountData?.[dateIndex][timeIndex],
            turnover: turnoverData?.[dateIndex][timeIndex],
          };
        }),
      };
    });
    return setData(data);
  };

  /** 获取分时数据 */
  const fetchTimeSegmentData = async (tradingDays: RecentTradingDay[]) => {
    const riseCountData = await fetchRiseCountInRange(tradingDays);
    renderTradingDay(tradingDays, riseCountData);

    const turnoverData = await fetchTurnover(tradingDays);
    renderTradingDay(tradingDays, riseCountData, turnoverData);
  };

  useEffect(() => {
    if (renderedRef.current) return;
    renderedRef.current = true;

    (async () => {
      setLoading(true);

      const tradingDay = await fetchRecentTradingDay();
      renderTradingDay(tradingDay);

      await fetchTimeSegmentData(tradingDay);

      setLoading(false);

      refreshAtIntervals(tradingDay);
    })();
    return () => {
      timer.current && clearInterval(timer.current);
    };
  }, []);

  return (
    <div className={style.container}>
      <Table
        dataSource={data}
        columns={columns}
        pagination={false}
        loading={loading}
        sticky
      ></Table>
    </div>
  );
}

export default App;
