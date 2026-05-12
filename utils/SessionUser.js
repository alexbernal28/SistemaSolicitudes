export const buildSessionUser = (user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    department_id: user.department_id,
    supervisor_id: user.supervisor_id,
    role_id: user.role_id,
    role: {
        id: user.Role.id,
        name: user.Role.name,
        level: user.Role.level,
    }
});