import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await createSuperAdmin(strapi);
    await createApiUser(strapi);
  },
};

/**
 * Cria um super admin com todas as permissões se não existir
 * Este usuário é para o painel administrativo do Strapi
 */
async function createSuperAdmin(strapi: Core.Strapi) {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@supply.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!@#';
  const superAdminFirstname = process.env.SUPER_ADMIN_FIRSTNAME || 'Super';
  const superAdminLastname = process.env.SUPER_ADMIN_LASTNAME || 'Admin';

  try {
    // Verificar se já existe um usuário admin com esse email
    const existingAdmin = await strapi.entityService.findMany('admin::user', {
      filters: { email: superAdminEmail },
    });

    if (existingAdmin.length > 0) {
      console.log(`✅ Super Admin já existe: ${superAdminEmail}`);
      return;
    }

    // Buscar a role "Super Admin" usando o código padrão do Strapi
    let superAdminRole = await strapi.entityService.findMany('admin::role', {
      filters: { code: 'strapi-super-admin' },
      limit: 1,
    });

    // Se não encontrar, buscar todas as roles e procurar pela super admin
    if (superAdminRole.length === 0) {
      const allRoles = await strapi.entityService.findMany('admin::role', {
        populate: ['permissions'],
      });

      // Procurar por role com código 'strapi-super-admin' ou nome 'Super Admin'
      superAdminRole = allRoles.filter((role: any) => 
        role.code === 'strapi-super-admin' || 
        role.name?.toLowerCase() === 'super admin'
      );

      // Se ainda não encontrou, usar a primeira role disponível (geralmente é a super admin padrão)
      if (superAdminRole.length === 0 && allRoles.length > 0) {
        superAdminRole = [allRoles[0]];
        console.log(`⚠️  Role super admin não encontrada. Usando role padrão: ${superAdminRole[0].name}`);
      }
    }

    const roleId = superAdminRole.length > 0 ? superAdminRole[0].id : null;

    if (!roleId) {
      console.error('❌ Não foi possível encontrar uma role adequada. Usuário não será criado.');
      return;
    }

    // Criar o usuário super admin usando entityService
    const superAdmin = await strapi.entityService.create('admin::user', {
      data: {
        email: superAdminEmail,
        password: superAdminPassword,
        firstname: superAdminFirstname,
        lastname: superAdminLastname,
        isActive: true,
        blocked: false,
      },
    });

    // Atribuir a role usando query direta na tabela de relacionamento manyToMany
    if (roleId) {
      try {
        const knex = strapi.db.connection;
        await knex('admin_users_roles_links')
          .insert({
            user_id: superAdmin.id,
            role_id: roleId,
            user_order: 1,
            role_order: 1,
          })
          .onConflict(['user_id', 'role_id'])
          .ignore();
      } catch (error: any) {
        console.warn(`⚠️  Não foi possível atribuir role automaticamente: ${error?.message}`);
        console.warn('💡 Você pode atribuir a role manualmente no painel admin');
      }
    }

    const roleName = superAdminRole[0].name || 'Super Admin';
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║          ✅ SUPER ADMIN CRIADO COM SUCESSO!                 ║
╠══════════════════════════════════════════════════════════════╣
║  Email: ${superAdminEmail.padEnd(46)}║
║  Senha: ${superAdminPassword.padEnd(47)}║
║  Role: ${roleName.padEnd(48)}║
║                                                              ║
║  Acesse o painel admin em:                                   ║
║  http://localhost:1337/admin                                 ║
╠══════════════════════════════════════════════════════════════╣
║  ⚠️  IMPORTANTE: Altere a senha após o primeiro acesso!     ║
╚══════════════════════════════════════════════════════════════╝
    `);

  } catch (error: any) {
    console.error('❌ Erro ao criar Super Admin:', error?.message || error);
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

/**
 * Cria um usuário de API com permissões completas para uso no app Flutter
 * Este usuário pode ser usado para autenticação via API
 */
async function createApiUser(strapi: Core.Strapi) {
  const apiUserEmail = process.env.API_USER_EMAIL || 'api@supply.com';
  const apiUserPassword = process.env.API_USER_PASSWORD || 'Api123!@#';
  const apiUsername = process.env.API_USER_USERNAME || 'api_user';
  const apiRoleName = process.env.API_USER_ROLE_NAME || 'API User';
  const apiRoleType = process.env.API_USER_ROLE_TYPE || 'api-user'; // Tipo único para role customizada

  try {
    // Primeiro, garantir que a role existe (precisa existir antes de criar/atualizar usuário)
    let apiRole: any[] = await strapi.entityService.findMany('plugin::users-permissions.role', {
      filters: { type: apiRoleType },
      limit: 1,
    });

    if (apiRole.length === 0) {
      // Criar role customizada
      const newRole = await strapi.entityService.create('plugin::users-permissions.role', {
        data: {
          name: apiRoleName,
          type: apiRoleType,
          description: 'Role customizada para usuários de API com acesso completo',
        },
      });
      
      apiRole = [newRole];

      console.log(`✅ Role customizada criada: ${apiRoleName}`);

      // Atribuir todas as permissões necessárias automaticamente
      await assignPermissionsToRole(strapi, apiRole[0].id);
    }

    // Garantir que apiRole tem um valor válido
    if (!apiRole || apiRole.length === 0) {
      console.error('❌ Não foi possível criar ou encontrar a role. Usuário não será criado.');
      return;
    }

    // Verificar se já existe um usuário de API com esse email ou username
    const existingUser = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: {
        $or: [
          { email: apiUserEmail },
          { username: apiUsername }
        ]
      },
    });

    if (existingUser.length > 0) {
      const existing = existingUser[0];
      console.log(`✅ Usuário de API já existe: ${apiUserEmail}`);
      
      // Para garantir que a senha seja hashada corretamente, vamos deletar e recriar
      console.log(`🔄 Deletando usuário existente para recriar com senha correta...`);
      try {
        await strapi.entityService.delete('plugin::users-permissions.user', existing.id);
        console.log(`✅ Usuário deletado. Será recriado abaixo...`);
      } catch (deleteError: any) {
        console.error(`❌ Erro ao deletar usuário: ${deleteError?.message}`);
        console.warn(`💡 Você pode deletar manualmente pelo painel admin e reiniciar o Strapi.`);
        return;
      }
      
      // Continuar para criar o usuário novamente (código abaixo)
    }

    // Criar o usuário de API usando o serviço do plugin (isso garante que a senha seja hashada corretamente)
    console.log(`🔧 Criando usuário de API...`);
    console.log(`   Email: ${apiUserEmail}`);
    console.log(`   Username: ${apiUsername}`);
    console.log(`   Role ID: ${apiRole[0].id}`);
    
    try {
      // Usar o serviço do plugin para criar o usuário (garante hash correto da senha)
      const plugin = strapi.plugin('users-permissions');
      if (!plugin || !plugin.service('user')) {
        throw new Error('Plugin users-permissions não disponível');
      }
      
      console.log(`🔧 Usando serviço do plugin para criar usuário (hash automático da senha)...`);
      
      const apiUser = await plugin.service('user').add({
        username: apiUsername,
        email: apiUserEmail,
        password: apiUserPassword,
        confirmed: true,
        blocked: false,
        role: apiRole[0].id,
        provider: 'local', // Importante: definir provider como 'local'
      });

      console.log(`✅ Usuário criado com ID: ${apiUser.id} usando serviço do plugin`);

      // Verificar se o usuário foi criado corretamente
      const verifyUser = await strapi.entityService.findOne('plugin::users-permissions.user', apiUser.id, {
        populate: ['role'],
      });

      if (verifyUser) {
        console.log(`✅ Usuário verificado:`);
        console.log(`   ID: ${verifyUser.id}`);
        console.log(`   Email: ${(verifyUser as any).email}`);
        console.log(`   Username: ${(verifyUser as any).username}`);
        console.log(`   Confirmed: ${(verifyUser as any).confirmed}`);
        console.log(`   Blocked: ${(verifyUser as any).blocked}`);
        const roleInfo = (verifyUser as any).role;
        console.log(`   Role: ${roleInfo ? (roleInfo.name || roleInfo.id) : 'Sem role'}`);
      }

      // Nota: O teste de login pode não estar disponível durante o bootstrap
      // O usuário será criado e você pode testar via API depois
      console.log(`ℹ️  Para testar o login, use: POST /api/auth/local com identifier: "${apiUserEmail}" e password: "${apiUserPassword}"`);

    } catch (userError: any) {
      console.error(`❌ Erro ao criar usuário com serviço do plugin: ${userError?.message}`);
      console.log(`🔄 Tentando criar com entityService...`);
      
      // Fallback: tentar criar com entityService
      const apiUser = await strapi.entityService.create('plugin::users-permissions.user', {
        data: {
          username: apiUsername,
          email: apiUserEmail,
          password: apiUserPassword,
          confirmed: true,
          blocked: false,
          role: apiRole[0].id,
        },
      });
      
      console.log(`✅ Usuário criado com entityService (ID: ${apiUser.id})`);
      console.warn(`⚠️  Nota: Verifique se a senha foi hashada corretamente.`);
    }

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║          ✅ USUÁRIO DE API CRIADO COM SUCESSO!               ║
╠══════════════════════════════════════════════════════════════╣
║  Email: ${apiUserEmail.padEnd(49)}║
║  Username: ${apiUsername.padEnd(46)}║
║  Senha: ${apiUserPassword.padEnd(50)}║
║  Role: ${apiRoleName.padEnd(47)}║
║                                                              ║
║  Este usuário pode ser usado no app Flutter para:           ║
║  - Autenticação via API                                      ║
║  - Criar, editar e deletar Clientes                         ║
║  - Criar, editar e deletar Lojas                            ║
║  - Acessar Planos                                            ║
╠══════════════════════════════════════════════════════════════╣
║  📝 Para fazer login, use:                                   ║
║  identifier: "${apiUserEmail}" ou "${apiUsername}"          ║
║  password: "${apiUserPassword}"                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

  } catch (error: any) {
    console.error('❌ Erro ao criar Usuário de API:', error?.message || error);
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

/**
 * Atribui permissões automaticamente para uma role específica
 */
async function assignPermissionsToRole(strapi: Core.Strapi, roleId: any) {
  try {
    // Content types e ações que precisam de permissão
    const contentTypes = [
      { name: 'cliente', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
      { name: 'loja', actions: ['find', 'findOne', 'create', 'update', 'delete'] },
      { name: 'plans-enum', actions: ['find', 'findOne'] },
    ];

    const permissionsCreated: string[] = [];

    for (const contentType of contentTypes) {
      for (const action of contentType.actions) {
        const actionName = `api::${contentType.name}.${contentType.name}.${action}`;
        
        // Verificar se a permissão já existe
        const existingPermission = await strapi.entityService.findMany('plugin::users-permissions.permission', {
          filters: {
            role: {
              id: roleId,
            },
            action: actionName,
          },
          limit: 1,
        });

        if (existingPermission.length === 0) {
          try {
            await strapi.entityService.create('plugin::users-permissions.permission', {
              data: {
                action: actionName,
                role: roleId,
              },
            });
            permissionsCreated.push(actionName);
          } catch (error: any) {
            console.warn(`⚠️  Não foi possível criar permissão ${actionName}: ${error?.message}`);
          }
        }
      }
    }

    if (permissionsCreated.length > 0) {
      console.log(`✅ ${permissionsCreated.length} permissões atribuídas à role`);
    } else {
      console.log(`✅ Todas as permissões já estavam configuradas`);
    }
  } catch (error: any) {
    console.warn(`⚠️  Erro ao atribuir permissões: ${error?.message}`);
    console.warn('💡 Você pode configurar as permissões manualmente no painel admin');
  }
}
