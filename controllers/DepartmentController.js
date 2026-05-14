import context from "../context/AppContext.js";
import { Sequelize } from "sequelize";

const { Departments, Users } = context;

// Select Departamentos
export const getDepartments = async (req, res) => {
    try {

        const departmentsResult = await Departments.findAll({
            include: [
                { model: Departments, as: "children", attributes: ["id", "name"] },
                { model: Departments, as: "parent",   attributes: ["id", "name"] },
            ],
            order: [
                [Sequelize.literal('Departments.parent_id IS NOT NULL'), 'ASC'],
                ["name", "ASC"]
            ]
        });

        const departments = departmentsResult.map(d => ({
            ...d.toJSON()
        }));

        res.render("department/index", {
            title: 'Departamentos',
            departments,
        });

    } catch (err) {
        console.error("Error al obtener los departamentos:", err);
        req.flash("errors", "Error al cargar los departamentos");
        res.redirect("/dashboard");
    }
}

//Create departamento

export const getCreate = async (req, res) => {
    try {
        const departments = await Departments.findAll({
            where: { parent_id: null },
            order: [["name", "ASC"]]
        })

        res.render("department/form", {
            title: "Nuevo Departamento",
            parents: departments.map(d => d.toJSON()),
            EditMode: false
        });
    } catch (err) {
        console.error("Error en el create de departamentos:", err);
        req.flash("errors", "Error al cargar el formulario");
        res.redirect("/dashboard");
    }
}

export const postCreate = async (req, res) => {
    try {
        const { name, parent_id } = req.body;

        if (!name) {
            req.flash("errors", "El campo de nombre es requerido.");
            return res.redirect("/departments/new");
        }

        const exists = await Departments.findOne({ where: { name } });

        if (exists) {
            req.flash("errors", "Este departamento ya existe.");
            return res.redirect("/departments/new");
        }

        await Departments.create({
            name,
            parent_id: parent_id || null
        });

        req.flash("success", `El departamento ${name} ha sido creado exitosamente`);
        return res.redirect("/departments");

    } catch (err) {
        console.error("Error al crear el departamento:", err);
        req.flash("errors", "Error al crear el departamento");
        res.redirect("/departments/new");
    }
}

// edit departamentos

export const getEdit = async (req, res) => {
    try {

        const department = await Departments.findByPk(req.params.id);

        if (!department) {
            req.flash("errors", "Departamento no encontrado");
            return res.redirect("/departments");
        }

        // Obtener posibles departamentos padres (todos excepto el mismo departamento)
        const parents = await Departments.findAll({
            where: { parent_id: null },
            attributes: ["id", "name"],
            order: [["name", "ASC"]]
        });

        res.render("department/form", {
            title: "Editar departamento",
            department: department.toJSON(),
            parents: parents.filter(p => p.id !== department.id).map(p => p.toJSON()),
            EditMode: true
        });

    } catch (err) {
        console.error("Error al editar el departamento:", err);
        req.flash("errors", "Error al editar el departamento");
        res.redirect("/departments");
    }
}

export const postEdit = async (req, res) => {
    try {

        const department = await Departments.findByPk(req.params.id);

        if (!department) {
            req.flash("errors", "Departamento no encontrado");
            return res.redirect("/departments");
        }

        const { name, parent_id } = req.body;

        const exists = await Departments.findOne({ where: { name } });

        if (exists && exists.id !== department.id) {
            req.flash("errors", "Este departamento ya está en uso.");
            return res.redirect(`/departments/${department.id}/edit`);
        }

        const updatedData = {
            name,
            parent_id: parent_id || null
        }

        await department.update(updatedData);

        req.flash("success", `El departamento ${name} ha sido editado exitosamente`);
        return res.redirect("/departments");

    } catch (err) {
        console.error("Error al editar el departamento:", err);
        req.flash("errors", "Error al editar el departamento");
        res.redirect("/departments");
    }
}

// Delete departamento

export const postDelete = async (req, res) => {
    try {

        const department = await Departments.findByPk(req.params.id);

        if (!department) {
            req.flash("errors", "Departamento no encontrado.");
            return res.redirect("/departments");
        }

        const children = await Departments.count({ where: { parent_id: department.id } });

        if (children > 0) {
            req.flash("errors", "No puedes eliminar un departamento que tiene sub-departamentos");
            return res.redirect("/departments");
        }

        const usersCount = await Users.count({ where: { department_id: department.id } });

        if (usersCount > 0) {
            req.flash("errors", "No puedes eliminar un departamento que tiene usuarios asignados");
            return res.redirect("/departments");
        }

        await department.destroy();

        req.flash("success", "Departamento eliminado correctamente");
        return res.redirect("/departments");

    } catch (err) {
        console.error("Error al eliminar departamento:", err);
        req.flash("errors", "Error al intentar eliminar el departamento");
        res.redirect("/departments");
    }
}