import xior from 'xior';
import xiorProgressPlugin from "xior/plugins/progress";

export const api = xior.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000"
});

api.plugins.use(xiorProgressPlugin());