document.addEventListener("DOMContentLoaded", () => {

    const session = StudyFlowStorage.getSession();
    const users = StudyFlowStorage.getUsers();

    if (
        !session ||
        !session.userId ||
        session.role !== "student" ||
        !Array.isArray(users)
    ) {
        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
        return;
    }

    const currentUser = users.find(
        user => user && user.id === session.userId
    );

    if (!currentUser || currentUser.role !== "student" ||
        currentUser.isActive === false) {
        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
        return;
    }


    const welcomeName = document.getElementById("welcome-name");
    const profileName = document.getElementById("profile-name");
    const profileAvatar = document.getElementById("profile-avatar");
    const currentDate = document.getElementById("current-date");

    const totalCourses = document.getElementById("total-courses");
    const totalTasks = document.getElementById("total-tasks");
    const completedTasks = document.getElementById("completed-tasks");
    const studyHours = document.getElementById("study-hours");

    const todayEmpty = document.getElementById("today-empty");
    const todayTaskList = document.getElementById("today-task-list");

    const deadlinesEmpty = document.getElementById("deadlines-empty");
    const deadlineList = document.getElementById("deadline-list");

    const weeklyHours = document.getElementById("weekly-hours");
    const weeklyChart = document.getElementById("weekly-chart");



    const fullName = currentUser.fullName || "Student";
    const firstName = fullName.trim().split(/\s+/)[0] || "Student";

    welcomeName.textContent = firstName;
    profileName.textContent = fullName;
    profileAvatar.textContent = firstName.charAt(0).toUpperCase();


function getLocalDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
}

function parseLocalDate(dateValue) {
        if (!dateValue) return null;

        const value = String(dateValue);

        if (value.length >= 10) {
            const datePart = value.slice(0, 10);
            const parts = datePart.split("-").map(Number);

            if (parts.length === 3 && parts.every(Number.isFinite)) {
                const [year, month, day] = parts;
                const date = new Date(year, month - 1, day);

                if (
                    date.getFullYear() === year &&
                    date.getMonth() === month - 1 &&
                    date.getDate() === day
                ) {
                    return date;
                }
            }
        }

        const parsed = new Date(value);

        return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTaskDate(task) {
        const dateValue = task.dueDate || task.date || task.deadline;
        return parseLocalDate(dateValue);
}


    currentDate.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });


    const courses = StudyFlowStorage.get("studyflow_courses", []);
    const tasks = StudyFlowStorage.get("studyflow_tasks", []);

    const studySessions = StudyFlowStorage.get("studyflow_schedule", []);

    const studentCourses = Array.isArray(courses)
        ? courses.filter(course => course.userId === currentUser.id)
        : [];

    const studentTasks = Array.isArray(tasks)
        ? tasks.filter(task => task.userId === currentUser.id)
        : [];

    const studentSessions = Array.isArray(studySessions)
        ? studySessions.filter(item => item.userId === currentUser.id)
        : [];


function isTaskCompleted(task) {
        return task.completed === true ||
            String(task.status || "").trim().toLowerCase() === "completed";
}

function isSessionCompleted(session) {
        return String(session.status || "").trim().toLowerCase() === "completed";
}

function getTaskTitle(task) {
        return task.title || task.name || "Untitled task";
}

function getSessionDuration(session) {
        if (!session.startTime || !session.endTime) {
            return 0;
}

        const [startHour, startMinute] = session.startTime.split(":").map(Number);
        const [endHour, endMinute] = session.endTime.split(":").map(Number);

        if (
            !Number.isFinite(startHour) ||
            !Number.isFinite(startMinute) ||
            !Number.isFinite(endHour) ||
            !Number.isFinite(endMinute)
        ) {
            return 0;
        }

        const start = startHour * 60 + startMinute;
        const end = endHour * 60 + endMinute;

        return end > start ? end - start : 0;
    }

    const completed = studentTasks.filter(isTaskCompleted);

    totalCourses.textContent = studentCourses.length;
    totalTasks.textContent = studentTasks.length;
    completedTasks.textContent = completed.length;

    const totalMinutes = studentSessions
        .filter(isSessionCompleted)
        .reduce((total, session) => {
            return total + getSessionDuration(session);
        }, 0);

    studyHours.textContent = `${(totalMinutes / 60).toFixed(1)}h`;



