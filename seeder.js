import "./utils/LoadEnvConfig.js";
import bcrypt from 'bcrypt';
import context from "./context/AppContext.js";

const { Roles, Permissions, Departments, Users, Sequelize } = context;

async function seed() {
    try {
        await Sequelize.sync({ force: true });
        console.log("Base de datos sincronizada");

        //Roles
        const [admin, director, gerente, usuario] = await Roles.bulkCreate([
            { name: 'Admin', level: 99, is_system: true },
            { name: 'Director', level: 2, is_system: true },
            { name: 'Gerente', level: 1, is_system: true },
            { name: 'Usuario', level: 0, is_system: true },
        ], { returning: true });

        console.log('Roles creados');

        //Permisos

        const permissions = await Permissions.bulkCreate([
            { name: "ver_todas_solicitudes", description: "Ver solicitudes de toda la organización" },
            { name: "ver_solicitudes_area", description: "Ver solicitudes de su área/dirección" },
            { name: "aprobar_solicitud", description: "Aprobar una solicitud" },
            { name: "rechazar_solicitud", description: "Rechazar una solicitud con comentario" },
            { name: "escalar_solicitud", description: "Escalar solicitud al superior" },
            { name: "crear_solicitud", description: "Crear una nueva solicitud" },
            { name: "gestionar_roles", description: "Crear y editar roles del sistema" },
            { name: "gestionar_usuarios", description: "Crear y editar usuarios" },
        ], { returning: true });

        const [
            verTodas, verArea, aprobar,
            rechazar, escalar, crear,
            gestionarRoles, gestionarUsuarios
        ] = permissions;

        console.log("Permisos creados");

        //Permisos por rol

        await admin.addPermissions([
            verTodas, verArea, aprobar,
            rechazar, escalar, crear,
            gestionarRoles, gestionarUsuarios
        ]);

        await director.addPermissions([verArea, aprobar, rechazar, escalar, crear]);
        await gerente.addPermissions([aprobar, rechazar, escalar, crear]);
        await usuario.addPermissions([crear]);

        console.log("Permisos asignados a roles");

        //Departamentos

        const [dTec, dFin, dLeg] = await Departments.bulkCreate([
            { name: "Tecnología", parent_id: null },
            { name: "Finanzas", parent_id: null },
            { name: "Legal", parent_id: null },
        ], { returning: true });

        await Departments.bulkCreate([
            { name: "Gerencia Soporte", parent_id: dTec.id },
            { name: "Gerencia Software", parent_id: dTec.id },
            { name: "Gestión Demanda", parent_id: dTec.id },
            { name: "Gerencia Ctas por Cobrar", parent_id: dFin.id },
            { name: "Tesorería", parent_id: dFin.id },
            { name: "Gerencia Legal", parent_id: dLeg.id },
            { name: "Gerencia Riesgos", parent_id: dLeg.id },
        ]);

        console.log("Departamentos creados");

        //Usuario
        await Users.create({
            name: 'Alexander Bernal',
            username: 'admin',
            password: await bcrypt.hash('admin123456', 10),
            role_id: admin.id,
            department_id: dTec.id,
            supervisor_id: null,
        });

        console.log('Admin creado');

        console.log("Seed completado");

    } catch (err) {
        console.log('Error en el seed: ', err);
    } finally {
        await Sequelize.close();
    }
}

seed();