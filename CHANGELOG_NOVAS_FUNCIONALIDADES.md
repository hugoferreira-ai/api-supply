# 📋 Novas Funcionalidades - Atualização da API

Este documento descreve apenas as **novas funcionalidades e alterações** adicionadas à API. Para a documentação completa, consulte `DOCUMENTACAO_API_FLUTTER.md`.

---

## 🆕 O Que Foi Adicionado

### 1. Criação Automática de Usuários

A API agora cria automaticamente dois usuários quando é iniciada pela primeira vez:

#### ✅ Super Admin (Painel Administrativo)
- **Email**: `admin@supply.com`
- **Senha**: `Admin123!@#`
- **Uso**: Acesso ao painel admin do Strapi em `http://localhost:1337/admin`

#### ✅ Usuário de API (App Flutter)
- **Email**: `api@supply.com`
- **Username**: `api_user`
- **Senha**: `Api123!@#`
- **Uso**: Autenticação no app Flutter via API

---

## 🔐 Autenticação JWT

A API agora suporta autenticação via JWT para acesso aos endpoints protegidos.

### Endpoint de Login

```http
POST /api/auth/local
Content-Type: application/json

{
  "identifier": "api@supply.com",
  "password": "Api123!@#"
}
```

**Resposta:**
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

### Como Usar o Token

Após fazer login, inclua o token JWT no header `Authorization` de todas as requisições:

```http
Authorization: Bearer {SEU_TOKEN_JWT}
```

---

## 💻 Código Flutter - Autenticação