function renderTodayTasks() {
        const today = getLocalDateString();

        const todaysTasks = studentTasks.filter(task => {
            const taskDate = getTaskDate(task);

            return taskDate &&
                getLocalDateString(taskDate) === today;
        });

        todayTaskList.replaceChildren();

        if (todaysTasks.length === 0) {
            todayEmpty.style.display = "flex";
            return;
        }

        todayEmpty.style.display = "none";

        todaysTasks.forEach(task => {
            const completedTask = isTaskCompleted(task);

            const item = document.createElement("div");
            item.className = `task-item ${completedTask ? "task-done" : ""}`;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "task-check";
            checkbox.checked = completedTask;
            checkbox.disabled = true;
            checkbox.setAttribute(
                "aria-label",
                `Task: ${getTaskTitle(task)}`
            );

            const info = document.createElement("div");
            info.className = "task-item-info";

            const title = document.createElement("strong");
            title.textContent = getTaskTitle(task);

            const description = document.createElement("span");
            description.textContent = completedTask
                ? "Completed"
                : "Scheduled for today";

            info.append(title, description);
            item.append(checkbox, info);

            todayTaskList.appendChild(item);
        });
    }


function renderUpcomingDeadlines() {
        const today = getLocalDateString();

        const upcomingTasks = studentTasks
            .filter(task => {
                const dueDate = getTaskDate(task);

                if (!dueDate || isTaskCompleted(task)) {
                    return false;
                }

                return getLocalDateString(dueDate) >= today;
            })
            .sort((a, b) => {
                return getLocalDateString(getTaskDate(a))
                    .localeCompare(getLocalDateString(getTaskDate(b)));
            })
            .slice(0, 5);

        deadlineList.replaceChildren();

        if (upcomingTasks.length === 0) {
            deadlinesEmpty.style.display = "flex";
            return;
        }

        deadlinesEmpty.style.display = "none";

        upcomingTasks.forEach(task => {
            const item = document.createElement("div");
            item.className = "deadline-item";

            const info = document.createElement("div");
            info.className = "deadline-item-info";

            const title = document.createElement("strong");
            title.textContent = getTaskTitle(task);

            const category = document.createElement("span");
            category.textContent =
                task.courseName || task.category || "Study task";

            const date = document.createElement("span");
            date.className = "deadline-date";

            date.textContent = getTaskDate(task).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
            });

            info.append(title, category);
            item.append(info, date);

            deadlineList.appendChild(item);
        });
    }


function renderWeeklyActivity() {
        const today = new Date();
        const dayOfWeek = today.getDay();

        const monday = new Date(today);

        monday.setDate(
            today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
        );

        monday.setHours(0, 0, 0, 0);

        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dailyMinutes = Array(7).fill(0);

        const completedSessions = studentSessions.filter(isSessionCompleted);

        completedSessions.forEach(session => {
            if (!session.date) return;

            const sessionDate = parseLocalDate(session.date);

            if (!sessionDate) return;

            sessionDate.setHours(0, 0, 0, 0);

            const dayDifference = Math.round(
                (sessionDate - monday) / (1000 * 60 * 60 * 24)
            );

            if (dayDifference >= 0 && dayDifference < 7) {
                dailyMinutes[dayDifference] += getSessionDuration(session);
            }
        });

        const weeklyTotal = dailyMinutes.reduce(
            (sum, minutes) => sum + minutes,
            0
        );

        weeklyHours.textContent = `${(weeklyTotal / 60).toFixed(1)}h`;

        const columns = weeklyChart.querySelectorAll(".chart-column");
        const maximumMinutes = Math.max(...dailyMinutes, 1);

        columns.forEach((column, index) => {
            if (index >= 7) return;

            const bar = column.querySelector(".chart-track span");
            const dayLabel = column.querySelector("span:last-child");

            const minutes = dailyMinutes[index];

            const percentage = (minutes / maximumMinutes) * 100;

            if (bar) {
                bar.style.height = `${percentage}%`;
            }

            if (dayLabel) {
                dayLabel.textContent = dayNames[index];
            }

            column.title =
                `${dayNames[index]}: ${(minutes / 60).toFixed(1)} hours`;
        });
}


    const logoutButton = document.getElementById("logout-button");

    logoutButton.addEventListener("click", () => {
        const shouldLogout = window.confirm(
            "Are you sure you want to log out?"
        );

        if (!shouldLogout) return;

        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
    });


    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menu-toggle");
    const sidebarOverlay = document.getElementById("sidebar-overlay");

    function closeSidebar() {
        sidebar.classList.remove("sidebar-open");
        sidebarOverlay.classList.remove("overlay-visible");
    }

    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("sidebar-open");
        sidebarOverlay.classList.toggle("overlay-visible");
    });

    sidebarOverlay.addEventListener("click", closeSidebar);

    renderTodayTasks();
    renderUpcomingDeadlines();
    renderWeeklyActivity();
});
