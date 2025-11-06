# Documentação Completa da API - Integração Flutter

## 📋 Índice

1. [Informações Gerais](#informações-gerais)
2. [Configuração Base](#configuração-base)
3. [Modelos de Dados](#modelos-de-dados)
4. [Endpoints da API](#endpoints-da-api)
5. [Códigos de Status HTTP](#códigos-de-status-http)
6. [Exemplos de Código Flutter](#exemplos-de-código-flutter)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Validações e Regras de Negócio](#validações-e-regras-de-negócio)
9. [Boas Práticas](#boas-práticas)

---

## 📌 Informações Gerais

### Tecnologia
- **Framework**: Strapi v5.29.0
- **Protocolo**: HTTP/HTTPS
- **Formato de Dados**: JSON
- **Método de Autenticação**: API Token (configurável via Strapi Admin)

### URL Base
```
http://localhost:1337/api
```
**Nota**: Em produção, substitua `localhost:1337` pela URL do seu servidor.

### Estrutura de Resposta Padrão
A API segue o padrão Strapi, onde todas as respostas bem-sucedidas têm a seguinte estrutura:

```json
{
  "data": {
    // Dados da entidade
  },
  "meta": {
    // Metadados (pagination, etc)
  }
}
```

### Headers Padrão
```http
Content-Type: application/json
Accept: application/json
```

**Se autenticação estiver habilitada:**
```http
Authorization: Bearer {SEU_TOKEN_API}
```

---

## 🔧 Configuração Base

### Limites de Paginação
- **Limite padrão**: 25 registros
- **Limite máximo**: 100 registros
- **Contagem**: Habilitada por padrão (`withCount: true`)

### Parâmetros de Query Comuns
```http
GET /api/clientes?pagination[page]=1&pagination[pageSize]=25
GET /api/clientes?sort=nome:asc
GET /api/clientes?filters[email][$eq]=joao@email.com
GET /api/clientes?fields[0]=nome&fields[1]=email
GET /api/clientes?populate=*
```

**Parâmetros disponíveis:**
- `pagination[page]`: Número da página (começa em 1)
- `pagination[pageSize]`: Itens por página (máx: 100)
- `sort`: Campo e direção (ex: `nome:asc`, `createdAt:desc`)
- `filters`: Filtros (sintaxe Strapi)
- `fields`: Campos específicos a retornar
- `populate`: Relacionamentos a popular

---

## 📊 Modelos de Dados

### Cliente

```dart
class Cliente {
  int? id;
  String nome;
  String email;
  String? telefone;
  PlansEnum? plano;
  List<Loja>? lojas;
  DateTime? createdAt;
  DateTime? updatedAt;
  DateTime? publishedAt;

  Cliente({
    this.id,
    required this.nome,
    required this.email,
    this.telefone,
    this.plano,
    this.lojas,
    this.createdAt,
    this.updatedAt,
    this.publishedAt,
  });

  factory Cliente.fromJson(Map<String, dynamic> json) {
    return Cliente(
      id: json['id'],
      nome: json['nome'],
      email: json['email'],
      telefone: json['telefone'],
      plano: json['plano'] != null 
        ? PlansEnum.fromJson(json['plano'] is Map ? json['plano'] : json['plano']['data'])
        : null,
      lojas: json['lojas'] != null
        ? (json['lojas'] is List
            ? (json['lojas'] as List).map((e) => Loja.fromJson(e is Map ? e : e['data'])).toList()
            : (json['lojas']['data'] as List).map((e) => Loja.fromJson(e)).toList())
        : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      publishedAt: json['publishedAt'] != null ? DateTime.parse(json['publishedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nome': nome,
      'email': email,
      if (telefone != null) 'telefone': telefone,
      if (plano != null) 'plano': plano!.id,
    };
  }
}
```

**Campos obrigatórios:**
- `nome` (String)
- `email` (String, único, formato email válido)

**Campos opcionais:**
- `telefone` (String)
- `plano` (Relation - ID do plano)

**Validações:**
- Email deve ser único no sistema
- Email deve ter formato válido

---

### Loja

```dart
class Loja {
  int? id;
  String nome;
  String cnpj;
  String? endereco;
  String? telefone;
  Cliente? cliente;
  DateTime? createdAt;
  DateTime? updatedAt;
  DateTime? publishedAt;

  Loja({
    this.id,
    required this.nome,
    required this.cnpj,
    this.endereco,
    this.telefone,
    this.cliente,
    this.createdAt,
    this.updatedAt,
    this.publishedAt,
  });

  factory Loja.fromJson(Map<String, dynamic> json) {
    return Loja(
      id: json['id'],
      nome: json['nome'],
      cnpj: json['cnpj'],
      endereco: json['endereco'],
      telefone: json['telefone'],
      cliente: json['cliente'] != null
        ? Cliente.fromJson(json['cliente'] is Map ? json['cliente'] : json['cliente']['data'])
        : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      publishedAt: json['publishedAt'] != null ? DateTime.parse(json['publishedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nome': nome,
      'cnpj': cnpj,
      if (endereco != null) 'endereco': endereco,
      if (telefone != null) 'telefone': telefone,
      if (cliente != null) 'cliente': cliente!.id,
    };
  }
}
```

**Campos obrigatórios:**
- `nome` (String)
- `cnpj` (String)
- `cliente` (Relation - ID do cliente)

**Campos opcionais:**
- `endereco` (Text)
- `telefone` (String)

**Validações:**
- Cliente é obrigatório
- Cliente deve existir
- Cliente deve ter um plano válido
- Limite de lojas baseado no plano do cliente

---

### PlansEnum (Plano)

```dart
class PlansEnum {
  int? id;
  String nome;
  int limiteLojas; // Pode ser Infinity (representado como -1 ou null)
  double preco;
  String? descricao;
  Map<String, dynamic>? recursos; // JSON
  DateTime? createdAt;
  DateTime? updatedAt;
  DateTime? publishedAt;

  PlansEnum({
    this.id,
    required this.nome,
    required this.limiteLojas,
    required this.preco,
    this.descricao,
    this.recursos,
    this.createdAt,
    this.updatedAt,
    this.publishedAt,
  });

  factory PlansEnum.fromJson(Map<String, dynamic> json) {
    return PlansEnum(
      id: json['id'],
      nome: json['nome'],
      limiteLojas: json['limiteLojas'] == null || json['limiteLojas'] == -1 
        ? -1 // Representa ilimitado
        : json['limiteLojas'] as int,
      preco: (json['preco'] is num) ? json['preco'].toDouble() : double.parse(json['preco']),
      descricao: json['descricao'],
      recursos: json['recursos'] is Map ? json['recursos'] : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      publishedAt: json['publishedAt'] != null ? DateTime.parse(json['publishedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nome': nome,
      'limiteLojas': limiteLojas == -1 ? null : limiteLojas,
      'preco': preco,
      if (descricao != null) 'descricao': descricao,
      if (recursos != null) 'recursos': recursos,
    };
  }

  bool get isIlimitado => limiteLojas == -1;
}
```

**Campos obrigatórios:**
- `nome` (String)
- `limiteLojas` (Integer) - Pode ser um número ou `null`/`Infinity` para ilimitado
- `preco` (Decimal)

**Campos opcionais:**
- `descricao` (Text)
- `recursos` (JSON)

**Nota**: O campo `limiteLojas` pode ser `null` ou um número muito alto para representar planos ilimitados. Na API, isso é tratado como `Infinity`.

---

## 🚀 Endpoints da API

### Cliente

#### 1. Listar Clientes

**Endpoint:**
```http
GET /api/clientes
```

**Parâmetros de Query (opcionais):**
```http
GET /api/clientes?pagination[page]=1&pagination[pageSize]=25&sort=nome:asc&populate=*
GET /api/clientes?filters[email][$eq]=joao@email.com
GET /api/clientes?filters[plano][id][$eq]=1
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-9999",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "publishedAt": "2024-01-15T10:30:00.000Z",
      "plano": {
        "id": 1,
        "nome": "Basico",
        "limiteLojas": 1,
        "preco": 150.00,
        "descricao": "Plano básico",
        "recursos": {
          "suporte": "email",
          "backup": false
        }
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

**Código Flutter:**
```dart
Future<List<Cliente>> listarClientes({
  int page = 1,
  int pageSize = 25,
  String? sort,
  Map<String, dynamic>? filters,
}) async {
  final queryParams = <String, String>{
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
    'populate': '*',
  };
  
  if (sort != null) queryParams['sort'] = sort;
  
  final uri = Uri.parse('$baseUrl/clientes').replace(queryParameters: queryParams);
  final response = await http.get(uri, headers: headers);
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return (json['data'] as List)
        .map((e) => Cliente.fromJson(e))
        .toList();
  } else {
    throw Exception('Erro ao listar clientes: ${response.statusCode}');
  }
}
```

---

#### 2. Buscar Cliente por ID

**Endpoint:**
```http
GET /api/clientes/:id
```

**Parâmetros de Path:**
- `id` (Integer): ID do cliente

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "publishedAt": "2024-01-15T10:30:00.000Z",
    "plano": {
      "id": 1,
      "nome": "Basico",
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

**Resposta de Erro (404):**
```json
{
  "error": {
    "status": 404,
    "message": "Not Found"
  }
}
```

**Código Flutter:**
```dart
Future<Cliente> buscarClientePorId(int id) async {
  final uri = Uri.parse('$baseUrl/clientes/$id?populate=*');
  final response = await http.get(uri, headers: headers);
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return Cliente.fromJson(json['data']);
  } else if (response.statusCode == 404) {
    throw NotFoundException('Cliente não encontrado');
  } else {
    throw Exception('Erro ao buscar cliente: ${response.statusCode}');
  }
}
```

---

#### 3. Criar Cliente

**Endpoint:**
```http
POST /api/clientes
```

**Body:**
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

**Campos obrigatórios:**
- `nome` (String)
- `email` (String, único)

**Campos opcionais:**
- `telefone` (String)
- `plano` (Integer - ID do plano)

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "publishedAt": "2024-01-15T10:30:00.000Z",
    "plano": {
      "id": 1,
      "nome": "Basico",
      "limiteLojas": 1,
      "preco": 150.00
    },
    "lojas": []
  }
}
```

**Resposta de Erro - Email Duplicado (400):**
```json
{
  "error": {
    "status": 400,
    "message": "Email já cadastrado"
  }
}
```

**Código Flutter:**
```dart
Future<Cliente> criarCliente(Cliente cliente) async {
  final uri = Uri.parse('$baseUrl/clientes');
  final body = jsonEncode({
    'data': cliente.toJson(),
  });
  
  final response = await http.post(
    uri,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: body,
  );
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return Cliente.fromJson(json['data']);
  } else if (response.statusCode == 400) {
    final error = jsonDecode(response.body);
    throw ValidationException(error['error']['message']);
  } else {
    throw Exception('Erro ao criar cliente: ${response.statusCode}');
  }
}
```

---

#### 4. Atualizar Cliente

**Endpoint:**
```http
PUT /api/clientes/:id
```

**Parâmetros de Path:**
- `id` (Integer): ID do cliente

**Body:**
```json
{
  "data": {
    "nome": "João Silva Atualizado",
    "email": "joao.novo@email.com",
    "telefone": "(11) 88888-8888",
    "plano": 2
  }
}
```

**Nota**: Você pode enviar apenas os campos que deseja atualizar. Campos não enviados permanecerão inalterados.

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "nome": "João Silva Atualizado",
    "email": "joao.novo@email.com",
    "telefone": "(11) 88888-8888",
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

**Resposta de Erro - Email Duplicado (400):**
```json
{
  "error": {
    "status": 400,
    "message": "Email já cadastrado"
  }
}
```

**Resposta de Erro - Limite de Lojas Excedido (400):**
```json
{
  "error": {
    "status": 400,
    "message": "Não é possível alterar para o plano Basico. Cliente possui 3 loja(s), mas o plano Basico permite apenas 1 loja(s). Remova algumas lojas antes de alterar o plano."
  }
}
```

**Código Flutter:**
```dart
Future<Cliente> atualizarCliente(int id, Map<String, dynamic> dados) async {
  final uri = Uri.parse('$baseUrl/clientes/$id');
  final body = jsonEncode({
    'data': dados,
  });
  
  final response = await http.put(
    uri,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: body,
  );
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return Cliente.fromJson(json['data']);
  } else if (response.statusCode == 400) {
    final error = jsonDecode(response.body);
    throw ValidationException(error['error']['message']);
  } else if (response.statusCode == 404) {
    throw NotFoundException('Cliente não encontrado');
  } else {
    throw Exception('Erro ao atualizar cliente: ${response.statusCode}');
  }
}
```

---

#### 5. Deletar Cliente

**Endpoint:**
```http
DELETE /api/clientes/:id
```

**Parâmetros de Path:**
- `id` (Integer): ID do cliente

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    ...
  }
}
```

**Código Flutter:**
```dart
Future<void> deletarCliente(int id) async {
  final uri = Uri.parse('$baseUrl/clientes/$id');
  final response = await http.delete(uri, headers: headers);
  
  if (response.statusCode == 200) {
    return;
  } else if (response.statusCode == 404) {
    throw NotFoundException('Cliente não encontrado');
  } else {
    throw Exception('Erro ao deletar cliente: ${response.statusCode}');
  }
}
```

---

#### 6. Obter Informações do Plano

**Endpoint:**
```http
GET /api/clientes/plano/:planoId
```

**Parâmetros de Path:**
- `planoId` (Integer): ID do plano

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "nome": "Basico",
    "limiteLojas": 1,
    "preco": 150.00,
    "descricao": "Máximo de 1 loja(s)",
    "recursos": {
      "suporte": "email",
      "backup": false
    }
  }
}
```

**Resposta de Erro (404):**
```json
{
  "error": {
    "status": 404,
    "message": "Plano não encontrado"
  }
}
```

**Código Flutter:**
```dart
Future<PlansEnum> obterInfoPlano(int planoId) async {
  final uri = Uri.parse('$baseUrl/clientes/plano/$planoId');
  final response = await http.get(uri, headers: headers);
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return PlansEnum.fromJson(json['data']);
  } else if (response.statusCode == 404) {
    throw NotFoundException('Plano não encontrado');
  } else {
    throw Exception('Erro ao buscar plano: ${response.statusCode}');
  }
}
```

---

#### 7. Listar Planos Disponíveis

**Endpoint:**
```http
GET /api/clientes/planos-disponiveis
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": 1,
      "nome": "Basico",
      "limiteLojas": 1,
      "preco": 150.00,
      "descricao": "Plano básico com recursos essenciais",
      "recursos": {
        "suporte": "email",
        "backup": false
      }
    },
    {
      "id": 2,
      "nome": "Intermedium",
      "limiteLojas": 3,
      "preco": 300.00,
      "descricao": "Plano intermediário com mais recursos",
      "recursos": {
        "suporte": "email e telefone",
        "backup": true
      }
    },
    {
      "id": 3,
      "nome": "Advanced",
      "limiteLojas": null,
      "preco": 500.00,
      "descricao": "Plano avançado com recursos ilimitados",
      "recursos": {
        "suporte": "24/7",
        "backup": true,
        "api": true
      }
    }
  ]
}
```

**Nota**: Os planos são retornados ordenados por preço (ascendente).

**Código Flutter:**
```dart
Future<List<PlansEnum>> listarPlanosDisponiveis() async {
  final uri = Uri.parse('$baseUrl/clientes/planos-disponiveis');
  final response = await http.get(uri, headers: headers);
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return (json['data'] as List)
        .map((e) => PlansEnum.fromJson(e))
        .toList();
  } else {
    throw Exception('Erro ao listar planos: ${response.statusCode}');
  }
}
```

---

### Loja

#### 1. Listar Lojas

**Endpoint:**
```http
GET /api/lojas
```

**Parâmetros de Query (opcionais):**
```http
GET /api/lojas?pagination[page]=1&pagination[pageSize]=25
GET /api/lojas?filters[cliente][id][$eq]=1
GET /api/lojas?populate=*
```

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": 1,
      "nome": "Loja Central",
      "cnpj": "12.345.678/0001-90",
      "endereco": "Rua das Flores, 123",
      "telefone": "(11) 3333-4444",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "publishedAt": "2024-01-15T10:30:00.000Z",
      "cliente": {
        "id": 1,
        "nome": "João Silva",
        "email": "joao@email.com",
        "plano": {
          "id": 1,
          "nome": "Basico",
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

**Código Flutter:**
```dart
Future<List<Loja>> listarLojas({
  int page = 1,
  int pageSize = 25,
  int? clienteId,
}) async {
  final queryParams = <String, String>{
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
    'populate': '*',
  };
  
  if (clienteId != null) {
    queryParams['filters[cliente][id][\$eq]'] = clienteId.toString();
  }
  
  final uri = Uri.parse('$baseUrl/lojas').replace(queryParameters: queryParams);
  final response = await http.get(uri, headers: headers);
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return (json['data'] as List)
        .map((e) => Loja.fromJson(e))
        .toList();
  } else {
    throw Exception('Erro ao listar lojas: ${response.statusCode}');
  }
}
```

---

#### 2. Buscar Loja por ID

**Endpoint:**
```http
GET /api/lojas/:id
```

**Parâmetros de Path:**
- `id` (Integer): ID da loja

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "nome": "Loja Central",
    "cnpj": "12.345.678/0001-90",
    "endereco": "Rua das Flores, 123",
    "telefone": "(11) 3333-4444",
    "cliente": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "plano": {
        "id": 1,
        "nome": "Basico",
        "limiteLojas": 1,
        "preco": 150.00
      }
    }
  },
  "meta": {}
}
```

**Código Flutter:**
```dart
Future<Loja> buscarLojaPorId(int id) async {
  final uri = Uri.parse('$baseUrl/lojas/$id?populate=*');
  final response = await http.get(uri, headers: headers);
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return Loja.fromJson(json['data']);
  } else if (response.statusCode == 404) {
    throw NotFoundException('Loja não encontrada');
  } else {
    throw Exception('Erro ao buscar loja: ${response.statusCode}');
  }
}
```

---

#### 3. Criar Loja

**Endpoint:**
```http
POST /api/lojas
```

**Body:**
```json
{
  "data": {
    "nome": "Loja Central",
    "cnpj": "12.345.678/0001-90",
    "endereco": "Rua das Flores, 123",
    "telefone": "(11) 3333-4444",
    "cliente": 1
  }
}
```

**Campos obrigatórios:**
- `nome` (String)
- `cnpj` (String)
- `cliente` (Integer - ID do cliente)

**Campos opcionais:**
- `endereco` (Text)
- `telefone` (String)

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "nome": "Loja Central",
    "cnpj": "12.345.678/0001-90",
    "endereco": "Rua das Flores, 123",
    "telefone": "(11) 3333-4444",
    "cliente": {
      "id": 1,
      "nome": "João Silva",
      "plano": {
        "id": 1,
        "nome": "Basico",
        "limiteLojas": 1
      }
    }
  }
}
```

**Resposta de Erro - Cliente Obrigatório (400):**
```json
{
  "error": {
    "status": 400,
    "message": "Cliente é obrigatório para criar uma loja"
  }
}
```

**Resposta de Erro - Cliente Não Encontrado (400):**
```json
{
  "error": {
    "status": 400,
    "message": "Cliente não encontrado"
  }
}
```

**Resposta de Erro - Cliente Sem Plano (400):**
```json
{
  "error": {
    "status": 400,
    "message": "Cliente não possui um plano válido"
  }
}
```

**Resposta de Erro - Limite de Lojas Excedido (400):**
```json
{
  "error": {
    "status": 400,
    "message": "Limite de lojas excedido para o plano Basico. Plano Basico permite 1 loja(s). Cliente já possui 1 loja(s)."
  }
}
```

**Código Flutter:**
```dart
Future<Loja> criarLoja(Loja loja) async {
  final uri = Uri.parse('$baseUrl/lojas');
  final body = jsonEncode({
    'data': loja.toJson(),
  });
  
  final response = await http.post(
    uri,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: body,
  );
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return Loja.fromJson(json['data']);
  } else if (response.statusCode == 400) {
    final error = jsonDecode(response.body);
    throw ValidationException(error['error']['message']);
  } else {
    throw Exception('Erro ao criar loja: ${response.statusCode}');
  }
}
```

---

#### 4. Atualizar Loja

**Endpoint:**
```http
PUT /api/lojas/:id
```

**Parâmetros de Path:**
- `id` (Integer): ID da loja

**Body:**
```json
{
  "data": {
    "nome": "Loja Central Atualizada",
    "endereco": "Nova Rua, 456",
    "cliente": 2
  }
}
```

**Nota**: Você pode enviar apenas os campos que deseja atualizar. Se alterar o `cliente`, o sistema validará se o novo cliente pode receber mais uma loja.

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "nome": "Loja Central Atualizada",
    "cnpj": "12.345.678/0001-90",
    "endereco": "Nova Rua, 456",
    "telefone": "(11) 3333-4444",
    "cliente": {
      "id": 2,
      "nome": "Maria Santos",
      "plano": {
        "id": 2,
        "nome": "Intermedium",
        "limiteLojas": 3
      }
    }
  }
}
```

**Resposta de Erro - Limite de Lojas Excedido (400):**
```json
{
  "error": {
    "status": 400,
    "message": "Limite de lojas excedido para o plano Basico. Plano Basico permite 1 loja(s). Cliente já possui 1 loja(s)."
  }
}
```

**Código Flutter:**
```dart
Future<Loja> atualizarLoja(int id, Map<String, dynamic> dados) async {
  final uri = Uri.parse('$baseUrl/lojas/$id');
  final body = jsonEncode({
    'data': dados,
  });
  
  final response = await http.put(
    uri,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: body,
  );
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    return Loja.fromJson(json['data']);
  } else if (response.statusCode == 400) {
    final error = jsonDecode(response.body);
    throw ValidationException(error['error']['message']);
  } else if (response.statusCode == 404) {
    throw NotFoundException('Loja não encontrada');
  } else {
    throw Exception('Erro ao atualizar loja: ${response.statusCode}');
  }
}
```

---

#### 5. Deletar Loja

**Endpoint:**
```http
DELETE /api/lojas/:id
```

**Parâmetros de Path:**
- `id` (Integer): ID da loja

**Resposta de Sucesso (200):**
```json
{
  "data": {
    "id": 1,
    "nome": "Loja Central",
    "cnpj": "12.345.678/0001-90",
    ...
  }
}
```

**Código Flutter:**
```dart
Future<void> deletarLoja(int id) async {
  final uri = Uri.parse('$baseUrl/lojas/$id');
  final response = await http.delete(uri, headers: headers);
  
  if (response.statusCode == 200) {
    return;
  } else if (response.statusCode == 404) {
    throw NotFoundException('Loja não encontrada');
  } else {
    throw Exception('Erro ao deletar loja: ${response.statusCode}');
  }
}
```

---

### PlansEnum (Plano)

**Nota**: O endpoint de PlansEnum usa o router padrão do Strapi. Os endpoints disponíveis são:

#### 1. Listar Planos
```http
GET /api/plans-enums
```

#### 2. Buscar Plano por ID
```http
GET /api/plans-enums/:id
```

**Recomendação**: Use os endpoints customizados de cliente (`/api/clientes/planos-disponiveis`) que já retornam os planos ordenados por preço.

---

## 📡 Códigos de Status HTTP

### Códigos de Sucesso
- **200 OK**: Requisição bem-sucedida
- **201 Created**: Recurso criado com sucesso (Strapi geralmente retorna 200)

### Códigos de Erro do Cliente
- **400 Bad Request**: Erro de validação ou regra de negócio violada
  - Email duplicado
  - Limite de lojas excedido
  - Campos obrigatórios ausentes
  - Cliente não encontrado (ao criar loja)
  - Cliente sem plano válido

- **404 Not Found**: Recurso não encontrado
  - Cliente/Loja/Plano não existe

- **422 Unprocessable Entity**: Erro de validação de dados (formato inválido)

### Códigos de Erro do Servidor
- **500 Internal Server Error**: Erro interno do servidor
- **503 Service Unavailable**: Serviço temporariamente indisponível

---

## 💻 Exemplos de Código Flutter

### Classe de Serviço Completa

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:1337/api';
  static String? _token;

  static Map<String, String> get headers {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    
    return headers;
  }

  static void setToken(String? token) {
    _token = token;
  }

  // ========== CLIENTE ==========
  
  Future<List<Cliente>> listarClientes({
    int page = 1,
    int pageSize = 25,
    String? sort,
  }) async {
    final queryParams = <String, String>{
      'pagination[page]': page.toString(),
      'pagination[pageSize]': pageSize.toString(),
      'populate': '*',
    };
    
    if (sort != null) queryParams['sort'] = sort;
    
    final uri = Uri.parse('$baseUrl/clientes').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: headers);
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return (json['data'] as List)
        .map((e) => Cliente.fromJson(e))
        .toList();
  }

  Future<Cliente> buscarClientePorId(int id) async {
    final uri = Uri.parse('$baseUrl/clientes/$id?populate=*');
    final response = await http.get(uri, headers: headers);
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Cliente.fromJson(json['data']);
  }

  Future<Cliente> criarCliente(Cliente cliente) async {
    final uri = Uri.parse('$baseUrl/clientes');
    final body = jsonEncode({
      'data': cliente.toJson(),
    });
    
    final response = await http.post(
      uri,
      headers: headers,
      body: body,
    );
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Cliente.fromJson(json['data']);
  }

  Future<Cliente> atualizarCliente(int id, Map<String, dynamic> dados) async {
    final uri = Uri.parse('$baseUrl/clientes/$id');
    final body = jsonEncode({
      'data': dados,
    });
    
    final response = await http.put(
      uri,
      headers: headers,
      body: body,
    );
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Cliente.fromJson(json['data']);
  }

  Future<void> deletarCliente(int id) async {
    final uri = Uri.parse('$baseUrl/clientes/$id');
    final response = await http.delete(uri, headers: headers);
    _handleResponse(response);
  }

  Future<PlansEnum> obterInfoPlano(int planoId) async {
    final uri = Uri.parse('$baseUrl/clientes/plano/$planoId');
    final response = await http.get(uri, headers: headers);
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return PlansEnum.fromJson(json['data']);
  }

  Future<List<PlansEnum>> listarPlanosDisponiveis() async {
    final uri = Uri.parse('$baseUrl/clientes/planos-disponiveis');
    final response = await http.get(uri, headers: headers);
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return (json['data'] as List)
        .map((e) => PlansEnum.fromJson(e))
        .toList();
  }

  // ========== LOJA ==========

  Future<List<Loja>> listarLojas({
    int page = 1,
    int pageSize = 25,
    int? clienteId,
  }) async {
    final queryParams = <String, String>{
      'pagination[page]': page.toString(),
      'pagination[pageSize]': pageSize.toString(),
      'populate': '*',
    };
    
    if (clienteId != null) {
      queryParams['filters[cliente][id][\$eq]'] = clienteId.toString();
    }
    
    final uri = Uri.parse('$baseUrl/lojas').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: headers);
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return (json['data'] as List)
        .map((e) => Loja.fromJson(e))
        .toList();
  }

  Future<Loja> buscarLojaPorId(int id) async {
    final uri = Uri.parse('$baseUrl/lojas/$id?populate=*');
    final response = await http.get(uri, headers: headers);
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Loja.fromJson(json['data']);
  }

  Future<Loja> criarLoja(Loja loja) async {
    final uri = Uri.parse('$baseUrl/lojas');
    final body = jsonEncode({
      'data': loja.toJson(),
    });
    
    final response = await http.post(
      uri,
      headers: headers,
      body: body,
    );
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Loja.fromJson(json['data']);
  }

  Future<Loja> atualizarLoja(int id, Map<String, dynamic> dados) async {
    final uri = Uri.parse('$baseUrl/lojas/$id');
    final body = jsonEncode({
      'data': dados,
    });
    
    final response = await http.put(
      uri,
      headers: headers,
      body: body,
    );
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Loja.fromJson(json['data']);
  }

  Future<void> deletarLoja(int id) async {
    final uri = Uri.parse('$baseUrl/lojas/$id');
    final response = await http.delete(uri, headers: headers);
    _handleResponse(response);
  }

  // ========== HELPERS ==========

  void _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }

    final errorBody = jsonDecode(response.body);
    
    if (response.statusCode == 400) {
      throw ValidationException(errorBody['error']['message']);
    } else if (response.statusCode == 404) {
      throw NotFoundException('Recurso não encontrado');
    } else if (response.statusCode == 422) {
      throw ValidationException('Dados inválidos');
    } else {
      throw Exception('Erro ${response.statusCode}: ${errorBody['error']?['message'] ?? 'Erro desconhecido'}');
    }
  }
}

// Exceções customizadas
class ValidationException implements Exception {
  final String message;
  ValidationException(this.message);
  
  @override
  String toString() => message;
}

class NotFoundException implements Exception {
  final String message;
  NotFoundException(this.message);
  
  @override
  String toString() => message;
}
```

