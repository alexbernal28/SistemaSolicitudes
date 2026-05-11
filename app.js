import "./utils/LoadEnvConfig.js";
import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import context from "./context/AppContext.js";
import { projectRoot } from "./utils/Paths.js";
import session from "express-session";
import flash from "connect-flash";

const app = express();

app.engine("hbs", engine({
    layoutsDir: "views/layouts",
    defaultLayout: 'layout',
    extname: "hbs",
    // helpers: {
    //     eq: eq,
    //     estadoPedido: estadoPedido,
    // }
}));

app.set("view engine", "hbs");
app.set("views", "views");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(projectRoot, "public")));

app.use(session({
    secret: process.env.SESSION_SECRET || 'anything',
    resave: false,
    saveUninitialized: false,
}));

app.use(flash());

app.use((req, res, next) => {
    if (req.session?.isAuthenticated && req.session?.user) {
        req.user = req.session.user;
    }
    next();
});

app.use((req, res, next) => {
    const errors = req.flash("errors");
    res.locals.user = req.user; // Usuario disponible en las vistas
    res.locals.hasUser = !!req.user; // Verificar si el usuario esta loggeado
    res.locals.isAuthenticated = req.session.isAuthenticated || false; // Verificar si el usuario esta autenticado
    res.locals.errors = errors; // Hacer que los mensajes flash de error se vean en las vistas
    res.locals.hasErrors = errors.length > 0; // Verificar si hay algun mensaje de error
    res.locals.success = req.flash("success"); // Hacer que los mensajes flash de success se vean en las vistas
    res.locals.hasSuccess = res.locals.success.length > 0; // Verificar si hay algun mensaje de success
    next();
});

try {
    // Sync the database and start the server
    const shouldForce = process.env.DB_FORCE === "true"; // Check if DB_FORCE is set to true
    const shouldAlter = process.env.DB_ALTER === "true"; // Check if DB_ALTER is set to true

    if (shouldForce) {
        await context.Sequelize.sync({ force: true }); // Use force: true to drop and recreate tables
    } else {
        await context.Sequelize.sync({ alter: shouldAlter || false }); //alter: true to update the schema without losing data {alter: true}
    }

    app.listen(process.env.PORT || 4000);
    console.log(`Server running on http://localhost:${process.env.PORT || 4000}`);
} catch (err) {
    console.error("Error connecting to the database:", err);
}