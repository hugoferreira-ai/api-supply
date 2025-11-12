/**
 * plano controller
 */

import { factories } from '@strapi/strapi';

const USERS_FIELDS = ['id', 'documentId', 'username', 'email', 'telefone'];

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

const ensureUsersPopulate = (ctx: any) => {
  const normalized = normalizePopulate(ctx.query.populate);

  if (normalized === '*') {
    return;
  }

  const populate = normalized as Record<string, unknown>;
  const currentUsersPopulate =
    typeof populate.users === 'object' && populate.users !== null
      ? { ...(populate.users as Record<string, unknown>) }
      : {};

  if (!currentUsersPopulate.fields) {
    currentUsersPopulate.fields = USERS_FIELDS;
  }

  populate.users = currentUsersPopulate;
  ctx.query.populate = populate;
};

const addUsersCount = <T extends { data?: any }>(response: T): T => {
  const compute = (entry: any) => {
    if (!entry?.attributes) {
      return entry;
    }

    const usersData = entry.attributes.users?.data;
    const count = Array.isArray(usersData) ? usersData.length : 0;

    entry.attributes.usersCount = count;

    return entry;
  };

  if (Array.isArray(response?.data)) {
    response.data = response.data.map(compute);
  } else if (response?.data) {
    response.data = compute(response.data);
  }

  return response;
};

export default factories.createCoreController('api::plano.plano', () => ({
  async find(ctx) {
    ensureUsersPopulate(ctx);

    const response = await super.find(ctx);

    return addUsersCount(response);
  },
  async findOne(ctx) {
    ensureUsersPopulate(ctx);

    const response = await super.findOne(ctx);

    return addUsersCount(response);
  },
}));
