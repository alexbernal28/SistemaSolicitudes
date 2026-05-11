import connection from '../utils/DbConnection.js';
import { DataTypes } from 'sequelize';
import Departments from './DepartmentModel.js';
import Roles from './RoleModel.js';

const Users = connection.define('Users', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Roles",
            key: "id"
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE"
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Departments",
            key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
    },
    supervisor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
            model: "Users",
            key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
    },
    creation_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { tableName: "Users" });

export default Users;