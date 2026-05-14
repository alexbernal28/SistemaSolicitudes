import bcrypt from "bcrypt";
import context from "../context/AppContext.js";

const { Users, Roles, Departments } = context;

// Select Usuarios
export const getUsers = async (req, res) => {
    try {

        const usersResult = await Users.findAll({
            include: [
                {
                    model: Roles,
                    attributes: ["id", "name"],
                },
                {
                    model: Departments,
                    attributes: ["id", "name"],
                }
            ],
            order: [["name", "ASC"]]
        });

        if (usersResult.length === 0) {
            req.flash("errors", "Error al cargar la lista de usuarios.");
            return res.redirect("/dashboard");
        }

        const users = usersResult.map(u => ({
            ...u.toJSON(),
            isActive: u.is_active
        }));

        res.render("user/index", {
            title: 'Usuarios',
            users,
        });

    } catch (err) {
        console.error("Error al obtener los usuarios:", err);
        req.flash("errors", "Error al cargar los usuarios");
        res.redirect("/dashboard");
    }
}

//Create usuarios

export const getCreate = async (req, res) => {
    try {
        const [roles, departments] = await Promise.all([
            Roles.findAll({ order: [["level", "DESC"]] }),
            Departments.findAll({ order: [["name", "ASC"]] })
        ]);

        res.render("user/form", {
            title: "Nuevo Usuario",
            roles: roles.map(r => r.toJSON()),
            departments: departments.map(d => d.toJSON()),
            EditMode: false
        });
    } catch (err) {
        console.error("Error en el create de usuarios:", err);
        req.flash("errors", "Error al cargar el formulario");
        res.redirect("/dashboard");
    }
}

export const postCreate = async (req, res) => {
    try {
        const { name, username, password, role_id, department_id, supervisor_id } = req.body;

        if (!name || !username || !password || !role_id || !department_id) {
            req.flash("errors", "Todos los campos son requeridos.");
            return res.redirect("/users/new");
        }

        if (password < 8) {
            req.flash("errors", "La contraseña debe tener al menos 8 caracteres.");
            return res.redirect("/users/new");
        }

        const exists = await Users.findOne({ where: { username } });

        if (exists) {
            req.flash("errors", "Este usuario ya está en uso.");
            return res.redirect("/users/new");
        }

        await Users.create({
            name,
            username,
            password: await bcrypt.hash(password, 10),
            is_active: true,
            role_id,
            department_id,
            supervisor_id: supervisor_id || null
        });

        req.flash("success", `El usuario de ${name} ha sido creado exitosamente`);
        return res.redirect("/users");

    } catch (err) {
        console.error("Error al crear el usuario:", err);
        req.flash("errors", "Error al crear el usuario");
        res.redirect("/users/new");
    }
}

// edit usuarios

export const getEdit = async (req, res) => {
    try {

        const [user, roles, departments] = await Promise.all([
            Users.findByPk(req.params.id, {
                include: [
                    { model: Roles },
                    { model: Departments }
                ]
            }),
            Roles.findAll({ order: [["level", "DESC"]] }),
            Departments.findAll({ order: [["name", "ASC"]] })
        ]);

        if (!user) {
            req.flash("errors", "Usuario no encontrado");
            return res.redirect("/users");
        }

        // Obtener posibles supervisores (todos excepto el mismo usuario)
        const supervisors = await Users.findAll({
            where: { is_active: true },
            attributes: ["id", "name"],
            order: [["name", "ASC"]]
        });

        res.render("user/form", {
            title: "Editar Usuario",
            editingUser: user.toJSON(),
            roles: roles.map(r => r.toJSON()),
            departments: departments.map(d => d.toJSON()),
            supervisors: supervisors.filter(s => s.id !== user.id).map(s => s.toJSON()),
            EditMode: true
        });

    } catch (err) {
        console.error("Error al editar el usuario:", err);
        req.flash("errors", "Error al editar el usuario");
        res.redirect("/users");
    }
}

export const postEdit = async (req, res) => {
    try {

        const user = await Users.findByPk(req.params.id);

        if (!user) {
            req.flash("errors", "Usuario no encontrado");
            return res.redirect("/users");
        }

        const { name, username, password, role_id, department_id, supervisor_id } = req.body;

        const exists = await Users.findOne({ where: { username } });

        if (exists && exists.id !== user.id) {
            req.flash("errors", "Este usuario ya está en uso.");
            return res.redirect(`/users/${user.id}/edit`);
        }

        const updatedData = {
            name,
            username,
            role_id,
            department_id,
            supervisor_id: supervisor_id || null
        }

        if (password && password.trim() !== "") {
            if (password.length < 8) {
                req.flash("errors", "La contraseña debe tener al menos 8 caracteres");
                return res.redirect(`/users/${user.id}/edit`);
            }
            updatedData.password = await bcrypt.hash(password, 10);
        }

        await user.update(updatedData);

        req.flash("success", `El usuario de ${name} ha sido editado exitosamente`);
        return res.redirect("/users");

    } catch (err) {
        console.error("Error al editar el usuario:", err);
        req.flash("errors", "Error al editar el usuario");
        res.redirect("/users");
    }
}

// Desactivate or activate

export const postToggle = async (req, res) => {
    try {

        const user = await Users.findByPk(req.params.id);

        if (!user) {
            req.flash("errors", "Usuario no encontrado");
            return res.redirect("/users");
        }

        if (user.id === req.user.id) {
            req.flash("errors", "No puedes desactivar tu propio usuario");
            return res.redirect("/users");
        }

        await user.update({ is_active: !user.is_active });

        const estado = user.is_active ? "activado" : "desactivado";

        req.flash("success", `El usuario de "${user.name}" ha sido ${estado} correctamente`);
        res.redirect("/users");

    } catch (err) {
        console.error("Error al cambiar el estado del usuario:", err);
        req.flash("errors", "Error al cambiar el estado del usuario");
        res.redirect("/users");
    }
}