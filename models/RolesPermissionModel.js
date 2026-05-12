import connection from '../utils/DbConnection.js';
import { DataTypes } from 'sequelize';

const RolesPermissions = connection.define('RolesPermissions', {
    role_id: {
        type: DataTypes.INTEGER,
        references: { model: 'Roles', key: 'id' }
    },
    permission_id: {
        type: DataTypes.INTEGER,
        references: { model: 'Permissions', key: 'id' }
    }
}, { tableName: 'RolesPermissions' });

export default RolesPermissions;
