const todoCard = document.querySelector(".todo-card");
const checkBox = document.getElementById("completed");
const title = document.querySelector(".todo-title");
const description = document.querySelector(".todo-description");
const stat = document.querySelector(".stat");
const timeRemaining = document.querySelector(".time-remaining");
const editButton = document.querySelector(".edit");
const deleteButton = document.querySelector(".delete");
const dueDateText = document.querySelector(".due-date");
const priorityText = document.querySelector(
  "[data-testid='test-todo-priority']",
);
const priorityIndicator = document.querySelector(
  "[data-testid='test-todo-priority-indicator']",
);
const statusControl = document.querySelector(
  "[data-testid='test-todo-status-control']",
);
const statusButtons = document.querySelectorAll(".status-chip");
const expandToggle = document.querySelector(
  "[data-testid='test-todo-expand-toggle']",
);
const collapsibleSection = document.querySelector(
  "[data-testid='test-todo-collapsible-section']",
);
const overdueIndicator = document.querySelector(
  "[data-testid='test-todo-overdue-indicator']",
);

const editForm = document.querySelector("[data-testid='test-todo-edit-form']");
const editTitleInput = document.querySelector(
  "[data-testid='test-todo-edit-title-input']",
);
const editDescriptionInput = document.querySelector(
  "[data-testid='test-todo-edit-description-input']",
);
const editPrioritySelect = document.querySelector(
  "[data-testid='test-todo-edit-priority-select']",
);
const editDueDateInput = document.querySelector(
  "[data-testid='test-todo-edit-due-date-input']",
);
const cancelButton = document.querySelector(
  "[data-testid='test-todo-cancel-button']",
);
const saveButton = document.querySelector(
  "[data-testid='test-todo-save-button']",
);
const editModal = document.getElementById("edit-modal");
const editModalBackdrop = document.querySelector("[data-close-edit='true']");

const STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const DESCRIPTION_COLLAPSE_THRESHOLD = 140;
const TIME_REFRESH_MS = 30000;

let editSnapshot = null;
let dueDateIntervalId = null;

function getSelectedStatus() {
  const activeButton = statusControl.querySelector(".status-chip.is-active");
  return activeButton?.dataset.status || STATUS.PENDING;
}

function setSelectedStatus(status) {
  statusButtons.forEach((button) => {
    const isActive = button.dataset.status === status;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-checked", String(isActive));
  });
}

function formatTimeRemaining(dueDateString) {
  const dueDate = new Date(`${dueDateString}T23:59:59`);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const totalMinutes = Math.floor(absDiffMs / (1000 * 60));
  const totalHours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));

  if (diffMs > 0) {
    if (totalDays >= 2) {
      return `Due in ${totalDays} days`;
    }

    if (totalDays === 1) {
      return "Due tomorrow";
    }

    if (totalHours >= 1) {
      return `Due in ${totalHours} hours`;
    }

    return `Due in ${Math.max(totalMinutes, 1)} minutes`;
  }

  if (totalDays >= 1) {
    return `Overdue by ${totalDays} days`;
  }

  if (totalHours >= 1) {
    return `Overdue by ${totalHours} hours`;
  }

  return `Overdue by ${Math.max(totalMinutes, 1)} minutes`;
}

function getCurrentPriority() {
  return (priorityText?.textContent || "Medium").trim();
}

function getCurrentDueDateISO() {
  return dueDateText?.dateTime || new Date().toISOString().slice(0, 10);
}

function formatDateLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function applyPriorityStyles(priority) {
  todoCard.classList.remove("priority-low", "priority-medium", "priority-high");

  const normalized = priority.toLowerCase();
  if (normalized === "low") {
    todoCard.classList.add("priority-low");
    priorityIndicator.textContent = "Low Priority";
  } else if (normalized === "high") {
    todoCard.classList.add("priority-high");
    priorityIndicator.textContent = "High Priority";
  } else {
    todoCard.classList.add("priority-medium");
    priorityIndicator.textContent = "Medium Priority";
  }
}

function applyStatusState(status) {
  stat.textContent = status;
  setSelectedStatus(status);
  checkBox.checked = status === STATUS.DONE;

  todoCard.classList.toggle("is-completed", status === STATUS.DONE);
  todoCard.classList.toggle("is-in-progress", status === STATUS.IN_PROGRESS);
  todoCard.classList.toggle("is-pending", status === STATUS.PENDING);

  refreshTimeUI();
}

function refreshTimeUI() {
  if (!dueDateText || !timeRemaining) {
    return;
  }

  if (getSelectedStatus() === STATUS.DONE) {
    timeRemaining.textContent = "Completed";
    overdueIndicator.hidden = true;
    todoCard.classList.remove("is-overdue");
    stopDueDateUpdates();
    return;
  }

  const message = formatTimeRemaining(getCurrentDueDateISO());
  const isOverdue = message.toLowerCase().startsWith("overdue");

  timeRemaining.textContent = message;
  overdueIndicator.hidden = !isOverdue;
  overdueIndicator.textContent = isOverdue ? "Overdue" : "";
  todoCard.classList.toggle("is-overdue", isOverdue);

  startDueDateUpdates();
}

