/**
 * loja controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::loja.loja', ({ strapi }) => ({
  async create(ctx) {
    try {
      const data = ctx.request.body?.data ?? {};
      const rawUser = data.user;

      let userId: number | undefined;
      let userDocumentId: string | undefined;

      if (rawUser !== undefined && rawUser !== null) {
        if (typeof rawUser === 'number') {
          userId = rawUser;
        } else if (typeof rawUser === 'string') {
          if (!Number.isNaN(Number(rawUser))) {
            userId = Number(rawUser);
          } else {
            userDocumentId = rawUser;
          }
        } else if (typeof rawUser === 'object') {
          const incoming = rawUser as Record<string, unknown>;

          if ('connect' in incoming && incoming.connect && typeof incoming.connect === 'object') {
            const connectValue = incoming.connect;
            const firstEntry = Array.isArray(connectValue) ? connectValue[0] : connectValue;

            if (firstEntry && typeof firstEntry === 'object') {
              if ('id' in firstEntry && typeof (firstEntry as Record<string, unknown>).id === 'number') {
                userId = (firstEntry as Record<string, unknown>).id as number;
              } else if (
                'documentId' in firstEntry &&
                typeof (firstEntry as Record<string, unknown>).documentId === 'string'
              ) {
                userDocumentId = (firstEntry as Record<string, unknown>).documentId as string;
              }
            }
          } else if ('set' in incoming && incoming.set && typeof incoming.set === 'object') {
            const setValue = incoming.set as Record<string, unknown>;

            if ('id' in setValue && typeof setValue.id === 'number') {
              userId = setValue.id;
            } else if ('documentId' in setValue && typeof setValue.documentId === 'string') {
              userDocumentId = setValue.documentId;
            }
          } else {
            if ('id' in incoming && typeof incoming.id === 'number') {
              userId = incoming.id;
            } else if ('documentId' in incoming && typeof incoming.documentId === 'string') {
              userDocumentId = incoming.documentId as string;
            }
          }
        }

        delete ctx.request.body.data.user;
      }

      strapi.log.info(`[loja] finalPayload=${JSON.stringify(ctx.request.body ?? null)}`);

      const response = await super.create(ctx);
      const createdLojaId = response?.data?.id;

      if (createdLojaId && (userId !== undefined || userDocumentId)) {
        let resolvedUserId = userId;

        if (!resolvedUserId && userDocumentId) {
          const foundUser = await strapi.db
            .query('plugin::users-permissions.user')
            .findOne({ where: { documentId: userDocumentId } });

          resolvedUserId = foundUser?.id;
        }

        if (resolvedUserId) {
          await strapi.db.connection('lojas_user_lnk').insert({
            loja_id: createdLojaId,
            user_id: resolvedUserId,
          });
        }
      }

      return response;
    } catch (error) {
      strapi.log.error(`[loja] error=${error?.message ?? error}`);
      if (error instanceof Error && error.stack) {
        strapi.log.error(error.stack);
      }
      throw error;
    }
  },
}));