### Classe de Autenticação

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseUrl = 'http://localhost:1337/api';
  static String? _token;

  // Fazer login
  static Future<String> login(String identifier, String password) async {
    final uri = Uri.parse('$baseUrl/auth/local');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier, // Pode ser email ou username
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

### Atualizar ApiService

Atualize sua classe `ApiService` para usar os headers de autenticação:

```dart
class ApiService {
  static const String baseUrl = 'http://localhost:1337/api';

  static Map<String, String> get headers {
    return AuthService.headers; // Usa os headers do AuthService
  }

  // Todos os métodos agora automaticamente incluem o token se disponível
  static Future<List<Cliente>> listarClientes() async {
    final uri = Uri.parse('$baseUrl/clientes?populate=*');
    final response = await http.get(uri, headers: headers);
    // ... resto do código
  }
  
  // ... outros métodos
}
```

---

## ⚙️ Configuração de Permissões

✅ **PERMISSÕES AUTOMÁTICAS**: As permissões são configuradas automaticamente quando o usuário é criado!

O sistema agora:
- ✅ Cria uma role customizada (`API User` por padrão)
- ✅ Atribui automaticamente todas as permissões necessárias:
  - ✅ **cliente**: find, findOne, create, update, delete
  - ✅ **loja**: find, findOne, create, update, delete
  - ✅ **plans-enum**: find, findOne

**Não é mais necessário configurar permissões manualmente!** 🎉

**Nota**: Se você quiser verificar ou ajustar as permissões:
1. Acesse `http://localhost:1337/admin`
2. Faça login com `admin@supply.com` / `Admin123!@#`
3. Vá em **Settings** → **Users & Permissions Plugin** → **Roles** → **API User**

---

## 🔧 Personalização (Opcional)

Você pode personalizar as credenciais e a role criando um arquivo `.env` na raiz do projeto:

```env
# Super Admin
SUPER_ADMIN_EMAIL=seu-email@exemplo.com
SUPER_ADMIN_PASSWORD=SuaSenha123!
SUPER_ADMIN_FIRSTNAME=Seu
SUPER_ADMIN_LASTNAME=Nome

# Usuário de API
API_USER_EMAIL=seu-email-api@exemplo.com
API_USER_PASSWORD=SuaSenhaApi123!
API_USER_USERNAME=seu_username

# Role Customizada (opcional)
API_USER_ROLE_NAME=Minha Role Personalizada
API_USER_ROLE_TYPE=minha-role-tipo-unico
```

### Como Funciona a Role Customizada

O sistema agora cria automaticamente uma **role customizada** para o usuário de API:

1. **Criação Automática**: Se a role não existir, ela é criada automaticamente
2. **Permissões Automáticas**: Todas as permissões necessárias são atribuídas automaticamente:
   - ✅ Cliente: find, findOne, create, update, delete
   - ✅ Loja: find, findOne, create, update, delete
   - ✅ PlansEnum: find, findOne
3. **Role Única**: A role é criada com um tipo único (`api-user` por padrão) para não conflitar com outras roles

### Atribuir o Usuário a uma Role Existente

Se você quiser usar uma role existente em vez de criar uma nova, você pode:

1. **Opção 1 - Via Código**: Modifique o código em `src/index.ts` para buscar a role desejada
2. **Opção 2 - Via Painel Admin**: 
   - Crie a role manualmente no painel admin
   - Configure as permissões
   - Atualize o código para usar essa role específica

**Exemplo de código para usar role existente:**

```typescript
// Em vez de criar uma nova role, buscar uma existente
const existingRole = await strapi.entityService.findMany('plugin::users-permissions.role', {
  filters: { name: 'Nome da Role Existente' },
  limit: 1,
});

if (existingRole.length > 0) {
  apiRole = existingRole;
  // Atribuir permissões se necessário
  await assignPermissionsToRole(strapi, apiRole[0].id);
}
```

---

## 📝 Exemplo de Uso Completo

```dart
void main() async {
  try {
    // 1. Fazer login com o usuário de API
    final token = await AuthService.login('api@supply.com', 'Api123!@#');
    print('✅ Login realizado! Token: ${token.substring(0, 20)}...');
    
    // 2. Agora todas as requisições incluem o token automaticamente
    final clientes = await ApiService.listarClientes();
    print('✅ Clientes encontrados: ${clientes.length}');
    
    // 3. Criar um novo cliente
    final novoCliente = Cliente(
      nome: 'João Silva',
      email: 'joao@email.com',
      telefone: '(11) 99999-9999',
    );
    
    final clienteCriado = await ApiService.criarCliente(novoCliente);
    print('✅ Cliente criado: ${clienteCriado.nome}');
    
  } catch (e) {
    print('❌ Erro: $e');
  }
}
```

---

## 🚨 Mudanças Importantes

### Antes
- ❌ Endpoints públicos (sem autenticação)
- ❌ Sem usuário padrão para testes
- ❌ Permissões precisavam ser configuradas manualmente

### Agora
- ✅ Autenticação JWT obrigatória para endpoints protegidos
- ✅ Usuário de API criado automaticamente
- ✅ Credenciais prontas para uso imediato
- ✅ **Permissões configuradas automaticamente** (não precisa fazer nada manualmente!)

## 📱 Impacto no Flutter

**Nenhuma mudança necessária no código Flutter!** 

As alterações são completamente transparentes para o app:
- ✅ Mesmas credenciais (`api@supply.com` / `Api123!@#`)
- ✅ Mesmo endpoint de autenticação (`/api/auth/local`)
- ✅ Mesmo formato de token JWT
- ✅ Mesmas requisições e endpoints

**O que mudou**: Apenas no backend - as permissões agora são criadas automaticamente quando o usuário é criado, então você não precisa mais configurar manualmente no painel admin.

---

## ⚠️ Notas Importantes

1. **Token JWT**: O token expira após um período. Você precisará fazer login novamente ou implementar refresh token.

2. **Primeira Execução**: Na primeira vez que iniciar o Strapi, os usuários serão criados automaticamente. Você verá as credenciais no console.

3. **Permissões**: Não esqueça de configurar as permissões no painel admin após a primeira execução.

4. **Segurança**: Altere as senhas padrão em produção!

---

## 📚 Documentação Completa

Para informações detalhadas sobre todos os endpoints, modelos de dados e exemplos completos, consulte:
- `DOCUMENTACAO_API_FLUTTER.md` - Documentação completa da API
- `GUIA_INTEGRACAO_FLUTTER.md` - Guia rápido de integração

---

**Data da Atualização**: Janeiro 2024

