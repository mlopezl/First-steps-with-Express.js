function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidName(name) {
    return typeof name === 'string' && name.trim().length >= 3;
}

function isUniqueNumericId(id, users, currentUserId = null) { 
    return typeof id === 'number' && 
        !users.some(user => user.id === id && user.id !== currentUserId);
}

function validateUser(user, users, currentUserId = null) {
    const { name, email, id } = user;
    
    if (!isValidName(name)) {
        return { isValid: false, error: "El nombre debe tener al menos 3 caracteres." };
    }

    if (!isValidEmail(email)) {
        return { isValid: false, error: "El correo electrónico no es válido." };
    }

    if (!isUniqueNumericId(id, users, currentUserId)) {
        return { isValid: false, error: "El ID debe ser un número único." };
    }

    return { isValid: true };
}

module.exports = {
    isValidName,
    isValidEmail,
    isUniqueNumericId,
    validateUser
};