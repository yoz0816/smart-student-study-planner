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
        form: document.getElementById("course-form"),
        formPanel: document.getElementById("course-form-panel"),
        formTitle: document.getElementById("course-form-title"),
        formMessage: document.getElementById("course-form-message"),
        courseId: document.getElementById("course-id"),
        name: document.getElementById("course-name"),
        code: document.getElementById("course-code"),
        instructor: document.getElementById("course-instructor"),
        credits: document.getElementById("course-credits"),
        description: document.getElementById("course-description"),
        grid: document.getElementById("course-grid"),
        emptyState: document.getElementById("courses-empty-state"),
        search: document.getElementById("course-search"),
        totalCourses: document.getElementById("total-courses"),
        totalCredits: document.getElementById("total-credits"),
        countLabel: document.getElementById("courses-count-label"),
        addButton: document.getElementById("add-course-button"),
        emptyAddButton: document.getElementById("empty-add-course-button"),
        closeButton: document.getElementById("close-course-form"),
        cancelButton: document.getElementById("cancel-course-form"),
        saveButton: document.getElementById("save-course-button"),
        logoutButton: document.getElementById("logout-button"),
        userName: document.getElementById("sidebar-user-name"),
        userAvatar: document.getElementById("user-avatar")
    };



    const userName = currentUser.fullName || "Student";

    elements.userName.textContent = userName;
    elements.userAvatar.textContent = userName.charAt(0).toUpperCase();


    const STORAGE_KEY = "studyflow_courses";

    let allCourses = StudyFlowStorage.get(STORAGE_KEY, []);

    if (!Array.isArray(allCourses)) {
        allCourses = [];
    }


function getMyCourses() {
        return allCourses.filter(
            course => course && course.userId === session.userId
        );
}

function saveCourses() {
        const saved = StudyFlowStorage.set(STORAGE_KEY, allCourses);

        if (!saved) {
            showMessage(
                "Could not save your course. Check your browser storage.",
                "error"
            );
        }

        return saved;
}

function showMessage(message, type = "") {
        elements.formMessage.textContent = message;
        elements.formMessage.className = `course-form-message ${type}`;
}


function openForm(course = null) {
        elements.form.reset();
        elements.courseId.value = "";
        elements.credits.value = 3;

        showMessage("");

        if (course) {
            elements.formTitle.textContent = "Edit course";
            elements.saveButton.textContent = "Update course";

            elements.courseId.value = course.id;
            elements.name.value = course.name || "";
            elements.code.value = course.code || "";
            elements.instructor.value = course.instructor || "";
            elements.credits.value = course.credits ?? 3;
            elements.description.value = course.description || "";
        } else {
            elements.formTitle.textContent = "Add a new course";
            elements.saveButton.textContent = "Save course";
        }

        elements.formPanel.hidden = false;

        elements.formPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        elements.name.focus();
}

function closeForm() {
        elements.formPanel.hidden = true;
        elements.form.reset();
        elements.courseId.value = "";

        showMessage("");
}


function createCourseCard(course) {
        const card = document.createElement("article");
        card.className = "course-card";

        const top = document.createElement("div");
        top.className = "course-card-top";

        const code = document.createElement("span");
        code.className = "course-code";
        code.textContent = course.code || "NO CODE";

        top.appendChild(code);

        const title = document.createElement("h3");
        title.textContent = course.name || "Untitled course";

        const description = document.createElement("p");
        description.className = "course-description";
        description.textContent =
            course.description || "No description added yet.";

        const meta = document.createElement("div");
        meta.className = "course-meta";

        const instructor = document.createElement("span");
        instructor.textContent =
            `Instructor: ${course.instructor || "Not specified"}`;

        const credits = document.createElement("span");
        credits.textContent =
            `${Number(course.credits) || 0} credit(s)`;

        meta.append(instructor, credits);

        const actions = document.createElement("div");
        actions.className = "course-card-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "course-action";
        editButton.textContent = "Edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = course.id;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "course-action delete";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = course.id;

        actions.append(editButton, deleteButton);

        card.append(top, title, description, meta, actions);

        return card;
}