### Exemplo de Uso em um Widget

```dart
import 'package:flutter/material.dart';

class ClientesScreen extends StatefulWidget {
  @override
  _ClientesScreenState createState() => _ClientesScreenState();
}

class _ClientesScreenState extends State<ClientesScreen> {
  final ApiService _apiService = ApiService();
  List<Cliente> _clientes = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _carregarClientes();
  }

  Future<void> _carregarClientes() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final clientes = await _apiService.listarClientes();
      setState(() {
        _clientes = clientes;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _criarCliente() async {
    final novoCliente = Cliente(
      nome: 'Novo Cliente',
      email: 'novo@email.com',
      telefone: '(11) 99999-9999',
    );

    try {
      await _apiService.criarCliente(novoCliente);
      _carregarClientes();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Cliente criado com sucesso!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Clientes')),
      body: _loading
          ? Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('Erro: $_error'))
              : RefreshIndicator(
                  onRefresh: _carregarClientes,
                  child: ListView.builder(
                    itemCount: _clientes.length,
                    itemBuilder: (context, index) {
                      final cliente = _clientes[index];
                      return ListTile(
                        title: Text(cliente.nome),
                        subtitle: Text(cliente.email),
                        trailing: Text(
                          cliente.plano?.nome ?? 'Sem plano',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                        onTap: () {
                          // Navegar para detalhes do cliente
                        },
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _criarCliente,
        child: Icon(Icons.add),
      ),
    );
  }
}
```

