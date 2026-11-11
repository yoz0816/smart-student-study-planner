const StudyFlowStorage = (() => {

    const KEYS = {
        USERS: "studyflow_users",
        SESSION: "studyflow_session"
    };

function get(key, fallback = null) {
        try {
            const data = localStorage.getItem(key);

            return data === null ? fallback : JSON.parse(data);

        } catch (error) {
            console.error("Storage read error:", error);
            return fallback;
        }
}


function set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;

        } catch (error) {
            console.error("Storage save error:", error);
            return false;
        }
}

function remove(key) {
        localStorage.removeItem(key);
}

function getUsers() {
        return get(KEYS.USERS, []);
}

function saveUsers(users) {
        return set(KEYS.USERS, users);
}

function getSession() {
        return get(KEYS.SESSION, null);
}

function saveSession(session) {
        return set(KEYS.SESSION, session);
}

function clearSession() {
        remove(KEYS.SESSION);
}

    return {
        get,
        set,
        remove,
        getUsers,
        saveUsers,
        getSession,
        saveSession,
        clearSession
    };

})();