function renderCourses() {
        const myCourses = getMyCourses();

        const searchTerm = elements.search.value
            .trim()
            .toLowerCase();

        const filteredCourses = myCourses.filter(course => {
            const name = String(course.name || "").toLowerCase();
            const code = String(course.code || "").toLowerCase();
            const instructor = String(course.instructor || "").toLowerCase();

            return (
                name.includes(searchTerm) ||
                code.includes(searchTerm) ||
                instructor.includes(searchTerm)
            );
        });

        elements.grid.replaceChildren();

        filteredCourses.forEach(course => {
            elements.grid.appendChild(createCourseCard(course));
        });

        elements.totalCourses.textContent = myCourses.length;

        const totalCredits = myCourses.reduce(
            (total, course) => total + (Number(course.credits) || 0),
            0
        );

        elements.totalCredits.textContent = totalCredits;

        elements.countLabel.textContent =
            `${myCourses.length} ${myCourses.length === 1 ? "course" : "courses"} added`;

        elements.emptyState.hidden = filteredCourses.length > 0;
        elements.grid.hidden = filteredCourses.length === 0;

        const emptyTitle = elements.emptyState.querySelector("h3");
        const emptyText = elements.emptyState.querySelector("p");
        const emptyButton = elements.emptyState.querySelector("button");

        if (myCourses.length === 0) {
            emptyTitle.textContent = "No courses yet";

            emptyText.textContent =
                "Add your first course to start organizing your studies.";

            emptyButton.hidden = false;
        } else if (filteredCourses.length === 0) {
            emptyTitle.textContent = "No matching courses";

            emptyText.textContent =
                "Try searching with a different course name, code, or instructor.";

            emptyButton.hidden = true;
        }
}

function handleCourseSubmit(event) {
        event.preventDefault();

        const id = elements.courseId.value;
        const name = elements.name.value.trim();
        const code = elements.code.value.trim().toUpperCase();
        const instructor = elements.instructor.value.trim();
        const credits = Number(elements.credits.value);
        const description = elements.description.value.trim();

        if (!name || !code) {
            showMessage(
                "Course name and course code are required.",
                "error"
            );
            return;
        }

        if (
            !Number.isInteger(credits) ||
            credits < 0 ||
            credits > 30
        ) {
            showMessage(
                "Credit hours must be a whole number between 0 and 30.",
                "error"
            );
            return;
        }

        const duplicateCode = getMyCourses().some(course =>
            String(course.code || "").toLowerCase() === code.toLowerCase() &&
            course.id !== id
        );

        if (duplicateCode) {
            showMessage(
                "You already have a course with this course code.",
                "error"
            );
            return;
        }

        if (id) {
            const courseIndex = allCourses.findIndex(course =>
                course &&
                course.id === id &&
                course.userId === session.userId
            );

            if (courseIndex === -1) {
                showMessage(
                    "This course could not be found.",
                    "error"
                );
                return;
            }

            const originalCourse = allCourses[courseIndex];

            allCourses[courseIndex] = {
                ...originalCourse,
                name,
                code,
                instructor,
                credits,
                description,
                updatedAt: new Date().toISOString()
            };

            if (!saveCourses()) {
                allCourses[courseIndex] = originalCourse;
                return;
            }

            closeForm();
            renderCourses();

            return;
        }

        const newCourse = {
            id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId: session.userId,
            name,
            code,
            instructor,
            credits,
            description,
            createdAt: new Date().toISOString()
        };

        allCourses.push(newCourse);

        if (!saveCourses()) {
            allCourses.pop();
            return;
        }

        closeForm();

        elements.search.value = "";

        renderCourses();
}

function handleCourseAction(event) {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const course = getMyCourses().find(
            item => item.id === button.dataset.id
        );

        if (!course) return;

        if (button.dataset.action === "edit") {
            openForm(course);
            return;
        }

        if (button.dataset.action === "delete") {
            const confirmed = window.confirm(
                `Are you sure you want to delete "${course.name}"?`
            );

            if (!confirmed) return;

            const originalCourses = allCourses;

            allCourses = allCourses.filter(
                item => !(
                    item &&
                    item.id === course.id &&
                    item.userId === session.userId
                )
            );

            if (!saveCourses()) {
                allCourses = originalCourses;
                return;
            }

            renderCourses();
        }
    }


    elements.addButton.addEventListener("click", () => openForm());
    elements.emptyAddButton.addEventListener("click", () => openForm());
    elements.closeButton.addEventListener("click", closeForm);
    elements.cancelButton.addEventListener("click", closeForm);
    elements.form.addEventListener("submit", handleCourseSubmit);
    elements.grid.addEventListener("click", handleCourseAction);
    elements.search.addEventListener("input", renderCourses);

    elements.logoutButton.addEventListener("click", () => {
        const confirmed = window.confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmed) return;

        StudyFlowStorage.clearSession();

        window.location.href = "login.html";
    });

    renderCourses();
});