### Exemplo de Validação Antes de Criar Loja

```dart
Future<bool> podeCriarLoja(int clienteId) async {
  try {
    final cliente = await _apiService.buscarClientePorId(clienteId);
    
    if (cliente.plano == null) {
      throw Exception('Cliente não possui um plano válido');
    }

    final plano = cliente.plano!;
    final quantidadeLojas = cliente.lojas?.length ?? 0;
    
    if (plano.isIlimitado) {
      return true;
    }

    return quantidadeLojas < plano.limiteLojas;
  } catch (e) {
    print('Erro ao verificar limite: $e');
    return false;
  }
}

Future<void> criarLojaComValidacao(Loja loja) async {
  // Validação local antes de enviar
  final podeCriar = await podeCriarLoja(loja.cliente!.id!);
  
  if (!podeCriar) {
    throw ValidationException('Limite de lojas excedido para o plano do cliente');
  }

  try {
    await _apiService.criarLoja(loja);
  } catch (e) {
    // A API também valida, mas fazer a validação local melhora a UX
    rethrow;
  }
}
```

---

## ⚠️ Tratamento de Erros

### Estrutura de Erro da API

```json
{
  "error": {
    "status": 400,
    "message": "Mensagem de erro detalhada"
  }
}
```

### Tratamento de Erros no Flutter

