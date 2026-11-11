document.addEventListener("DOMContentLoaded", () => {
    const session = StudyFlowStorage.getSession();

    if (!session || !session.userId || session.role !== "student") {
        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
        return;
    }

    const users = StudyFlowStorage.getUsers();

    const currentUser = Array.isArray(users)
        ? users.find(user => user && user.id === session.userId)
        : null;

    if (
        !currentUser ||
        currentUser.role !== "student" ||
        currentUser.isActive === false
    ) {
        StudyFlowStorage.clearSession();
        window.location.href = "login.html";
        return;
    }

    const elements = {
        userName: document.getElementById("sidebar-user-name"),
        userAvatar: document.getElementById("user-avatar"),
        logoutButton: document.getElementById("logout-button"),

        form: document.getElementById("schedule-form"),
        formPanel: document.getElementById("schedule-form-panel"),
        formTitle: document.getElementById("schedule-form-title"),
        formMessage: document.getElementById("schedule-form-message"),
        sessionId: document.getElementById("session-id"),
        topic: document.getElementById("session-topic"),
        course: document.getElementById("session-course"),
        date: document.getElementById("session-date"),
        status: document.getElementById("session-status"),
        start: document.getElementById("session-start"),
        end: document.getElementById("session-end"),
        notes: document.getElementById("session-notes"),

        list: document.getElementById("schedule-session-list"),
        emptyState: document.getElementById("schedule-empty-state"),
        dateFilter: document.getElementById("schedule-date-filter"),
        selectedDayTitle: document.getElementById("selected-day-title"),

        totalSessions: document.getElementById("total-sessions"),
        totalStudyHours: document.getElementById("total-study-hours"),
        upcomingSessions: document.getElementById("upcoming-sessions"),

        addButton: document.getElementById("add-session-button"),
        emptyAddButton: document.getElementById("empty-add-session-button"),
        closeButton: document.getElementById("close-schedule-form"),
        cancelButton: document.getElementById("cancel-schedule-form"),
        saveButton: document.getElementById("save-session-button"),
        todayButton: document.getElementById("today-button")
    };


    const userName = currentUser.fullName || "Student";

    elements.userName.textContent = userName;
    elements.userAvatar.textContent = userName.charAt(0).toUpperCase();


    const SESSIONS_KEY = "studyflow_schedule";
    const COURSES_KEY = "studyflow_courses";

    let sessions = StudyFlowStorage.get(SESSIONS_KEY, []);
    let courses = StudyFlowStorage.get(COURSES_KEY, []);

    if (!Array.isArray(sessions)) {
        sessions = [];
    }

    if (!Array.isArray(courses)) {
        courses = [];
    }


function getLocalDateString() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
        const [year, month, day] = dateString.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
}

function formatTime(timeString) {
        const [hours, minutes] = timeString.split(":").map(Number);

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit"
        });
}

function getDuration(start, end) {
        if (!start || !end) return 0;

        const [startHour, startMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);

        return (
            (endHour * 60 + endMinute) -
            (startHour * 60 + startMinute)
        );
}

function formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours === 0) {
            return `${remainingMinutes} min`;
        }

        if (remainingMinutes === 0) {
            return `${hours}h`;
        }

        return `${hours}h ${remainingMinutes}m`;
}


function getMyCourses() {
        return courses.filter(
            course => course && course.userId === session.userId
        );
}

function getMySessions() {
        return sessions.filter(
            item => item && item.userId === session.userId
        );
}

function saveSessions() {
        const saved = StudyFlowStorage.set(SESSIONS_KEY, sessions);

        if (!saved) {
            showMessage(
                "Could not save your session. Check your browser storage.",
                "error"
            );
        }

        return saved;
}



function showMessage(message, type = "") {
        elements.formMessage.textContent = message;
        elements.formMessage.className =
            `schedule-form-message ${type}`;
}



function populateCourseSelect() {
        const myCourses = getMyCourses();

        elements.course.replaceChildren();

        const placeholder = document.createElement("option");

        placeholder.value = "";
        placeholder.textContent = myCourses.length
            ? "Select a course"
            : "Add a course first";

        elements.course.appendChild(placeholder);

        myCourses.forEach(course => {
            const option = document.createElement("option");

            option.value = course.id;
            option.textContent =
                `${course.code || "NO CODE"} — ${course.name || "Untitled course"}`;

            elements.course.appendChild(option);
        });

        elements.course.disabled = myCourses.length === 0;
        elements.saveButton.disabled = myCourses.length === 0;
}

