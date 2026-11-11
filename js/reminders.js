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

    if (
        !session ||
        !session.userId ||
        session.role !== "student"
    ) {
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



    const getElement = id => document.getElementById(id);

    const elements = {
        userName: getElement("sidebar-user-name"),
        userAvatar: getElement("user-avatar"),
        logoutButton: getElement("logout-button"),

        totalCount: getElement("reminder-total-count"),
        upcomingCount: getElement("reminder-upcoming-count"),
        overdueCount: getElement("reminder-overdue-count"),
        completedCount: getElement("reminder-completed-count"),

        list: getElement("reminder-list"),
        emptyState: getElement("reminder-empty-state"),

        addButton: getElement("add-reminder-button"),
        emptyAddButton: getElement("empty-add-reminder-button"),

        modal: getElement("reminder-modal"),
        modalBackdrop: getElement("reminder-modal-backdrop"),
        modalTitle: getElement("reminder-form-title"),
        closeButton: getElement("close-reminder-modal"),

        form: getElement("reminder-form"),
        reminderId: getElement("reminder-id"),
        title: getElement("reminder-title"),
        type: getElement("reminder-type"),
        date: getElement("reminder-date"),
        time: getElement("reminder-time"),
        priority: getElement("reminder-priority"),
        description: getElement("reminder-description"),
        error: getElement("reminder-form-error"),

        cancelButton: getElement("cancel-reminder-button"),
        saveButton: getElement("save-reminder-button"),

        filterButtons: document.querySelectorAll(
            ".reminder-filter[data-filter]"
        ),

        notificationButton: getElement(
            "notification-permission-button"
        ),
        notificationLabel: getElement(
            "notification-button-label"
        )
    };


    const requiredElements = [
        elements.list,
        elements.emptyState,
        elements.form,
        elements.modal,
        elements.title,
        elements.type,
        elements.date,
        elements.time,
        elements.priority,
        elements.description,
        elements.saveButton
    ];

    if (requiredElements.some(element => !element)) {
        console.error(
            "StudyFlow Reminders: One or more required HTML elements are missing."
        );
        return;
    }


    const fullName = currentUser.fullName || "Student";
    if (elements.userName) {
        elements.userName.textContent = fullName;
    }

    if (elements.userAvatar) {
        elements.userAvatar.textContent =
            fullName.charAt(0).toUpperCase();
    }


    const STORAGE_KEY = "studyflow_reminders";

    let allReminders = StudyFlowStorage.get(
        STORAGE_KEY,
        []
    );

    if (!Array.isArray(allReminders)) {
        allReminders = [];
    }

    let reminders = allReminders.filter(
        reminder =>
            reminder &&
            reminder.userId === currentUser.id
    );

    let editingReminderId = null;
    let activeFilter = "all";


function showError(message) {
        if (!elements.error) return;

        elements.error.textContent = message;
        elements.error.hidden = false;
}

function clearError() {
        if (!elements.error) return;

        elements.error.textContent = "";
        elements.error.hidden = true;
}

function saveReminders() {
        const otherUsersReminders = allReminders.filter(
            reminder =>
                reminder &&
                reminder.userId !== currentUser.id
        );

        const updatedReminders = [
            ...otherUsersReminders,
            ...reminders
        ];

        const saved = StudyFlowStorage.set(
            STORAGE_KEY,
            updatedReminders
        );

        if (!saved) {
            alert(
                "Unable to save your reminder. Please check your browser storage."
            );

            return false;
        }

        allReminders = updatedReminders;

        return true;
}

function createReminderId() {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }

        return `reminder-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}`;
}


function isValidDate(dateString) {
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

function isValidTime(timeString) {
        if (typeof timeString !== "string") {
            return false;
        }

        const parts = timeString.split(":");

        if (parts.length !== 2) {
            return false;
        }

        const [hours, minutes] = parts.map(Number);

        return (
            Number.isInteger(hours) &&
            Number.isInteger(minutes) &&
            hours >= 0 &&
            hours <= 23 &&
            minutes >= 0 &&
            minutes <= 59
        );
}

function getReminderDateTime(reminder) {
        if (
            !reminder ||
            !isValidDate(reminder.date) ||
            !isValidTime(reminder.time)
        ) {
            return null;
        }

        const [year, month, day] =
            reminder.date.split("-").map(Number);

        const [hours, minutes] =
            reminder.time.split(":").map(Number);

        return new Date(
            year,
            month - 1,
            day,
            hours,
            minutes,
            0,
            0
        );
}

function getLocalDateString() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
        if (!isValidDate(dateString)) {
            return "Invalid date";
        }

        const [year, month, day] =
            dateString.split("-").map(Number);

        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
}