```dart
try {
  final cliente = await apiService.criarCliente(novoCliente);
} on ValidationException catch (e) {
  // Erro de validação (400)
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Erro de Validação'),
      content: Text(e.message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('OK'),
        ),
      ],
    ),
  );
} on NotFoundException catch (e) {
  // Recurso não encontrado (404)
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Recurso não encontrado')),
  );
} catch (e) {
  // Outros erros
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Erro: ${e.toString()}')),
  );
}
```

---

## ✅ Validações e Regras de Negócio

### Validações de Cliente

1. **Email Único**
   - O email deve ser único no sistema
   - Erro: `"Email já cadastrado"` (400)

2. **Email Válido**
   - O email deve ter formato válido
   - Erro: `422 Unprocessable Entity`

3. **Campos Obrigatórios**
   - `nome` e `email` são obrigatórios
   - Erro: `422 Unprocessable Entity`

### Validações de Loja

1. **Cliente Obrigatório**
   - Toda loja deve ter um cliente associado
   - Erro: `"Cliente é obrigatório para criar uma loja"` (400)

2. **Cliente Deve Existir**
   - O cliente informado deve existir no sistema
   - Erro: `"Cliente não encontrado"` (400)

3. **Cliente Deve Ter Plano**
   - O cliente deve ter um plano válido
   - Erro: `"Cliente não possui um plano válido"` (400)

