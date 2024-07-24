FROM node:18

# Instala as dependências necessárias para o Puppeteer e Chromium
RUN apt-get update && apt-get install -y \
  libnss3 \
  libxss1 \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgdk-pixbuf2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libxcomposite1 \
  libxrandr2 \
  libx11-xcb1 \
  libxtst6 \
  xdg-utils \
  wget \
  libgbm1 \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copia o package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia todos os arquivos e diretórios restantes para o diretório de trabalho
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
