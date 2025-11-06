# 📚 Documentação Completa de Endpoints da API

Esta documentação descreve todos os endpoints disponíveis na API, incluindo os dados que podem ser enviados e recebidos em cada requisição.

**Base URL:** `/api`

---

## 📋 Índice

- [Clientes](#clientes)
- [Lojas](#lojas)
- [Planos (Plans-Enum)](#planos-plans-enum)

---

## 👤 Clientes

### 1. Listar Todos os Clientes

**Método:** `GET`  
**Endpoint:** `/api/clientes`

**Parâmetros de Query (Opcionais):**
- `pagination[page]` - Número da página (padrão: 1)
- `pagination[pageSize]` - Itens por página (padrão: 25, máximo: 100)
- `sort` - Campo para ordenação (ex: `sort=nome:asc`)
- `filters` - Filtros do Strapi (ex: `filters[email][$eq]=email@example.com`)
- `populate` - Popular relacionamentos (ex: `populate=*` ou `populate[plano]=*`)
- `fields` - Campos específicos a retornar (ex: `fields[0]=nome&fields[1]=email`)

**Exemplos de Query:**
```http
GET /api/clientes?pagination[page]=1&pagination[pageSize]=25&populate=*
GET /api/clientes?filters[email][$eq]=joao@email.com&populate[plano]=*
GET /api/clientes?sort=nome:asc&fields[0]=nome&fields[1]=email
```

**Resposta de Sucesso (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "xxx",
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-9999",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "plano": {
        "id": 1,
        "nome": "Básico",
        "limiteLojas": 1,
        "preco": 150.00,
        "descricao": "Plano básico",
        "recursos": {}
      },
      "lojas": [
        {
          "id": 1,
          "nome": "Loja Central",
          "cnpj": "12.345.678/0001-90",
          "endereco": "Rua das Flores, 123",
          "telefone": "(11) 3333-4444"
        }
      ]
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

---

### 2. Buscar Cliente por ID

**Método:** `GET`  
**Endpoint:** `/api/clientes/:id`

**Parâmetros de URL:**
- `id` (obrigatório) - ID do cliente

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "plano": {
      "id": 1,
      "nome": "Básico",
      "limiteLojas": 1,
      "preco": 150.00,
      "descricao": "Plano básico",
      "recursos": {}
    },
    "lojas": [
      {
        "id": 1,
        "nome": "Loja Central",
        "cnpj": "12.345.678/0001-90",
        "endereco": "Rua das Flores, 123",
        "telefone": "(11) 3333-4444"
      }
    ]
  },
  "meta": {}
}
```

**Resposta de Erro (404 Not Found):**
```json
{
  "error": {
    "status": 404,
    "message": "Not Found"
  }
}
```

---

### 3. Criar Cliente

**Método:** `POST`  
**Endpoint:** `/api/clientes`

**Headers:**
```
Content-Type: application/json
```

**Body da Requisição:**
```json
{
  "data": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "plano": 1
  }
}
```

**Campos:**
- `nome` (string, obrigatório) - Nome do cliente
- `email` (string, obrigatório, único) - Email do cliente
- `telefone` (string, opcional) - Telefone do cliente
- `plano` (integer, opcional) - ID do plano associado

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "plano": {
      "id": 1,
      "nome": "Básico",
      "limiteLojas": 1,
      "preco": 150.00
    },
    "lojas": []
  }
}
```

**Resposta de Erro (400 Bad Request):**
```json
{
  "error": {
    "status": 400,
    "message": "Email já cadastrado"
  }
}
```

**Validações:**
- Email deve ser único no sistema
- Se o email já existir, retorna erro 400

---

### 4. Atualizar Cliente

**Método:** `PUT`  
**Endpoint:** `/api/clientes/:id`

**Parâmetros de URL:**
- `id` (obrigatório) - ID do cliente

**Headers:**
```
Content-Type: application/json
```

**Body da Requisição:**
```json
{
  "data": {
    "nome": "João Silva Atualizado",
    "telefone": "(11) 88888-8888",
    "plano": 2
  }
}
```