4. **Limite de Lojas**
   - Não pode exceder o limite de lojas do plano do cliente
   - Erro: `"Limite de lojas excedido para o plano {nome}. Plano {nome} permite {limite} loja(s). Cliente já possui {quantidade} loja(s)."` (400)

### Validações de Atualização de Cliente

1. **Downgrade de Plano**
   - Não é possível fazer downgrade se o cliente possui mais lojas que o novo limite permite
   - Erro: `"Não é possível alterar para o plano {nome}. Cliente possui {quantidade} loja(s), mas o plano {nome} permite apenas {limite} loja(s). Remova algumas lojas antes de alterar o plano."` (400)

2. **Email Único na Atualização**
   - O novo email não pode ser usado por outro cliente
   - Erro: `"Email já cadastrado"` (400)

### Validações de Atualização de Loja

1. **Transferência de Loja**
   - Ao transferir uma loja para outro cliente, o novo cliente deve ter espaço disponível no plano
   - Erro: `"Limite de lojas excedido para o plano {nome}..."` (400)

---

## 🎯 Boas Práticas

### 1. Gerenciamento de Estado

Use um gerenciador de estado apropriado (Provider, Riverpod, Bloc, etc.):

```dart
// Exemplo com Provider
class ClienteProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Cliente> _clientes = [];
  bool _loading = false;
  String? _error;

  List<Cliente> get clientes => _clientes;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> carregarClientes() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _clientes = await _apiService.listarClientes();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
```

