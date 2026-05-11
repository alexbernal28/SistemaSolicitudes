import connection from '../utils/DbConnection.js';
import { DataTypes } from 'sequelize';

const Permissions = connection.define('Permissions', {

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
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }

}, { tableName: 'Permissions' });

export default Permissions;