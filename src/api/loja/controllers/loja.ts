/**
 * loja controller
 */

import { factories } from '@strapi/strapi';

type NormalizedUserReference = {
  userId?: number;
  userDocumentId?: string;
  explicitNull?: boolean;
};

const parseUserReference = (rawUser: unknown): NormalizedUserReference => {
  if (rawUser === null) {
    return { explicitNull: true };
  }

  if (typeof rawUser === 'number') {
    return { userId: rawUser };
  }

  if (typeof rawUser === 'string') {
    if (!Number.isNaN(Number(rawUser))) {
      return { userId: Number(rawUser) };
    }

    return { userDocumentId: rawUser };
  }

  if (typeof rawUser === 'object' && rawUser !== null) {
    const incoming = rawUser as Record<string, unknown>;

    const extract = (source: Record<string, unknown> | undefined): NormalizedUserReference => {
      if (!source) {
        return {};
      }

      if (typeof source.id === 'number') {
        return { userId: source.id };
      }

      if (typeof source.documentId === 'string') {
        return { userDocumentId: source.documentId };
      }

      return {};
    };

    if (Array.isArray(incoming.connect)) {
      return extract(incoming.connect[0] as Record<string, unknown>);
    }

    if (typeof incoming.connect === 'object' && incoming.connect !== null) {
      return extract(incoming.connect as Record<string, unknown>);
    }

    if (typeof incoming.set === 'object' && incoming.set !== null) {
      return extract(incoming.set as Record<string, unknown>);
    }

    return extract(incoming);
  }

  return {};
};

const resolveUserId = async (
  strapi: any,
  reference: NormalizedUserReference
): Promise<number | undefined> => {
  if (reference.userId !== undefined) {
    return reference.userId;
  }

  if (reference.userDocumentId) {
    const user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({ where: { documentId: reference.userDocumentId } });

    return user?.id;
  }

  return undefined;
};

const syncLojaUserRelation = async (strapi: any, lojaId: number, userId?: number) => {
  try {
    await strapi.db.connection('lojas_user_lnk').where('loja_id', lojaId).delete();

    if (userId !== undefined && userId !== null) {
      await strapi.db.connection('lojas_user_lnk').insert({
        loja_id: lojaId,
        user_id: userId,
        loja_ord: 1.0,
      });
    }

    strapi.log.info(`[loja] syncLojaUserRelation lojaId=${lojaId} userId=${userId ?? 'null'}`);
  } catch (error) {
    strapi.log.error(`[loja] syncLojaUserRelation error=${error?.message ?? error}`);
    throw error;
  }
};

const prepareUserReference = (ctx: any): NormalizedUserReference | null => {
  const data = ctx.request.body?.data ?? {};
  const rawUser = data.user;

  // Se o campo user não foi enviado no payload, retorna null para preservar a relação existente
  if (rawUser === undefined) {
    return null;
  }

  // Se o campo user foi enviado (mesmo que seja null), processa e remove do payload
  const parsed = parseUserReference(rawUser);
  delete ctx.request.body.data.user;

  return parsed;
};

const ensurePopulate = (ctx: any) => {
  const query = ctx.query ?? {};
  const populate = query.populate;

  if (populate === 'deep') {
    return;
  }

  const normalizedPopulate =
    populate && typeof populate === 'object'
      ? (populate as Record<string, unknown>)
      : populate === '*' || populate === true
        ? { user: true }
        : {};

  query.populate = {
    ...normalizedPopulate,
    user: normalizedPopulate.user ?? true,
  };

  ctx.query = query;
};

