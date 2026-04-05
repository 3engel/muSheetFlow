import xior from 'xior';
import xiorProgressPlugin from "xior/plugins/progress";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const api = xior.create({
  baseURL: API_BASE_URL
});

api.plugins.use(xiorProgressPlugin());