import connection from '../utils/DbConnection.js';
import { DataTypes } from 'sequelize';

const RequestsFlow = connection.define("Requests_flow", {

     id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    request_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Requests',
            key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    },
    flow_state: {
        type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada', 'escalada'),
        allowNull: false,
        defaultValue: 'pendiente',
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    assignment_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    response_date: {
        type: DataTypes.DATE,
        allowNull: true
    }

}, { tableName: 'Requests_flow' });

export default RequestsFlow;