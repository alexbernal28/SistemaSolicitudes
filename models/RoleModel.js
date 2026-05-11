import connection from '../utils/DbConnection.js';
import { DataTypes } from 'sequelize';

const Roles = connection.define('Roles', {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    is_system: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, { tableName: "Roles" });

export default Roles;