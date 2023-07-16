import { IGetKlineParams, IGetKlineRes, IGetMarketIndicatorDataRes } from "./index.types";
import { XgbAxios } from "./xuangubao";

export const getMarketIndicatorData = async (date: string) => {
  return XgbAxios.get<IGetMarketIndicatorDataRes>(
    "https://flash-api.xuangubao.cn/api/market_indicator/line",
    {
      params: {
        fields: "rise_count,fall_count",
        date: date,
      },
    }
  );
};

export const getKline = async (params: IGetKlineParams) => {
  return XgbAxios.get<IGetKlineRes>(
    "https://api-ddc-wscn.xuangubao.cn/market/kline",
    {
      params: {
        ...params,
        tick_count: 10000, // K线数量
        adjust_price_type: "forward", // 调整价格类型
        period_type: 60, // K线周期类型(s)
        fields: 'tick_at,turnover_value'
          // "tick_at,open_px,close_px,high_px,low_px,turnover_volume,turnover_value,turnover_ratio,average_px,px_change,px_change_rate,avg_px,business_amount,business_balance,ma5,ma10,ma20,ma60", // 数据字段列表
      },
    }
  );
};
