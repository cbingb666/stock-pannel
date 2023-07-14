import { useState } from "react";
import style from "./App.module.less";
import { Table } from "antd";
import dayjs from "dayjs";
import { IconFont } from "./components/Iconfont/Iconfont";
import { isToday } from "./utils/time";

type TimeSegment = {
  turnover: number;
  upCount: number;
};

// 时间分段
const TIME_SEGMENT = [
  "9:25",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
] as const;

// 时间段 Column
const TimeSegmentColumns = TIME_SEGMENT.map((time) => ({
  title: time,
  dataIndex: time,
  key: time,
  className: style.time,
  render: (info?: TimeSegment) => {
    return (
      <>
        <div className={style.upCount}>
          {/* <IconFont type="icon-17home"></IconFont> */}
          {info?.upCount}
        </div>
        <div className={style.turnover}>
          {/* <IconFont type="icon-money"></IconFont> */}
          {info?.turnover}
        </div>
      </>
    );
  },
}));

// 日期 Column
const DateColumn = {
  title: "日期",
  dataIndex: "date",
  key: "date",
  width: '150px',
  render: (date: string) => {
    return (
      <div className={style.date}>
        {date}
        {isToday(date) ? (
          <IconFont
            className={style.icon}
            type="icon-jintian"
            style={{ fontSize: "20px" }}
          ></IconFont>
        ) : (
          <></>
        )}
      </div>
    );
  },
};
const columns = [DateColumn, ...TimeSegmentColumns];

function App() {
  // 获取当前日期
  const today = dayjs();

  // 构建一个包含最近 15 天日期字符串的数组
  const dates = Array.from({ length: 15 }).map((_, index) => {
    const date = today.subtract(index, "day");
    return date.format("YYYY-MM-DD");
  });

  console.log(dates);

  const dataSource = [
    ...dates.map((date) => {
      return {
        date,
        ...TIME_SEGMENT.reduce((obj: any, time) => {
          obj[time] = {
            turnover: 1000,
            upCount: 1000,
          };
          return obj;
        }, {}),
      };
    }),
  ];

  return (
    <div className={style.container}>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
      />
    </div>
  );
}

export default App;
