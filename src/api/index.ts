import dayjs from "dayjs";
import {
  IGetKlineParams,
  IGetKlineRes,
  IGetMarketIndicatorDataRes,
} from "./index.types";
import { EmAxios } from "./utils/eastmoney";
import { XgbAxios } from "./utils/xuangubao";

/**
 * 获取上涨家数 - 选股宝
 */
export const getRiseCountFromXgb = async (date: string) => {
  return XgbAxios.get<IGetMarketIndicatorDataRes>(
    "https://flash-api.xuangubao.cn/api/market_indicator/line",
    {
      params: {
        fields: "rise_count",
        date: date,
      },
    }
  );
};

/**
 * 获取K线 - 选股宝
 */
export const getKlineFromXgb = async (params: IGetKlineParams) => {
  return XgbAxios.get<IGetKlineRes>(
    "https://api-ddc-wscn.xuangubao.cn/market/kline",
    {
      params: {
        prod_code: params.prod_code.join(','),
        tick_count: 5000, // K线数量
        adjust_price_type: "forward", // 调整价格类型
        period_type: 60, // K线周期类型(s)
        fields: "tick_at,turnover_value",
        // "tick_at,open_px,close_px,high_px,low_px,turnover_volume,turnover_value,turnover_ratio,average_px,px_change,px_change_rate,avg_px,business_amount,business_balance,ma5,ma10,ma20,ma60", // 数据字段列表
      },
    }
  );
};

/**
 * 获取历史行情数据-通用
 * 参考: https://akshare.akfamily.xyz/data/index/index.html#id7
 * 目标地址: http://quote.eastmoney.com/center/hszs.html
 * 描述: 东方财富网-指数数据-分时行情
 * 限量: 单次返回具体指数指定 period 从 start_date 到 end 的之间的近期数据，该接口不能返回所有历史数据
 */
export async function getIndexZhAHistMinEm({
  code,
  period,
  start_date,
  end_date,
}: {
  // 股票代码
  code: string;
  // 周期
  period: 5 | 15 | 30;
  // 开始时间
  start_date: string;
  // 结束时间
  end_date: string;
}) {
  const { data } = await EmAxios.get<{
    rc: 0;
    rt: 17;
    svr: 181734976;
    lt: 1;
    full: 0;
    data: {
      code: "399293";
      market: 0;
      name: "创业大盘";
      decimal: 2;
      dktotal: 477;
      klines: [
        "2019-04-18,3105.00,3078.87,3113.69,3077.85,13321590,21989221888.00,0.00"
      ];
    };
  }>("https://push2his.eastmoney.com/api/qt/stock/kline/get", {
    params: {
      secid: code,
      fields1: "f1,f2,f3,f4,f5",
      fields2: "f51,f52,f53,f54,f55,f56,f57,f58",
      klt: period,
      fqt: 0,
      beg: start_date,
      end: end_date,
      // Imt: 1000000,
      _: new Date().getTime(),
    },
    responseType: "json",
  });
  return (data?.data?.klines || []).map((_) => {
    const [date, kp, sp, zg, zd, cjl, cje, zf] = _.split(",");
    return {
      date,
      kp: Number(kp),
      sp: Number(sp),
      zg: Number(zg),
      zd: Number(zd),
      cjl,
      cje,
      zf,
    };
  });
}
