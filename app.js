let token = localStorage.getItem("token");
let currentUser = null;
let projects = [];
let tasks = [];
let users = [];

const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const projectForm = document.getElementById("project-form");
const taskForm = document.getElementById("task-form");

function api(path, options = {}) {
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  });
}

function showMessage(form, message) {
  let box = form.querySelector(".message");
  if (!box) {
    box = document.createElement("p");
    box.className = "message";
    form.appendChild(box);
  }
  box.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
      }),
    });
    token = data.token;
    localStorage.setItem("token", token);
    await loadApp();
  } catch (error) {
    showMessage(loginForm, error.message);
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("signup-name").value,
        email: document.getElementById("signup-email").value,
        password: document.getElementById("signup-password").value,
        role: document.getElementById("signup-role").value,
      }),
    });
    token = data.token;
    localStorage.setItem("token", token);
    await loadApp();
  } catch (error) {
    showMessage(signupForm, error.message);
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  api("/auth/logout", { method: "POST" }).catch(() => {});
  localStorage.removeItem("token");
  token = null;
  currentUser = null;
  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/projects", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("project-name").value,
        description: document.getElementById("project-description").value,
      }),
    });
    projectForm.reset();
    await loadData();
  } catch (error) {
    showMessage(projectForm, error.message);
  }
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/tasks", {
      method: "POST",
      body: JSON.stringify({
        projectId: document.getElementById("task-project").value,
        title: document.getElementById("task-title").value,
        assigneeId: document.getElementById("task-assignee").value,
        dueDate: document.getElementById("task-due-date").value,
        status: document.getElementById("task-status").value,
      }),
    });
    taskForm.reset();
    await loadData();
  } catch (error) {
    showMessage(taskForm, error.message);
  }
});

async function loadApp() {
  try {
    const profile = await api("/me");
    currentUser = profile.user;
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    document.getElementById("welcome-title").textContent = `Welcome, ${currentUser.name}`;
    document.getElementById("role-text").textContent = `Role: ${currentUser.role}`;
    document.querySelectorAll(".admin-only").forEach((element) => {
      element.classList.toggle("hidden", currentUser.role !== "Admin");
    });
    await loadData();
  } catch {
    localStorage.removeItem("token");
    token = null;
  }
}

async function loadData() {
  const data = await api("/dashboard");
  projects = data.projects;
  tasks = data.tasks;
  users = data.users;
  renderDashboard(data.stats);
  renderProjects();
  renderTasks();
  renderFormOptions();
}

function renderDashboard(stats) {
  document.getElementById("total-tasks").textContent = stats.total;
  document.getElementById("todo-tasks").textContent = stats.todo;
  document.getElementById("progress-tasks").textContent = stats.inProgress;
  document.getElementById("done-tasks").textContent = stats.done;
  document.getElementById("overdue-tasks").textContent = stats.overdue;
}

function renderProjects() {
  const list = document.getElementById("project-list");
  list.innerHTML = projects.map((project) => `
    <article class="item">
      <div class="item-row">
        <strong>${escapeHtml(project.name)}</strong>
        <span class="badge">${project.taskCount} tasks</span>
      </div>
      <p class="muted">${escapeHtml(project.description || "No description")}</p>
      <small>Created by ${escapeHtml(project.createdByName)}</small>
    </article>
  `).join("");
}

function renderTasks() {
  const list = document.getElementById("task-list");
  list.innerHTML = tasks.map((task) => {
    const overdue = task.isOverdue ? '<span class="badge overdue">Overdue</span>' : "";
    const statusControl = currentUser.role === "Admin" || task.assigneeId === currentUser.id
      ? `<select class="status-select" data-task-id="${escapeHtml(task.id)}">
          <option ${task.status === "To Do" ? "selected" : ""}>To Do</option>
          <option ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option ${task.status === "Done" ? "selected" : ""}>Done</option>
        </select>`
      : `<span class="badge">${escapeHtml(task.status)}</span>`;

    return `
      <article class="item">
        <div class="item-row">
          <strong>${escapeHtml(task.title)}</strong>
          ${overdue}
        </div>
        <p class="muted">Project: ${escapeHtml(task.projectName)}</p>
        <p class="muted">Assigned to: ${escapeHtml(task.assigneeName)} | Due: ${escapeHtml(task.dueDate)}</p>
        <div>${statusControl}</div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async () => {
      await api(`/tasks/${select.dataset.taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: select.value }),
      });
      await loadData();
    });
  });
}

function renderFormOptions() {
  document.getElementById("task-project").innerHTML = projects
    .map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}</option>`)
    .join("");

  document.getElementById("task-assignee").innerHTML = users
    .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} (${escapeHtml(user.role)})</option>`)
    .join("");
}

if (token) {
  loadApp();
}
