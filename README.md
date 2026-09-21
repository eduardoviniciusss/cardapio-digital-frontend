# Cardápio Digital — Frontend

Frontend de cadastro de usuário e login para o projeto **Cardápio Digital**,
consumindo a API ASP.NET Core hospedada no Render.

## Stack

- React 18 + TypeScript
- Vite (bundler e dev server)
- React Router DOM (rotas)
- Axios (requisições HTTP)
- Context API (estado de autenticação)

## Estrutura de pastas

```
src/
├── components/
│   └── ProtectedRoute.tsx   # bloqueia rotas para quem não está logado
├── context/
│   └── AuthContext.tsx      # login, logout, usuário atual, persistência
├── pages/
│   ├── Login/Login.tsx
│   ├── Register/Register.tsx
│   ├── Dashboard/Dashboard.tsx   # página protegida de exemplo
│   └── auth-layout.css      # estilos compartilhados das telas de auth
├── routes/
│   └── AppRoutes.tsx        # definição das rotas com React Router
├── services/
│   ├── api.ts               # instância do Axios (baseURL + token JWT)
│   └── authService.ts       # chamadas a /login e /users + tratamento de erro
├── types/
│   └── auth.ts              # tipos e enum de Role
├── App.tsx
├── main.tsx
└── index.css                 # tokens de design (cores, tipografia)
```

## Passo a passo para rodar localmente

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior instalado (`node -v` para checar)
- Editor de código (recomendado: VS Code)

### 2. Instalar as dependências

Descompacte este projeto, abra um terminal na pasta e rode:

```bash
npm install
```

Isso vai ler o `package.json` e baixar React, TypeScript, Vite, Axios e
React Router para a pasta `node_modules`.

### 3. Configurar a URL da API

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

O arquivo `.env` já vem apontando para a API do Render:

```
VITE_API_URL=https://cardapio-digital-1-ww62.onrender.com
```

Se você rodar o backend localmente (ex: `https://localhost:5001`), troque esse
valor por ele. **Toda variável usada pelo Vite no navegador precisa começar
com `VITE_`** — é assim que o Vite sabe quais variáveis podem ser expostas
no bundle final (variáveis sem esse prefixo ficam de fora por segurança).

### 4. Rodar o projeto

```bash
npm run dev
```

O terminal vai mostrar algo como:

```
Local:   http://localhost:5173/
```

Abra esse endereço no navegador. Você deve cair na tela de **login**
(a rota `/` é protegida e redireciona para lá se não houver sessão).

### 5. Testar o fluxo

1. Acesse `/cadastro`, crie uma conta escolhendo o papel (Administrador,
   Cantina ou Responsável).
2. Você será redirecionado para `/login` — entre com o e-mail e senha
   cadastrados.
3. Ao logar com sucesso, você cai na home (`/`), que é uma página protegida.

> **Nota sobre o Render (plano gratuito):** se a API ficar "dormindo" por
> inatividade, a primeira requisição pode demorar 30–60s para responder.
> Isso pode aparecer como erro de rede na primeira tentativa — tente
> novamente depois de alguns segundos.

### 6. Build de produção (opcional)

```bash
npm run build
npm run preview   # serve o build localmente para conferir
```

## Decisões técnicas (explicadas)

- **Por que Context API e não Redux?** Para um fluxo de autenticação
  (login, logout, usuário atual), o estado é pequeno e muda pouco. Context
  API resolve isso com bem menos código e nenhuma dependência extra. Se o
  projeto crescer muito (múltiplos módulos de estado complexo), aí sim vale
  reconsiderar uma lib como Zustand ou Redux Toolkit.

- **Por que um `api.ts` central com interceptors?** Em vez de repetir
  `axios.get(url, { headers: { Authorization: ... } })` em cada tela, o
  interceptor de request injeta o token automaticamente em toda chamada.
  O interceptor de response centraliza o que fazer quando a API responde
  `401` (token expirado/inválido): limpa a sessão local em um único lugar,
  em vez de tratar isso espalhado por cada componente.

- **localStorage vs cookie HttpOnly para o token:**
  - `localStorage` (usado aqui): simples de implementar, funciona bem para
    APIs que não são same-site com o front. **Risco:** é acessível via
    JavaScript, então um ataque de XSS bem-sucedido no seu site consegue
    ler o token.
  - Cookie `HttpOnly`: o token não fica acessível via JavaScript (mitiga
    XSS), mas exige que o **backend** seja quem define o cookie na resposta
    do login, com `Secure`, `HttpOnly` e `SameSite` configurados — e isso
    muda como o CORS precisa ser configurado (`credentials: true` nos dois
    lados). Como o backend atual devolve o token no corpo da resposta
    (`{ "token": "JWT" }`), a via mais direta agora é localStorage; migrar
    para cookie HttpOnly é uma melhoria de segurança para revisitar depois,
    em conjunto com o time de backend.

- **Por que decodificar o JWT no frontend?** Só para extrair informações
  como nome, e-mail e papel do usuário e saber quando o token expira — o
  frontend nunca *valida* a assinatura do token (isso é papel exclusivo do
  backend a cada requisição). É por isso que a função de decodificação em
  `AuthContext.tsx` só faz `atob` + `JSON.parse`, sem checar assinatura.

- **Por que `ProtectedRoute` como componente e não um hook?** Encapsular a
  regra "se não estiver logado, redirecione" como um componente que recebe
  `children` deixa o arquivo de rotas (`AppRoutes.tsx`) declarativo e fácil
  de ler: basta envolver a rota que precisa de login.

- **Sobre o valor do campo `role`:** o Swagger mostra `"role": 1` no
  cadastro, mas não documenta o significado de cada número. O enum em
  `src/types/auth.ts` assume `1 = Administrador, 2 = Cantina, 3 = Responsável`
  — **confirme esse mapeamento com o backend** (ou teste criando um usuário
  de cada tipo e conferindo o que a API aceita) antes de usar em produção.

## Próximos passos sugeridos

- Adicionar as telas de `/schools`, `/categories`, `/products`, `/menus`,
  `/parents` e `/children`, reaproveitando `api.ts` e o padrão de serviço
  tipado usado em `authService.ts`.
- Adicionar testes (Vitest + React Testing Library) para o `AuthContext` e
  as validações de formulário.
- Avaliar migrar o armazenamento do token para cookie `HttpOnly` junto com
  o backend, se o requisito de segurança justificar.
