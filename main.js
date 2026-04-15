// const todoCard = document.querySelector('.todo-card');
// const completedToggle = document.querySelector('#completed-toggle');
// const statusTag = document.querySelector('.status .tag');

// if (todoCard && completedToggle && statusTag) {
// 	const syncCompletedState = () => {
// 		const isCompleted = completedToggle.checked;

// 		todoCard.classList.toggle('is-completed', isCompleted);
// 		statusTag.textContent = isCompleted ? 'Completed' : 'Pending';
// 	};

// 	completedToggle.addEventListener('change', syncCompletedState);
// 	syncCompletedState();
// }

const todoCard = document.querySelector(".todo-card");
const checkBox = document.getElementById("completed");
const title = document.querySelector(".todo-title");
const description = document.querySelector(".todo-description");
const stat = document.querySelector(".stat");
const timeRemaining = document.querySelector(".time-remaining");
const editButton = document.querySelector(".edit");
const deleteButton = document.querySelector(".delete");
const dueDateText = document.querySelector(".due-date");

function formatTimeRemaining(dueDateString) {
  const dueDate = new Date(dueDateString);
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

function syncCompletedState() {
  const isCompleted = checkBox.checked;

  todoCard.classList.toggle("is-completed", isCompleted);
  title.style.textDecoration = isCompleted ? "line-through" : "none";
  description.style.textDecoration = isCompleted ? "line-through" : "none";
  stat.textContent = isCompleted ? "Done" : "Pending";
}

if (dueDateText && timeRemaining) {
  timeRemaining.textContent = formatTimeRemaining(
    dueDateText.textContent.trim(),
  );
}

checkBox.addEventListener("change", syncCompletedState);
syncCompletedState();

editButton.addEventListener("click", () => {
  console.log("edit clicked");
});

deleteButton.addEventListener("click", () => {
  alert("Delete clicked");
});
