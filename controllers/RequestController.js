import context from "../context/AppContext.js";
import { Op, where } from "sequelize";
import { requestStatus } from "../utils/enums/requestStatus.js";
import { requestFlowStatus } from "../utils/enums/requestFlowStatus.js";

const { Requests, RequestsFlow, Users, Roles, Departments, Permissions } = context;

export const getNextReceiver = async (currentReceiverID) => {

    const current = await Users.findByPk(currentReceiverID, {
        include: [
            { model: Roles },
            { model: Departments },
        ]
    });

    if (!current) return null;

    const currentLevel = current.Role.level;
    const deptID = current.department_id;
    const parentDeptID = current.Department.parent_id;

    // Buscar en el departamento o el departamento padre

    const deptIDs = [deptID];
    if (parentDeptID) deptIDs.push(parentDeptID);

    // traer usuarios de esos departamentos con mayor nivel jerarquico
    const candidates = await Users.findAll({
        where: {
            is_active: true,
            department_id: deptIDs,
        },
        include: [{ model: Roles }]
    });

    const higher = candidates
        .filter(u => u.Role.level > currentLevel && u.id !== current.id)
        .sort((a, b) => a.Role.level - b.Role.level);

    return higher[0] ?? null;

}

const getUserPermissions = async (roleId) => {
    const role = await Roles.findByPk(roleId, {
        include: [{ model: Permissions, attributes: ["name"] }]
    });
    return role?.Permissions.map(p => p.name) ?? [];
};

// select solicitudes

export const getRequests = async (req, res) => {
    try {
        const { id: userId, role_id, department_id } = req.user;

        const userPerms = await getUserPermissions(role_id);

        const canSeeAll = userPerms.includes("ver_todas_solicitudes");  // Admin
        const canSeeArea = userPerms.includes("ver_solicitudes_area");   // Director

        let requests;

        if (canSeeAll) {
            requests = await Requests.findAll({
                include: [
                    {
                        model: Users,
                        as: 'transmitter',
                        attributes: ["id", "name"]
                    }
                ],
                order: [["creation_date", "DESC"]]
            });
        } else if (canSeeArea) {
            const deptChildren = await Departments.findAll({ where: { parent_id: department_id } });
            const deptIds = [department_id, ...deptChildren.map(d => d.id)];

            const usersInArea = await Users.findAll({ where: { department_id: deptIds }, attributes: ["id"] });
            const usersIds = usersInArea.map(u => u.id);

            requests = await Requests.findAll({
                where: { transmitter_id: usersIds },
                include: [
                    {
                        model: Users,
                        as: 'transmitter',
                        attributes: ["id", "name"]
                    }
                ],
                order: [["creation_date", "DESC"]]
            });
        } else {
            // Cualquier otro rol: solicitudes donde participó en el flujo y las propias
            const flows = await RequestsFlow.findAll({
                where: { receiver_id: userId },
                attributes: ["request_id"]
            });

            const flowsRequestsIds = flows.map(f => f.request_id);

            const allIds = [...new Set([...flowsRequestsIds])];

            requests = await Requests.findAll({
                where: {
                    [Op.or]: [
                        { transmitter_id: userId },
                        { id: allIds }
                    ]
                },
                include: [
                    {
                        model: Users,
                        as: 'transmitter',
                        attributes: ["id", "name"]
                    }
                ],
                order: [["creation_date", "DESC"]]
            });
        }

        res.render("request/index", {
            title: "Solicitudes",
            requests: requests.map(r => r.toJSON()),
            canSeeAll,
            canSeeArea
        });
    } catch (err) {
        console.error("Error al obtener las solicitudes:", err);
        req.flash("errors", "Error al cargar las solicitudes");
        res.redirect("/dashboard");
    }
}

// create solicitudes

export const getCreate = (req, res) => {
    res.render("request/form", {
        title: "Nueva solicitud"
    });
}

export const postCreate = async (req, res) => {
    try {

        const { subject, description } = req.body;
        const transmitterId = req.user.id;

        if (!subject) {
            req.flash("errors", "El asunto es obligatorio.");
            return res.redirect("/requests/new");
        }

        const nextReceiver = await getNextReceiver(transmitterId);

        if (!nextReceiver) {
            req.flash("errors", "No hay un receptor disponible para tu solicitud.");
            return res.redirect("/requests/new");
        }

        //Solicitud
        const request = await Requests.create({
            subject,
            description: description || null,
            global_state: requestStatus.PENDING,
            transmitter_id: transmitterId
        });

        //Crear flujo
        await RequestsFlow.create({
            request_id: request.id,
            receiver_id: nextReceiver.id,
            flow_state: requestFlowStatus.PENDING
        });

        req.flash("success", "Solicitud enviada correctamente.");
        return res.redirect("/requests")

    } catch (err) {
        console.error("Error al crear una solicitud:", err);
        req.flash("errors", "Error al crear una solicitud");
        res.redirect("/requests/new");
    }
}

