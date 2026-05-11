import connection from "../utils/DbConnection.js";
import Roles from "../models/RoleModel.js";
import Permissions from "../models/PermissionModel.js";
import Departments from "../models/DepartmentModel.js";
import Users from "../models/UserModel.js";
import Requests from "../models/RequestModel.js";
import RequestsFlow from "../models/RequestFlowModel.js";

try {
    await connection.authenticate();
    console.log("The connection to the database has been completed successfully.")
} catch (err) {
    console.error("Unable to connect to the database:", err);
}

// Uno a muchos
Departments.hasMany(Departments, { foreignKey: 'parent_id', as: 'children' });
Departments.belongsTo(Departments, { foreignKey: 'parent_id', as: 'parent' });

Roles.hasMany(Users, { foreignKey: 'role_id' });
Users.belongsTo(Roles, { foreignKey: 'role_id' });

Departments.hasMany(Users, { foreignKey: 'department_id' });
Users.belongsTo(Departments, { foreignKey: 'department_id' });

Users.hasMany(Users, { foreignKey: 'supervisor_id', as: 'subordinates' });
Users.belongsTo(Users, { foreignKey: 'supervisor_id', as: 'supervisor' });

Users.hasMany(Requests, { foreignKey: 'transmitter_id', as: 'sent_requests' });
Requests.belongsTo(Users, { foreignKey: 'transmitter_id', as: 'transmitter' });

Requests.hasMany(RequestsFlow, { foreignKey: 'request_id', as: 'flows' });
RequestsFlow.belongsTo(Requests, { foreignKey: 'request_id', as: 'requests' });

Users.hasMany(RequestsFlow, { foreignKey: 'receiver_id', as: 'received_flows' });
RequestsFlow.belongsTo(Users, { foreignKey: 'receiver_id', as: 'receiver' });

// Muchos a Muchos

Permissions.belongsToMany(Roles, { through: 'RolesPermissions', foreignKey: 'idPermission', otherKey: 'idRole' });
Roles.belongsToMany(Permissions, { through: 'RolesPermissions', foreignKey: 'idRole', otherKey: 'idPermission' });

export default {
    Sequelize: connection,
    Roles,
    Permissions,
    Departments,
    Users,
    Requests,
    RequestsFlow
}