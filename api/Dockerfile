FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5050

CMD ["npm", "start"]