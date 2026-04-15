# Use a lightweight Nginx image that supports multi-arch (AMD64/ARM64)
FROM --platform=$BUILDPLATFORM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy static configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy project files to the web root
# We are copying the entire project structure to be served statically
COPY index.html /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src
COPY styles /usr/share/nginx/html/styles

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
