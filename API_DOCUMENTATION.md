# Documentação da API - Supply

## Base URL
```
http://localhost:1337/api
```
*Nota: Substitua `localhost:1337` pelo endereço do seu servidor em produção*

---

## Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Após o login/registro, você receberá um token que deve ser incluído no header de todas as requisições autenticadas:

```
Authorization: Bearer {seu_token_jwt}
```

---

## Endpoints de Autenticação (Users & Permissions)

### 1. Registrar Usuário

**POST** `/api/auth/local/register`

Registra um novo usuário no sistema.

**Body:**
```json
{
  "username": "usuario123",
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@example.com",
    "provider": "local",
    "confirmed": false,
    "blocked": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "telefone": null,
    "plano": null,
    "lojas": []
  }
}
```

**Erros Possíveis:**
- `400` - Email ou username já existe
- `400` - Validação falhou (email inválido, senha muito curta, etc.)

---

### 2. Login

**POST** `/api/auth/local`

Realiza login de um usuário existente.

**Body:**
```json
{
  "identifier": "usuario@example.com",
  "password": "senha123"
}
```

*Nota: `identifier` pode ser o email ou username*

**Resposta de Sucesso (200):**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@example.com",
    "provider": "local",
    "confirmed": true,
    "blocked": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "telefone": "11999999999",
    "plano": {
      "id": 1,
      "nome": "Plano Básico",
      "limiteLojas": 5,
      "preco": 99.90,
      "descricao": "Plano básico para pequenas empresas"
    },
    "lojas": [
      {
        "id": 1,
        "nome": "Loja Centro",
        "cnpj": "12.345.678/0001-90",
        "endereco": {...},
        "telefone": "11988888888"
      }
    ]
  }
}
```

**Erros Possíveis:**
- `400` - Credenciais inválidas
- `403` - Usuário bloqueado

---

### 3. Obter Usuário Atual

**GET** `/api/users/me`

Retorna os dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "username": "usuario123",
  "email": "usuario@example.com",
  "provider": "local",
  "confirmed": true,
  "blocked": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "telefone": "11999999999",
  "plano": {
    "id": 1,
    "nome": "Plano Básico",
    "limiteLojas": 5,
    "preco": 99.90,
    "descricao": "Plano básico"
  },
  "lojas": [...]
}
```

---

### 4. Atualizar Usuário

**PUT** `/api/users/{id}`

Atualiza os dados de um usuário.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "telefone": "11999999999",
  "plano": 1
}
```

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "username": "usuario123",
  "email": "usuario@example.com",
  "telefone": "11999999999",
  "plano": {
    "id": 1,
    "nome": "Plano Básico",
    ...
  },
  ...
}
```

**Nota:** Para atualizar relacionamentos, use o ID do objeto relacionado (ex: `"plano": 1`)

---

## Endpoints de Roles (Permissões)

### 1. Listar Roles

**GET** `/api/users-permissions/roles`

Retorna uma lista de todas as roles disponíveis no sistema.

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta de Sucesso (200):**
```json
{
  "roles": [
    {
      "id": 1,
      "name": "Authenticated",
      "description": "Default role given to authenticated user.",
      "type": "authenticated"
    },
    {
      "id": 2,
      "name": "Public",
      "description": "Default role given to unauthenticated user.",
      "type": "public"
    },
    {
      "id": 3,
      "name": "Cliente",
      "description": "Role para clientes do sistema",
      "type": "cliente"
    }
  ]
}
```

**Nota:** Este endpoint geralmente requer autenticação de administrador.

---

### 2. Obter Role por ID

**GET** `/api/users-permissions/roles/{id}`

Retorna os detalhes de uma role específica, incluindo suas permissões.

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta de Sucesso (200):**
```json
{
  "role": {
    "id": 3,
    "name": "Cliente",
    "description": "Role para clientes do sistema",
    "type": "cliente",
    "permissions": [
      {
        "id": 1,
        "action": "api::plano.plano.find",
        "enabled": true
      },
      {
        "id": 2,
        "action": "api::loja.loja.find",
        "enabled": true
      }
    ]
  }
}
```

---

## Endpoints de Planos

### 1. Listar Planos

**GET** `/api/planos`

Retorna uma lista de todos os planos disponíveis.

**Query Parameters:**
- `pagination[page]` - Número da página (padrão: 1)
- `pagination[pageSize]` - Itens por página (padrão: 25, máximo: 100)
- `populate` - Campos relacionados para popular (ex: `populate=users`)

**Exemplo:**
```
GET /api/planos?pagination[page]=1&pagination[pageSize]=10
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "nome": "Plano Básico",
        "limiteLojas": 5,
        "preco": 99.90,
        "descricao": "Plano básico para pequenas empresas",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "publishedAt": "2024-01-01T00:00:00.000Z"
      }
    },
    {
      "id": 2,
      "attributes": {
        "nome": "Plano Premium",
        "limiteLojas": 20,
        "preco": 299.90,
        "descricao": "Plano premium para empresas maiores",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "publishedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

---

### 2. Obter Plano por ID

**GET** `/api/planos/{id}`

Retorna os detalhes de um plano específico.

**Query Parameters:**
- `populate` - Campos relacionados para popular (ex: `populate=users`)

**Exemplo:**
```
GET /api/planos/1?populate=users
```

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "nome": "Plano Básico",
      "limiteLojas": 5,
      "preco": 99.90,
      "descricao": "Plano básico para pequenas empresas",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "users": {
        "data": [
          {
            "id": 1,
            "attributes": {
              "username": "usuario123",
              "email": "usuario@example.com"
            }
          }
        ]
      }
    }
  }
}
```