function stopDueDateUpdates() {
  if (dueDateIntervalId) {
    clearInterval(dueDateIntervalId);
    dueDateIntervalId = null;
  }
}

function startDueDateUpdates() {
  if (dueDateIntervalId) {
    return;
  }

  dueDateIntervalId = setInterval(() => {
    if (getSelectedStatus() !== STATUS.DONE) {
      refreshTimeUI();
    }
  }, TIME_REFRESH_MS);
}

function shouldCollapseDescription() {
  return description.textContent.trim().length > DESCRIPTION_COLLAPSE_THRESHOLD;
}

function setDescriptionCollapsed(collapsed) {
  if (!shouldCollapseDescription()) {
    collapsibleSection.classList.remove("is-collapsed");
    expandToggle.hidden = true;
    expandToggle.setAttribute("aria-expanded", "true");
    expandToggle.textContent = "Collapse details";
    return;
  }

  expandToggle.hidden = false;
  collapsibleSection.classList.toggle("is-collapsed", collapsed);
  expandToggle.setAttribute("aria-expanded", String(!collapsed));
  expandToggle.textContent = collapsed ? "Expand details" : "Collapse details";
}

function showEditForm() {
  editSnapshot = {
    title: title.textContent.trim(),
    description: description.textContent.trim(),
    priority: getCurrentPriority(),
    dueDate: getCurrentDueDateISO(),
  };

  editTitleInput.value = editSnapshot.title;
  editDescriptionInput.value = editSnapshot.description;
  editPrioritySelect.value = editSnapshot.priority;
  editDueDateInput.value = editSnapshot.dueDate;

  editModal.hidden = false;
  editModal.classList.add("is-open");
  document.body.classList.add("modal-open");
  editTitleInput.focus();
}

function hideEditForm() {
  editModal.classList.remove("is-open");
  editModal.hidden = true;
  document.body.classList.remove("modal-open");
  editButton.focus();
}

function saveEditFormChanges() {
  if (!editSnapshot) {
    return;
  }

  applyEditValues({
    title: editTitleInput.value.trim() || editSnapshot.title,
    description: editDescriptionInput.value.trim() || editSnapshot.description,
    priority: editPrioritySelect.value,
    dueDate: editDueDateInput.value || editSnapshot.dueDate,
  });

  hideEditForm();
}

function applyEditValues(values) {
  title.textContent = values.title;
  description.textContent = values.description;
  priorityText.textContent = values.priority;
  dueDateText.dateTime = values.dueDate;
  dueDateText.textContent = formatDateLabel(values.dueDate);

  applyPriorityStyles(values.priority);
  setDescriptionCollapsed(shouldCollapseDescription());
  refreshTimeUI();
}

function handleFormKeydown(event) {
  if (event.key !== "Tab" || editModal.hidden) {
    return;
  }

  const focusable = editForm.querySelectorAll(
    "input, textarea, select, button:not([disabled])",
  );

  if (!focusable.length) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

checkBox.addEventListener("change", () => {
  if (checkBox.checked) {
    applyStatusState(STATUS.DONE);
  } else if (getSelectedStatus() === STATUS.DONE) {
    applyStatusState(STATUS.PENDING);
  } else {
    applyStatusState(getSelectedStatus());
  }
});

statusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyStatusState(button.dataset.status);
  });
});

expandToggle.addEventListener("click", () => {
  const isCollapsed = collapsibleSection.classList.contains("is-collapsed");
  setDescriptionCollapsed(!isCollapsed);
});

editButton.addEventListener("click", () => {
  showEditForm();
});

if (editForm) {
  editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEditFormChanges();
  });

  editForm.addEventListener("keydown", handleFormKeydown);
}

if (saveButton) {
  saveButton.addEventListener("click", (event) => {
    event.preventDefault();
    saveEditFormChanges();
  });
}

if (cancelButton) {
  cancelButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (editSnapshot) {
      applyEditValues(editSnapshot);
    }
    hideEditForm();
  });
}

if (editModalBackdrop) {
  editModalBackdrop.addEventListener("click", () => {
    hideEditForm();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !editModal.hidden) {
    hideEditForm();
  }
});

if (dueDateText) {
  const existingDate = dueDateText.dateTime || dueDateText.textContent.trim();
  const safeDate = new Date(existingDate);

  if (!Number.isNaN(safeDate.getTime())) {
    const iso = safeDate.toISOString().slice(0, 10);
    dueDateText.dateTime = iso;
    dueDateText.textContent = formatDateLabel(iso);
  }
}

applyPriorityStyles(getCurrentPriority());
setDescriptionCollapsed(shouldCollapseDescription());
applyStatusState(STATUS.PENDING);

deleteButton.addEventListener("click", () => {
  alert("Delete clicked");
});
