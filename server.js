const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 5600;
const DB_FILE = path.join(__dirname, "db.json");
const PUBLIC_FILES = {
  "/": "index.html",
  "/index.html": "index.html",
  "/styles.css": "styles.css",
  "/app.js": "app.js",
};

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function seedDatabase() {
  if (fs.existsSync(DB_FILE)) return;

  saveDb({
    users: [
      { id: "u1", name: "Admin User", email: "admin@example.com", passwordHash: hashPassword("admin123"), role: "Admin" },
      { id: "u2", name: "Member User", email: "member@example.com", passwordHash: hashPassword("member123"), role: "Member" },
    ],
    sessions: [],
    projects: [
      { id: "p1", name: "Website Redesign", description: "Update company website pages.", createdBy: "u1" },
      { id: "p2", name: "Mobile App", description: "Build basic screens and API integration.", createdBy: "u1" },
    ],
    tasks: [
      { id: "t1", projectId: "p1", title: "Create home page layout", assigneeId: "u2", dueDate: "2026-05-05", status: "In Progress" },
      { id: "t2", projectId: "p1", title: "Prepare content list", assigneeId: "u1", dueDate: "2026-04-20", status: "To Do" },
      { id: "t3", projectId: "p2", title: "Design login screen", assigneeId: "u2", dueDate: "2026-05-10", status: "Done" },
    ],
  });
}

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendFile(res, fileName) {
  const filePath = path.join(__dirname, fileName);
  const ext = path.extname(fileName);
  const type = ext === ".css" ? "text/css" : ext === ".js" ? "text/javascript" : "text/html";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function getAuthUser(req, db) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  return db.users.find((user) => user.id === session.userId) || null;
}

function requireFields(body, fields) {
  for (const field of fields) {
    if (!body[field] || String(body[field]).trim() === "") return `${field} is required`;
  }
  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(date)) && !Number.isNaN(Date.parse(date));
}

function isAdmin(user) {
  return user.role === "Admin";
}

function buildDashboard(db, user) {
  const visibleTasks = isAdmin(user) ? db.tasks : db.tasks.filter((task) => task.assigneeId === user.id);
  const today = new Date().toISOString().slice(0, 10);

  const tasks = visibleTasks.map((task) => {
    const project = db.projects.find((item) => item.id === task.projectId);
    const assignee = db.users.find((item) => item.id === task.assigneeId);
    return {
      ...task,
      projectName: project ? project.name : "Unknown",
      assigneeName: assignee ? assignee.name : "Unknown",
      isOverdue: task.status !== "Done" && task.dueDate < today,
    };
  });

  const projects = db.projects.map((project) => {
    const creator = db.users.find((item) => item.id === project.createdBy);
    return {
      ...project,
      createdByName: creator ? creator.name : "Unknown",
      taskCount: db.tasks.filter((task) => task.projectId === project.id).length,
    };
  });

  return {
    user: publicUser(user),
    users: db.users.map(publicUser),
    projects,
    tasks,
    stats: {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "To Do").length,
      inProgress: tasks.filter((task) => task.status === "In Progress").length,
      done: tasks.filter((task) => task.status === "Done").length,
      overdue: tasks.filter((task) => task.isOverdue).length,
    },
  };
}

