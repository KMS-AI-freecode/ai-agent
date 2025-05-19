FROM node:22

# Установка зависимостей для системных уведомлений
RUN apt-get update && apt-get install -y \
    libnotify-bin \
    dbus-x11 \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Настройка sudo для пользователя node
RUN echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node && \
    chmod 0440 /etc/sudoers.d/node

WORKDIR /app
COPY package*.json ./

RUN ls -la

RUN npm ci
COPY . .

RUN npm run generate:types
RUN npm run build

EXPOSE 3000
