const STORAGE_KEY = "taskflow.tasks.v1";
const taskForm = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const categoryInput = document.querySelector("#task-category");
const priorityInput = document.querySelector("#task-priority");
const dueInput = document.querySelector("#task-due");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const clearCompletedButton = document.querySelector("#clear-completed");
const filterButtons = [...document.querySelectorAll(".filter")];

let tasks = loadTasks();
let currentFilter = "all";
let searchTerm = "";

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeId() {
  return window.crypto?.randomUUID?.() || String(Date.now() + Math.random());
}

function dateLabel(value) {
  if (!value) return "No due date";
  return new Date(value + "T12:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  return new Date(task.dueDate + "T00:00:00") < today;
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const active = total - completed;
  const percent = total ? Math.round(completed / total * 100) : 0;
  document.querySelector("#all-count").textContent = total;
  document.querySelector("#active-count").textContent = active;
  document.querySelector("#completed-count").textContent = completed;
  document.querySelector("#stat-total").textContent = total;
  document.querySelector("#stat-active").textContent = active;
  document.querySelector("#stat-completed").textContent = completed;
  document.querySelector("#progress-value").textContent = percent + "%";
  document.querySelector("#progress-ring").style.background = `conic-gradient(#fff ${percent * 3.6}deg,#ffffff45 0deg)`;
  document.querySelector("#visible-count").textContent = getVisibleTasks().length;
  document.querySelector("#welcome-copy").textContent = total ? (percent === 100 ? "Everything is done. Enjoy the breathing room!" : `${active} task${active === 1 ? "" : "s"} left. Keep your momentum going.`) : "A clear plan makes a lighter day.";
}

function getVisibleTasks() {
  return tasks.filter(task => {
    const matchesFilter = currentFilter === "all" || (currentFilter === "active" && !task.completed) || (currentFilter === "completed" && task.completed);
    const matchesSearch = task.title.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  }).sort((a,b) => b.createdAt - a.createdAt);
}

function createTaskElement(task) {
  const item = document.createElement("article");
  item.className = "task-item" + (task.completed ? " completed" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label","Mark task complete");
  checkbox.addEventListener("change",() => {
    task.completed = checkbox.checked;
    saveTasks();
    render();
  });

  const info = document.createElement("div");
  info.className = "task-info";
  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;
  const meta = document.createElement("div");
  meta.className = "task-meta";

  const category = document.createElement("span");
  category.className = "category";
  category.textContent = task.category;
  const priority = document.createElement("span");
  priority.className = "priority " + task.priority;
  priority.textContent = task.priority + " priority";
  const due = document.createElement("span");
  due.className = "due" + (isOverdue(task) ? " overdue" : "");
  due.textContent = (isOverdue(task) ? "Overdue · " : "Due · ") + dateLabel(task.dueDate);
  meta.append(category,priority,due);
  info.append(title,meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "×";
  deleteButton.title = "Delete task";
  deleteButton.setAttribute("aria-label","Delete " + task.title);
  deleteButton.addEventListener("click",() => {
    tasks = tasks.filter(item => item.id !== task.id);
    saveTasks();
    render();
  });
  actions.append(deleteButton);
  item.append(checkbox,info,actions);
  return item;
}

function render() {
  const visible = getVisibleTasks();
  taskList.replaceChildren(...visible.map(createTaskElement));
  emptyState.hidden = visible.length > 0;
  if (!tasks.length) {
    emptyState.querySelector("h3").textContent = "Nothing on your list yet";
    emptyState.querySelector("p").textContent = "Add a task above and make a little progress today.";
  } else if (!visible.length) {
    emptyState.querySelector("h3").textContent = "No matching tasks";
    emptyState.querySelector("p").textContent = "Try another search or choose a different filter.";
  }
  document.querySelector("#list-label").textContent = ({all:"All tasks",active:"In progress",completed:"Completed"})[currentFilter];
  updateStats();
}

taskForm.addEventListener("submit",event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  tasks.push({
    id:makeId(),
    title,
    category:categoryInput.value,
    priority:priorityInput.value,
    dueDate:dueInput.value,
    completed:false,
    createdAt:Date.now()
  });
  saveTasks();
  taskForm.reset();
  categoryInput.value = "Personal";
  priorityInput.value = "Medium";
  titleInput.focus();
  render();
});

filterButtons.forEach(button => {
  button.addEventListener("click",() => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle("active",item === button));
    render();
  });
});

searchInput.addEventListener("input",() => {
  searchTerm = searchInput.value.trim().toLowerCase();
  render();
});

clearCompletedButton.addEventListener("click",() => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
});

document.querySelector("#today-date").textContent = new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
render();