async function handleApi(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, { status: "ok", app: "Team Task Manager" });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/signup") {
      const body = await parseBody(req);
      const missing = requireFields(body, ["name", "email", "password", "role"]);
      if (missing) return sendJson(res, 400, { error: missing });
      if (!isValidEmail(body.email)) return sendJson(res, 400, { error: "Valid email is required" });
      if (!["Admin", "Member"].includes(body.role)) return sendJson(res, 400, { error: "Invalid role" });
      if (String(body.password).length < 6) return sendJson(res, 400, { error: "Password must be at least 6 characters" });
      if (db.users.some((user) => user.email.toLowerCase() === body.email.toLowerCase())) {
        return sendJson(res, 409, { error: "Email already exists" });
      }

      const user = {
        id: `u${Date.now()}`,
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        passwordHash: hashPassword(body.password),
        role: body.role,
      };
      const token = createToken();
      db.users.push(user);
      db.sessions.push({ token, userId: user.id });
      saveDb(db);
      return sendJson(res, 201, { token, user: publicUser(user) });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await parseBody(req);
      const missing = requireFields(body, ["email", "password"]);
      if (missing) return sendJson(res, 400, { error: missing });
      if (!isValidEmail(body.email)) return sendJson(res, 400, { error: "Valid email is required" });
      const user = db.users.find((item) => item.email === body.email.trim().toLowerCase());
      if (!user || user.passwordHash !== hashPassword(body.password)) {
        return sendJson(res, 401, { error: "Invalid email or password" });
      }
      const token = createToken();
      db.sessions.push({ token, userId: user.id });
      saveDb(db);
      return sendJson(res, 200, { token, user: publicUser(user) });
    }

    const user = getAuthUser(req, db);
    if (!user) return sendJson(res, 401, { error: "Login required" });

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      db.sessions = db.sessions.filter((session) => session.token !== token);
      saveDb(db);
      return sendJson(res, 200, { message: "Logged out" });
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
      return sendJson(res, 200, { user: publicUser(user) });
    }

    if (req.method === "GET" && url.pathname === "/api/dashboard") {
      return sendJson(res, 200, buildDashboard(db, user));
    }

    if (req.method === "POST" && url.pathname === "/api/projects") {
      if (!isAdmin(user)) return sendJson(res, 403, { error: "Admin role required" });
      const body = await parseBody(req);
      const missing = requireFields(body, ["name"]);
      if (missing) return sendJson(res, 400, { error: missing });
      db.projects.push({
        id: `p${Date.now()}`,
        name: body.name.trim(),
        description: String(body.description || "").trim(),
        createdBy: user.id,
      });
      saveDb(db);
      return sendJson(res, 201, { message: "Project created" });
    }

    if (req.method === "POST" && url.pathname === "/api/tasks") {
      if (!isAdmin(user)) return sendJson(res, 403, { error: "Admin role required" });
      const body = await parseBody(req);
      const missing = requireFields(body, ["projectId", "title", "assigneeId", "dueDate", "status"]);
      if (missing) return sendJson(res, 400, { error: missing });
      if (!db.projects.some((project) => project.id === body.projectId)) return sendJson(res, 400, { error: "Invalid project" });
      if (!db.users.some((item) => item.id === body.assigneeId)) return sendJson(res, 400, { error: "Invalid assignee" });
      if (!isValidDate(body.dueDate)) return sendJson(res, 400, { error: "Valid due date is required" });
      if (!["To Do", "In Progress", "Done"].includes(body.status)) return sendJson(res, 400, { error: "Invalid status" });
      db.tasks.push({
        id: `t${Date.now()}`,
        projectId: body.projectId,
        title: body.title.trim(),
        assigneeId: body.assigneeId,
        dueDate: body.dueDate,
        status: body.status,
      });
      saveDb(db);
      return sendJson(res, 201, { message: "Task created" });
    }

    const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (req.method === "PATCH" && taskMatch) {
      const body = await parseBody(req);
      const task = db.tasks.find((item) => item.id === taskMatch[1]);
      if (!task) return sendJson(res, 404, { error: "Task not found" });
      if (!isAdmin(user) && task.assigneeId !== user.id) return sendJson(res, 403, { error: "You can update only your assigned tasks" });
      if (!["To Do", "In Progress", "Done"].includes(body.status)) return sendJson(res, 400, { error: "Invalid status" });
      task.status = body.status;
      saveDb(db);
      return sendJson(res, 200, { message: "Task updated" });
    }

    return sendJson(res, 404, { error: "API route not found" });
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
}

seedDatabase();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }

  if (PUBLIC_FILES[url.pathname]) {
    sendFile(res, PUBLIC_FILES[url.pathname]);
    return;
  }

  sendFile(res, "index.html");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Team Task Manager running at http://localhost:${PORT}`);
});