function formatTime(timeString) {
        if (!isValidTime(timeString)) {
            return "Invalid time";
        }

        const [hours, minutes] =
            timeString.split(":").map(Number);

        const date = new Date();

        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit"
        });
}

function getReminderStatus(reminder) {
        if (
            String(reminder.status || "").toLowerCase() ===
            "completed"
        ) {
            return "completed";
        }

        const reminderDate = getReminderDateTime(reminder);

        if (!reminderDate) {
            return "upcoming";
        }

        return reminderDate < new Date()
            ? "overdue"
            : "upcoming";
}


function updateStatistics() {
        const upcoming = reminders.filter(
            reminder =>
                getReminderStatus(reminder) === "upcoming"
        ).length;

        const overdue = reminders.filter(
            reminder =>
                getReminderStatus(reminder) === "overdue"
        ).length;

        const completed = reminders.filter(
            reminder =>
                getReminderStatus(reminder) === "completed"
        ).length;

        if (elements.totalCount) {
            elements.totalCount.textContent = reminders.length;
        }

        if (elements.upcomingCount) {
            elements.upcomingCount.textContent = upcoming;
        }

        if (elements.overdueCount) {
            elements.overdueCount.textContent = overdue;
        }

        if (elements.completedCount) {
            elements.completedCount.textContent = completed;
        }
    }



function getFilteredReminders() {
        return reminders
            .filter(reminder => {
                if (activeFilter === "all") {
                    return true;
                }

                return (
                    getReminderStatus(reminder) === activeFilter
                );
            })
            .sort((a, b) => {
                const dateA = getReminderDateTime(a);
                const dateB = getReminderDateTime(b);

                return (
                    (dateA?.getTime() ?? Infinity) -
                    (dateB?.getTime() ?? Infinity)
                );
            });
}

function updateFilterButtons() {
        elements.filterButtons.forEach(button => {
            const isActive =
                button.dataset.filter === activeFilter;

            button.classList.toggle("active", isActive);

            button.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });
}


function createReminderCard(reminder) {
        const status = getReminderStatus(reminder);

        const card = document.createElement("article");
        card.className = "reminder-item";
        card.dataset.id = reminder.id;

        const main = document.createElement("div");
        main.className = "reminder-item-main";

        const marker = document.createElement("div");
        marker.className = "reminder-item-marker";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = "♧";

        const content = document.createElement("div");
        content.className = "reminder-item-content";

        const title = document.createElement("h3");
        title.className = "reminder-item-title";
        title.textContent =
            reminder.title || "Untitled reminder";

        const statusLabel = document.createElement("span");
        statusLabel.className =
            `reminder-item-status ${status}`;

        statusLabel.textContent =
            status.charAt(0).toUpperCase() + status.slice(1);

        const titleRow = document.createElement("div");
        titleRow.className = "reminder-item-heading";

        titleRow.append(title, statusLabel);

        const description = document.createElement("p");
        description.className = "reminder-item-description";
        description.textContent = reminder.description || "";
        description.hidden = !reminder.description;

        const meta = document.createElement("div");
        meta.className = "reminder-item-meta";

        const typeTag = document.createElement("span");
        typeTag.className = "reminder-tag";
        typeTag.textContent = reminder.category || "Other";

        const priority = String(
            reminder.priority || "Normal"
        ).toLowerCase();

        const priorityTag = document.createElement("span");
        priorityTag.className =
            `reminder-tag reminder-priority-${priority}`;

        priorityTag.textContent =
            `${reminder.priority || "Normal"} priority`;

        const dateLabel = document.createElement("span");
        dateLabel.textContent = formatDate(reminder.date);

        const timeLabel = document.createElement("span");
        timeLabel.textContent = formatTime(reminder.time);

        meta.append(
            typeTag,
            priorityTag,
            dateLabel,
            timeLabel
        );

        content.append(
            titleRow,
            description,
            meta
        );

        main.append(marker, content);

        const actions = document.createElement("div");
        actions.className = "reminder-item-actions";

        if (status !== "completed") {
            const completeButton =
                document.createElement("button");

            completeButton.type = "button";
            completeButton.className =
                "reminder-action-button complete-reminder";

            completeButton.textContent = "Mark complete";
            completeButton.dataset.action = "complete";
            completeButton.dataset.id = reminder.id;

            actions.appendChild(completeButton);
        } else {
            const undoButton = document.createElement("button");

            undoButton.type = "button";
            undoButton.className =
                "reminder-action-button undo-reminder";

            undoButton.textContent = "Undo";
            undoButton.dataset.action = "undo";
            undoButton.dataset.id = reminder.id;

            actions.appendChild(undoButton);
        }

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className =
            "reminder-action-button edit-reminder";

        editButton.textContent = "Edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = reminder.id;

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "reminder-action-button delete delete-reminder";

        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = reminder.id;

        actions.append(editButton, deleteButton);

        card.append(main, actions);

        return card;
    }



