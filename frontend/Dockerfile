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
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