const populateUserForLojas = async (strapi: any, lojas: any[], auth?: any) => {
  if (!lojas || lojas.length === 0) {
    return;
  }

  const lojaIds = lojas
    .map((loja) => loja.id)
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));

  if (lojaIds.length === 0) {
    return;
  }

  const links = await strapi.db.connection('lojas_user_lnk').whereIn('loja_id', lojaIds);

  const userIds = links
    .map((link) => link.user_id)
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));

  if (userIds.length === 0) {
    return;
  }

  const users = await strapi.db.query('plugin::users-permissions.user').findMany({
    where: { id: { $in: userIds } },
    populate: {},
  });

  const userSchema = strapi.getModel('plugin::users-permissions.user');
  const sanitizedUsers = await Promise.all(
    users.map(async (user: any) => {
      try {
        return await strapi.contentAPI.sanitize.output(user, userSchema, { auth });
      } catch {
        return user;
      }
    })
  );

  const userMap = new Map(sanitizedUsers.map((user: any) => [user.id, user]));

  const linkMap = new Map<number, number>();
  links.forEach((link) => {
    if (typeof link.loja_id === 'number' && typeof link.user_id === 'number') {
      linkMap.set(link.loja_id, link.user_id);
    }
  });

  lojas.forEach((loja) => {
    if (typeof loja.id === 'number') {
      const userId = linkMap.get(loja.id);
      if (userId !== undefined) {
        const user = userMap.get(userId);
        if (user) {
          loja.user = user;
        }
      }
    }
  });
};

const extractLojasFromResponse = (response: any): any[] => {
  if (!response?.data) {
    return [];
  }

  if (Array.isArray(response.data)) {
    return response.data.map((item: any) => {
      if (item?.attributes) {
        return { ...item.attributes, id: item.id, documentId: item.documentId };
      }
      return item;
    });
  }

  if (response.data?.attributes) {
    return [{ ...response.data.attributes, id: response.data.id, documentId: response.data.documentId }];
  }

  return [response.data];
};

const setLojasInResponse = (response: any, lojas: any[]) => {
  if (!response?.data) {
    return;
  }

  if (Array.isArray(response.data)) {
    response.data.forEach((item: any, index: number) => {
      const loja = lojas[index];
      if (item) {
        if (item.attributes) {
          if (loja?.user) {
            item.attributes.user = loja.user;
          } else {
            delete item.attributes.user;
          }
        } else {
          if (loja?.user) {
            item.user = loja.user;
          } else {
            delete item.user;
          }
        }
      }
    });
  } else if (response.data?.attributes) {
    const loja = lojas[0];
    if (loja?.user) {
      response.data.attributes.user = loja.user;
    } else {
      delete response.data.attributes.user;
    }
  } else {
    const loja = lojas[0];
    if (loja?.user) {
      response.data.user = loja.user;
    } else {
      delete response.data.user;
    }
  }
};