---

### 3. Criar Plano

**POST** `/api/planos`

Cria um novo plano. Requer autenticação de administrador.

**Headers:**
```
Authorization: Bearer {token_admin}
Content-Type: application/json
```

**Body:**
```json
{
  "data": {
    "nome": "Plano Enterprise",
    "limiteLojas": 100,
    "preco": 999.90,
    "descricao": "Plano enterprise para grandes empresas"
  }
}
```

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 3,
    "attributes": {
      "nome": "Plano Enterprise",
      "limiteLojas": 100,
      "preco": 999.90,
      "descricao": "Plano enterprise para grandes empresas",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 4. Atualizar Plano

**PUT** `/api/planos/{id}`

Atualiza um plano existente. Requer autenticação de administrador.

**Headers:**
```
Authorization: Bearer {token_admin}
Content-Type: application/json
```

**Body:**
```json
{
  "data": {
    "preco": 1099.90
  }
}
```

---

### 5. Deletar Plano

**DELETE** `/api/planos/{id}`

Deleta um plano. Requer autenticação de administrador.

**Headers:**
```
Authorization: Bearer {token_admin}
```

---

## Endpoints de Lojas

### 1. Listar Lojas

**GET** `/api/lojas`

Retorna uma lista de lojas.

**Query Parameters:**
- `pagination[page]` - Número da página
- `pagination[pageSize]` - Itens por página
- `filters[user][id][$eq]` - Filtrar por ID do usuário
- `populate` - Campos relacionados (ex: `populate=user`)

**Exemplo - Listar lojas do usuário autenticado:**
```
GET /api/lojas?filters[user][id][$eq]=1&populate=user
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "nome": "Loja Centro",
        "cnpj": "12.345.678/0001-90",
        "endereco": {
          "rua": "Rua Exemplo, 123",
          "cidade": "São Paulo",
          "cep": "01234-567"
        },
        "telefone": "11988888888",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "publishedAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "data": {
            "id": 1,
            "attributes": {
              "username": "usuario123",
              "email": "usuario@example.com"
            }
          }
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

### 2. Obter Loja por ID

**GET** `/api/lojas/{id}`

Retorna os detalhes de uma loja específica.

**Query Parameters:**
- `populate` - Campos relacionados (ex: `populate=user`)

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "nome": "Loja Centro",
      "cnpj": "12.345.678/0001-90",
      "endereco": {
        "rua": "Rua Exemplo, 123",
        "cidade": "São Paulo",
        "cep": "01234-567"
      },
      "telefone": "11988888888",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "data": {
          "id": 1,
          "attributes": {
            "username": "usuario123",
            "email": "usuario@example.com"
          }
        }
      }
    }
  }
}
```

---

### 3. Criar Loja

**POST** `/api/lojas`

Cria uma nova loja. Requer autenticação.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "data": {
    "nome": "Loja Nova",
    "cnpj": "98.765.432/0001-10",
    "endereco": {
      "rua": "Avenida Nova, 456",
      "cidade": "Rio de Janeiro",
      "cep": "20000-000",
      "estado": "RJ"
    },
    "telefone": "21977777777",
    "user": 1
  }
}
```

*Nota: O campo `user` deve ser o ID do usuário proprietário da loja*

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 2,
    "attributes": {
      "nome": "Loja Nova",
      "cnpj": "98.765.432/0001-10",
      "endereco": {...},
      "telefone": "21977777777",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 4. Atualizar Loja

**PUT** `/api/lojas/{id}`

Atualiza uma loja existente. Requer autenticação e permissão.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "data": {
    "nome": "Loja Atualizada",
    "telefone": "21999999999"
  }
}
```

---

### 5. Deletar Loja

**DELETE** `/api/lojas/{id}`

Deleta uma loja. Requer autenticação e permissão.

**Headers:**
```
Authorization: Bearer {token}
```

---

## Modelos de Dados

### User (Usuário)

```typescript
{
  id: number;
  username: string;          // obrigatório, mínimo 3 caracteres, único
  email: string;             // obrigatório, formato email, único
  password: string;           // obrigatório, mínimo 6 caracteres (não retornado na API)
  telefone?: string;          // opcional
  confirmed: boolean;         // padrão: false
  blocked: boolean;           // padrão: false
  plano?: Plano;              // relação Many-to-One
  lojas?: Loja[];             // relação One-to-Many
  createdAt: string;
  updatedAt: string;
}
```

### Plano

