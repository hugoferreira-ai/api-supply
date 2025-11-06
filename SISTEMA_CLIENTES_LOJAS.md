# Sistema de Cadastro de Clientes e Lojas

## Estrutura do Sistema

### Entidades Principais

1. **Cliente** - Entidade principal que possui um plano e pode ter múltiplas lojas
2. **Loja** - Entidade que pertence a um cliente específico
3. **PlansEnum** - Enum com informações detalhadas dos planos

### Planos e Limites (Dinâmicos via PlansEnum)

Os planos são gerenciados dinamicamente através da tabela `PlansEnum` no admin do Strapi:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| nome | String | Nome do plano (ex: "Basico", "Intermedium", "Advanced") |
| limiteLojas | Integer | Limite de lojas permitidas |
| preco | Decimal | Preço do plano |
| descricao | Text | Descrição do plano |
| recursos | JSON | Recursos inclusos no plano |

**Exemplo de Planos:**
- **Basico**: 1 loja, R$ 150,00
- **Intermedium**: 3 lojas, R$ 300,00  
- **Advanced**: Ilimitado, R$ 500,00

## APIs Disponíveis

### Cliente

#### Criar Cliente
```http
POST /api/clientes
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "(11) 99999-9999",
  "plano": 1
}
```

#### Listar Clientes
```http
GET /api/clientes
```

#### Buscar Cliente por ID
```http
GET /api/clientes/:id
```

#### Atualizar Cliente
```http
PUT /api/clientes/:id
Content-Type: application/json

{
  "plano": 2
}
```

#### Obter Informações do Plano
```http
GET /api/clientes/plano/:planoId
```

#### Listar Planos Disponíveis
```http
GET /api/clientes/planos-disponiveis
```

### Loja

#### Criar Loja
```http
POST /api/lojas
Content-Type: application/json

{
  "nome": "Loja Central",
  "cnpj": "12.345.678/0001-90",
  "endereco": "Rua das Flores, 123",
  "telefone": "(11) 3333-4444",
  "cliente": 1
}
```

#### Listar Lojas
```http
GET /api/lojas
```

#### Buscar Loja por ID
```http
GET /api/lojas/:id
```

#### Atualizar Loja
```http
PUT /api/lojas/:id
Content-Type: application/json

{
  "nome": "Loja Central Atualizada"
}
```

## Validações Implementadas

### No Cadastro de Cliente
- ✅ Email único (não permite duplicatas)
- ✅ Plano padrão é "Basic" se não especificado

### No Cadastro de Loja
- ✅ Cliente é obrigatório
- ✅ Verifica limite de lojas baseado no plano do cliente
- ✅ Impede criação se limite for excedido

### Na Atualização de Cliente
- ✅ Impede downgrade de plano se cliente já possui mais lojas que o novo limite permite
- ✅ Valida email único (exceto o próprio cliente)

### Na Atualização de Loja
- ✅ Verifica limite ao transferir loja para outro cliente

## Exemplos de Uso

### Cenário 1: Cliente com plano "Basico" tentando criar segunda loja
```http
POST /api/lojas
{
  "nome": "Segunda Loja",
  "cnpj": "98.765.432/0001-10",
  "cliente": 1
}
```

**Resposta de Erro:**
```json
{
  "error": {
    "status": 400,
    "message": "Limite de lojas excedido para o plano Basico. Plano Basico permite 1 loja(s). Cliente já possui 1 loja(s)."
  }
}
```

### Cenário 2: Upgrade de plano
```http
PUT /api/clientes/1
{
  "plano": 2
}
```

**Resposta de Sucesso:**
```json
{
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
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

### Cenário 3: Downgrade de plano (com lojas excedentes)
```http
PUT /api/clientes/1
{
  "plano": 1
}
```

**Resposta de Erro:**
```json
{
  "error": {
    "status": 400,
    "message": "Não é possível alterar para o plano Basico. Cliente possui 3 loja(s), mas o plano Basico permite apenas 1 loja(s). Remova algumas lojas antes de alterar o plano."
  }
}
```

## Fluxo Recomendado

1. **Cadastrar Cliente** com plano desejado
2. **Cadastrar Lojas** associadas ao cliente
3. **Sistema valida automaticamente** os limites baseado no plano
4. **Para upgrade de plano**: cliente pode ter mais lojas
5. **Para downgrade de plano**: cliente deve remover lojas excedentes primeiro

## Benefícios

- ✅ **Validação na API**: Não depende do frontend
- ✅ **Planos Dinâmicos**: Gerenciados pelo admin do Strapi
- ✅ **Flexibilidade Total**: Adicione/edite planos sem alterar código
- ✅ **Segurança**: Impede violação de limites automaticamente
- ✅ **UX**: Mensagens claras de erro
- ✅ **Escalabilidade**: Estrutura preparada para crescimento
- ✅ **Sem Hardcode**: Sistema 100% configurável