function renderReminders() {
        const filteredReminders = getFilteredReminders();

        elements.list.replaceChildren();

        filteredReminders.forEach(reminder => {
            elements.list.appendChild(
                createReminderCard(reminder)
            );
        });

        const hasReminders = filteredReminders.length > 0;

        elements.list.hidden = !hasReminders;
        elements.emptyState.hidden = hasReminders;

        const emptyHeading =
            elements.emptyState.querySelector("h3");

        const emptyMessage =
            elements.emptyState.querySelector("p");

        if (!hasReminders) {
            const hasAnyReminders = reminders.length > 0;

            if (emptyHeading) {
                emptyHeading.textContent = hasAnyReminders
                    ? "No reminders found"
                    : "No reminders here yet";
            }

            if (emptyMessage) {
                emptyMessage.textContent = hasAnyReminders
                    ? "There are no reminders in this category."
                    : "Create a reminder to keep track of important study activities.";
            }

            if (elements.emptyAddButton) {
                elements.emptyAddButton.hidden = hasAnyReminders;
            }
        }

        updateStatistics();
        updateFilterButtons();
    }


function openModal() {
        elements.modal.hidden = false;
        document.body.classList.add("modal-open");

        clearError();

        elements.title.focus();
}

function closeModal() {
        elements.modal.hidden = true;
        document.body.classList.remove("modal-open");

        editingReminderId = null;

        elements.form.reset();

        if (elements.reminderId) {
            elements.reminderId.value = "";
        }

        elements.modalTitle.textContent = "Create reminder";
        elements.saveButton.textContent = "Save Reminder";

        clearError();
}

function resetCreateForm() {
        editingReminderId = null;

        elements.form.reset();

        if (elements.reminderId) {
            elements.reminderId.value = "";
        }

        elements.modalTitle.textContent = "Create reminder";
        elements.saveButton.textContent = "Save Reminder";

        clearError();

        openModal();
}

function getFormData() {
        const title = elements.title.value.trim();
        const category = elements.type.value;
        const date = elements.date.value;
        const time = elements.time.value;
        const priority = elements.priority.value;
        const description =
            elements.description.value.trim();

        if (!title || !date || !time) {
            showError(
                "Please complete all required fields."
            );
            return null;
        }

        if (!isValidDate(date)) {
            showError("Please select a valid date.");
            return null;
        }

        if (!isValidTime(time)) {
            showError("Please select a valid time.");
            return null;
        }

        const validCategories = [
            "Study",
            "Assignment",
            "Exam",
            "Deadline",
            "Personal",
            "Other"
        ];

        const validPriorities = [
            "Normal",
            "High",
            "Low"
        ];

        if (!validCategories.includes(category)) {
            showError("Please select a valid reminder type.");
            return null;
        }

        if (!validPriorities.includes(priority)) {
            showError("Please select a valid priority.");
            return null;
        }

        return {
            title,
            description,
            category,
            date,
            time,
            priority
        };
}


function handleFormSubmit(event) {
        event.preventDefault();

        clearError();

        const formData = getFormData();

        if (!formData) {
            return;
        }

        const now = new Date().toISOString();

        if (editingReminderId) {
            const existingReminder = reminders.find(
                reminder =>
                    reminder.id === editingReminderId
            );

            if (!existingReminder) {
                showError(
                    "This reminder could not be found."
                );
                return;
            }

            const previousReminder = {
                ...existingReminder
            };

            Object.assign(existingReminder, {
                ...formData,
                updatedAt: now
            });

            if (!saveReminders()) {
                Object.assign(
                    existingReminder,
                    previousReminder
                );
                return;
            }
        } else {
            const newReminder = {
                id: createReminderId(),
                userId: currentUser.id,

                ...formData,

                status: "pending",
                completedAt: null,
                createdAt: now,
                updatedAt: now
            };

            reminders.push(newReminder);

            if (!saveReminders()) {
                reminders = reminders.filter(
                    reminder =>
                        reminder.id !== newReminder.id
                );
                return;
            }
        }

        closeModal();
        renderReminders();
}


function editReminder(id) {
        const reminder = reminders.find(
            item => item.id === id
        );

        if (!reminder) {
            return;
        }

        editingReminderId = id;

        elements.reminderId.value = reminder.id;
        elements.title.value = reminder.title || "";
        elements.type.value = reminder.category || "Other";
        elements.date.value = reminder.date || "";
        elements.time.value = reminder.time || "";
        elements.priority.value = reminder.priority || "Normal";
        elements.description.value =
            reminder.description || "";

        elements.modalTitle.textContent = "Edit reminder";
        elements.saveButton.textContent = "Update Reminder";

        clearError();

        openModal();
}