**Campos (todos opcionais):**
- `nome` (string) - Nome do cliente
- `email` (string, único) - Email do cliente
- `telefone` (string) - Telefone do cliente
- `plano` (integer) - ID do plano associado

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "João Silva Atualizado",
    "email": "joao@email.com",
    "telefone": "(11) 88888-8888",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "plano": {
      "id": 2,
      "nome": "Intermedium",
      "limiteLojas": 3,
      "preco": 300.00
    },
    "lojas": [...]
  }
}
```

**Resposta de Erro (400 Bad Request):**
```json
{
  "error": {
    "status": 400,
    "message": "Email já cadastrado"
  }
}
```

```json
{
  "error": {
    "status": 400,
    "message": "Não é possível alterar para o plano Intermedium. Cliente possui 3 loja(s), mas o plano Intermedium permite apenas 3 loja(s). Remova algumas lojas antes de alterar o plano."
  }
}
```

**Validações:**
- Se o email for alterado, deve ser único no sistema
- Se o plano for alterado, o cliente não pode ter mais lojas do que o novo plano permite
- Se exceder o limite, retorna erro 400 com mensagem explicativa

---

### 5. Deletar Cliente

**Método:** `DELETE`  
**Endpoint:** `/api/clientes/:id`

**Parâmetros de URL:**
- `id` (obrigatório) - ID do cliente

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "João Silva",
    "email": "joao@email.com",
    ...
  }
}
```

**Resposta de Erro (404 Not Found):**
```json
{
  "error": {
    "status": 404,
    "message": "Not Found"
  }
}
```

---

### 6. Obter Informações do Plano

**Método:** `GET`  
**Endpoint:** `/api/clientes/plano/:planoId`

**Parâmetros de URL:**
- `planoId` (obrigatório) - ID do plano

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "nome": "Básico",
    "limiteLojas": 1,
    "preco": 150.00,
    "descricao": "Máximo de 1 loja(s)",
    "recursos": {}
  }
}
```

**Resposta de Erro (404 Not Found):**
```json
{
  "error": {
    "status": 404,
    "message": "Plano não encontrado"
  }
}
```

**Nota:** A descrição é formatada automaticamente com base no limite de lojas.

---

### 7. Listar Planos Disponíveis

**Método:** `GET`  
**Endpoint:** `/api/clientes/planos-disponiveis`

**Resposta de Sucesso (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "nome": "Básico",
      "limiteLojas": 1,
      "preco": 150.00,
      "descricao": "Plano básico",
      "recursos": {}
    },
    {
      "id": 2,
      "nome": "Intermedium",
      "limiteLojas": 3,
      "preco": 300.00,
      "descricao": "Plano intermediário",
      "recursos": {}
    },
    {
      "id": 3,
      "nome": "Advanced",
      "limiteLojas": 999999,
      "preco": 500.00,
      "descricao": "Plano avançado",
      "recursos": {}
    }
  ]
}
```

**Nota:** Os planos são retornados ordenados por preço (crescente).

---

## 🏪 Lojas

### 1. Listar Todas as Lojas

**Método:** `GET`  
**Endpoint:** `/api/lojas`

**Parâmetros de Query (Opcionais):**
- `pagination[page]` - Número da página (padrão: 1)
- `pagination[pageSize]` - Itens por página (padrão: 25, máximo: 100)
- `sort` - Campo para ordenação (ex: `sort=nome:asc`)
- `filters` - Filtros do Strapi (ex: `filters[cliente][id][$eq]=1`)
- `populate` - Popular relacionamentos (ex: `populate=*` ou `populate[cliente]=*`)
- `fields` - Campos específicos a retornar (ex: `fields[0]=nome&fields[1]=cnpj`)

**Exemplos de Query:**
```http
GET /api/lojas?pagination[page]=1&pagination[pageSize]=25&populate=*
GET /api/lojas?filters[cliente][id][$eq]=1&populate[cliente][populate][plano]=*
GET /api/lojas?sort=nome:asc&fields[0]=nome&fields[1]=cnpj
```

