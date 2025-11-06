# 🔧 Troubleshooting - Login com Usuário de API

## ❌ Erro: "Invalid identifier or password"

### Possíveis Causas e Soluções

#### 1. Email ou Username Incorreto

**Erro comum**: Usar `pi@supply.com` em vez de `api@supply.com`

**Correto:**
```json
{
  "identifier": "api@supply.com",  // ✅ Correto
  "password": "Api123!@#"
}
```

**OU**

```json
{
  "identifier": "api_user",  // ✅ Username também funciona
  "password": "Api123!@#"
}
```

#### 2. Senha Incorreta

**Verifique se está usando a senha correta:**
- ✅ Senha padrão: `Api123!@#`
- ❌ Verifique se não há espaços extras
- ❌ Verifique se não há diferença entre maiúsculas/minúsculas

#### 3. Usuário Não Foi Criado

**Verifique nos logs do Strapi ao iniciar:**

Você deve ver algo como:
```
✅ USUÁRIO DE API CRIADO COM SUCESSO!
  Email: api@supply.com
  Username: api_user
  Senha: Api123!@#
```

**Se não ver essa mensagem:**
1. Verifique se há erros no console do Strapi
2. Verifique se o bootstrap está sendo executado
3. Reinicie o Strapi

#### 4. Usuário Bloqueado ou Não Confirmado

**Verifique no painel admin:**
1. Acesse `http://localhost:1337/admin`
2. Faça login com `admin@supply.com` / `Admin123!@#`
3. Vá em **Content Manager** → **Users**
4. Procure pelo usuário `api@supply.com`
5. Verifique se:
   - ✅ **Confirmed**: deve estar marcado
   - ✅ **Blocked**: deve estar desmarcado

#### 5. Verificar Usuário Via API

Você pode verificar se o usuário existe fazendo uma requisição (se tiver acesso):

```bash
# Listar todos os usuários (requer autenticação admin)
GET /api/users?filters[email][$eq]=api@supply.com
```

## 🔍 Como Debugar

### Passo 1: Verificar Logs do Strapi

Ao iniciar o Strapi, você deve ver:
```
🔧 Criando usuário de API...
   Email: api@supply.com
   Username: api_user
   Role ID: X
✅ Usuário criado com ID: X
✅ Usuário verificado:
   ID: X
   Email: api@supply.com
   Username: api_user
   Confirmed: true
   Blocked: false
   Role: API User
```

### Passo 2: Testar Login Manualmente

Use curl ou Postman para testar:

```bash
curl -X POST http://localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "api@supply.com",
    "password": "Api123!@#"
  }'
```

**Resposta esperada (200):**
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

### Passo 3: Verificar no Painel Admin

1. Acesse `http://localhost:1337/admin`
2. Login: `admin@supply.com` / `Admin123!@#`
3. Vá em **Content Manager** → **Users**
4. Procure por `api@supply.com`
5. Verifique os campos:
   - **Email**: `api@supply.com`
   - **Username**: `api_user`
   - **Confirmed**: ✅ Marcado
   - **Blocked**: ❌ Desmarcado
   - **Role**: Deve ter uma role atribuída

### Passo 4: Recriar o Usuário

Se o usuário não foi criado ou está com problemas:

1. **Deletar o usuário existente** (via painel admin ou código)
2. **Reiniciar o Strapi** para que o bootstrap recrie o usuário

Ou criar manualmente via código:

```typescript
// No console do Strapi ou em um script
await strapi.entityService.create('plugin::users-permissions.user', {
  data: {
    username: 'api_user',
    email: 'api@supply.com',
    password: 'Api123!@#',
    confirmed: true,
    blocked: false,
  },
});
```

## ✅ Checklist de Verificação

Antes de fazer login, verifique:

- [ ] Email correto: `api@supply.com` (não `pi@supply.com`)
- [ ] Senha correta: `Api123!@#`
- [ ] Strapi está rodando
- [ ] Usuário foi criado (ver logs do Strapi)
- [ ] Usuário está confirmado (`confirmed: true`)
- [ ] Usuário não está bloqueado (`blocked: false`)
- [ ] URL da API está correta: `http://localhost:1337/api/auth/local`
- [ ] Header `Content-Type: application/json` está sendo enviado

## 📝 Exemplo Correto de Login no Flutter

```dart
final response = await http.post(
  Uri.parse('http://localhost:1337/api/auth/local'),
  headers: {
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'identifier': 'api@supply.com',  // ✅ Email correto
    'password': 'Api123!@#',          // ✅ Senha correta
  }),
);
```

**OU usando username:**

```dart
body: jsonEncode({
  'identifier': 'api_user',  // ✅ Username também funciona
  'password': 'Api123!@#',
}),
```

## 🔄 Resetar Senha do Usuário Existente

Se o usuário já existe mas o login não funciona, o código agora **automaticamente reseta a senha** quando o Strapi inicia.

**O que acontece:**
1. Detecta que o usuário existe
2. Reseta a senha usando o serviço do plugin (hash correto)
3. Garante que está confirmado e não bloqueado
4. Atribui a role correta

**Você verá nos logs:**
```
✅ Usuário de API já existe: api@supply.com
🔧 Resetando senha do usuário existente usando serviço do plugin...
✅ Senha resetada com sucesso usando serviço do plugin!
```

**Se isso não funcionar**, você pode deletar e recriar:

### Deletar e Recriar Manualmente

1. **Acesse o painel admin**: `http://localhost:1337/admin`
2. **Login**: `admin@supply.com` / `Admin123!@#`
3. **Vá em**: Content Manager → Users
4. **Procure por**: `api@supply.com`
5. **Delete o usuário**
6. **Reinicie o Strapi** — o usuário será recriado automaticamente

## 🆘 Se Nada Funcionar

### Verificar se o Usuário Existe

Você pode verificar via API (se tiver acesso admin) ou pelo painel:

**Via Painel Admin:**
1. Content Manager → Users
2. Procure por `api@supply.com`
3. Verifique:
   - ✅ Email está correto
   - ✅ Username está correto
   - ✅ Confirmed está marcado
   - ✅ Blocked está desmarcado
   - ✅ Role está atribuída

### Resetar Senha Manualmente

Se o reset automático não funcionar, você pode resetar manualmente:

1. Acesse o painel admin
2. Vá em Content Manager → Users
3. Abra o usuário `api@supply.com`
4. Clique em "Reset Password" ou edite manualmente
5. Salve

### Verificar Logs do Strapi

Ao iniciar o Strapi, você deve ver:

```
✅ Usuário de API já existe: api@supply.com
🔧 Resetando senha do usuário existente usando serviço do plugin...
✅ Senha resetada com sucesso usando serviço do plugin!
✅ Usuário verificado após atualização:
   ID: X
   Email: api@supply.com
   Confirmed: true
   Blocked: false
```

Se você ver erros, eles indicarão o problema específico.

---

**Última atualização**: Janeiro 2024

