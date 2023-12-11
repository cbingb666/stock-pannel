import axios, { AxiosInstance, AxiosResponse } from "axios";

export type EmRes<T> = {
  code: number;
  message: string;
  data: T;
};

const EM_ERROR_CODE = 20000;

// 创建一个新的xuangubao axios实例
export const EmAxios: AxiosInstance = axios.create({});

// const EmErrorInterceptor = (
//   response: AxiosResponse<EmRes<any>>
// ) => {
//   if (response.data.code !== EM_ERROR_CODE)
//     throw new Error(response.data.message);
//   return response;
// };

// EmAxios.interceptors.response.use(EmErrorInterceptor);