**Resposta de Sucesso (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "xxx",
      "nome": "Loja Central",
      "cnpj": "12.345.678/0001-90",
      "endereco": "Rua das Flores, 123",
      "telefone": "(11) 3333-4444",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "locale": "pt-BR",
      "localizations": [],
      "cliente": {
        "id": 1,
        "nome": "João Silva",
        "email": "joao@email.com",
        "plano": {
          "id": 1,
          "nome": "Básico",
          "limiteLojas": 1,
          "preco": 150.00
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

---

### 2. Buscar Loja por ID

**Método:** `GET`  
**Endpoint:** `/api/lojas/:id`

**Parâmetros de URL:**
- `id` (obrigatório) - ID da loja

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "Loja Central",
    "cnpj": "12.345.678/0001-90",
    "endereco": "Rua das Flores, 123",
    "telefone": "(11) 3333-4444",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "locale": "pt-BR",
    "localizations": [],
    "cliente": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "plano": {
        "id": 1,
        "nome": "Básico",
        "limiteLojas": 1,
        "preco": 150.00
      }
    }
  },
  "meta": {}
}
```

**Resposta de Erro (404 Not Found):**
```json
{
  "error": {
    "status": 404,
    "message": "Not Found"
  }
}
```

---

### 3. Criar Loja

**Método:** `POST`  
**Endpoint:** `/api/lojas`

**Headers:**
```
Content-Type: application/json
```

**Body da Requisição:**
```json
{
  "nome": "Loja Central",
  "cnpj": "12.345.678/0001-90",
  "endereco": "Rua das Flores, 123",
  "telefone": "(11) 3333-4444",
  "cliente": 1
}
```

**Campos:**
- `nome` (string, obrigatório) - Nome da loja
- `cnpj` (string, obrigatório) - CNPJ da loja
- `endereco` (string, opcional) - Endereço da loja
- `telefone` (string, opcional) - Telefone da loja
- `cliente` (integer, obrigatório) - ID do cliente proprietário

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "Loja Central",
    "cnpj": "12.345.678/0001-90",
    "endereco": "Rua das Flores, 123",
    "telefone": "(11) 3333-4444",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "locale": "pt-BR",
    "cliente": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "plano": {
        "id": 1,
        "nome": "Básico",
        "limiteLojas": 1,
        "preco": 150.00
      }
    }
  }
}
```

**Resposta de Erro (400 Bad Request):**
```json
{
  "error": {
    "status": 400,
    "message": "Cliente é obrigatório para criar uma loja"
  }
}
```

```json
{
  "error": {
    "status": 400,
    "message": "Cliente não encontrado"
  }
}
```

```json
{
  "error": {
    "status": 400,
    "message": "Cliente não possui um plano válido"
  }
}
```

```json
{
  "error": {
    "status": 400,
    "message": "Limite de lojas excedido para o plano Básico. Plano Básico permite 1 loja(s). Cliente já possui 1 loja(s)."
  }
}
```

**Validações:**
- Cliente é obrigatório
- Cliente deve existir no sistema
- Cliente deve ter um plano válido
- O cliente não pode exceder o limite de lojas do seu plano

---

### 4. Atualizar Loja

**Método:** `PUT`  
**Endpoint:** `/api/lojas/:id`

**Parâmetros de URL:**
- `id` (obrigatório) - ID da loja

**Headers:**
```
Content-Type: application/json
```

**Body da Requisição:**
```json
{
  "nome": "Loja Central Atualizada",
  "endereco": "Rua Nova, 456",
  "cliente": 2
}
```

**Campos (todos opcionais):**
- `nome` (string) - Nome da loja
- `cnpj` (string) - CNPJ da loja
- `endereco` (string) - Endereço da loja
- `telefone` (string) - Telefone da loja
- `cliente` (integer) - ID do cliente proprietário

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "Loja Central Atualizada",
    "cnpj": "12.345.678/0001-90",
    "endereco": "Rua Nova, 456",
    "telefone": "(11) 3333-4444",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "locale": "pt-BR",
    "cliente": {
      "id": 2,
      "nome": "Maria Santos",
      "email": "maria@email.com",
      "plano": {
        "id": 2,
        "nome": "Intermedium",
        "limiteLojas": 3,
        "preco": 300.00
      }
    }
  }
}
```

**Resposta de Erro (400 Bad Request):**
```json
{
  "error": {
    "status": 400,
    "message": "Limite de lojas excedido para o plano Básico. Plano Básico permite 1 loja(s). Cliente já possui 1 loja(s)."
  }
}
```

**Validações:**
- Se o cliente for alterado, o novo cliente não pode exceder o limite de lojas do seu plano
- A loja atual não é contada no limite do novo cliente (se estiver sendo movida)

---

### 5. Deletar Loja

**Método:** `DELETE`  
**Endpoint:** `/api/lojas/:id`

**Parâmetros de URL:**
- `id` (obrigatório) - ID da loja

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "Loja Central",
    "cnpj": "12.345.678/0001-90",
    ...
  }
}
```

