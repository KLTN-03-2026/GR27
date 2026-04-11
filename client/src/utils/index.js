import axiosClient from "./axiosClient";

export const get = (url, config) => axiosClient.get(url, config);

export const post = (url, data, config) => axiosClient.post(url, data, config);

export const patch = (url, data, config) => axiosClient.patch(url, data, config);

export const del = (url, config) => axiosClient.delete(url, config);