// Obtener ultimo flujo pendiente

export const getFlow = async (req, res) => {
    try {
        const request = await Requests.findByPk(req.params.id, {
            include: [
                {
                    model: Users,
                    as: "transmitter",
                    attributes: ["id", "name"]
                }
            ]
        });

        if (!request) {
            req.flash("errors", "Solicitud no encontrada");
            return res.redirect("/requests");
        }

        //Ultimo flujo pendiente
        const currentFlow = await RequestsFlow.findOne({
            where: {
                request_id: request.id,
                flow_state: requestFlowStatus.PENDING
            },
            include: [
                {
                    model: Users,
                    as: "receiver",
                    attributes: ["id", "name"]
                }
            ],
            order: [["assignment_date", "DESC"]]
        });

        const isReceiver = currentFlow?.receiver_id === req.user.id;
        const isTransmitter = request.transmitter_id === req.user.id;
        const isAdmin = req.user.role.level >= 99;

        // Verificar si se puede escalar
        let canEscalate = false;

        if (isReceiver && currentFlow) {
            const next = await getNextReceiver(req.user.id);
            canEscalate = !!next;
        }

        res.render("request/show", {
            title: `Solicitud #${request.id}`,
            request: request.toJSON(),
            currentFlow: currentFlow?.toJSON() ?? null,
            isReceiver,
            isTransmitter,
            isAdmin,
            canEscalate
        });

    } catch (err) {
        console.error("Error al mostrar la solicitud:", err);
        req.flash("errors", "Error al cargar la solicitud");
        res.redirect("/requests");
    }
}

// Aprobar

export const postApprove = async (req, res) => {
    try {
        const flow = await RequestsFlow.findOne({
            where: {
                request_id: req.params.id,
                flow_state: requestFlowStatus.PENDING,
                receiver_id: req.user.id
            }
        });

        if (!flow) {
            req.flash("errors", "No tienes una acción pendiente en esta solicitud");
            return res.redirect(`/solicitudes/${req.params.id}`);
        }

        await flow.update({
            flow_state: requestFlowStatus.APPROVED,
            response_date: new Date()
        });

        await Requests.update(
            {
                global_state: requestStatus.APPROVED
            },
            {
                where: { id: req.params.id }
            }
        );

        req.flash("success", "Solicitud aprobada exitosamente");
        return res.redirect("/requests");
    } catch (err) {
        console.error("Error al aprobar:", err);
        req.flash("errors", "Error al aprobar la solicitud");
        res.redirect(`/requests/${req.params.id}`);
    }
}

// rechazar

export const postReject = async (req, res) => {
    try {

        const { comment } = req.body;

        const flow = await RequestsFlow.findOne({
            where: {
                request_id: req.params.id,
                flow_state: requestFlowStatus.PENDING,
                receiver_id: req.user.id
            }
        });

        if (!flow) {
            req.flash("errors", "No tienes una acción pendiente en esta solicitud");
            return res.redirect(`/solicitudes/${req.params.id}`);
        }

        await flow.update({
            flow_state: requestFlowStatus.REJECTED,
            comment: comment || null,
            response_date: new Date()
        });

        await Requests.update(
            {
                global_state: requestStatus.REJECTED
            },
            {
                where: { id: req.params.id }
            }
        );

        req.flash("success", "Solicitud rechazada exitosamente");
        return res.redirect("/requests");
    } catch (err) {
        console.error("Error al rechazar:", err);
        req.flash("errors", "Error al rechazar la solicitud");
        res.redirect(`/requests/${req.params.id}`);
    }
}

// escalar

export const postEscalate = async (req, res) => {
    try {

        const flow = await RequestsFlow.findOne({
            where: {
                request_id: req.params.id,
                flow_state: requestFlowStatus.PENDING,
                receiver_id: req.user.id
            }
        });

        if (!flow) {
            req.flash("errors", "No tienes una acción pendiente en esta solicitud");
            return res.redirect(`/solicitudes/${req.params.id}`);
        }

        //Buscar siguiente nivel
        const nextReceiver = await getNextReceiver(req.user.id);

        if (!nextReceiver) {
            req.flash("errors", "Ya no puedes escalar más");
            return res.redirect(`/solicitudes/${req.params.id}`);
        }

        await flow.update({
            flow_state: requestFlowStatus.ESCALATED,
            response_date: new Date()
        });

        //Crear nuevo flujo
        await RequestsFlow.create({
            request_id: req.params.id,
            receiver_id: nextReceiver.id,
            flow_state: requestFlowStatus.PENDING
        });

        req.flash("success", `Solicitud escalada a ${nextReceiver.name} exitosamente`);
        return res.redirect("/requests");
    } catch (err) {
        console.error("Error al escalar:", err);
        req.flash("errors", "Error al escalar la solicitud");
        res.redirect(`/requests/${req.params.id}`);
    }
}