function openForm(studySession = null) {
        populateCourseSelect();

        elements.form.reset();
        elements.sessionId.value = "";
        elements.date.value =
            elements.dateFilter.value || getLocalDateString();

        elements.status.value = "Planned";

        showMessage("");

        if (studySession) {
            elements.formTitle.textContent = "Edit study session";
            elements.saveButton.textContent = "Update session";

            elements.sessionId.value = studySession.id;
            elements.topic.value = studySession.topic || "";
            elements.course.value = studySession.courseId || "";
            elements.date.value = studySession.date || getLocalDateString();
            elements.status.value = studySession.status || "Planned";
            elements.start.value = studySession.startTime || "";
            elements.end.value = studySession.endTime || "";
            elements.notes.value = studySession.notes || "";
        } else {
            elements.formTitle.textContent = "Plan a study session";
            elements.saveButton.textContent = "Save session";
        }

        elements.formPanel.hidden = false;

        elements.formPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        elements.topic.focus();
}

function closeForm() {
        elements.formPanel.hidden = true;
        elements.form.reset();
        elements.sessionId.value = "";

        showMessage("");
}



function hasTimeConflict(date, startTime, endTime, ignoredId = "") {
        return getMySessions().some(item => {
            if (
                item.id === ignoredId ||
                item.date !== date
            ) {
                return false;
            }

            if (item.status !== "Planned") {
                return false;
            }

            if (!item.startTime || !item.endTime) {
                return false;
            }

            return (
                startTime < item.endTime &&
                endTime > item.startTime
            );
        });
}


function updateStatistics(mySessions) {
        const completedSessions = mySessions.filter(
            item => item.status === "Completed"
        );

        const totalMinutes = completedSessions.reduce(
            (total, item) => {
                return total + getDuration(
                    item.startTime,
                    item.endTime
                );
            },
            0
        );

        const now = new Date();

        const upcoming = mySessions.filter(item => {
            if (
                item.status !== "Planned" ||
                !item.date ||
                !item.startTime
            ) {
                return false;
            }

            const sessionDateTime =
                new Date(`${item.date}T${item.startTime}`);

            return !Number.isNaN(sessionDateTime.getTime()) &&
                sessionDateTime >= now;
        }).length;

        elements.totalSessions.textContent = mySessions.length;

        elements.totalStudyHours.textContent =
            formatDuration(totalMinutes);

        elements.upcomingSessions.textContent = upcoming;
}



function createSessionCard(studySession) {
        const card = document.createElement("article");
        card.className = "schedule-session-card";

        const time = document.createElement("div");
        time.className = "session-time";

        const start = document.createElement("strong");
        start.textContent = formatTime(studySession.startTime);

        const end = document.createElement("span");
        end.textContent =
            `Until ${formatTime(studySession.endTime)}`;

        time.append(start, end);

        const details = document.createElement("div");
        details.className = "session-details";

        const title = document.createElement("h4");
        title.textContent = studySession.topic || "Untitled session";

        const course = document.createElement("p");
        course.className = "session-course";

        const linkedCourse = getMyCourses().find(
            item => item.id === studySession.courseId
        );

        course.textContent = linkedCourse
            ? `${linkedCourse.code || "NO CODE"} — ${linkedCourse.name || "Untitled course"}`
            : "Course unavailable";

        const notes = document.createElement("p");
        notes.className = "session-notes";
        notes.textContent = studySession.notes || "";
        notes.hidden = !studySession.notes;

        const status = document.createElement("span");

        const sessionStatus = [
            "Planned",
            "Completed",
            "Skipped"
        ].includes(studySession.status)
            ? studySession.status
            : "Planned";

        status.className =
            `session-status ${sessionStatus.toLowerCase()}`;

        status.textContent = sessionStatus;

        details.append(title, course, notes, status);

        const actions = document.createElement("div");
        actions.className = "session-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "session-action";
        editButton.textContent = "Edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = studySession.id;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "session-action delete";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = studySession.id;

        actions.append(editButton, deleteButton);

        card.append(time, details, actions);

        return card;
}


function renderSessions() {
        const mySessions = getMySessions();

        const selectedDate =
            elements.dateFilter.value || getLocalDateString();

        updateStatistics(mySessions);

        elements.selectedDayTitle.textContent =
            selectedDate === getLocalDateString()
                ? "Today's sessions"
                : formatDate(selectedDate);

        const selectedSessions = mySessions
            .filter(item => item.date === selectedDate)
            .sort((a, b) =>
                String(a.startTime || "").localeCompare(
                    String(b.startTime || "")
                )
            );

        elements.list.replaceChildren();

        selectedSessions.forEach(item => {
            elements.list.appendChild(createSessionCard(item));
        });

        elements.emptyState.hidden = selectedSessions.length > 0;
        elements.list.hidden = selectedSessions.length === 0;
}


