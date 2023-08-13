import { useEffect, useRef, useState } from "react";
import style from "./App.module.less";
import { Table } from "antd";
import dayjs from "dayjs";
import { IconFont } from "./components/Iconfont/Iconfont";
import { getKline, getMarketIndicatorData } from "./api";
import { RecentTradingDay, recentTradingDay } from "./utils/stock";
import {
  hhMM,
  isToday,
  unix2posix,
  yyyyMMdd,
  yyyyMMddHHmmss,
} from "./utils/time";
import { INDEX_CODES } from "./constants/stock";
import Big from "big.js";
import classnames from "classnames";
import { setInterval, clearInterval } from "worker-timers";

/** 分时数据 */
type TimeSegment = {
  /** 成交额 */
  turnover: number;
  /** 上涨家数 */
  rise_count: number;
};

interface IData {
  date: RecentTradingDay;
  "09:25": TimeSegment;
  "09:31": TimeSegment;
  "10:00": TimeSegment;
  "11:00": TimeSegment;
  "13:00": TimeSegment;
  "14:00": TimeSegment;
  "15:00": TimeSegment;
}

// 时间分段
const TIME_SEGMENT = [
  "09:25",
  "09:31",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "14:10",
  "15:00",
] as const;

// 时间段 Column
const TimeSegmentColumns = TIME_SEGMENT.map((time) => ({
  title: time,
  dataIndex: time,
  key: time,
  className: style.time,
  render: (info?: TimeSegment) => {
    let color = "";
    if (info?.rise_count !== undefined) {
      if (info.rise_count <= 1000) {
        color = style.low;
      } else if (info.rise_count >= 3000) {
        color = style.high;
      }
    }

    return (
      <>
        <div className={classnames(style.riseCount, color)}>
          {info?.rise_count ?? "-"}
        </div>
        <div className={style.turnover}>{info?.turnover ?? "-"}</div>
      </>
    );
  },
}));

// 日期 Column
const DateColumn = {
  title: "日期",
  dataIndex: "date",
  key: "date",
  width: "160px",
  render: (date: RecentTradingDay) => {
    return (
      <>
        <div className={style.date}>
          {date.date}
          {isToday(date.date) ? (
            <IconFont
              className={style.icon}
              type="icon-jintian"
              style={{ fontSize: "20px" }}
            ></IconFont>
          ) : (
            <></>
          )}
        </div>
        <div>{date.week}</div>
      </>
    );
  },
};
const columns = [DateColumn, ...TimeSegmentColumns];

interface DataItem {
  turnover_value: number;
  tick_at: number;
  date: string;
}

function App() {
  /** 获取近期交易日 */
  const fetchRecentTradingDay = async () => {
    const NEET_RECENT_TRADING_DAY = 10;
    const res = await recentTradingDay(NEET_RECENT_TRADING_DAY);
    return res.filter((item) => item.isTradingDay);
  };

  /** 获取涨跌家数 */
  const fetchFallRiseCount = async (date: dayjs.ConfigType) => {
    const res = await getMarketIndicatorData(yyyyMMdd(date));
    return res.data.data.filter((item) => {
      return TIME_SEGMENT.includes(hhMM(unix2posix(item.timestamp)) as any);
    });
  };

  const groupByDate = (data: DataItem[]): Record<string, DataItem[]> => {
    const groups: Record<string, DataItem[]> = {};

    for (const item of data) {
      const date = item.date.split(" ")[0];

      if (date in groups) {
        groups[date].push(item);
      } else {
        groups[date] = [item];
      }
    }

    return groups;
  };

  const calculateTotalTurnover = (
    data: DataItem[],
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

  const fetchInitData = async (dates: RecentTradingDay[]) => {
    const kLinePromise = getKline({
      prod_code: `${INDEX_CODES.SZ},${INDEX_CODES.SH}`,
    });

    const fallRisePromises = dates.map((date) => fetchFallRiseCount(date.date));

    const [kLineRes, fallRiseCounts] = await Promise.all([
      kLinePromise,
      Promise.all(fallRisePromises),
    ]);

    const turnoverValueLineSZ = groupByDate(
      kLineRes.data.data.candle[INDEX_CODES.SZ].lines
        .map((item) => {
          return kLineRes.data.data.fields.reduce((acc, cur, index) => {
            acc[cur] = item[index];
            return acc;
          }, {} as any);
        })
        .map((item) => {
          item.date = yyyyMMddHHmmss(unix2posix(item.tick_at));
          return item;
        })
    );

    const turnoverValueLineSH = groupByDate(
      kLineRes.data.data.candle[INDEX_CODES.SH].lines
        .map((item) => {
          return kLineRes.data.data.fields.reduce((acc, cur, index) => {
            acc[cur] = item[index];
            return acc;
          }, {} as any);
        })
        .map((item) => {
          item.date = yyyyMMddHHmmss(unix2posix(item.tick_at));
          return item;
        })
    );

    const res = dates.map((date, index) => {
      const fallRise = fallRiseCounts[index];

      const item = {
        key: date.date,
        date,
        ...TIME_SEGMENT.reduce((acc, cur, index) => {
          const todayStartDay = dayjs(`${date.date} 09:00`);
          const curDay = dayjs(`${date.date} ${cur}`);
          const szTurnoverValue = turnoverValueLineSZ[date.date]
            ? calculateTotalTurnover(
                turnoverValueLineSZ[date.date],
                todayStartDay,
                curDay
              )
            : undefined;

          const shTurnoverValue = turnoverValueLineSH[date.date]
            ? calculateTotalTurnover(
                turnoverValueLineSH[date.date],
                todayStartDay,
                curDay
              )
            : undefined;
          const turnover =
            szTurnoverValue && shTurnoverValue
              ? new Big(szTurnoverValue).add(shTurnoverValue).toFixed(0)
              : undefined;

          const rise_count = fallRise?.find((item) => {
            const timestamp = unix2posix(item.timestamp);
            return timestamp === dayjs(`${date.date} ${cur}`).valueOf();
          })?.rise_count;

          acc[cur] = {
            rise_count,
            turnover: curDay.valueOf() > Date.now() ? undefined : turnover,
          };
          return acc;
        }, {} as any),
      };
      return item;
    });

    setData(res);
  };

  /** 定时刷新 */
  let timer = useRef<any>(null);
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
        fetchInitData(dates);
      }
    }, 60);
  };

  const [loading, setLoading] = useState(false);

  const renderRef = useRef(false);
  useEffect(() => {
    if (renderRef.current) return;
    renderRef.current = true;

    (async () => {
      setLoading(true);
      const dates = await fetchRecentTradingDay();
      await fetchInitData(dates);
      setLoading(false);
      refreshAtIntervals(dates);
    })();
    return () => {
      timer.current && clearInterval(timer.current);
    };
  }, []);

  const [data, setData] = useState<IData[]>([]);

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
