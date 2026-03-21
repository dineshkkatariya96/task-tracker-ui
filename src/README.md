# Task Tracker UI

An Angular frontend for the Employee Task Tracker system with separate Admin and Employee dashboards.

## Technologies
- Angular 17
- Angular Material UI
- TypeScript
- SCSS
- JWT Authentication
- HTTP Interceptors

## Features
- Login and Register pages
- JWT token based authentication
- Route guards for protected pages
- Admin Dashboard:
  - View all tasks
  - Create / Edit / Delete tasks
  - Assign tasks to employees
  - Filter tasks by employee
  - View overdue tasks
  - Task stats overview
- Employee Dashboard:
  - View assigned tasks
  - Update task status
  - View overdue tasks
  - Task completion stats

## Setup Instructions

### Prerequisites
- Node.js 18+
- Angular CLI
- task-tracker-api running on port 8080

### Steps
1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Start the development server:
```
ng serve
```
4. Open browser at `http://localhost:4200`

## Default Credentials
```
Admin    : admin@tasktracker.com / admin123
Employee : register at /register
```

## Project Structure
```
src/app/
├── components/
│   ├── admin/
│   │   ├── dashboard/    ← Admin panel
│   │   └── task-form/    ← Create/Edit task dialog
│   ├── employee/
│   │   └── dashboard/    ← Employee panel
│   ├── login/            ← Login page
│   └── register/         ← Register page
├── guards/               ← Auth route guard
├── interceptors/         ← JWT interceptor
├── models/               ← TypeScript interfaces
└── services/             ← API services
```

## Backend Repository
https://github.com/dineshkkatariya96/task-tracker-api
