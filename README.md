# 📋 Sistema de Solicitudes

Sistema web para la gestión y flujo de aprobación de solicitudes internas, con soporte para escalamiento jerárquico entre departamentos.

---

## 🚀 Tecnologías

- **Node.js** + **Express 5**
- **Sequelize 6** + **SQLite** (configurable a MySQL)
- **Express Handlebars** — vistas
- **Express Session** + **Connect Flash** — sesiones y mensajes
- **Bcrypt** — hash de contraseñas
- **Bootstrap 5** + **Bootstrap Icons** — estilos

---

## 📁 Estructura del proyecto

```
├── context/
│   └── AppContext.js          # Conexión DB + asociaciones Sequelize
├── controllers/
│   ├── AuthController.js
│   ├── DashboardController.js
│   ├── DepartmentController.js
│   ├── RequestController.js
│   ├── RoleController.js
│   └── UserController.js
├── middlewares/
│   └── auth.js                # requireAuth, requireRole, requireLevel, requirePermission
├── models/
│   ├── DepartmentModel.js
│   ├── PermissionModel.js
│   ├── RequestFlowModel.js
│   ├── RequestModel.js
│   ├── RoleModel.js
│   └── UserModel.js
├── routes/
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── departmentRoutes.js
│   ├── requestRoutes.js
│   ├── roleRoutes.js
│   └── userRoutes.js
├── seeders/
│   └── index.js               # Datos iniciales
├── utils/
│   ├── DbConnection.js
│   ├── LoadEnvConfig.js
│   ├── Paths.js
│   └── SessionUser.js
├── views/
│   ├── layouts/
│   │   ├── auth.hbs
│   │   └── layout.hbs
│   ├── auth/
│   │   └── login.hbs
│   ├── dashboard.hbs
│   ├── department/
│   │   ├── form.hbs
│   │   └── index.hbs
│   ├── requests/
│   │   ├── form.hbs
│   │   ├── index.hbs
│   │   └── show.hbs
│   ├── roles/
│   │   ├── form.hbs
│   │   └── index.hbs
│   └── users/
│       ├── form.hbs
│       └── index.hbs
├── .env
├── app.js
└── package.json
```

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sistemasolicitudes.git
cd sistemasolicitudes
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
NODE_ENV=development

# Sesión
SESSION_SECRET=tu_session_secret_aqui

# Base de datos
DB_DIALECT=sqlite
DB_FOLDER=database
DB_FILENAME=db.sqlite

# Sincronización (usar solo en desarrollo)
DB_FORCE=false
DB_ALTER=false
```

> Para generar un `SESSION_SECRET` seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Ejecutar el seeder

Crea las tablas y carga los datos iniciales (roles, permisos, departamentos y usuario admin):

```bash
npm run seed
```

### 5. Iniciar el servidor

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

---

## 🔐 Credenciales iniciales

| Usuario | Contraseña    |
|---------|---------------|
| `admin` | `admin123456` |

> Se recomienda cambiar la contraseña del admin después del primer inicio de sesión.

---

## 👥 Roles del sistema

| Rol      | Nivel | Descripción |
|----------|-------|-------------|
| Admin    | 99    | Acceso total al sistema |
| Director | 3     | Ve y gestiona solicitudes de su área |
| Gerente  | 2     | Aprueba, rechaza y escala solicitudes |
| Usuario  | 0     | Crea solicitudes |

> Los roles pueden gestionarse dinámicamente desde el panel de administración. El nivel determina la jerarquía para el escalamiento de solicitudes.

---

## 📌 Flujo de una solicitud

```
Usuario crea solicitud
        ↓
Le llega al siguiente nivel jerárquico en su departamento
        ↓
Receptor puede:
  ✅ Aprobar   → solicitud marcada como "aprobada"
  ❌ Rechazar  → solicitud marcada como "rechazada" (comentario opcional)
  ⬆️ Escalar   → se crea un nuevo paso y le llega al nivel superior
        ↓
Si escala al nivel más alto y no hay superior → no se puede escalar más
```

---

## 🛠️ Scripts disponibles

```bash
npm start    # Inicia el servidor con nodemon
npm run seed # Ejecuta el seeder (¡borra y recrea la base de datos!)
```

---

## 🗄️ Cambiar a MySQL

En `utils/DbConnection.js` descomenta el bloque de MySQL y actualiza el `.env`:

```env
DB_DIALECT=mysql
DB_NAME=sistema_solicitudes
DB_USER=root
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=3306
```

---

## 📄 Autor

Elvyn A. Bernal
