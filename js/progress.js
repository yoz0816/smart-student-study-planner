document.addEventListener("DOMContentLoaded", () => {

    const SESSION_KEY = "studyflow_session";
    const USERS_KEY = "studyflow_users";
    const COURSES_KEY = "studyflow_courses";
    const TASKS_KEY = "studyflow_tasks";
    const SCHEDULE_KEY = "studyflow_schedule";


function readArray(key) {
        const data = StudyFlowStorage.get(key, []);

        return Array.isArray(data) ? data : [];
}

function getCurrentSession() {
        return StudyFlowStorage.getSession();
}

function getCurrentUser(session) {
        const users = readArray(USERS_KEY);

        return users.find(
            user => user && user.id === session.userId
        ) || null;
}


    const currentSession = getCurrentSession();

    if (
        !currentSession ||
        !currentSession.userId ||
        currentSession.role !== "student"
    ) {
        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
        return;
    }

    const currentUser = getCurrentUser(currentSession);

    if (
        !currentUser ||
        currentUser.role !== "student" ||
        currentUser.isActive === false
    ) {
        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
        return;
    }

    const userId = currentSession.userId;


    const courses = readArray(COURSES_KEY).filter(
        course => course && course.userId === userId
    );

    const tasks = readArray(TASKS_KEY).filter(
        task => task && task.userId === userId
    );

    const sessions = readArray(SCHEDULE_KEY).filter(
        session => session && session.userId === userId
    );


function getElement(id) {
        return document.getElementById(id);
}

function setText(id, value) {
        const element = getElement(id);

        if (element) {
            element.textContent = value;
        }
}

function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
}

function getFirstName(name) {
        return String(name || "Student")
            .trim()
            .split(/\s+/)[0] || "Student";
}


function renderUserInformation() {
        const name = currentUser.fullName || "Student";
        const firstName = getFirstName(name);

        setText("sidebar-user-name", firstName);

        const avatar = getElement("user-avatar");

        if (avatar) {
            avatar.textContent = firstName.charAt(0).toUpperCase();
        }
}


function getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
}

function isValidDateString(dateString) {
        if (typeof dateString !== "string") {
            return false;
        }

        const parts = dateString.split("-");

        if (parts.length !== 3) {
            return false;
        }

        const [year, month, day] = parts.map(Number);

        if (
            !Number.isInteger(year) ||
            !Number.isInteger(month) ||
            !Number.isInteger(day)
        ) {
            return false;
        }

        const date = new Date(year, month - 1, day);

        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
        );
}

function parseTimeToMinutes(time) {
        if (typeof time !== "string") {
            return null;
        }

        const parts = time.split(":");

        if (parts.length !== 2) {
            return null;
        }

        const [hours, minutes] = parts.map(Number);

        if (
            !Number.isInteger(hours) ||
            !Number.isInteger(minutes) ||
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59 ||
            parts[0].length !== 2 ||
            parts[1].length !== 2
        ) {
            return null;
        }

        return hours * 60 + minutes;
}

function getSessionDuration(session) {
        const start = parseTimeToMinutes(session.startTime);
        const end = parseTimeToMinutes(session.endTime);

        if (start === null || end === null || end <= start) {
            return 0;
        }

        return end - start;
}

function formatStudyTime(minutes) {
        const safeMinutes = Math.max(0, Number(minutes) || 0);

        const hours = Math.floor(safeMinutes / 60);
        const remainingMinutes = safeMinutes % 60;

        if (hours === 0) {
            return `${remainingMinutes} minutes`;
        }

        if (remainingMinutes === 0) {
            return `${hours}h`;
        }

        return `${hours}h ${remainingMinutes}m`;
    }


function getTaskStatus(task) {
        const status = String(
            task.status || "Pending"
        ).toLowerCase().trim();

        if (status === "completed") {
            return "completed";
        }

        if (status === "in progress") {
            return "in-progress";
        }

        return "pending";
}

function getTaskCounts(taskList) {
        const counts = {
            completed: 0,
            inProgress: 0,
            pending: 0
        };

        taskList.forEach(task => {
            const status = getTaskStatus(task);

            if (status === "completed") {
                counts.completed++;
            } else if (status === "in-progress") {
                counts.inProgress++;
            } else {
                counts.pending++;
            }
        });

        return counts;
}



function renderOverview() {
        const totalCourses = courses.length;
        const totalTasks = tasks.length;

        const counts = getTaskCounts(tasks);

        const completionRate = totalTasks > 0
            ? Math.round(
                (counts.completed / totalTasks) * 100
            )
            : 0;

        setText("progress-total-courses", totalCourses);
        setText("progress-total-tasks", totalTasks);
        setText("progress-completed-tasks", counts.completed);
        setText("progress-completion-rate", `${completionRate}%`);

        setText("overall-progress-percent", `${completionRate}%`);

        setText("breakdown-completed", counts.completed);
        setText("breakdown-in-progress", counts.inProgress);
        setText("breakdown-pending", counts.pending);

        const ring = getElement("overall-progress-ring");

        if (ring) {
            ring.style.setProperty(
                "--progress-value",
                `${completionRate}%`
            );

            ring.setAttribute(
                "aria-label",
                `Overall task completion: ${completionRate} percent`
            );
        }
}


