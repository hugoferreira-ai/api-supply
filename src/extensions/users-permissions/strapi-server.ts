declare const strapi: any;

const PLANO_FIELDS = ['id', 'documentId', 'nome', 'descricao', 'preco', 'limiteLojas'];

type PopulateParam = '*' | Record<string, unknown>;

const normalizePopulate = (populate: unknown): PopulateParam => {
  if (!populate) {
    return {};
  }

  if (populate === '*') {
    return '*';
  }

  if (typeof populate === 'string') {
    return populate.split(',').reduce<Record<string, unknown>>((acc, relation) => {
      const trimmed = relation.trim();

      if (!trimmed) {
        return acc;
      }

      acc[trimmed] = true;

      return acc;
    }, {});
  }

  if (Array.isArray(populate)) {
    return populate.reduce<Record<string, unknown>>((acc, relation) => {
      if (typeof relation === 'string') {
        acc[relation] = true;
      }

      return acc;
    }, {});
  }

  if (typeof populate === 'object') {
    return { ...(populate as Record<string, unknown>) };
  }

  return {};
};

const ensurePlanoPopulate = (incoming: PopulateParam): PopulateParam => {
  if (incoming === '*') {
    return incoming;
  }

  const populate = incoming as Record<string, unknown>;

  const currentPlanoPopulate =
    typeof populate.plano === 'object' && populate.plano !== null
      ? { ...(populate.plano as Record<string, unknown>) }
      : {};

  if (!currentPlanoPopulate.fields) {
    currentPlanoPopulate.fields = PLANO_FIELDS;
  }

  populate.plano = currentPlanoPopulate;

  return populate;
};

export default (plugin: any) => {
  plugin.controllers.user.me = async (ctx: any) => {
    const authUser = ctx.state.user;

    if (!authUser) {
      return ctx.unauthorized();
    }

    const normalizedPopulate = normalizePopulate(ctx.query?.populate);
    const populate = ensurePlanoPopulate(normalizedPopulate);

    const queryWithPopulate = {
      ...ctx.query,
      populate,
    };

    const schema = strapi.getModel('plugin::users-permissions.user');
    const auth = ctx.state.auth;

    await strapi.contentAPI.validate.query(queryWithPopulate, schema, { auth });
    const sanitizedQuery = await strapi.contentAPI.sanitize.query(queryWithPopulate, schema, { auth });

    const user = await strapi.entityService.findOne('plugin::users-permissions.user', authUser.id, sanitizedQuery);

    strapi.log.info(
      `[users-permissions] me populate=${JSON.stringify(
        sanitizedQuery?.populate ?? null
      )} rawPlano=${JSON.stringify(user?.plano ?? null)}`
    );

    const sanitizedUser = await strapi.contentAPI.sanitize.output(user, schema, { auth });

    if (sanitizedUser && user?.plano) {
      const planoSchema = strapi.getModel('api::plano.plano');
      sanitizedUser.plano = await strapi.contentAPI.sanitize.output(user.plano, planoSchema, { auth });
    }

    strapi.log.info(`[users-permissions] me sanitizedPlano=${JSON.stringify(sanitizedUser?.plano ?? null)}`);

    ctx.body = sanitizedUser;
  };

  return plugin;
};

