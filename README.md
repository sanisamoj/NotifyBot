# Notify-Bot
Este é um gerenciador de bots para o Whatsapp, que utiliza a API do [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js).

Tem como objetivo de gerenciar bots que servem para notificar usuários, criar grupos para aplicações que têm uma base de usuários e pode funcionar como um microservice.

## Funcionalidades do Bot de Notificação

- Enviar mensagens para números cadastrados no Whatsapp.
- Criar grupos.
    - Enviar mensagens aos grupos.
    - Adicionar/Remover participantes dos grupos .

## Funcionalidades do Sistema

- Criar ou destruir bots.
- Gerenciar bots.
    - Retornar bots.
    - Retornar participantes dos grupos.

## Tecnologias e Ferramentas Utilizadas

- Backend: **Fastify (Typescript)**.
- Banco de dados: **Mongodb** - Para armazenamento de dados sensíveis.
- API para controle de bot: [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js).

## Para a instalação
Para instalar o projeto para testes, utilizaremos o Docker.

- Instale a última versão do **Docker** em sua máquina.
- Instale o mongodb (Verifique na página oficial, ou monte uma imagem com o Docker).

#### Execute o comando a seguir para construir a imagem Docker.

    docker build -t notify-bot .

#### Execute o comando a seguir para executar a imagem criada com o Docker.

    docker run --name notify-bot -p 9091:9091 notify-bot:latest
 