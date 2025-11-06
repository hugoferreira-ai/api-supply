/**
 * cliente routes
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/clientes',
      handler: 'cliente.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/clientes/:id',
      handler: 'cliente.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/clientes',
      handler: 'cliente.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/clientes/:id',
      handler: 'cliente.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/clientes/:id',
      handler: 'cliente.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/clientes/plano/:planoId',
      handler: 'cliente.getPlanoInfo',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/clientes/planos-disponiveis',
      handler: 'cliente.getPlanosDisponiveis',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
