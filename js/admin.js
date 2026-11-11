document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    if (
        typeof StudyFlowStorage === "undefined" ||
        typeof StudyFlowStorage.getSession !== "function"
    ) {
        window.location.href = "login.html";
        return;
    }

    const session = StudyFlowStorage.getSession();

    if (!session || !session.userId || session.role !== "admin") {
        window.location.href = "login.html";
        return;
    }

    const users = StudyFlowStorage.getUsers();

    if (!Array.isArray(users)) {
        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
        return;
    }

    const currentAdmin = users.find(
        user =>
            user &&
            user.id === session.userId &&
            user.role === "admin"
    );

    if (!currentAdmin || currentAdmin.isActive === false) {
        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
        return;
    }


    const getElement = id => document.getElementById(id);

    const setText = (id, value) => {
        const element = getElement(id);

        if (element) {
            element.textContent = value;
        }
    };

function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
}

function readArray(key) {
        const value = StudyFlowStorage.get(key, []);

        return Array.isArray(value)
            ? value.filter(item => item && typeof item === "object")
            : [];
}

function formatDate(value) {
        if (!value) {
            return "Unknown";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
}

function getInitials(name) {
        return String(name || "Student")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("");
}


    const adminName = currentAdmin.fullName || "Administrator";
    setText("admin-name", adminName);
    setText("admin-avatar", getInitials(adminName));

    setText(
        "admin-current-date",
        new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        })
    );


    let allUsers = users.filter(
        user => user && typeof user === "object"
    );

    const courses = readArray("studyflow_courses");
    const tasks = readArray("studyflow_tasks");
    const sessions = readArray("studyflow_schedule");

function getStudents() {
        return allUsers.filter(
            user => user && user.role === "student"
        );
}

function isActive(student) {
        return student.isActive !== false;
}



function updatePlatformStatistics() {
        const students = getStudents();

        const activeStudents = students.filter(isActive).length;
        const inactiveStudents = students.length - activeStudents;

        setText("admin-total-students", students.length);
        setText("admin-total-courses", courses.length);
        setText("admin-total-tasks", tasks.length);
        setText("admin-total-sessions", sessions.length);

        setText("admin-active-students", activeStudents);
        setText("admin-inactive-students", inactiveStudents);
}


function renderRecentStudents() {
        const container = getElement("admin-recent-students");
        const emptyState = getElement("admin-recent-empty");

        if (!container || !emptyState) {
            return;
        }

        const recentStudents = getStudents()
            .slice()
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();

                return (
                    (Number.isFinite(dateB) ? dateB : 0) -
                    (Number.isFinite(dateA) ? dateA : 0)
                );
            })
            .slice(0, 4);

        if (recentStudents.length === 0) {
            container.innerHTML = "";
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;

        container.innerHTML = recentStudents.map(student => {
            const name = escapeHTML(student.fullName || "Student");
            const email = escapeHTML(student.email || "");

            return `
                <div class="admin-recent-item">
                    <div class="admin-recent-avatar">
                        ${escapeHTML(getInitials(student.fullName))}
                    </div>

                    <div class="admin-recent-info">
                        <strong>${name}</strong>
                        <span>${email} · ${formatDate(student.createdAt)}</span>
                    </div>
                </div>
            `;
        }).join("");
}



let searchTerm = "";
let statusFilter = "all";

function getFilteredStudents() {
        return getStudents()
            .filter(student => {
                const name = typeof student.fullName === "string"
                    ? student.fullName.toLowerCase()
                    : "";

                const email = typeof student.email === "string"
                    ? student.email.toLowerCase()
                    : "";

                const matchesSearch =
                    name.includes(searchTerm) ||
                    email.includes(searchTerm);

                const status = isActive(student)
                    ? "active"
                    : "inactive";

                const matchesStatus =
                    statusFilter === "all" ||
                    status === statusFilter;

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const nameA = typeof a.fullName === "string"
                    ? a.fullName
                    : "";

                const nameB = typeof b.fullName === "string"
                    ? b.fullName
                    : "";

                return nameA.localeCompare(nameB);
            });
}


function renderStudents() {
        const tableBody = getElement("admin-student-table-body");
        const emptyState = getElement("admin-student-empty");
        const countElement = getElement("admin-student-count");

        if (!tableBody || !emptyState) {
            return;
        }

        const students = getFilteredStudents();
        const totalStudents = getStudents().length;

        if (countElement) {
            countElement.textContent =
                `${totalStudents} ${totalStudents === 1 ? "student" : "students"}`;
        }

        if (students.length === 0) {
            tableBody.innerHTML = "";
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;

        tableBody.innerHTML = students.map(student => {
            const active = isActive(student);

            const name = escapeHTML(student.fullName || "Student");
            const email = escapeHTML(student.email || "");
            const id = escapeHTML(student.id);

            const statusClass = active ? "active" : "inactive";
            const statusText = active ? "Active" : "Deactivated";

            const actionText = active ? "Deactivate" : "Activate";
            const actionClass = active ? "deactivate" : "activate";

            return `
                <tr>
                    <td>
                        <div class="admin-student-identity">
                            <div class="admin-student-avatar">
                                ${escapeHTML(getInitials(student.fullName))}
                            </div>

                            <span class="admin-student-name">${name}</span>
                        </div>
                    </td>

                    <td>${email}</td>

                    <td>${formatDate(student.createdAt)}</td>

                    <td>
                        <span class="admin-status ${statusClass}">
                            ${statusText}
                        </span>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="admin-action-button ${actionClass}"
                            data-action="toggle-status"
                            data-id="${id}"
                        >
                            ${actionText}
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
}


function toggleStudentStatus(studentId) {
        const student = allUsers.find(
            user => user.id === studentId && user.role === "student"
        );

        if (!student) {
            return;
        }

        const currentlyActive = isActive(student);
        const action = currentlyActive ? "deactivate" : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${student.fullName || "this student's"} account?`
        );

        if (!confirmed) {
            return;
        }

        const previousIsActive = student.isActive;
        const previousUpdatedAt = student.updatedAt;

        student.isActive = !currentlyActive;
        student.updatedAt = new Date().toISOString();

        if (!StudyFlowStorage.saveUsers(allUsers)) {
            if (previousIsActive === undefined) {
                delete student.isActive;
            } else {
                student.isActive = previousIsActive;
            }

            if (previousUpdatedAt === undefined) {
                delete student.updatedAt;
            } else {
                student.updatedAt = previousUpdatedAt;
            }

            alert("Unable to update the student account. Please try again.");
            return;
        }


        const updatedUsers = StudyFlowStorage.getUsers();

        if (Array.isArray(updatedUsers)) {
            allUsers = updatedUsers.filter(
                user => user && typeof user === "object"
            );
        }

        updatePlatformStatistics();
        renderStudents();
        renderRecentStudents();
    }


getElement("admin-student-search")?.addEventListener(
        "input",
        event => {
            searchTerm = event.target.value.trim().toLowerCase();
            renderStudents();
        }
    );

getElement("admin-status-filter")?.addEventListener(
        "change",
        event => {
            statusFilter = event.target.value;
            renderStudents();
        }
    );

getElement("admin-student-table-body")?.addEventListener(
        "click",
        event => {
            const button = event.target.closest(
                '[data-action="toggle-status"]'
            );

            if (!button) {
                return;
            }

            toggleStudentStatus(button.dataset.id);
        }
    );

getElement("admin-logout")?.addEventListener("click", () => {
        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
    });


    updatePlatformStatistics();
    renderRecentStudents();
    renderStudents();

});
