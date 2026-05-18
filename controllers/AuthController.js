import bcrypt from 'bcrypt';
import context from '../context/AppContext.js';
import { buildSessionUser } from '../utils/SessionUser.js';

const { Users, Roles } = context;

export const showLogin = (req, res, next) => {
    res.render('auth/login', {
        title: 'Iniciar Sesión',
        layout: 'auth'
    });
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            req.flash("errors", "El usuario y la contraseña son requeridos.");
            return res.redirect("/");
        }

        //Buscar usuario con su rol
        const user = await Users.findOne({
            where: { username, is_active: true },
            include: [{ model: Roles }],
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            req.flash("errors", "El usuario y/o contraseña son incorrectos.");
            return res.redirect("/");
        }

        req.session.user = buildSessionUser(user);
        req.session.isAuthenticated = true;

        req.session.regenerate((err) => {
            if (err) {
                console.error("Error regenerando sesión:", err);
                req.flash("errors", "Error al iniciar sesión");
                return res.redirect("/");
            }

            // Hay que reasignar porque regenerate limpia la sesión
            req.session.user = buildSessionUser(user);
            req.session.isAuthenticated = true;

            req.flash("success", 'Sesión iniciada correctamente');
            res.redirect("/dashboard");
        });
    } catch (err) {
        console.error("Error en el login: ", err);
        req.flash("errors", "Error interno del servidor");
        res.redirect("/");
    }
};

export const logout = (req, res) => {

    req.session.destroy((err) => {
        if (err) {
            console.error("Error al destruir la sesión:", err);
            req.flash("errors", "Error al cerrar la sesión");
            return res.redirect("/");
        }
    });
    res.redirect("/");
};