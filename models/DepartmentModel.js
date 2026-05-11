import connection from '../utils/DbConnection.js';
import { DataTypes } from 'sequelize';

const Departments = connection.define('Departments', {

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
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Departments",
            key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
    }
}, { tableName: "Departments" });

export default Departments;