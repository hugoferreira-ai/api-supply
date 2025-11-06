/**
 * loja controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::loja.loja', ({ strapi }) => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    
    // Populate cliente relation
    const populatedData = await Promise.all(
      data.map(async (item) => {
        const populatedItem = await strapi.entityService.findOne('api::loja.loja', item.id, {
          populate: {
            cliente: {
              populate: {
                plano: true
              }
            }
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
      const populatedData = await strapi.entityService.findOne('api::loja.loja', data.id, {
        populate: {
          cliente: {
            populate: {
              plano: true
            }
          }
        }
      });
      return { data: populatedData, meta };
    }

    return { data, meta };
  },

  async create(ctx) {
    const requestData = ctx.request.body;
    
    if (!requestData || !requestData.cliente) {
      return ctx.badRequest('Cliente é obrigatório para criar uma loja');
    }

    // Buscar o cliente para verificar o plano
    const cliente = await strapi.entityService.findOne('api::cliente.cliente', requestData.cliente, {
      populate: {
        lojas: true,
        plano: true
      }
    });

    if (!cliente) {
      return ctx.badRequest('Cliente não encontrado');
    }

    if (!(cliente as any).plano) {
      return ctx.badRequest('Cliente não possui um plano válido');
    }

    // Verificar limite de lojas baseado no plano
    const quantidadeLojasAtuais = (cliente as any).lojas?.length || 0;
    const limitePlano = (cliente as any).plano?.limiteLojas || 1;

    if (quantidadeLojasAtuais >= limitePlano) {
      const planoNome = (cliente as any).plano?.nome || 'desconhecido';
      return ctx.badRequest(
        `Limite de lojas excedido para o plano ${planoNome}. ` +
        `Plano ${planoNome} permite ${limitePlano} loja(s). ` +
        `Cliente já possui ${quantidadeLojasAtuais} loja(s).`
      );
    }

    // Criar a loja
    const loja = await strapi.entityService.create('api::loja.loja', {
      data: {
        ...requestData,
        cliente: requestData.cliente
      },
      populate: {
        cliente: {
          populate: {
            plano: true
          }
        }
      }
    });

    return { data: loja };
  },

  async update(ctx) {
    const { id } = ctx.params;
    const requestData = ctx.request.body;

    // Se está mudando o cliente, verificar limite
    if (requestData.cliente) {
      const cliente = await strapi.entityService.findOne('api::cliente.cliente', requestData.cliente, {
        populate: {
          lojas: true,
          plano: true
        }
      });

      if (cliente && (cliente as any).plano) {
        const quantidadeLojasAtuais = (cliente as any).lojas?.length || 0;
        
        // Se a loja atual não está sendo contada (porque está sendo movida), subtrair 1
        const lojasSemAtual = quantidadeLojasAtuais - ((cliente as any).lojas?.some(loja => loja.id == id) ? 1 : 0);
        const limitePlano = (cliente as any).plano?.limiteLojas || 1;

        if (lojasSemAtual >= limitePlano) {
          const planoNome = (cliente as any).plano?.nome || 'desconhecido';
          return ctx.badRequest(
            `Limite de lojas excedido para o plano ${planoNome}. ` +
            `Plano ${planoNome} permite ${limitePlano} loja(s). ` +
            `Cliente já possui ${lojasSemAtual} loja(s).`
          );
        }
      }
    }

    const loja = await strapi.entityService.update('api::loja.loja', id, {
      data: requestData,
      populate: {
        cliente: {
          populate: {
            plano: true
          }
        }
      }
    });

    return { data: loja };
  }
}));
