# Notify-Bot
Este é um gerenciador de bots para o Whatsapp, que utiliza a API do [venom](https://github.com/orkestral/venom).

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
- API para controle de bot: [venom](https://github.com/orkestral/venom).