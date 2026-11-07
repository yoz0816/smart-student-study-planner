# StudyFlow – Smart Student Study Planner

**StudyFlow** is a web-based student study planner designed to help students organize their academic activities, manage coursework, plan study sessions, track learning progress, and stay on top of important deadlines.

The application provides a centralized dashboard where students can manage their academic responsibilities through a simple, modern, and responsive interface. It also includes an administrator dashboard for managing student accounts and viewing platform statistics.

---

## 1. Project Overview

Students often struggle to organize their courses, assignments, study schedules, and academic deadlines across different platforms or tools.

StudyFlow addresses this problem by bringing essential academic planning features together in one application.

The system provides two main roles:

- **Student:** Manages courses, tasks, study schedules, reminders, and academic progress.
- **Administrator:** Monitors platform activity, views registered students, searches student accounts, and manages account status.

---

## 2. Main Features

### Student Features

- **Dashboard:** View an overview of academic activities and important statistics.
- **Course Management:** Add and manage personal courses.
- **Task Management:** Create, update, delete, search, and filter academic tasks.
- **Study Schedule:** Organize study sessions by date and time, track their status, and prevent overlapping planned sessions.
- **Progress Tracking:** Monitor task completion, course progress, and study activity.
- **Reminders:** Create, update, delete, search, and manage important academic reminders.
- **User Authentication:** Register a student account, log in, and log out.

### Administrator Features

- **Administrator Dashboard:** View overall platform statistics.
- **Student Management:** View registered student accounts.
- **Student Search:** Search students using their names or email addresses.
- **Account Management:** Activate or deactivate student accounts.
- **Recent Registrations:** View recently registered students.
- **Platform Overview:** Monitor student, course, task, and study session statistics.

---

## 3. Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling, layouts, and responsive design |
| JavaScript | Application functionality and interactions |
| LocalStorage | Browser-based data persistence |
| Python HTTP Server | Local development server |

The project uses **Vanilla JavaScript** without frontend frameworks or external JavaScript libraries.

---

## 4. Project Structure

```text
smart-student-study-planner/
│
├── assets/
│   ├── images/
│   └── icons/
│
├── css/
│   ├── style.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── storage.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── courses.js
│   ├── tasks.js
│   ├── schedule.js
│   ├── progress.js
│   ├── reminders.js
│   └── admin.js
│
├── pages/
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── courses.html
│   ├── tasks.html
│   ├── schedule.html
│   ├── progress.html
│   ├── reminders.html
│   └── admin-dashboard.html
│
├── README.md
└── index.html
```

---

## 5. Installation and Setup

### Prerequisites

You need:

- A computer with a modern web browser.
- Python 3 installed.
- A code editor such as Visual Studio Code.

No Node.js, npm, database server, or backend framework is required.

### Step 1: Get the Project

Download or clone the project repository.

If you already have the project locally, open its directory:

```bash
cd ~/Documents/smart-student-study-planner
```

### Step 2: Start the Local Server

Run:

```bash
python3 -m http.server 5500
```

### Step 3: Open the Application

Open your browser and visit:

```text
http://localhost:5500
```

The StudyFlow landing page should appear.

To stop the server, press:

```text
Ctrl + C
```

---

## 6. How to Use the Application

### Student Access

1. Open the application.
2. Navigate to the registration page.
3. Create a student account.
4. Log in using your registered email and password.
5. Open the student dashboard.
6. Start managing your courses, tasks, study sessions, reminders, and progress.

### Administrator Access

The application automatically initializes a default administrator account when the login page loads if an administrator account does not already exist.

**Default administrator credentials:**

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin1234` |

Log in using these credentials to access the Administrator Dashboard.

**Important:** These are demonstration credentials. Change or remove the default administrator setup before any real deployment.

---

## 7. Data Storage

StudyFlow uses the browser's LocalStorage API to store application data.

The application maintains separate data records for different users using their account identifiers.

Main LocalStorage keys include:

| Key | Description |
|---|---|
| `studyflow_users` | Registered student and administrator accounts |
| `studyflow_session` | Current login session |
| `studyflow_courses` | Course records |
| `studyflow_tasks` | Academic task records |
| `studyflow_schedule` | Study session records |
| `studyflow_reminders` | Reminder records |

Data remains stored in the browser until it is cleared or removed.

**Important limitations:**

- Data is stored locally in the browser.
- Data does not automatically synchronize between devices.
- Clearing browser data may remove stored application records.
- The application does not use a centralized database.

---

## 8. Security Considerations

StudyFlow is an academic frontend prototype developed for educational purposes.

Its authentication system is implemented using JavaScript and LocalStorage.

It is not suitable for production authentication because:

- Passwords are stored in browser LocalStorage.
- Client-side authentication can be bypassed.
- Administrator access is simulated in the frontend.
- There is no server-side authorization or centralized access control.

A production version should use a secure backend, password hashing, server-side authentication, database storage, and proper authorization.

Do not use real or sensitive passwords with this demonstration application.

---

## 9. Future Improvements

Possible future enhancements include:

- Backend integration using Python and FastAPI.
- MySQL database integration.
- Secure authentication and authorization.
- Cloud-based data synchronization.
- Email and push notifications.
- Calendar integration.
- Advanced academic analytics.
- Mobile application support.
- Exporting academic schedules and progress reports.

---

## 10. Project Purpose

StudyFlow was developed as a Web Programming academic project to demonstrate practical application of:

- HTML page structuring.
- CSS styling and responsive web design.
- JavaScript programming and DOM manipulation.
- Event handling and form validation.
- Browser LocalStorage.
- CRUD operations.
- User interface design.
- Role-based application workflows.

---

## 11. Conclusion

StudyFlow provides students with a centralized environment for organizing their academic activities and monitoring their learning progress.

By combining course management, task tracking, study scheduling, reminders, and progress monitoring, the application aims to make academic planning more organized and manageable.

**StudyFlow – Plan Smarter. Study Better. Achieve More.**