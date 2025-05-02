FROM node:22
WORKDIR /app
COPY package*.json .

RUN ls -la

RUN npm ci
COPY . .

RUN npm run generate:types
RUN npm run build

EXPOSE 3000
