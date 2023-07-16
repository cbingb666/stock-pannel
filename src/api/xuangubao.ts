import axios, { AxiosInstance, AxiosResponse } from "axios";
import { XuanGuBaoRes } from "./index.types";

const XUANGUBAO_ERROR_CODE = 20000;

// 创建一个新的xuangubao axios实例
export const XgbAxios: AxiosInstance = axios.create({});

const xuangubaoErrorInterceptor = (
  response: AxiosResponse<XuanGuBaoRes<any>>
) => {
  if (response.data.code !== XUANGUBAO_ERROR_CODE)
    throw new Error(response.data.message);
  return response;
};

XgbAxios.interceptors.response.use(xuangubaoErrorInterceptor);
