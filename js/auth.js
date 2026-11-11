document.addEventListener("DOMContentLoaded", () => {
    "use strict";


    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
    const message = document.getElementById("auth-message");

    if (typeof StudyFlowStorage === "undefined") {
        console.error("StudyFlowStorage is not available.");
        return;
    }


function createDefaultAdmin() {
        const users = StudyFlowStorage.getUsers();

        if (!Array.isArray(users)) {
            console.error("Invalid user storage data.");
            return;
        }

        const existingAdmin = users.find(user =>
            user &&
            user.role === "admin" &&
            (
                user.username === "admin" ||
                user.email === "admin@studyflow.local"
            )
        );

        if (existingAdmin) {
            return;
        }

        const adminAccount = {
            id: "studyflow-admin",
            username: "admin",
            fullName: "Administrator",
            email: "admin@studyflow.local",
            password: "admin1234",
            role: "admin",
            createdAt: new Date().toISOString()
        };

        users.push(adminAccount);

        if (!StudyFlowStorage.saveUsers(users)) {
            console.error(
                "Unable to create the default administrator account."
            );
        }
}

    createDefaultAdmin();


function showMessage(text, type) {
        if (!message) {
            return;
        }

        message.textContent = text;
        message.className = `auth-message ${type}`;
}

function getUsers() {
        const users = StudyFlowStorage.getUsers();

        return Array.isArray(users) ? users : [];
}

function redirectByRole(role) {
        if (role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else if (role === "student") {
            window.location.href = "dashboard.html";
        }
}

function redirectIfLoggedIn() {
        const session = StudyFlowStorage.getSession();

        if (!session || !session.userId) {
            return;
        }

        const user = getUsers().find(
            account => account && account.id === session.userId
        );

        if (
            !user ||
            user.isActive === false ||
            user.role !== session.role ||
            !["student", "admin"].includes(user.role)
        ) {
            StudyFlowStorage.clearSession();
            return;
        }

        redirectByRole(user.role);
}


    if (registerForm) {
        registerForm.addEventListener("submit", event => {
            event.preventDefault();

            const fullName = document
                .getElementById("full-name")
                .value.trim();

            const email = document
                .getElementById("register-email")
                .value.trim()
                .toLowerCase();

            const password = document
                .getElementById("register-password")
                .value;

            const confirmPassword = document
                .getElementById("confirm-password")
                .value;

            if (fullName.length < 2 || fullName.length > 60) {
                showMessage(
                    "Full name must contain between 2 and 60 characters.",
                    "error"
                );
                return;
            }

            if (password.length < 8) {
                showMessage(
                    "Password must contain at least 8 characters.",
                    "error"
                );
                return;
            }

            if (password !== confirmPassword) {
                showMessage(
                    "Your passwords do not match.",
                    "error"
                );
                return;
            }

            const users = getUsers();

            const existingUser = users.find(
                user =>
                    user &&
                    typeof user.email === "string" &&
                    user.email.toLowerCase() === email
            );

            if (existingUser) {
                showMessage(
                    "An account with this email already exists.",
                    "error"
                );
                return;
            }

            const newUser = {
                id: `student-${Date.now()}`,
                fullName,
                email,
                password,
                role: "student",
                isActive: true,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);

            if (!StudyFlowStorage.saveUsers(users)) {
                showMessage(
                    "Unable to save your account. Please try again.",
                    "error"
                );
                return;
            }

            const sessionSaved = StudyFlowStorage.saveSession({
                userId: newUser.id,
                role: newUser.role,
                loginAt: new Date().toISOString()
            });

            if (!sessionSaved) {
                showMessage(
                    "Account created, but your session could not be saved. Please log in.",
                    "error"
                );
                return;
            }

            showMessage(
                "Account created successfully! Welcome to StudyFlow.",
                "success"
            );

            registerForm.reset();

            setTimeout(() => {
                redirectByRole(newUser.role);
            }, 1000);
        });
    }


    if (loginForm) {
        loginForm.addEventListener("submit", event => {
            event.preventDefault();

            const identifier = document
                .getElementById("login-email")
                .value.trim()
                .toLowerCase();

            const password = document
                .getElementById("login-password")
                .value;

            const users = getUsers();

            const user = users.find(account => {
                if (!account) {
                    return false;
                }

                const email = typeof account.email === "string"
                    ? account.email.toLowerCase()
                    : "";

                const username = typeof account.username === "string"
                    ? account.username.toLowerCase()
                    : "";

                const matchesIdentifier =
                    email === identifier ||
                    username === identifier;

                return matchesIdentifier &&
                    account.password === password;
            });

            if (!user) {
                showMessage(
                    "Incorrect username, email, or password. Please try again.",
                    "error"
                );
                return;
            }

            if (!["student", "admin"].includes(user.role)) {
                showMessage(
                    "This account has an invalid account role.",
                    "error"
                );
                return;
            }

            if (user.isActive === false) {
                showMessage(
                    "Your account has been deactivated. Please contact the administrator.",
                    "error"
                );
                return;
            }

            const sessionSaved = StudyFlowStorage.saveSession({
                userId: user.id,
                role: user.role,
                loginAt: new Date().toISOString()
            });

            if (!sessionSaved) {
                showMessage(
                    "Unable to start your session. Please try again.",
                    "error"
                );
                return;
            }

            showMessage(
                `Welcome back, ${user.fullName || "Student"}!`,
                "success"
            );

            loginForm.reset();

            setTimeout(() => {
                redirectByRole(user.role);
            }, 800);
        });
    }


    if (registerForm || loginForm) {
        redirectIfLoggedIn();
    }

});