**Resposta de Erro (404 Not Found):**
```json
{
  "error": {
    "status": 404,
    "message": "Not Found"
  }
}
```

---

## 📦 Planos (Plans-Enum)

### 1. Listar Todos os Planos

**Método:** `GET`  
**Endpoint:** `/api/plans-enums`

**Parâmetros de Query (Opcionais):**
- `pagination[page]` - Número da página (padrão: 1)
- `pagination[pageSize]` - Itens por página (padrão: 25, máximo: 100)
- `sort` - Campo para ordenação (ex: `sort=preco:asc`)
- `filters` - Filtros do Strapi (ex: `filters[limiteLojas][$gte]=3`)
- `populate` - Popular relacionamentos (geralmente não necessário para plans-enum)
- `fields` - Campos específicos a retornar (ex: `fields[0]=nome&fields[1]=preco`)

**Exemplos de Query:**
```http
GET /api/plans-enums?pagination[page]=1&pagination[pageSize]=25
GET /api/plans-enums?filters[limiteLojas][$gte]=3&sort=preco:asc
GET /api/plans-enums?fields[0]=nome&fields[1]=preco&fields[2]=limiteLojas
```

**Resposta de Sucesso (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "xxx",
      "nome": "Básico",
      "limiteLojas": 1,
      "preco": 150.00,
      "descricao": "Plano básico com recursos essenciais",
      "recursos": {
        "suporte": "email",
        "relatorios": false
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

---

### 2. Buscar Plano por ID

**Método:** `GET`  
**Endpoint:** `/api/plans-enums/:id`

**Parâmetros de URL:**
- `id` (obrigatório) - ID do plano

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "Básico",
    "limiteLojas": 1,
    "preco": 150.00,
    "descricao": "Plano básico com recursos essenciais",
    "recursos": {
      "suporte": "email",
      "relatorios": false
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z"
  },
  "meta": {}
}
```

**Resposta de Erro (404 Not Found):**
```json
{
  "error": {
    "status": 404,
    "message": "Not Found"
  }
}
```

---

### 3. Criar Plano

**Método:** `POST`  
**Endpoint:** `/api/plans-enums`

**Headers:**
```
Content-Type: application/json
```

**Body da Requisição:**
```json
{
  "data": {
    "nome": "Premium",
    "limiteLojas": 999999,
    "preco": 500.00,
    "descricao": "Plano premium com recursos ilimitados",
    "recursos": {
      "suporte": "24/7",
      "relatorios": true,
      "api": true
    }
  }
}
```

**Campos:**
- `nome` (string, obrigatório) - Nome do plano
- `limiteLojas` (integer, obrigatório) - Limite de lojas permitidas (use 999999 para ilimitado)
- `preco` (decimal, obrigatório) - Preço do plano
- `descricao` (text, opcional) - Descrição do plano
- `recursos` (json, opcional) - Recursos inclusos no plano (objeto JSON)

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 4,
    "documentId": "xxx",
    "nome": "Premium",
    "limiteLojas": 999999,
    "preco": 500.00,
    "descricao": "Plano premium com recursos ilimitados",
    "recursos": {
      "suporte": "24/7",
      "relatorios": true,
      "api": true
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. Atualizar Plano

**Método:** `PUT`  
**Endpoint:** `/api/plans-enums/:id`

**Parâmetros de URL:**
- `id` (obrigatório) - ID do plano

**Headers:**
```
Content-Type: application/json
```

**Body da Requisição:**
```json
{
  "data": {
    "preco": 450.00,
    "descricao": "Plano atualizado"
  }
}
```

**Campos (todos opcionais):**
- `nome` (string) - Nome do plano
- `limiteLojas` (integer) - Limite de lojas permitidas
- `preco` (decimal) - Preço do plano
- `descricao` (text) - Descrição do plano
- `recursos` (json) - Recursos inclusos no plano

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "Básico",
    "limiteLojas": 1,
    "preco": 450.00,
    "descricao": "Plano atualizado",
    "recursos": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "publishedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. Deletar Plano

**Método:** `DELETE`  
**Endpoint:** `/api/plans-enums/:id`

**Parâmetros de URL:**
- `id` (obrigatório) - ID do plano

**Resposta de Sucesso (200 OK):**
```json
{
  "data": {
    "id": 1,
    "documentId": "xxx",
    "nome": "Básico",
    "limiteLojas": 1,
    "preco": 150.00,
    ...
  }
}
```

**Resposta de Erro (404 Not Found):**
```json
{
  "error": {
    "status": 404,
    "message": "Not Found"
  }
}
```

---

## 🔒 Autenticação e Permissões

**Nota:** Esta API utiliza Strapi, que por padrão requer autenticação para operações de escrita (POST, PUT, DELETE). As operações de leitura (GET) podem ser públicas dependendo da configuração do Strapi.

Para autenticação, você precisará:
1. Criar um usuário no Strapi Admin
2. Obter um token JWT através do endpoint de login
3. Incluir o token no header `Authorization: Bearer <token>`

---

## 📝 Notas Importantes

### ⚠️ Formato de Body nas Requisições

**IMPORTANTE**: Existe uma diferença no formato do body entre os endpoints:

- **Cliente e Plans-Enum**: Usam o wrapper `data`
  ```json
  {
    "data": {
      "nome": "João Silva",
      "email": "joao@email.com"
    }
  }
  ```

- **Loja**: NÃO usa o wrapper `data` (dados diretos)
  ```json
  {
    "nome": "Loja Central",
    "cnpj": "12.345.678/0001-90",
    "cliente": 1
  }
  ```

**Motivo**: O controller de Loja foi customizado e acessa `ctx.request.body` diretamente, enquanto Cliente e Plans-Enum usam o padrão Strapi que espera `ctx.request.body.data`.

### Validações de Negócio

1. **Limite de Lojas:** O sistema valida automaticamente se o cliente pode criar/atualizar lojas baseado no limite do seu plano.

2. **Email Único:** O email do cliente deve ser único no sistema.

3. **Plano Obrigatório:** Para criar uma loja, o cliente deve ter um plano válido.

4. **Relacionamentos:** 
   - Um cliente pode ter múltiplas lojas (oneToMany)
   - Uma loja pertence a um cliente (manyToOne)
   - Um cliente tem um plano (manyToOne)

### Formato de Dados

- Todas as datas são retornadas no formato ISO 8601
- Valores decimais (preço) são retornados como números
- Campos JSON são retornados como objetos/arrays
- Todas as respostas seguem o padrão Strapi: `{ "data": {...}, "meta": {...} }`

### Paginação

Por padrão, o Strapi retorna 25 itens por página (configurável em `config/api.ts`). O máximo é 100 itens por página.

---

## 🔗 Exemplos de Uso Completo

### Criar um Cliente e uma Loja

```bash
# 1. Criar cliente
POST /api/clientes
{
  "data": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "plano": 1
  }
}

# 2. Criar loja para o cliente
POST /api/lojas
{
  "nome": "Loja Central",
  "cnpj": "12.345.678/0001-90",
  "endereco": "Rua das Flores, 123",
  "telefone": "(11) 3333-4444",
  "cliente": 1
}
```

### Atualizar Plano do Cliente

```bash
# 1. Verificar quantas lojas o cliente possui
GET /api/clientes/1

# 2. Se o cliente tem menos lojas que o novo plano permite, atualizar
PUT /api/clientes/1
{
  "data": {
    "plano": 2
  }
}
```

---

## 📞 Suporte

Para mais informações sobre o Strapi, consulte a [documentação oficial](https://docs.strapi.io).

