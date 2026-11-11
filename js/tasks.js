document.addEventListener("DOMContentLoaded", () => {
    const session = StudyFlowStorage.getSession();

    if (!session || !session.userId || session.role !== "student") {
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

        form: document.getElementById("task-form"),
        formPanel: document.getElementById("task-form-panel"),
        formTitle: document.getElementById("task-form-title"),
        formMessage: document.getElementById("task-form-message"),
        taskId: document.getElementById("task-id"),
        title: document.getElementById("task-title"),
        course: document.getElementById("task-course"),
        type: document.getElementById("task-type"),
        priority: document.getElementById("task-priority"),
        dueDate: document.getElementById("task-due-date"),
        status: document.getElementById("task-status"),
        description: document.getElementById("task-description"),

        list: document.getElementById("task-list"),
        emptyState: document.getElementById("tasks-empty-state"),
        search: document.getElementById("task-search"),
        statusFilter: document.getElementById("status-filter"),
        priorityFilter: document.getElementById("priority-filter"),
        courseFilter: document.getElementById("course-filter"),

        totalTasks: document.getElementById("total-tasks"),
        pendingTasks: document.getElementById("pending-tasks"),
        progressTasks: document.getElementById("progress-tasks"),
        completedTasks: document.getElementById("completed-tasks"),
        countLabel: document.getElementById("tasks-count-label"),

        addButton: document.getElementById("add-task-button"),
        emptyAddButton: document.getElementById("empty-add-task-button"),
        closeButton: document.getElementById("close-task-form"),
        cancelButton: document.getElementById("cancel-task-form"),
        saveButton: document.getElementById("save-task-button")
    };


    const TASKS_KEY = "studyflow_tasks";
    const COURSES_KEY = "studyflow_courses";

    let tasks = StudyFlowStorage.get(TASKS_KEY, []);
    let courses = StudyFlowStorage.get(COURSES_KEY, []);

    if (!Array.isArray(tasks)) tasks = [];
    if (!Array.isArray(courses)) courses = [];

    const userName = currentUser.fullName || "Student";

    elements.userName.textContent = userName;
    elements.userAvatar.textContent = userName.charAt(0).toUpperCase();


function getMyCourses() {
        return courses.filter(course => course.userId === session.userId);
}

function getMyTasks() {
        return tasks.filter(task => task.userId === session.userId);
}

function saveTasks() {
        const saved = StudyFlowStorage.set(TASKS_KEY, tasks);

        if (!saved) {
            showMessage(
                "Could not save your task. Check your browser storage.",
                "error"
            );
        }

        return saved;
}

function showMessage(message, type = "") {
        elements.formMessage.textContent = message;
        elements.formMessage.className = `task-form-message ${type}`;
}


function getLocalDateString() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
        if (!dateString) return "No due date";

        const [year, month, day] = dateString.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
}

function isOverdue(task) {
        return task.status !== "Completed" &&
            task.dueDate < getLocalDateString();
}

function getCourseName(courseId, savedName = "") {
        const course = getMyCourses().find(item => item.id === courseId);

        return course
            ? course.name
            : (savedName || "Course unavailable");
}

function populateCourseSelects() {
        const myCourses = getMyCourses();

        elements.course.replaceChildren();
        elements.courseFilter.replaceChildren();

        const coursePlaceholder = document.createElement("option");

        coursePlaceholder.value = "";
        coursePlaceholder.textContent = myCourses.length
            ? "Select a course"
            : "Add a course first";

        elements.course.appendChild(coursePlaceholder);

        const allOption = document.createElement("option");

        allOption.value = "All";
        allOption.textContent = "All courses";

        elements.courseFilter.appendChild(allOption);

        myCourses.forEach(course => {
            const formOption = document.createElement("option");

            formOption.value = course.id;
            formOption.textContent = `${course.code} — ${course.name}`;

            elements.course.appendChild(formOption);

            const filterOption = document.createElement("option");

            filterOption.value = course.id;
            filterOption.textContent = `${course.code} — ${course.name}`;

            elements.courseFilter.appendChild(filterOption);
        });

        elements.course.disabled = myCourses.length === 0;
        elements.saveButton.disabled = myCourses.length === 0;
}

function openForm(task = null) {
        populateCourseSelects();

        elements.form.reset();
        elements.taskId.value = "";
        elements.priority.value = "Medium";
        elements.status.value = "Pending";
        elements.dueDate.value = getLocalDateString();

        showMessage("");

        if (task) {
            elements.formTitle.textContent = "Edit task";
            elements.saveButton.textContent = "Update task";

            elements.taskId.value = task.id;
            elements.title.value = task.title;
            elements.course.value = task.courseId;
            elements.type.value = task.type;
            elements.priority.value = task.priority;
            elements.dueDate.value = task.dueDate;
            elements.status.value = task.status;
            elements.description.value = task.description || "";
        } else {
            elements.formTitle.textContent = "Create a new task";
            elements.saveButton.textContent = "Save task";
        }

        elements.formPanel.hidden = false;

        elements.formPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        elements.title.focus();
}

function closeForm() {
        elements.formPanel.hidden = true;
        elements.form.reset();
        elements.taskId.value = "";

        showMessage("");
}

function createBadge(text, className) {
        const badge = document.createElement("span");

        badge.className = `task-badge ${className}`;
        badge.textContent = text;

        return badge;
}

function createTaskItem(task) {
        const item = document.createElement("article");

        item.className = "task-item";

        if (task.status === "Completed") {
            item.classList.add("is-completed");
        }

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.status === "Completed";
        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.title} as completed`
        );

        checkbox.dataset.action = "toggle";
        checkbox.dataset.id = task.id;

        const content = document.createElement("div");
        content.className = "task-content";
        const titleRow = document.createElement("div");
        titleRow.className = "task-title-row";
        const title = document.createElement("h3");
        title.className = "task-title";
        title.textContent = task.title;

        const priorityClass = `priority-${task.priority.toLowerCase()}`;

        const statusClass = task.status === "In Progress"
            ? "status-in-progress"
            : `status-${task.status.toLowerCase()}`;

        titleRow.append(
            title,
            createBadge(task.priority, priorityClass),
            createBadge(task.status, statusClass)
        );

        const description = document.createElement("p");
        description.className = "task-description";
        description.textContent = task.description || "";

        if (!task.description) {
            description.hidden = true;
        }

        const meta = document.createElement("div");

        meta.className = "task-meta";

        const course = document.createElement("span");
        course.textContent = getCourseName(
            task.courseId,
            task.courseName
        );

        const type = document.createElement("span");
        type.textContent = task.type;

        const due = document.createElement("span");

        due.textContent = `Due ${formatDate(task.dueDate)}`;

        if (isOverdue(task)) {
            due.classList.add("task-overdue");
            due.textContent += " · Overdue";
        }

        meta.append(course, type, due);

        content.append(titleRow, description, meta);

        const actions = document.createElement("div");

        actions.className = "task-actions";

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "task-action";
        editButton.textContent = "Edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = task.id;

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "task-action delete";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = task.id;

        actions.append(editButton, deleteButton);

        item.append(checkbox, content, actions);

        return item;
}


function updateStatistics(myTasks) {
        const pending = myTasks.filter(
            task => task.status === "Pending"
        ).length;

        const inProgress = myTasks.filter(
            task => task.status === "In Progress"
        ).length;

        const completed = myTasks.filter(
            task => task.status === "Completed"
        ).length;

        elements.totalTasks.textContent = myTasks.length;
        elements.pendingTasks.textContent = pending;
        elements.progressTasks.textContent = inProgress;
        elements.completedTasks.textContent = completed;

        elements.countLabel.textContent =
            `${myTasks.length} ${myTasks.length === 1 ? "task" : "tasks"}`;
}

function renderTasks() {
        const myTasks = getMyTasks();

        updateStatistics(myTasks);

        const searchTerm = elements.search.value.trim().toLowerCase();
        const statusValue = elements.statusFilter.value;
        const priorityValue = elements.priorityFilter.value;
        const courseValue = elements.courseFilter.value;

        const filteredTasks = myTasks
            .filter(task => {
                const matchesSearch =
                    task.title.toLowerCase().includes(searchTerm) ||
                    (task.description || "").toLowerCase().includes(searchTerm) ||
                    (task.courseName || "").toLowerCase().includes(searchTerm);

                const matchesStatus =
                    statusValue === "All" || task.status === statusValue;

                const matchesPriority =
                    priorityValue === "All" || task.priority === priorityValue;

                const matchesCourse =
                    courseValue === "All" || task.courseId === courseValue;

                return matchesSearch &&
                    matchesStatus &&
                    matchesPriority &&
                    matchesCourse;
            })
            .sort((a, b) => {
                if (a.status === "Completed" && b.status !== "Completed") {
                    return 1;
                }

                if (a.status !== "Completed" && b.status === "Completed") {
                    return -1;
                }

                return a.dueDate.localeCompare(b.dueDate);
            });

        elements.list.replaceChildren();

        filteredTasks.forEach(task => {
            elements.list.appendChild(createTaskItem(task));
        });

        elements.emptyState.hidden = filteredTasks.length > 0;
        elements.list.hidden = filteredTasks.length === 0;

        const emptyTitle = elements.emptyState.querySelector("h3");
        const emptyText = elements.emptyState.querySelector("p");
        const emptyButton = elements.emptyState.querySelector("button");

        if (myTasks.length === 0) {
            emptyTitle.textContent = "No tasks yet";

            emptyText.textContent =
                getMyCourses().length === 0
                    ? "Add a course first, then create tasks for it."
                    : "Create your first task and start organizing your academic work.";

            emptyButton.hidden = getMyCourses().length === 0;
        } else {
            emptyTitle.textContent = "No matching tasks";

            emptyText.textContent =
                "Try changing your search or filters to find your tasks.";

            emptyButton.hidden = true;
        }
}

function handleFormSubmit(event) {
        event.preventDefault();

        const id = elements.taskId.value;
        const title = elements.title.value.trim();
        const courseId = elements.course.value;

        const course = getMyCourses().find(
            item => item.id === courseId
        );

        const type = elements.type.value;
        const priority = elements.priority.value;
        const dueDate = elements.dueDate.value;
        const status = elements.status.value;
        const description = elements.description.value.trim();

        if (!title || !courseId || !dueDate || !course) {
            showMessage(
                "Please complete the required fields and select a valid course.",
                "error"
            );

            return;
        }

        if (dueDate < "2000-01-01") {
            showMessage("Please enter a valid due date.", "error");
            return;
        }

        const validPriorities = ["Low", "Medium", "High"];

        const validStatuses = [
            "Pending",
            "In Progress",
            "Completed"
        ];

        const validTypes = [
            "Assignment",
            "Homework",
            "Project",
            "Exam",
            "Reading",
            "Other"
        ];

        if (
            !validPriorities.includes(priority) ||
            !validStatuses.includes(status) ||
            !validTypes.includes(type)
        ) {
            showMessage("Please select valid task options.", "error");
            return;
        }

        if (id) {
            const index = tasks.findIndex(task =>
                task.id === id && task.userId === session.userId
            );

            if (index === -1) {
                showMessage("This task could not be found.", "error");
                return;
            }

            const previousTask = tasks[index];

            tasks[index] = {
                ...previousTask,
                title,
                courseId,
                courseName: course.name,
                type,
                priority,
                dueDate,
                status,
                description,

                completedAt: status === "Completed"
                    ? (previousTask.completedAt || new Date().toISOString())
                    : null,

                updatedAt: new Date().toISOString()
            };

            if (!saveTasks()) {
                tasks[index] = previousTask;
                return;
            }
        } else {
            const newTask = {
                id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                userId: session.userId,
                title,
                courseId,
                courseName: course.name,
                type,
                priority,
                dueDate,
                status,
                description,

                completedAt: status === "Completed"
                    ? new Date().toISOString()
                    : null,

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            tasks.push(newTask);

            if (!saveTasks()) {
                tasks.pop();
                return;
            }
        }

        closeForm();
        renderTasks();
}


function handleTaskClick(event) {
        const control = event.target.closest("[data-action]");

        if (!control) return;

        const action = control.dataset.action;

        if (action !== "edit" && action !== "delete") {
            return;
        }

        const task = getMyTasks().find(
            item => item.id === control.dataset.id
        );

        if (!task) return;

        if (action === "edit") {
            openForm(task);
            return;
        }

        if (action === "delete") {
            const confirmed = window.confirm(
                `Are you sure you want to delete "${task.title}"?`
            );

            if (!confirmed) return;

            const originalTasks = tasks;

            tasks = tasks.filter(
                item => !(
                    item.id === task.id &&
                    item.userId === session.userId
                )
            );

            if (!saveTasks()) {
                tasks = originalTasks;
                return;
            }

            renderTasks();
        }
}


function handleTaskChange(event) {
        const control = event.target.closest('[data-action="toggle"]');

        if (!control) return;

        const task = getMyTasks().find(
            item => item.id === control.dataset.id
        );

        if (!task) return;

        const previousStatus = task.status;
        const previousCompletedAt = task.completedAt;

        task.status = control.checked
            ? "Completed"
            : "Pending";

        task.completedAt = control.checked
            ? new Date().toISOString()
            : null;

        if (!saveTasks()) {
            task.status = previousStatus;
            task.completedAt = previousCompletedAt;

            control.checked = previousStatus === "Completed";

            return;
        }

        renderTasks();
}


function handleLogout() {
        const confirmed = window.confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmed) return;

        StudyFlowStorage.clearSession();

        window.location.href = "login.html";
}


    elements.addButton.addEventListener("click", () => openForm());
    elements.emptyAddButton.addEventListener("click", () => openForm());
    elements.closeButton.addEventListener("click", closeForm);
    elements.cancelButton.addEventListener("click", closeForm);
    elements.form.addEventListener("submit", handleFormSubmit);
    elements.list.addEventListener("click", handleTaskClick);
    elements.list.addEventListener("change", handleTaskChange);
    elements.search.addEventListener("input", renderTasks);
    elements.statusFilter.addEventListener("change", renderTasks);
    elements.priorityFilter.addEventListener("change", renderTasks);
    elements.courseFilter.addEventListener("change", renderTasks);
    elements.logoutButton.addEventListener("click", handleLogout);

    populateCourseSelects();
    renderTasks();
});
