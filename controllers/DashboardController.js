import context from "../context/AppContext.js";
import { Op, where } from "sequelize";
import { requestStatus } from "../utils/enums/requestStatus.js"

const { Requests, RequestsFlow, Users, Roles, Permissions, Departments } = context;

const getUserPermissions = async (roleID) => {
    const role = await Roles.findByPk(roleID, {
        include: [{ model: Permissions, attributes: ["name"] }]
    });

    return role?.Permissions.map(p => p.name) ?? [];
}

export const getDashboard = async (req, res) => {
    try {
        const { id: userId, role_id, department_id } = req.user;

        const userPerms = await getUserPermissions(role_id);
        const canSeeAll = userPerms.includes("ver_todas_solicitudes");
        const canSeeArea = userPerms.includes("ver_solicitudes_area");

        let whereClause = {};

        if (canSeeAll) {
            whereClause = {};
        } else if (canSeeArea) {
            const deptChildren = await Departments.findAll({ where: { parent_id: department_id } });
            const deptIds = [department_id, ...deptChildren.map(d => d.id)];
            const usersInArea = await Users.findAll({ where: { department_id: deptIds } });
            whereClause = { transmitter_id: usersInArea.map(u => u.id) };
        } else {
            const flows = await RequestsFlow.findAll({
                where: { receiver_id: userId },
                attributes: ["request_id"]
            });

            const flowsIds = flows.map(f => f.request_id);

            whereClause = {
                [Op.or]: [
                    { transmitter_id: userId },
                    { id: flowsIds }
                ]
            };
        }

        const [totalPending, totalAproved, totalRejected] = await Promise.all([
            Requests.count({ where: { ...whereClause, global_state: requestStatus.PENDING } }),
            Requests.count({ where: { ...whereClause, global_state: requestStatus.APPROVED } }),
            Requests.count({ where: { ...whereClause, global_state: requestStatus.REJECTED } })
        ]);

        // Ultimas 5 solicitudes

        const recent = await Requests.findAll({
            where: whereClause,
            include: [{ model: Users, as: "transmitter", attributes: ["id", "name"] }],
            order: [["creation_date", "DESC"]],
            limit: 5
        });

        res.render("dashboard/index", {
            title: "dashboard",
            totalPending,
            totalAproved,
            totalRejected,
            total: totalPending + totalAproved + totalRejected,
            recent: recent.map(r => r.toJSON()),
            canSeeAll,
            canSeeArea
        });
    } catch (err) {
        console.error("Error en dashboard:", err);
        req.flash("errors", "Error al cargar el dashboard");
        res.redirect("/requests");
    }
}