# 🔐 Configuração do Super Admin

## Descrição

Este projeto possui um script automático que cria um usuário **Super Admin** com todas as permissões para gerenciar clientes e lojas quando o Strapi é iniciado pela primeira vez.

## Como Funciona

O script é executado automaticamente no bootstrap do Strapi (`src/index.ts`). Ele:

1. ✅ Verifica se já existe um super admin com o email configurado
2. ✅ Busca a role "Super Admin" no sistema
3. ✅ Cria o usuário com todas as permissões se não existir
4. ✅ Exibe as credenciais no console ao iniciar o servidor

## Credenciais Padrão

Se você não configurar variáveis de ambiente, o script usará as seguintes credenciais padrão:

- **Email**: `admin@supply.com`
- **Senha**: `Admin123!@#`
- **Nome**: `Super Admin`
- **Sobrenome**: `Admin`

## ⚙️ Configuração Personalizada

Você pode personalizar as credenciais através de variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto com:

```env
SUPER_ADMIN_EMAIL=seu-email@exemplo.com
SUPER_ADMIN_PASSWORD=SuaSenhaSegura123!
SUPER_ADMIN_FIRSTNAME=Seu
SUPER_ADMIN_LASTNAME=Nome
```

## 📋 Como Usar

### 1. Iniciar o Strapi

```bash
npm run develop
# ou
npm run start
```

### 2. Verificar o Console

Quando o Strapi iniciar, você verá uma mensagem no console:

```
╔══════════════════════════════════════════════════════════════╗
║          ✅ SUPER ADMIN CRIADO COM SUCESSO!                 ║
╠══════════════════════════════════════════════════════════════╣
║  Email: admin@supply.com                                      ║
║  Senha: Admin123!@#                                           ║
║  Role: Super Admin                                            ║
║                                                              ║
║  Acesse o painel admin em:                                   ║
║  http://localhost:1337/admin                                 ║
╠══════════════════════════════════════════════════════════════╣
║  ⚠️  IMPORTANTE: Altere a senha após o primeiro acesso!     ║
╚══════════════════════════════════════════════════════════════╝
```

### 3. Acessar o Painel Admin

1. Abra seu navegador em: `http://localhost:1337/admin`
2. Faça login com as credenciais exibidas no console
3. **Altere a senha** após o primeiro acesso

## 🔒 Permissões

O Super Admin criado possui **todas as permissões**, incluindo:

- ✅ Criar, editar e deletar Clientes
- ✅ Criar, editar e deletar Lojas
- ✅ Gerenciar Planos (PlansEnum)
- ✅ Acessar todas as funcionalidades do painel admin
- ✅ Configurar permissões e roles

## 🔄 Se o Usuário Já Existe

Se você já tem um super admin cadastrado, o script não criará um novo. Você verá a mensagem:

```
✅ Super Admin já existe: admin@supply.com
```

## 🛠️ Troubleshooting

### Erro: "Não foi possível encontrar uma role adequada"

Se você ver este erro, significa que o Strapi ainda não foi inicializado completamente. Neste caso:

1. Acesse `http://localhost:1337/admin` no navegador
2. Crie o primeiro usuário admin pelo painel web
3. O script funcionará nas próximas inicializações

### Erro: "Email já cadastrado"

Isso significa que já existe um usuário com esse email. Você pode:

1. Usar as credenciais existentes
2. Ou alterar a variável `SUPER_ADMIN_EMAIL` no `.env` para outro email

## 📝 Notas Importantes

⚠️ **Segurança**: 
- Altere a senha padrão após o primeiro acesso
- Nunca commite o arquivo `.env` no repositório
- Use senhas fortes em produção

⚠️ **Produção**:
- Certifique-se de configurar variáveis de ambiente seguras
- Considere desabilitar o script após criar o primeiro admin
- Use um gerenciador de senhas para armazenar credenciais

## 🚀 Desabilitar o Script (Opcional)

Se você não quiser que o script crie automaticamente o super admin, você pode:

1. Comentar a linha no `src/index.ts`:
```typescript
async bootstrap({ strapi }: { strapi: Core.Strapi }) {
  // await createSuperAdmin(strapi);
},
```

2. Ou criar o usuário manualmente através do painel admin do Strapi

## 🔐 Usuário de API para App Flutter

O script também cria automaticamente um **usuário de API** que pode ser usado no app Flutter para autenticação.

### Credenciais Padrão do Usuário de API

- **Email**: `api@supply.com`
- **Username**: `api_user`
- **Senha**: `Api123!@#`

### Configuração Personalizada

Você pode personalizar as credenciais através de variáveis de ambiente:

```env
API_USER_EMAIL=seu-email-api@exemplo.com
API_USER_PASSWORD=SuaSenhaApi123!
API_USER_USERNAME=seu_username_api
```

### Como Usar no Flutter

O usuário de API pode ser usado para autenticação via endpoint `/api/auth/local`:

```dart
// Exemplo de autenticação no Flutter
Future<String> login(String email, String password) async {
  final uri = Uri.parse('$baseUrl/auth/local');
  final body = jsonEncode({
    'identifier': email, // Pode ser email ou username
    'password': password,
  });
  
  final response = await http.post(
    uri,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body,
  );
  
  if (response.statusCode == 200) {
    final json = jsonDecode(response.body);
    final token = json['jwt'];
    return token;
  } else {
    throw Exception('Erro ao fazer login');
  }
}
```

### Endpoints de Autenticação

#### Login
```http
POST /api/auth/local
Content-Type: application/json

{
  "identifier": "api@supply.com",  // ou "api_user"
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
    "blocked": false,
    "role": {
      "id": 1,
      "name": "Authenticated",
      "type": "authenticated"
    }
  }
}
```

#### Usar o Token nas Requisições

Após obter o token JWT, use-o no header `Authorization`:

```http
Authorization: Bearer {SEU_TOKEN_JWT}
```

### Permissões do Usuário de API

O usuário criado possui permissões completas para:
- ✅ Criar, editar e deletar Clientes
- ✅ Criar, editar e deletar Lojas
- ✅ Acessar Planos
- ✅ Todas as operações CRUD nos content types principais

## 📞 Suporte

Se você tiver problemas com o script, verifique:

1. Os logs do console ao iniciar o Strapi
2. Se o banco de dados está acessível
3. Se as variáveis de ambiente estão configuradas corretamente

### Diferença entre Super Admin e Usuário de API

- **Super Admin**: Usuário do painel administrativo do Strapi (acesso web)
- **Usuário de API**: Usuário para autenticação via API (uso no app Flutter)

