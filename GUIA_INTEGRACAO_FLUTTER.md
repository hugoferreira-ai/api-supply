# Guia Rápido de Integração - API Flutter

Este guia contém apenas as informações essenciais para integrar o app Flutter com a API.

---

## 🔑 Credenciais de Acesso

### Usuário de API (para autenticação no app)
- **Email**: `api@supply.com`
- **Username**: `api_user`
- **Senha**: `Api123!@#`

**Nota**: Você pode personalizar essas credenciais através de variáveis de ambiente no servidor.

---

## 🌐 URL Base da API

```
http://localhost:1337/api
```

**Produção**: Substitua `localhost:1337` pela URL do seu servidor.

---

## 🔐 Autenticação

### 1. Fazer Login

**Endpoint:**
```http
POST /api/auth/local
Content-Type: application/json
```

**Body:**
```json
{
  "identifier": "api@supply.com",
  "password": "Api123!@#"
}
```

**Resposta de Sucesso (200):**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "api_user",
    "email": "api@supply.com",
    "confirmed": true,
    "blocked": false
  }
}
```

### 2. Usar o Token nas Requisições

Após obter o token JWT, inclua-o no header `Authorization`:

```http
Authorization: Bearer {SEU_TOKEN_JWT}
```

---

## 📱 Código Flutter - Autenticação

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseUrl = 'http://localhost:1337/api';
  static String? _token;

  // Fazer login
  static Future<String> login(String email, String password) async {
    final uri = Uri.parse('$baseUrl/auth/local');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': email, // Pode ser email ou username
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      _token = json['jwt'];
      return _token!;
    } else {
      throw Exception('Erro ao fazer login: ${response.statusCode}');
    }
  }

  // Obter headers com autenticação
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

  static void logout() {
    _token = null;
  }
}
```

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

  Cliente({
    this.id,
    required this.nome,
    required this.email,
    this.telefone,
    this.plano,
    this.lojas,
    this.createdAt,
    this.updatedAt,
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

  Loja({
    this.id,
    required this.nome,
    required this.cnpj,
    this.endereco,
    this.telefone,
    this.cliente,
    this.createdAt,
    this.updatedAt,
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

### PlansEnum (Plano)

```dart
class PlansEnum {
  int? id;
  String nome;
  int limiteLojas; // -1 significa ilimitado
  double preco;
  String? descricao;
  Map<String, dynamic>? recursos;

  PlansEnum({
    this.id,
    required this.nome,
    required this.limiteLojas,
    required this.preco,
    this.descricao,
    this.recursos,
  });

  factory PlansEnum.fromJson(Map<String, dynamic> json) {
    return PlansEnum(
      id: json['id'],
      nome: json['nome'],
      limiteLojas: json['limiteLojas'] == null || json['limiteLojas'] == -1 
        ? -1 
        : json['limiteLojas'] as int,
      preco: (json['preco'] is num) ? json['preco'].toDouble() : double.parse(json['preco']),
      descricao: json['descricao'],
      recursos: json['recursos'] is Map ? json['recursos'] : null,
    );
  }

  bool get isIlimitado => limiteLojas == -1;
}
```

---

## 🚀 Endpoints Principais

### Cliente

#### Listar Clientes
```http
GET /api/clientes?populate=*
Authorization: Bearer {TOKEN}
```

#### Buscar Cliente por ID
```http
GET /api/clientes/:id?populate=*
Authorization: Bearer {TOKEN}
```

#### Criar Cliente
```http
POST /api/clientes
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "data": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "plano": 1
  }
}
```

#### Atualizar Cliente
```http
PUT /api/clientes/:id
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "data": {
    "nome": "João Silva Atualizado"
  }
}
```

#### Deletar Cliente
```http
DELETE /api/clientes/:id
Authorization: Bearer {TOKEN}
```

#### Listar Planos Disponíveis
```http
GET /api/clientes/planos-disponiveis
Authorization: Bearer {TOKEN}
```

### Loja

#### Listar Lojas
```http
GET /api/lojas?populate=*
Authorization: Bearer {TOKEN}
```

#### Buscar Loja por ID
```http
GET /api/lojas/:id?populate=*
Authorization: Bearer {TOKEN}
```

#### Criar Loja
```http
POST /api/lojas
Authorization: Bearer {TOKEN}
Content-Type: application/json

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

#### Atualizar Loja
```http
PUT /api/lojas/:id
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "data": {
    "nome": "Loja Central Atualizada"
  }
}
```

#### Deletar Loja
```http
DELETE /api/lojas/:id
Authorization: Bearer {TOKEN}
```

---

## 💻 Serviço Flutter Completo

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

  // ========== AUTENTICAÇÃO ==========
  
  static Future<String> login(String identifier, String password) async {
    final uri = Uri.parse('$baseUrl/auth/local');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      _token = json['jwt'];
      return _token!;
    } else {
      throw Exception('Erro ao fazer login: ${response.statusCode}');
    }
  }

  // ========== CLIENTE ==========
  
  static Future<List<Cliente>> listarClientes({int page = 1, int pageSize = 25}) async {
    final uri = Uri.parse('$baseUrl/clientes')
        .replace(queryParameters: {
          'pagination[page]': page.toString(),
          'pagination[pageSize]': pageSize.toString(),
          'populate': '*',
        });
    
    final response = await http.get(uri, headers: headers);
    _handleResponse(response);
    
    final json = jsonDecode(response.body);
    return (json['data'] as List)
        .map((e) => Cliente.fromJson(e))
        .toList();
  }

  static Future<Cliente> buscarClientePorId(int id) async {
    final uri = Uri.parse('$baseUrl/clientes/$id?populate=*');
    final response = await http.get(uri, headers: headers);
    _handleResponse(response);
    
    final json = jsonDecode(response.body);
    return Cliente.fromJson(json['data']);
  }

  static Future<Cliente> criarCliente(Cliente cliente) async {
    final uri = Uri.parse('$baseUrl/clientes');
    final response = await http.post(
      uri,
      headers: headers,
      body: jsonEncode({'data': cliente.toJson()}),
    );
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Cliente.fromJson(json['data']);
  }

  static Future<Cliente> atualizarCliente(int id, Map<String, dynamic> dados) async {
    final uri = Uri.parse('$baseUrl/clientes/$id');
    final response = await http.put(
      uri,
      headers: headers,
      body: jsonEncode({'data': dados}),
    );
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Cliente.fromJson(json['data']);
  }

  static Future<void> deletarCliente(int id) async {
    final uri = Uri.parse('$baseUrl/clientes/$id');
    final response = await http.delete(uri, headers: headers);
    _handleResponse(response);
  }

  static Future<List<PlansEnum>> listarPlanosDisponiveis() async {
    final uri = Uri.parse('$baseUrl/clientes/planos-disponiveis');
    final response = await http.get(uri, headers: headers);
    _handleResponse(response);
    
    final json = jsonDecode(response.body);
    return (json['data'] as List)
        .map((e) => PlansEnum.fromJson(e))
        .toList();
  }

  // ========== LOJA ==========

  static Future<List<Loja>> listarLojas({int? clienteId, int page = 1}) async {
    final queryParams = {
      'pagination[page]': page.toString(),
      'pagination[pageSize]': '25',
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

  static Future<Loja> buscarLojaPorId(int id) async {
    final uri = Uri.parse('$baseUrl/lojas/$id?populate=*');
    final response = await http.get(uri, headers: headers);
    _handleResponse(response);
    
    final json = jsonDecode(response.body);
    return Loja.fromJson(json['data']);
  }

  static Future<Loja> criarLoja(Loja loja) async {
    final uri = Uri.parse('$baseUrl/lojas');
    final response = await http.post(
      uri,
      headers: headers,
      body: jsonEncode({'data': loja.toJson()}),
    );
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Loja.fromJson(json['data']);
  }

  static Future<Loja> atualizarLoja(int id, Map<String, dynamic> dados) async {
    final uri = Uri.parse('$baseUrl/lojas/$id');
    final response = await http.put(
      uri,
      headers: headers,
      body: jsonEncode({'data': dados}),
    );
    
    _handleResponse(response);
    final json = jsonDecode(response.body);
    return Loja.fromJson(json['data']);
  }

  static Future<void> deletarLoja(int id) async {
    final uri = Uri.parse('$baseUrl/lojas/$id');
    final response = await http.delete(uri, headers: headers);
    _handleResponse(response);
  }

  // ========== HELPERS ==========

  static void _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }

    final errorBody = jsonDecode(response.body);
    
    if (response.statusCode == 400) {
      throw ValidationException(errorBody['error']['message']);
    } else if (response.statusCode == 401) {
      throw UnauthorizedException('Token inválido ou expirado');
    } else if (response.statusCode == 404) {
      throw NotFoundException('Recurso não encontrado');
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

class UnauthorizedException implements Exception {
  final String message;
  UnauthorizedException(this.message);
  @override
  String toString() => message;
}
```

---

## ⚠️ Erros Comuns e Validações

### Erros de Validação

| Código | Descrição |
|--------|-----------|
| 400 | Email duplicado / Limite de lojas excedido |
| 401 | Token inválido ou não fornecido |
| 404 | Recurso não encontrado |
| 422 | Dados inválidos (formato incorreto) |

### Mensagens de Erro Comuns

- **"Email já cadastrado"**: O email já existe no sistema
- **"Limite de lojas excedido"**: Cliente atingiu o limite de lojas do plano
- **"Cliente não encontrado"**: ID do cliente inválido ao criar loja
- **"Cliente não possui um plano válido"**: Cliente precisa ter um plano antes de criar loja

---

## 📋 Exemplo de Uso Completo

```dart
void main() async {
  try {
    // 1. Fazer login
    final token = await ApiService.login('api@supply.com', 'Api123!@#');
    print('Login realizado com sucesso!');
    
    // 2. Listar planos disponíveis
    final planos = await ApiService.listarPlanosDisponiveis();
    print('Planos disponíveis: ${planos.length}');
    
    // 3. Criar um cliente
    final novoCliente = Cliente(
      nome: 'João Silva',
      email: 'joao@email.com',
      telefone: '(11) 99999-9999',
      plano: planos.first, // Usar o primeiro plano
    );
    
    final clienteCriado = await ApiService.criarCliente(novoCliente);
    print('Cliente criado: ${clienteCriado.nome}');
    
    // 4. Criar uma loja para o cliente
    final novaLoja = Loja(
      nome: 'Loja Central',
      cnpj: '12.345.678/0001-90',
      endereco: 'Rua das Flores, 123',
      telefone: '(11) 3333-4444',
      cliente: clienteCriado,
    );
    
    final lojaCriada = await ApiService.criarLoja(novaLoja);
    print('Loja criada: ${lojaCriada.nome}');
    
    // 5. Listar lojas do cliente
    final lojas = await ApiService.listarLojas(clienteId: clienteCriado.id);
    print('Lojas do cliente: ${lojas.length}');
    
  } catch (e) {
    print('Erro: $e');
  }
}
```

---

## ✅ Permissões Automáticas

**Boa notícia!** As permissões são configuradas **automaticamente** quando o usuário é criado. 

O sistema cria automaticamente:
- ✅ Uma role customizada (`API User`)
- ✅ Todas as permissões necessárias para:
  - ✅ **cliente**: find, findOne, create, update, delete
  - ✅ **loja**: find, findOne, create, update, delete
  - ✅ **plans-enum**: find, findOne

**Não é necessário configurar nada manualmente!** O usuário já está pronto para usar assim que é criado.

**Nota**: Se precisar verificar ou ajustar permissões, acesse o painel admin em `http://localhost:1337/admin` → **Settings** → **Users & Permissions Plugin** → **Roles** → **API User**

---

## 📦 Dependências Necessárias

Adicione ao seu `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
```

---

## 📝 Notas Importantes

1. **Estrutura de Resposta**: Sempre acesse `json['data']` para obter os dados
2. **Populate**: Use `populate=*` para obter relacionamentos completos (plano, lojas, cliente)
3. **Token JWT**: O token expira após um período. Implemente refresh token se necessário
4. **Paginação**: Limite padrão é 25 registros, máximo é 100
5. **Datas**: Todas as datas vêm no formato ISO 8601

---

## 🆘 Suporte

Para problemas:
- Verifique se o token está sendo enviado corretamente
- Confirme que as permissões estão configuradas no painel admin
- Verifique os logs do servidor Strapi
- Confirme que a URL base está correta

---

**Última atualização**: Janeiro 2024