### 2. Cache e Offline

Considere usar `flutter_cache_manager` ou `hive` para cache local:

```dart
import 'package:hive/hive.dart';

class ClienteRepository {
  final ApiService _apiService = ApiService();
  late Box<Cliente> _cacheBox;

  Future<void> init() async {
    _cacheBox = await Hive.openBox<Cliente>('clientes');
  }

  Future<List<Cliente>> listarClientes({bool forceRefresh = false}) async {
    if (!forceRefresh && _cacheBox.isNotEmpty) {
      return _cacheBox.values.toList();
    }

    final clientes = await _apiService.listarClientes();
    
    await _cacheBox.clear();
    for (var cliente in clientes) {
      await _cacheBox.put(cliente.id, cliente);
    }

    return clientes;
  }
}
```

### 3. Paginação Infinita

Implemente scroll infinito para melhor performance:

```dart
class ClientesInfiniteScroll extends StatefulWidget {
  @override
  _ClientesInfiniteScrollState createState() => _ClientesInfiniteScrollState();
}

class _ClientesInfiniteScrollState extends State<ClientesInfiniteScroll> {
  final ScrollController _scrollController = ScrollController();
  final ApiService _apiService = ApiService();
  List<Cliente> _clientes = [];
  int _currentPage = 1;
  bool _hasMore = true;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _carregarClientes();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent * 0.9) {
      _carregarMaisClientes();
    }
  }

  Future<void> _carregarClientes() async {
    _loading = true;
    final clientes = await _apiService.listarClientes(page: _currentPage);
    setState(() {
      _clientes.addAll(clientes);
      _hasMore = clientes.length == 25; // Assumindo pageSize = 25
      _loading = false;
    });
  }

  Future<void> _carregarMaisClientes() async {
    if (!_loading && _hasMore) {
      _currentPage++;
      await _carregarClientes();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: _scrollController,
      itemCount: _clientes.length + (_hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _clientes.length) {
          return Center(child: CircularProgressIndicator());
        }
        return ListTile(title: Text(_clientes[index].nome));
      },
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}
```