```typescript
{
  id: number;
  nome: string;               // obrigatório
  limiteLojas: number;        // obrigatório
  preco: number;              // obrigatório (decimal)
  descricao?: string;         // opcional
  users?: User[];             // relação One-to-Many
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}
```

### Loja

```typescript
{
  id: number;
  nome: string;               // obrigatório
  cnpj?: string;              // opcional
  endereco?: object;          // opcional (JSON)
  telefone?: string;          // opcional
  user: User;                 // relação Many-to-One (obrigatório)
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}
```

---

## Filtros e Buscas

O Strapi suporta filtros avançados usando query parameters:

### Filtros Básicos

```
GET /api/lojas?filters[nome][$eq]=Loja Centro
GET /api/planos?filters[preco][$lt]=100
GET /api/planos?filters[preco][$gte]=50
```

### Operadores Disponíveis

- `$eq` - Igual a
- `$ne` - Diferente de
- `$lt` - Menor que
- `$lte` - Menor ou igual a
- `$gt` - Maior que
- `$gte` - Maior ou igual a
- `$in` - Está em (array)
- `$notIn` - Não está em (array)
- `$contains` - Contém (string)
- `$notContains` - Não contém (string)
- `$startsWith` - Começa com
- `$endsWith` - Termina com

### Exemplos de Filtros

```
# Buscar planos com preço entre 50 e 200
GET /api/planos?filters[preco][$gte]=50&filters[preco][$lte]=200

# Buscar lojas por nome que contém "Centro"
GET /api/lojas?filters[nome][$contains]=Centro

# Buscar usuários com plano específico
GET /api/users?filters[plano][id][$eq]=1&populate=plano
```

---

## Ordenação

Use o parâmetro `sort` para ordenar resultados:

```
# Ordenar por nome (ascendente)
GET /api/planos?sort=nome

# Ordenar por preço (descendente)
GET /api/planos?sort=preco:desc

# Ordenar por múltiplos campos
GET /api/lojas?sort=createdAt:desc,nome:asc
```

---

## Paginação

Todos os endpoints de listagem suportam paginação:

```
GET /api/planos?pagination[page]=1&pagination[pageSize]=10
```

**Resposta:**
```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 50
    }
  }
}
```

---

## Populate (Relacionamentos)

Para incluir dados de relacionamentos, use o parâmetro `populate`:

```
# Popular um relacionamento
GET /api/users/me?populate=plano

# Popular múltiplos relacionamentos
GET /api/users/me?populate=plano,lojas

# Popular todos os relacionamentos
GET /api/users/me?populate=*

# Popular relacionamentos aninhados
GET /api/users/me?populate[lojas][populate]=user
```

---

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida (validação falhou)
- `401` - Não autenticado (token inválido ou ausente)
- `403` - Sem permissão (usuário bloqueado ou sem permissão)
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

---

## Exemplos de Uso no Flutter

### Exemplo 1: Login

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('http://localhost:1337/api/auth/local'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'identifier': email,
      'password': password,
    }),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Falha no login');
  }
}
```

### Exemplo 2: Listar Planos

```dart
Future<List<Map<String, dynamic>>> getPlanos() async {
  final response = await http.get(
    Uri.parse('http://localhost:1337/api/planos'),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return List<Map<String, dynamic>>.from(data['data']);
  } else {
    throw Exception('Falha ao carregar planos');
  }
}
```

### Exemplo 3: Criar Loja (com autenticação)

```dart
Future<Map<String, dynamic>> criarLoja({
  required String token,
  required String nome,
  String? cnpj,
  Map<String, dynamic>? endereco,
  String? telefone,
  required int userId,
}) async {
  final response = await http.post(
    Uri.parse('http://localhost:1337/api/lojas'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'data': {
        'nome': nome,
        'cnpj': cnpj,
        'endereco': endereco,
        'telefone': telefone,
        'user': userId,
      },
    }),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Falha ao criar loja');
  }
}
```

### Exemplo 4: Obter Usuário Atual

```dart
Future<Map<String, dynamic>> getUsuarioAtual(String token) async {
  final response = await http.get(
    Uri.parse('http://localhost:1337/api/users/me'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Falha ao obter usuário');
  }
}
```

---

## Notas Importantes

1. **Base URL**: Lembre-se de substituir `localhost:1337` pelo endereço do seu servidor em produção.

2. **Content-Type**: Sempre inclua `Content-Type: application/json` nos headers de requisições POST/PUT.

3. **Autenticação**: A maioria dos endpoints requer autenticação via token JWT no header `Authorization`.

4. **Relacionamentos**: Para atualizar relacionamentos, use o ID do objeto relacionado (ex: `"plano": 1` ou `"user": 2`).

5. **Draft & Publish**: Os content types `plano` e `loja` usam Draft & Publish. Certifique-se de que os registros estão publicados para aparecerem nas consultas.

6. **Validação**: O Strapi valida automaticamente os dados. Campos obrigatórios devem ser fornecidos, e formatos (email, etc.) são validados.

---

## Suporte

Para mais informações sobre a API do Strapi, consulte a [documentação oficial](https://docs.strapi.io/dev-docs/api/rest).

