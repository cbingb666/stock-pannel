export const issz = (code: string) =>
  /^(000|001|002|003|300|301)\d{3}$/.test(code);
export const issh = (code: string) => /^(600|601|603|605|689)\d{3}$/.test(code);

export const marketCode = (code: string) => {
  const zero = issz(code) ? "0" : issh(code) ? "1" : undefined;
  if (zero) {
    return `${zero}.${code}`;
  } else {
    console.log("代码不匹配,现在的股票代码是：", code);
    return "";
  }
};