function renderStudyTime() {
        const completedSessions = sessions.filter(
            session =>
                String(session.status || "").toLowerCase() === "completed"
        );

        const totalMinutes = completedSessions.reduce(
            (total, session) => {
                return total + getSessionDuration(session);
            },
            0
        );

        setText(
            "progress-study-hours",
            formatStudyTime(totalMinutes)
        );

        setText(
            "progress-study-minutes",
            `${totalMinutes} minutes recorded`
        );

        setText(
            "progress-completed-sessions",
            completedSessions.length
        );
}


function renderCourseProgress() {
        const container = getElement("course-progress-list");
        const emptyState = getElement("course-progress-empty");

        if (!container || !emptyState) {
            return;
        }

        setText(
            "course-progress-count",
            `${courses.length} ${courses.length === 1 ? "course" : "courses"}`
        );

        if (courses.length === 0) {
            container.replaceChildren();
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;

        container.innerHTML = courses.map(course => {
            const courseTasks = tasks.filter(
                task => task.courseId === course.id
            );

            const completedCount = courseTasks.filter(
                task => getTaskStatus(task) === "completed"
            ).length;

            const totalCount = courseTasks.length;

            const percentage = totalCount > 0
                ? Math.round(
                    (completedCount / totalCount) * 100
                )
                : 0;

            const courseName = escapeHTML(
                course.name || "Untitled Course"
            );

            const courseCode = escapeHTML(
                course.code || "Course"
            );

            return `
                <div class="progress-course-item">
                    <div class="progress-course-info">
                        <div class="progress-course-name">
                            <strong>${courseName}</strong>
                            <span>${courseCode} · ${completedCount} of ${totalCount} tasks completed</span>
                        </div>

                        <span class="progress-course-percentage">
                            ${percentage}%
                        </span>
                    </div>

                    <div
                        class="progress-course-track"
                        role="progressbar"
                        aria-valuenow="${percentage}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label="${courseName} task completion"
                    >
                        <div
                            class="progress-course-fill"
                            style="width: ${percentage}%"
                        ></div>
                    </div>
                </div>
            `;
        }).join("");
}


function renderWeeklyActivity() {
        const container = getElement("weekly-activity-chart");

        if (!container) {
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayString = getLocalDateString(today);
        const monday = new Date(today);
        const daysSinceMonday = (today.getDay() + 6) % 7;
        monday.setDate(today.getDate() - daysSinceMonday);

        const completedSessions = sessions.filter(session => {
            return (
                String(session.status || "").toLowerCase() === "completed" &&
                isValidDateString(session.date)
            );
        });

        const days = [];

        for (let offset = 0; offset < 7; offset++) {
            const date = new Date(monday);

            date.setDate(monday.getDate() + offset);

            const dateString = getLocalDateString(date);

            const minutes = completedSessions
                .filter(session => session.date === dateString)
                .reduce(
                    (total, session) => {
                        return total + getSessionDuration(session);
                    },
                    0
                );

            days.push({
                dateString,
                label: date.toLocaleDateString("en-US", {
                    weekday: "short"
                }),
                minutes,
                isToday: dateString === todayString
            });
        }

        const maxMinutes = Math.max(
            ...days.map(day => day.minutes),
            60
        );

        const weeklyTotal = days.reduce(
            (total, day) => total + day.minutes,
            0
        );

        container.innerHTML = days.map(day => {
            const height = day.minutes > 0
                ? Math.max(
                    (day.minutes / maxMinutes) * 100,
                    5
                )
                : 3;

            const barClass = day.isToday
                ? "weekly-day-bar today"
                : "weekly-day-bar";

            return `
                <div class="weekly-day-column">
                    <span class="weekly-day-value">
                        ${day.minutes > 0
                            ? escapeHTML(formatStudyTime(day.minutes))
                            : "—"}
                    </span>

                    <div class="weekly-day-bar-area">
                        <div
                            class="${barClass}"
                            style="height: ${height}%"
                            role="img"
                            aria-label="${day.label}: ${day.minutes} minutes"
                            title="${day.minutes} minutes"
                        ></div>
                    </div>

                    <span class="weekly-day-label">
                        ${day.label}
                    </span>
                </div>
            `;
        }).join("");

        setText(
            "weekly-study-total",
            formatStudyTime(weeklyTotal)
        );
}


function handleLogout() {
        const confirmed = window.confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmed) {
            return;
        }

        StudyFlowStorage.clearSession();

        window.location.href = "login.html";
}


function initializeProgressPage() {
        renderUserInformation();
        renderOverview();
        renderStudyTime();
        renderCourseProgress();
        renderWeeklyActivity();

        const logoutButton = getElement("logout-button");

        if (logoutButton) {
            logoutButton.addEventListener(
                "click",
                handleLogout
            );
        }
}

    initializeProgressPage();
});
