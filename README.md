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
    - Gerenciamento das configurações de cada bot.

## Tecnologias e Ferramentas Utilizadas

- Backend: **Fastify (Typescript)**.
- Banco de dados: **Mongodb** - Para armazenamento de dados sensíveis.
- API para controle de bot: [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js).

## Para a instalação
Para instalar o projeto para testes, utilizaremos o Docker.

- Instale a última versão do **Docker** em sua máquina.
- Instale o mongodb (Verifique na página oficial, ou monte uma imagem com o Docker).
- Crie um arquivo .env, ou adicione um arquivo .env manualmente na construção da imagem docker.

```.env
SUPER_USER= #Mais de um superAdmin, separar por vírgula -- numero, numero, numero
MONGO_HOST=mongodb://localhost:27017 #mongodb://host.docker.internal ou //mongodb://mongodb:27017
```
> Se você estiver expondo a porta do MongoDB no Docker, é necessário alterar o valor da variável **MONGO_HOST** para __mongodb://host.docker.internal:27017__.

#### Execute o comando a seguir para construir a imagem Docker.

    docker build -t notify-bot .

#### Execute o comando a seguir para executar a imagem criada com o Docker.

    docker run --name notify-bot -p 9091:9091 notify-bot:latest

## Endpoints disponíveis

No momento apenas alguns endpoints estão disponíveis, e estão hospedados na página de endpoints do Postman.
https://documenter.getpostman.com/view/29175154/2sA3kYhzYP