function completeReminder(id) {
        const reminder = reminders.find(
            item => item.id === id
        );

        if (!reminder) {
            return;
        }

        const previousStatus = reminder.status;
        const previousCompletedAt = reminder.completedAt;
        const previousUpdatedAt = reminder.updatedAt;

        const now = new Date().toISOString();

        reminder.status = "completed";
        reminder.completedAt = now;
        reminder.updatedAt = now;

        if (!saveReminders()) {
            reminder.status = previousStatus;
            reminder.completedAt = previousCompletedAt;
            reminder.updatedAt = previousUpdatedAt;
            return;
        }

        renderReminders();
}

function undoReminder(id) {
        const reminder = reminders.find(
            item => item.id === id
        );

        if (!reminder) {
            return;
        }

        const previousStatus = reminder.status;
        const previousCompletedAt = reminder.completedAt;
        const previousUpdatedAt = reminder.updatedAt;

        reminder.status = "pending";
        reminder.completedAt = null;
        reminder.updatedAt = new Date().toISOString();

        if (!saveReminders()) {
            reminder.status = previousStatus;
            reminder.completedAt = previousCompletedAt;
            reminder.updatedAt = previousUpdatedAt;
            return;
        }

        renderReminders();
}


function deleteReminder(id) {
        const reminder = reminders.find(
            item => item.id === id
        );

        if (!reminder) {
            return;
        }

        const confirmed = window.confirm(
            `Delete the reminder "${reminder.title}"?`
        );

        if (!confirmed) {
            return;
        }

        const previousReminders = reminders;

        reminders = reminders.filter(
            item => item.id !== id
        );

        if (!saveReminders()) {
            reminders = previousReminders;
            return;
        }

        renderReminders();
}


function updateNotificationButton() {
        if (
            !elements.notificationButton ||
            !elements.notificationLabel
        ) {
            return;
        }

        if (!("Notification" in window)) {
            elements.notificationLabel.textContent =
                "Notifications unavailable";

            elements.notificationButton.disabled = true;
            return;
        }

        if (Notification.permission === "granted") {
            elements.notificationLabel.textContent =
                "Notifications enabled";

            elements.notificationButton.disabled = true;
        } else if (Notification.permission === "denied") {
            elements.notificationLabel.textContent =
                "Notifications blocked";

            elements.notificationButton.disabled = true;
        } else {
            elements.notificationLabel.textContent =
                "Enable notifications";

            elements.notificationButton.disabled = false;
        }
}

async function requestNotificationPermission() {
        if (!("Notification" in window)) {
            alert(
                "Your browser does not support notifications."
            );

            updateNotificationButton();
            return;
        }

        if (Notification.permission === "granted") {
            updateNotificationButton();
            return;
        }

        if (Notification.permission === "denied") {
            alert(
                "Notifications are blocked. Allow them in your browser settings."
            );

            updateNotificationButton();
            return;
        }

        try {
            const permission =
                await Notification.requestPermission();

            if (permission === "granted") {
                alert(
                    "Browser notification permission enabled."
                );
            } else {
                alert(
                    "Notification permission was not granted."
                );
            }
        } catch (error) {
            console.error(
                "Unable to request notification permission:",
                error
            );

            alert(
                "Unable to enable browser notifications."
            );
        }

        updateNotificationButton();
}


    elements.addButton?.addEventListener(
        "click",
        resetCreateForm
    );

    elements.emptyAddButton?.addEventListener(
        "click",
        resetCreateForm
    );

    elements.closeButton?.addEventListener(
        "click",
        closeModal
    );

    elements.cancelButton?.addEventListener(
        "click",
        closeModal
    );

    elements.form.addEventListener(
        "submit",
        handleFormSubmit
    );

    elements.modalBackdrop?.addEventListener(
        "click",
        closeModal
    );

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            !elements.modal.hidden
        ) {
            closeModal();
        }
    });

    elements.list.addEventListener("click", event => {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (!id) {
            return;
        }

        switch (action) {
            case "complete":
                completeReminder(id);
                break;

            case "undo":
                undoReminder(id);
                break;

            case "edit":
                editReminder(id);
                break;

            case "delete":
                deleteReminder(id);
                break;
        }
    });

    elements.filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter || "all";

            renderReminders();
        });
    });

    elements.notificationButton?.addEventListener(
        "click",
        requestNotificationPermission
    );

    elements.logoutButton?.addEventListener(
        "click",
        () => {
            const confirmed = window.confirm(
                "Are you sure you want to log out?"
            );

            if (!confirmed) {
                return;
            }

            StudyFlowStorage.clearSession();

            window.location.href = "login.html";
        }
    );

    updateNotificationButton();
    renderReminders();
});