function handleFormSubmit(event) {
        event.preventDefault();

        const id = elements.sessionId.value;
        const topic = elements.topic.value.trim();
        const courseId = elements.course.value;

        const course = getMyCourses().find(
            item => item.id === courseId
        );

        const date = elements.date.value;
        const status = elements.status.value;
        const startTime = elements.start.value;
        const endTime = elements.end.value;
        const notes = elements.notes.value.trim();

        if (
            !topic ||
            !course ||
            !date ||
            !startTime ||
            !endTime
        ) {
            showMessage(
                "Please complete all required fields.",
                "error"
            );
            return;
        }

        const [year, month, day] = date.split("-").map(Number);
        const parsedDate = new Date(year, month - 1, day);

        if (
            !date ||
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.getFullYear() !== year ||
            parsedDate.getMonth() !== month - 1 ||
            parsedDate.getDate() !== day
        ) {
            showMessage("Please select a valid date.", "error");
            return;
        }

        if (endTime <= startTime) {
            showMessage(
                "The end time must be later than the start time.",
                "error"
            );
            return;
        }

        if (!["Planned", "Completed", "Skipped"].includes(status)) {
            showMessage(
                "Please select a valid session status.",
                "error"
            );
            return;
        }

        if (
            status === "Planned" &&
            hasTimeConflict(date, startTime, endTime, id)
        ) {
            showMessage(
                "This session overlaps with another planned session. Choose a different time.",
                "error"
            );
            return;
        }

        if (id) {
            const index = sessions.findIndex(item =>
                item &&
                item.id === id &&
                item.userId === session.userId
            );

            if (index === -1) {
                showMessage(
                    "This study session could not be found.",
                    "error"
                );
                return;
            }

            const previousSession = sessions[index];

            sessions[index] = {
                ...previousSession,
                topic,
                courseId,
                date,
                status,
                startTime,
                endTime,
                notes,
                updatedAt: new Date().toISOString()
            };

            if (!saveSessions()) {
                sessions[index] = previousSession;
                return;
            }
        } else {
            const newSession = {
                id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                userId: session.userId,
                topic,
                courseId,
                date,
                status,
                startTime,
                endTime,
                notes,
                createdAt: new Date().toISOString()
            };

            sessions.push(newSession);

            if (!saveSessions()) {
                sessions.pop();
                return;
            }
        }

        elements.dateFilter.value = date;

        closeForm();
        renderSessions();
}


function handleSessionAction(event) {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button) return;

        const studySession = getMySessions().find(
            item => item.id === button.dataset.id
        );

        if (!studySession) return;

        if (button.dataset.action === "edit") {
            openForm(studySession);
            return;
        }

        if (button.dataset.action === "delete") {
            const confirmed = window.confirm(
                `Delete the study session "${studySession.topic}"?`
            );

            if (!confirmed) return;

            const originalSessions = sessions;

            sessions = sessions.filter(item => !(
                item &&
                item.id === studySession.id &&
                item.userId === session.userId
            ));

            if (!saveSessions()) {
                sessions = originalSessions;
                return;
            }

            renderSessions();
        }
}


function handleLogout() {
        const confirmed = window.confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmed) return;

        StudyFlowStorage.clearSession();

        window.location.href = "login.html";
}


    elements.addButton.addEventListener(
        "click",
        () => openForm()
    );

    elements.emptyAddButton.addEventListener(
        "click",
        () => openForm()
    );

    elements.closeButton.addEventListener(
        "click",
        closeForm
    );

    elements.cancelButton.addEventListener(
        "click",
        closeForm
    );

    elements.form.addEventListener(
        "submit",
        handleFormSubmit
    );

    elements.list.addEventListener(
        "click",
        handleSessionAction
    );

    elements.dateFilter.addEventListener(
        "change",
        renderSessions
    );

    elements.todayButton.addEventListener("click", () => {
        elements.dateFilter.value = getLocalDateString();
        renderSessions();
    });

    elements.logoutButton.addEventListener(
        "click",
        handleLogout
    );


    elements.dateFilter.value = getLocalDateString();

    populateCourseSelect();
    renderSessions();
});
