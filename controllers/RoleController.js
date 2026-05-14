import context from "../context/AppContext.js";

const { Roles, Permissions } = context;

//select Roles

export const getRoles = async (req, res) => {
    try {

        const roles = await Roles.findAll({
            include: [
                {
                    model: Permissions,
                    attributes: ["id", "name", "description"]
                }
            ],
            order: [["level", "DESC"]]
        });

        res.render("role/index", {
            title: "Roles",
            roles: roles.map(r => ({
                ...r.toJSON(),
                permissionCount: r.Permissions.length
            }))
        });

    } catch (err) {
        console.error("Error al obtener los roles:", err);
        req.flash("errors", "Error al cargar los roles");
        res.redirect("/dashboard");
    }
}

// create roles

export const getCreate = async (req, res) => {
    try {

        const permissions = await Permissions.findAll({ order: [["name", "ASC"]] });

        res.render("role/form", {
            title: "Nuevo Rol",
            permissions: permissions.map(p => p.toJSON()),
            EditMode: false
        });

    } catch (err) {
        console.error("Error en el formulario de crear roles:", err);
        req.flash("errors", "Error al abrir el formulario de crear roles");
        res.redirect("/dashboard");
    }
}

export const postCreate = async (req, res) => {
    try {

        let { name, level, permissions } = req.body;

        if (!name || level == undefined) {
            req.flash("errors", "El nombre y el nivel son requeridos.");
            return res.redirect("/roles/new");
        }

        const exists = await Roles.findOne({ where: { name } });

        if (exists) {
            req.flash("errors", "Ya existe un rol con este nombre.");
            return res.redirect("/roles/new");
        }

        const role = await Roles.create({
            name,
            level: parseInt(level),
            is_system: false
        });

        // Añadir permisos
        if (permissions) {
            const ids = Array.isArray(permissions) ? permissions : [permissions];
            await role.addPermissions(ids.map(id => parseInt(id)));
        }

        req.flash("success", `El rol ${name} ha sido creado satisfactorimente`);
        return res.redirect("/roles");

    } catch (err) {
        console.error("Error al crear rol:", err);
        req.flash("errors", "Error al intentar crear el rol");
        res.redirect("/roles/new");
    }
}

//Edit roles

export const getEdit = async (req, res) => {
    try {
        const [role, permissions] = await Promise.all([
            Roles.findByPk(req.params.id, {
                include: [{ model: Permissions }]
            }),
            Permissions.findAll({ order: [["name", "ASC"]] })
        ]);

        if (!role) {
            req.flash("errors", "Rol no encontrado.");
            return res.redirect("/roles");
        }

        const assignedPermissions = role.Permissions.map(p => p.id);

        res.render("role/form", {
            title: "Editar Rol",
            rol: role.toJSON(),
            permissions: permissions.map(p => ({
                ...p.toJSON(),
                checked: assignedPermissions.includes(p.id)
            })),
            EditMode: true
        });

    } catch (err) {
        console.error("Error en el formulario de editar rol:", err);
        req.flash("errors", "Error al intentar cargar el rol");
        res.redirect("/roles");
    }
}

export const postEdit = async (req, res) => {
    try {

        const role = await Roles.findByPk(req.params.id, {
            include: [{ model: Permissions }]
        });

        if (!role) {
            req.flash("errors", "Rol no encontrado.");
            return res.redirect("/roles");
        }

        const { name, level, permissions } = req.body;

        const exists = await Roles.findOne({ where: { name } });

        if (exists && exists.id !== role.id) {
            req.flash("errors", "Ya existe un rol con este nombre.");
            return res.redirect(`/roles/${role.id}/edit`);
        }

        await role.update({
            name,
            level: parseInt(level)
        });

        const ids = permissions
            ? (Array.isArray(permissions) ? permissions : [permissions]).map(id => parseInt(id))
            : [];

        await role.setPermissions(ids);

        req.flash("success", `El rol ${name} ha sido actualizado correctamente.`);
        return res.redirect("/roles");

    } catch (err) {
        console.error("Error al editar rol:", err);
        req.flash("errors", "Error al intentar editar el rol");
        res.redirect("/roles");
    }
}

//delete rol

export const postDelete = async (req, res) => {
    try {

        const role = await Roles.findByPk(req.params.id);

        if (!role) {
            req.flash("errors", "Rol no encontrado.");
            return res.redirect("/roles");
        }

        if (role.is_system) {
            req.flash("errors", "Este rol pertenece al sistema, no puede ser eliminado.");
            return res.redirect("/roles");
        }

        await role.destroy();

        req.flash("success", "Rol eliminado correctamente");
        return res.redirect("/roles");

    } catch (err) {
        console.error("Error al eliminar rol:", err);
        req.flash("errors", "Error al intentar eliminar el rol");
        res.redirect("/roles");
    }
}