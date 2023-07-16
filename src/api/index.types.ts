export type XuanGuBaoRes<T> = {
  code: number;
  message: string;
  data: T;
};

export type IMarketIndicatorData = {
  rise_count: number;
  fall_count: number;
  timestamp: number;
};
export type IGetMarketIndicatorDataRes = XuanGuBaoRes<IMarketIndicatorData[]>;

// 定义candle数据的接口
export interface ICandleData {
  [key: string]: {
    lines: number[][]; // K线数据数组
    market_type: string; // 市场类型
    pre_close_px: number; // 前收盘价
    securities_type: string; // 证券类型
  };
}

export type IGetKlineParams = {
  prod_code: string; // 产品代码
}

// 定义API响应的接口
export type IGetKlineRes = XuanGuBaoRes<{
  candle: ICandleData; // K线数据
  fields: string[]; // 数据字段列表
}>;