### 4. Tratamento de Timeout

Configure timeouts nas requisições:

```dart
class ApiService {
  static const Duration timeout = Duration(seconds: 30);

  Future<http.Response> _get(String url) async {
    return await http.get(
      Uri.parse(url),
      headers: headers,
    ).timeout(timeout);
  }

  Future<http.Response> _post(String url, String body) async {
    return await http.post(
      Uri.parse(url),
      headers: headers,
      body: body,
    ).timeout(timeout);
  }
}
```

### 5. Logging

Adicione logging para debug:

```dart
import 'package:logger/logger.dart';

class ApiService {
  final Logger _logger = Logger();

  Future<List<Cliente>> listarClientes() async {
    _logger.d('Buscando lista de clientes...');
    try {
      final clientes = await _apiService.listarClientes();
      _logger.i('${clientes.length} clientes encontrados');
      return clientes;
    } catch (e) {
      _logger.e('Erro ao listar clientes', error: e);
      rethrow;
    }
  }
}
```

### 6. Configuração de Ambiente

Use diferentes URLs para desenvolvimento e produção:

```dart
class ApiConfig {
  static const String devUrl = 'http://localhost:1337/api';
  static const String prodUrl = 'https://api.seudominio.com/api';

  static String get baseUrl {
    const String env = String.fromEnvironment('ENV', defaultValue: 'dev');
    return env == 'prod' ? prodUrl : devUrl;
  }
}
```

