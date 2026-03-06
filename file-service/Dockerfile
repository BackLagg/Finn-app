FROM node:20-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p /app/uploads /app/logs
EXPOSE 3002
CMD ["npm", "run", "dev"]