export default factories.createCoreController('api::loja.loja', ({ strapi }) => ({
  async find(ctx) {
    ensurePopulate(ctx);
    const response = await super.find(ctx);
    const auth = ctx.state.auth;

    if (response?.data) {
      const lojas = extractLojasFromResponse(response);
      await populateUserForLojas(strapi, lojas, auth);
      setLojasInResponse(response, lojas);
    }

    return response;
  },

  async findOne(ctx) {
    ensurePopulate(ctx);
    const response = await super.findOne(ctx);
    const auth = ctx.state.auth;

    if (response?.data) {
      const lojas = extractLojasFromResponse(response);
      await populateUserForLojas(strapi, lojas, auth);
      setLojasInResponse(response, lojas);
    }

    return response;
  },

  async create(ctx) {
    try {
      const userReference = prepareUserReference(ctx);
      const auth = ctx.state.auth;

      const response = await super.create(ctx);
      const createdLojaId = response?.data?.id;

      if (createdLojaId) {
        const resolvedUserId = await resolveUserId(strapi, userReference);
        await syncLojaUserRelation(strapi, createdLojaId, resolvedUserId);

        const lojas = extractLojasFromResponse(response);
        await populateUserForLojas(strapi, lojas, auth);
        setLojasInResponse(response, lojas);
      }

      return response;
    } catch (error) {
      strapi.log.error(`[loja] create error=${error?.message ?? error}`);
      if (error instanceof Error && error.stack) {
        strapi.log.error(error.stack);
      }
      throw error;
    }
  },

  async update(ctx) {
    try {
      const auth = ctx.state.auth;
      const paramId = ctx.params?.id;

      // Resolve o ID numérico e documentId da loja ANTES do update
      let originalLojaId: number | undefined;
      let originalDocumentId: string | undefined;

      if (paramId) {
        const numericId = Number(paramId);
        if (Number.isFinite(numericId)) {
          originalLojaId = numericId;
          const loja = await strapi.db.query('api::loja.loja').findOne({
            where: { id: numericId },
            populate: {},
          });
          originalDocumentId = loja?.documentId;
        } else {
          // Se não é um número, provavelmente é um documentId
          // Com Draft & Publish, pode haver múltiplas versões (draft e publicado)
          // Preferimos a versão publicada, mas se não houver, usamos a draft
          const lojas = await strapi.db.query('api::loja.loja').findMany({
            where: { documentId: paramId },
            populate: {},
          });

          // Ordena manualmente: publicados primeiro (publishedAt não null), depois drafts
          lojas.sort((a: any, b: any) => {
            if (a.publishedAt && !b.publishedAt) return -1;
            if (!a.publishedAt && b.publishedAt) return 1;
            return 0;
          });

          // Prefere a loja publicada (com publishedAt), senão usa a primeira
          const publishedLoja = lojas.find((l: any) => l.publishedAt !== null);
          const loja = publishedLoja || lojas[0];

          if (loja) {
            originalLojaId = loja.id;
            originalDocumentId = loja.documentId || paramId;
            strapi.log.info(
              `[loja] update found ${lojas.length} loja(s) with documentId=${paramId}, using id=${originalLojaId} (published=${!!publishedLoja})`
            );
          } else {
            originalLojaId = undefined;
            originalDocumentId = paramId;
          }
        }
      }

      strapi.log.info(
        `[loja] update paramId=${paramId} originalLojaId=${originalLojaId ?? 'null'} originalDocumentId=${originalDocumentId ?? 'null'}`
      );

      // Busca a relação existente ANTES do update (usando o ID original)
      let existingUserId: number | undefined;
      if (originalLojaId !== undefined && Number.isFinite(originalLojaId)) {
        const existingLink = await strapi.db.connection('lojas_user_lnk').where('loja_id', originalLojaId).first();
        existingUserId =
          existingLink && typeof existingLink.user_id === 'number' ? existingLink.user_id : undefined;
        strapi.log.info(`[loja] update existingUserId=${existingUserId ?? 'null'}`);
      }

      // Processa a referência do usuário no payload (se existir) ANTES de fazer o update
      const userReference = prepareUserReference(ctx);

      strapi.log.info(
        `[loja] update userReference=${userReference === null ? 'null (preserve existing)' : JSON.stringify(userReference)}`
      );

      // Se não encontramos a loja pelo parâmetro, retorna 404 antes de chamar super.update
      if (originalLojaId === undefined) {
        strapi.log.error(`[loja] update loja not found for paramId=${paramId}`);
        return ctx.notFound('Loja not found');
      }

      // Se encontramos a loja, vamos fazer o update diretamente usando entityService
      // Isso evita problemas com documentId duplicado no Draft & Publish
      let response: any;

      if (originalLojaId !== undefined && Number.isFinite(originalLojaId)) {
        try {
          // Atualiza o ctx.params.id para o ID numérico para o super.update funcionar
          const originalParamId = ctx.params?.id;
          ctx.params.id = String(originalLojaId);

          strapi.log.info(`[loja] update using numeric ID in params: ${originalLojaId} (original param: ${originalParamId})`);

          // Chama o super.update com o ID numérico
          response = await super.update(ctx);

          // Se não retornou dados, tenta fazer update direto usando entityService
          if (!response?.data) {
            strapi.log.warn(`[loja] update super.update returned no data, trying direct entityService update`);

            const updateData = ctx.request.body?.data ?? {};
            const updatedLoja = await strapi.entityService.update('api::loja.loja', originalLojaId, {
              data: updateData,
              populate: {},
            });

            if (updatedLoja) {
              // Formata a resposta no formato esperado pelo Strapi
              response = {
                data: {
                  id: updatedLoja.id,
                  documentId: updatedLoja.documentId,
                  attributes: updatedLoja,
                },
              };
              strapi.log.info(`[loja] update direct entityService update successful: id=${updatedLoja.id}`);
            } else {
              strapi.log.error(`[loja] update direct entityService update also failed`);
              return ctx.notFound('Loja not found');
            }
          }
        } catch (error: any) {
          strapi.log.error(`[loja] update error: ${error?.message ?? error}`);
          
          // Se o erro é 404, tenta fazer update direto
          if (error?.status === 404 || error?.name === 'NotFoundError') {
            try {
              strapi.log.info(`[loja] update retrying with direct entityService update`);
              const updateData = ctx.request.body?.data ?? {};
              const updatedLoja = await strapi.entityService.update('api::loja.loja', originalLojaId, {
                data: updateData,
                populate: {},
              });

              if (updatedLoja) {
                response = {
                  data: {
                    id: updatedLoja.id,
                    documentId: updatedLoja.documentId,
                    attributes: updatedLoja,
                  },
                };
                strapi.log.info(`[loja] update direct entityService update successful: id=${updatedLoja.id}`);
              } else {
                return ctx.notFound('Loja not found');
              }
            } catch (retryError: any) {
              strapi.log.error(`[loja] update direct entityService update error: ${retryError?.message ?? retryError}`);
              throw error; // Lança o erro original
            }
          } else {
            throw error;
          }
        }
      } else {
        return ctx.notFound('Loja not found');
      }

      // Obtém o novo lojaId da resposta (pode ter mudado se o Strapi criou uma nova loja)
      let newLojaId: number | undefined;
      const lojas = extractLojasFromResponse(response);
      if (lojas.length > 0 && typeof lojas[0].id === 'number') {
        newLojaId = lojas[0].id;
        strapi.log.info(`[loja] update newLojaId from response: ${newLojaId}`);

        // Se o ID mudou, precisamos migrar a relação do ID antigo para o novo
        if (originalLojaId !== undefined && newLojaId !== originalLojaId) {
          strapi.log.warn(
            `[loja] update ID changed from ${originalLojaId} to ${newLojaId}, migrating relation`
          );

          // Remove a relação do ID antigo
          await strapi.db.connection('lojas_user_lnk').where('loja_id', originalLojaId).delete();

          // Se havia uma relação existente, cria no novo ID
          if (existingUserId !== undefined) {
            await strapi.db.connection('lojas_user_lnk').insert({
              loja_id: newLojaId,
              user_id: existingUserId,
              loja_ord: 1.0,
            });
            strapi.log.info(`[loja] update migrated relation from lojaId=${originalLojaId} to lojaId=${newLojaId} userId=${existingUserId}`);
          }
        }
      }

      // Usa o novo lojaId se disponível, senão usa o original
      const lojaId = newLojaId ?? originalLojaId;

      if (lojaId !== undefined && Number.isFinite(lojaId)) {
        let desiredUserId: number | undefined;

        // Se userReference é null, significa que o campo user não foi enviado - preserva a relação existente
        if (userReference === null) {
          desiredUserId = existingUserId;
          strapi.log.info(`[loja] update preserving existing relation userId=${desiredUserId ?? 'null'}`);
        }
        // Se explicitNull ou userId === null, remove a relação
        else if (userReference.explicitNull || userReference.userId === null) {
          desiredUserId = undefined;
          strapi.log.info(`[loja] update removing user relation`);
        }
        // Se userReference tem userId ou userDocumentId, atualiza a relação
        else if (userReference.userId !== undefined || userReference.userDocumentId) {
          desiredUserId = await resolveUserId(strapi, userReference);
          strapi.log.info(`[loja] update updating relation to userId=${desiredUserId ?? 'null'}`);
        }
        // Caso padrão: preserva a relação existente
        else {
          desiredUserId = existingUserId;
          strapi.log.info(`[loja] update keeping existing userId=${desiredUserId ?? 'null'}`);
        }

        // Sincroniza a relação apenas se houve mudança ou se precisa remover
        // Usa o novo lojaId para garantir que a relação está no ID correto
        if (desiredUserId !== existingUserId || (newLojaId !== undefined && newLojaId !== originalLojaId)) {
          await syncLojaUserRelation(strapi, lojaId, desiredUserId);
          strapi.log.info(`[loja] update relation synced: lojaId=${lojaId} userId=${desiredUserId ?? 'null'}`);
        } else {
          strapi.log.info(`[loja] update no relation change needed`);
        }

        // Popula o user na resposta
        await populateUserForLojas(strapi, lojas, auth);
        setLojasInResponse(response, lojas);
      } else {
        strapi.log.warn(`[loja] update lojaId is not a valid number, skipping relation sync`);
      }

      return response;
    } catch (error) {
      strapi.log.error(`[loja] update error=${error?.message ?? error}`);
      if (error instanceof Error && error.stack) {
        strapi.log.error(error.stack);
      }
      throw error;
    }
  },
}));
