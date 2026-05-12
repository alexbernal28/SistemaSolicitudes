import context from "../context/AppContext";

const { Roles, Permissions } = context;

//Verificar que estes autenticado

export const requireAuth = (req, res, next) => {
    if (!req.session?.isAuthenticaded) {
        res.flash("errors", "Debes iniciar sesión para ingresar.");
        return res.redirect("/login");
    }

    next();
}

//Verificar rol

export const requireRole = (...roles) => (req, res, next) => {
    const userRole = req.user?.role?.name;

    if (!userRole || !roles.includes(userRole)) {
        req.flash("flash", "No tienes permisos para acceder a esta sección.");
        return res.redirect("/dashboard");
    }

    next();
}

// Verificar nivel de jerarquia

export const requireLevel = (minLevel) => (req, res, next) => {
    const userLevel = req.user?.role?.level;

    if (userLevel == undefined || userLevel < minLevel) {
        req.flash("flash", "No tienes el nivel necesario para esta acción.");
        return res.redirect("/dashboard");
    }

    next();
}

//Verificar permiso especifico

export const requirePermission = (permissionName) => async (req, res, next) => {
    try {
        const userRole = req.user?.role_id;

        if (!userRole) {
            req.flash("flash", "No tienes permisos para esta acción.");
            return res.redirect("/dashboard");
        }

        const role = await Roles.findByPk(userRole, {
            include: [{
                model: Permissions,
                where: { name: permissionName },
                required: false
            }]
        });

        const hasPermission = role?.Permissions?.length > 0;

        if (!hasPermission) {
            req.flash("flash", "No tienes permisos para esta acción.");
            return res.redirect("/dashboard");
        }

        next

    } catch (err) {
        console.error("Error en requirePermission:", err);
        res.status(500).render("error", { message: "Error interno del servidor" });
    }
}

// Verificar que pertenezca al area

export const requireSameArea = async (req, res, next) => {
    try {
        const user = req.user;

        //admin tiene permiso a todo
        if (user?.rol?.level >= 99) next();

        const deptID = parseInt(req.params.departemnt_id || req.query.departemnt_id);

        if (!deptID) next(); //Si no hay filtro por area

        const userDepartmentID = user?.department_id;


        const { Departments } = context;
        const dept = await Departments.findByPk(deptID);

        const isSameArea = 
            deptID === userDepartmentID ||     //Mismo departamento
            dept.parent_id === userDepartmentID; // Departamento hijo

        if (!isSameArea) {
            req.flash("flash", "No tienes acceso a esta área.");
            return res.redirect("/dashboard");
        }

        next();

    } catch (err) {
        console.error("Error en requireSameArea:", err);
        res.status(500).render("error", { message: "Error interno del servidor" });
    }
}

// Redirigir si esta autenticado

export const redirectIfAuthenticated = (req, res, next) => {
    if (req.session?.isAuthenticaded) {
        return res.redirect("/login");
    }

    next();
}