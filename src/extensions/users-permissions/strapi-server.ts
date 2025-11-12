declare const strapi: any;

const PLANO_FIELDS = ['id', 'documentId', 'nome', 'descricao', 'preco', 'limiteLojas'];
const LOJA_FIELDS = ['id', 'documentId', 'nome', 'cnpj', 'telefone', 'endereco', 'createdAt', 'updatedAt', 'publishedAt'];

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

const ensurePlanoAndLojasPopulate = (incoming: PopulateParam): PopulateParam => {
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

  const currentLojasPopulate =
    typeof populate.lojas === 'object' && populate.lojas !== null
      ? { ...(populate.lojas as Record<string, unknown>) }
      : {};

  if (!currentLojasPopulate.fields) {
    currentLojasPopulate.fields = LOJA_FIELDS;
  }

  populate.lojas = currentLojasPopulate;

  return populate;
};

export default (plugin: any) => {
  plugin.controllers.user.me = async (ctx: any) => {
    const authUser = ctx.state.user;

    if (!authUser) {
      return ctx.unauthorized();
    }

    const normalizedPopulate = normalizePopulate(ctx.query?.populate);
    const populate = ensurePlanoAndLojasPopulate(normalizedPopulate);

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
      )} rawPlano=${JSON.stringify(user?.plano ?? null)} rawLojas=${JSON.stringify(user?.lojas ?? null)}`
    );

    const sanitizedUser = await strapi.contentAPI.sanitize.output(user, schema, { auth });

    if (sanitizedUser) {
      if (user?.plano) {
        const planoSchema = strapi.getModel('api::plano.plano');
        sanitizedUser.plano = await strapi.contentAPI.sanitize.output(user.plano, planoSchema, { auth });
      }

      const lojaSchema = strapi.getModel('api::loja.loja');

      const lojaLinks = await strapi
        .db.connection('lojas_user_lnk')
        .select('loja_id')
        .where('user_id', authUser.id);

      const lojaIds = lojaLinks
        .map((row: { loja_id: number | null }) => row.loja_id)
        .filter((lojaId): lojaId is number => typeof lojaId === 'number' && Number.isFinite(lojaId));

      strapi.log.info(`[users-permissions] me lojaIds=${JSON.stringify(lojaIds)}`);

      if (lojaIds.length > 0) {
        const lojas = await strapi.db.query('api::loja.loja').findMany({
          where: {
            id: {
              $in: lojaIds,
            },
          },
        });

        strapi.log.info(`[users-permissions] me lojasRaw=${JSON.stringify(lojas)}`);

        sanitizedUser.lojas = await Promise.all(
          lojas.map((loja: any) => strapi.contentAPI.sanitize.output(loja, lojaSchema, { auth }))
        );
      } else {
        sanitizedUser.lojas = [];
      }
    }

    strapi.log.info(
      `[users-permissions] me sanitizedPlano=${JSON.stringify(sanitizedUser?.plano ?? null)} sanitizedLojas=${JSON.stringify(
        sanitizedUser?.lojas ?? null
      )}`
    );

    ctx.body = sanitizedUser;
  };

  return plugin;
};

