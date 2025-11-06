/**
 * cliente controller
 */

import { factories } from '@strapi/strapi'

// Funções utilitárias para gerenciamento de planos
const getLimiteLojasFromPlansEnum = async (strapi: any, planoId: number): Promise<number> => {
  try {
    const plano = await strapi.entityService.findOne('api::plans-enum.plans-enum', planoId);
    
    if (!plano) {
      console.warn(`Plano com ID ${planoId} não encontrado`);
      return 1; // Limite padrão
    }

    return plano.limiteLojas || 1;
  } catch (error) {
    console.error('Erro ao buscar limite de lojas:', error);
    return 1; // Limite padrão em caso de erro
  }
};

const getPlanoInfo = async (strapi: any, planoId: number) => {
  try {
    const plano = await strapi.entityService.findOne('api::plans-enum.plans-enum', planoId);
    
    if (!plano) {
      return null;
    }

    return {
      id: plano.id,
      nome: plano.nome,
      limiteLojas: plano.limiteLojas,
      preco: plano.preco,
      descricao: plano.descricao,
      recursos: plano.recursos
    };
  } catch (error) {
    console.error('Erro ao buscar informações do plano:', error);
    return null;
  }
};

const validarLimiteLojas = async (
  strapi: any, 
  clienteId: number, 
  quantidadeLojasAtuais: number
): Promise<{ podeAdicionar: boolean; limite: number; mensagem?: string }> => {
  try {
    const cliente = await strapi.entityService.findOne('api::cliente.cliente', clienteId, {
      populate: {
        plano: true,
        lojas: true
      }
    });

    if (!cliente || !cliente.plano) {
      return {
        podeAdicionar: false,
        limite: 1,
        mensagem: 'Cliente ou plano não encontrado'
      };
    }

    const limite = await getLimiteLojasFromPlansEnum(strapi, cliente.plano.id);
    
    if (quantidadeLojasAtuais >= limite) {
      return {
        podeAdicionar: false,
        limite,
        mensagem: `Limite de lojas excedido para o plano ${cliente.plano.nome}. ` +
                 `Plano ${cliente.plano.nome} permite ${limite === Infinity ? 'lojas ilimitadas' : limite + ' loja(s)'}. ` +
                 `Cliente já possui ${quantidadeLojasAtuais} loja(s).`
      };
    }

    return {
      podeAdicionar: true,
      limite
    };
  } catch (error) {
    console.error('Erro ao validar limite de lojas:', error);
    return {
      podeAdicionar: false,
      limite: 1,
      mensagem: 'Erro interno ao validar limite de lojas'
    };
  }
};

export default factories.createCoreController('api::cliente.cliente', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    
    // Populate lojas e plano relations
    const populatedData = await Promise.all(
      data.map(async (item) => {
        const populatedItem = await strapi.entityService.findOne('api::cliente.cliente', item.id, {
          populate: {
            lojas: true,
            plano: true
          }
        });
        return populatedItem;
      })
    );

    return { data: populatedData, meta };
  },

  async findOne(ctx) {
    const { data, meta } = await super.findOne(ctx);
    
    if (data) {
      const populatedData = await strapi.entityService.findOne('api::cliente.cliente', data.id, {
        populate: {
          lojas: true,
          plano: true
        }
      });
      return { data: populatedData, meta };
    }

    return { data, meta };
  },

  async create(ctx) {
    const { data } = ctx.request.body;
    
    // Validar se o email já existe
    if (data.email) {
      const clienteExistente = await strapi.entityService.findMany('api::cliente.cliente', {
        filters: {
          email: data.email
        }
      });
      
      if (clienteExistente.length > 0) {
        return ctx.badRequest('Email já cadastrado');
      }
    }

    // Criar o cliente
    const cliente = await strapi.entityService.create('api::cliente.cliente', {
      data: {
        ...data
      },
      populate: {
        lojas: true,
        plano: true
      }
    });

    return { data: cliente };
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = ctx.request.body;

    // Se está mudando o plano, verificar se não excede o limite atual de lojas
    if (data.plano) {
      const clienteAtual = await strapi.entityService.findOne('api::cliente.cliente', id, {
        populate: {
          lojas: true,
          plano: true
        }
      });

      if (clienteAtual) {
        const novoLimite = await getLimiteLojasFromPlansEnum(strapi, data.plano);
        const quantidadeLojasAtuais = (clienteAtual as any).lojas?.length || 0;

        if (quantidadeLojasAtuais > novoLimite) {
          const planoInfo = await getPlanoInfo(strapi, data.plano);
          return ctx.badRequest(
            `Não é possível alterar para o plano ${planoInfo?.nome || 'desconhecido'}. ` +
            `Cliente possui ${quantidadeLojasAtuais} loja(s), mas o plano ${planoInfo?.nome || 'desconhecido'} ` +
            `permite apenas ${novoLimite === Infinity ? 'lojas ilimitadas' : novoLimite + ' loja(s)'}. ` +
            `Remova algumas lojas antes de alterar o plano.`
          );
        }
      }
    }

    // Se está mudando o email, verificar se já existe
    if (data.email) {
      const clienteExistente = await strapi.entityService.findMany('api::cliente.cliente', {
        filters: {
          email: data.email,
          id: {
            $ne: id
          }
        }
      });
      
      if (clienteExistente.length > 0) {
        return ctx.badRequest('Email já cadastrado');
      }
    }

    const cliente = await strapi.entityService.update('api::cliente.cliente', id, {
      data,
      populate: {
        lojas: true,
        plano: true
      }
    });

    return { data: cliente };
  },

  // Método customizado para obter informações do plano
  async getPlanoInfo(ctx) {
    const { planoId } = ctx.params;
    
    const planoInfo = await getPlanoInfo(strapi, parseInt(planoId));
    
    if (!planoInfo) {
      return ctx.notFound('Plano não encontrado');
    }
    
    return {
      data: {
        ...planoInfo,
        descricao: planoInfo.limiteLojas === Infinity ? 'Sem limite de lojas' : `Máximo de ${planoInfo.limiteLojas} loja(s)`
      }
    };
  },

  // Método para listar todos os planos disponíveis
  async getPlanosDisponiveis(ctx) {
    const planos = await strapi.entityService.findMany('api::plans-enum.plans-enum', {
      sort: { preco: 'asc' }
    });

    return {
      data: planos.map(plano => ({
        id: plano.id,
        nome: plano.nome,
        limiteLojas: plano.limiteLojas,
        preco: plano.preco,
        descricao: plano.descricao,
        recursos: plano.recursos
      }))
    };
  }
}));
