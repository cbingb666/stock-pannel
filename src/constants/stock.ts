/** 指数代码 */
export const INDEX_CODES = {
  /** 上证指数 */
  SH: "000001",
  /** 深证成指 */
  SZ: "399001",
};

export const marketSuffix = (code: string) => {
  if (INDEX_CODES.SH === code) {
    return `${code}.SS`;
  } else if (INDEX_CODES.SZ === code) {
    return `${code}.SZ`;
  } else {
    throw "找不到后缀市场代码";
  }
};

export const marketPreffix = (code: string) => {
  if (INDEX_CODES.SH === code) {
    return `1.${code}`;
  } else if (INDEX_CODES.SZ === code) {
    return `0.${code}`;
  } else {
    throw "找不到前缀市场代码";
  }
};
