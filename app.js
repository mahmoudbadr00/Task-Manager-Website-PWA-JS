let db;
let notificationTimeouts = {};

function openDatabase() {
  const request = indexedDB.open("NotificationDB", 1);
  request.onupgradeneeded = (event) => {
    db = event.target.result;
    db.createObjectStore("notifications", { keyPath: "title" });
  };
  request.onsuccess = (event) => {
    db = event.target.result;
    loadNotifications();
  };
}

function saveNotification(todoTitle, time) {
  const transaction = db.transaction(["notifications"], "readwrite");
  const store = transaction.objectStore("notifications");
  store.put({ title: todoTitle, time });
}

function loadNotifications() {
  const transaction = db.transaction(["notifications"], "readonly");
  const store = transaction.objectStore("notifications");
  store.getAll().onsuccess = (event) => {
    event.target.result.forEach(({ title, time }) => {
      displayNotification(title, time);
    });
  };
}

function deleteNotification(title) {
  clearTimeout(notificationTimeouts[title]);
  const transaction = db.transaction(["notifications"], "readwrite");
  transaction.objectStore("notifications").delete(title);
  document.querySelector(`[data-title="${title}"]`).remove();
}

function populateDropdowns() {
  for (let i = 0; i < 24; i++) {
    document.getElementById("hours").innerHTML += `<option>${i
      .toString()
      .padStart(2, "0")}</option>`;
  }
  for (let i = 0; i < 60; i++) {
    document.getElementById("minutes").innerHTML += `<option>${i
      .toString()
      .padStart(2, "0")}</option>`;
  }
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i <= currentYear + 10; i++) {
    document.getElementById("years").innerHTML += `<option>${i}</option>`;
  }
  for (let i = 1; i <= 12; i++) {
    document.getElementById("months").innerHTML += `<option>${i
      .toString()
      .padStart(2, "0")}</option>`;
  }
  updateDays();
  document.getElementById("years").addEventListener("change", updateDays);
  document.getElementById("months").addEventListener("change", updateDays);
}

function updateDays() {
  const year = document.getElementById("years").value;
  const month = document.getElementById("months").value;
  const daysInMonth = new Date(year, month, 0).getDate();
  document.getElementById("days").innerHTML = "";
  for (let i = 1; i <= daysInMonth; i++) {
    document.getElementById("days").innerHTML += `<option>${i
      .toString()
      .padStart(2, "0")}</option>`;
  }
}

function calculateDelay(year, month, day, hours, minutes) {
  const now = new Date();
  const targetTime = new Date(year, month - 1, day, hours, minutes);
  return targetTime - now;
}

function displayNotification(title, time) {
  const todoList = document.getElementById("todo-list");
  const todoItem = document.createElement("div");
  todoItem.setAttribute("data-title", title);
  todoItem.innerHTML = `
    <div>
      <span class="todo-text">${title} at ${time.hours}:${time.minutes} on ${time.day}/${time.month}/${time.year}</span>
      </div>
      <div>${time.description ? `<p class="todo-description">${time.description}</p>` : ""}</div>
    <div>
      <button style="margin-right: 5px;" class="done-btn">Done</button>
      <button class="delete-btn">Delete</button>
    </div>
  `;
  todoList.appendChild(todoItem);

  todoItem.querySelector(".done-btn").addEventListener("click", () => markAsDone(title));
  todoItem.querySelector(".delete-btn").addEventListener("click", () => deleteNotification(title));
}

function markAsDone(title) {
  const todoText = document.querySelector(`[data-title="${title}"] .todo-text`);
  todoText.classList.toggle("done");
}

function setNotification() {
  const todoTitle = document.getElementById("todo-title").value;
  const todoDescription = document.getElementById("description").value;
  if (!todoTitle) return alert("Please enter a task title.");
  
  const time = {
    hours: document.getElementById("hours").value,
    minutes: document.getElementById("minutes").value,
    year: document.getElementById("years").value,
    month: document.getElementById("months").value,
    day: document.getElementById("days").value,
  };
  
  const delay = calculateDelay(
    time.year,
    time.month,
    time.day,
    time.hours,
    time.minutes
  );
  
  if (delay < 0) return alert("Please select a future date.");
  if (delay < 1000) return alert("The task time is too close.");

  saveNotification(todoTitle, { ...time, description: todoDescription });
  displayNotification(todoTitle, { ...time, description: todoDescription });

  document.getElementById("todo-title").value = '';
  document.getElementById("description").value = '';
  document.getElementById("hours").value = '00';
  document.getElementById("minutes").value = '00';
  document.getElementById("years").value = new Date().getFullYear();
  document.getElementById("months").value = '01';
  document.getElementById("days").value = '01';

  notificationTimeouts[todoTitle] = setTimeout(() => {
    alert(`Time to do: ${todoTitle}`);
    document
      .querySelector(`[data-title="${todoTitle}"] .todo-text`)
      .classList.add("expired");
  }, delay);
}

openDatabase();
populateDropdowns();