### 7. Interceptors

Use interceptors para adicionar headers automaticamente ou tratar erros:

```dart
class ApiInterceptor {
  static http.BaseClient getClient() {
    final client = http.Client();
    // Adicione lógica de interceptação aqui
    return client;
  }
}
```

---

## 📦 Dependências Necessárias

Adicione ao seu `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  # Opcional: para cache
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  # Opcional: para logging
  logger: ^2.0.0
  # Opcional: para injeção de dependência
  get_it: ^7.6.0
  # Opcional: para gerenciamento de estado
  provider: ^6.1.0
```

---

## 🔐 Autenticação (Se Habilitada)

Se você habilitar autenticação no Strapi Admin:

1. **Criar API Token no Strapi Admin**
   - Settings → API Tokens → Create new API Token
   - Escolha as permissões necessárias

2. **Usar o Token no Flutter**
```dart
ApiService.setToken('seu_token_aqui');
```

3. **Headers com Autenticação**
```dart
static Map<String, String> get headers {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer $_token',
  };
}
```

---

## 📝 Notas Importantes

1. **Estrutura de Resposta**: Sempre acesse `json['data']` para obter os dados da resposta.

2. **Populate**: Use `populate=*` nos queries para obter relacionamentos completos (plano, lojas, cliente).

3. **Limite de Lojas**: O valor `Infinity` ou `null` em `limiteLojas` significa lojas ilimitadas.

4. **Validação Dupla**: A API valida tudo, mas validar localmente melhora a experiência do usuário.

5. **Paginação**: O limite padrão é 25 e o máximo é 100 registros por página.

6. **Datas**: Todas as datas vêm no formato ISO 8601 (`2024-01-15T10:30:00.000Z`).

7. **Campos Opcionais**: Campos opcionais podem vir como `null` ou não estar presentes na resposta.

---

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor Strapi
2. Verifique a estrutura dos dados enviados
3. Confirme que a URL base está correta
4. Verifique se a autenticação está configurada corretamente (se aplicável)

---

**Última atualização**: Janeiro 2024
**Versão da API**: Strapi 5.29.0

