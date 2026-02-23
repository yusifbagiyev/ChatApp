# Stage 1: React frontend build
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY chatapp-frontend/package.json chatapp-frontend/package-lock.json* ./
RUN npm ci
COPY chatapp-frontend/ .
RUN npm run build

# Stage 2: Nginx — React static files + reverse proxy
FROM nginx:alpine

# Default nginx config sil
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config kopyala
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# React build output-u nginx html directory-sinə kopyala
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Runtime env.js injection üçün entrypoint
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 7000

ENTRYPOINT ["/docker-entrypoint.sh"]
