FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# We need to build the Vite app. Next.js telemetry is not needed, but harmless.
RUN npm run build

FROM nginx:alpine AS runner
# Copy custom Nginx configuration if you have one, or just overrite default
# For purely single page app without subroutes breaking on refresh, 
# we need a simple nginx conf. Let's do it via inline bash or create a config.
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Configure NGINX to route everything to index.html for CSR
# and reverse proxy /api/ to the backend
RUN echo 'server { \
    listen 80; \
    client_max_body_size 100M; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8000/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        client_max_body_size 100M; \
    } \
}' > /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
