// Task Manager Pro JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const taskInput = document.getElementById('task-input');
  const taskPriority = document.getElementById('task-priority');
  const addTaskBtn = document.getElementById('add-task-btn');
  const todoTasks = document.getElementById('todo-tasks');
  const inProgressTasks = document.getElementById('in-progress-tasks');
  const completedTasks = document.getElementById('completed-tasks');
  const todoCount = document.getElementById('todo-count');
  const inProgressCount = document.getElementById('in-progress-count');
  const completedCount = document.getElementById('completed-count');
  const editTaskModal = document.getElementById('edit-task-modal');
  const closeModal = document.querySelector('.close-modal');
  const editTaskInput = document.getElementById('edit-task-input');
  const editTaskPriority = document.getElementById('edit-task-priority');
  const saveTaskBtn = document.getElementById('save-task-btn');

  // Task Lists
  const taskLists = document.querySelectorAll('.task-list');
  
  // Task Data Storage
  let tasks = JSON.parse(localStorage.getItem('taskManagerPro')) || {
    todo: [],
    inProgress: [],
    completed: []
  };
  
  // Current task being edited
  let currentEditingTask = null;

  // Initialize the app
  function init() {
    // Load saved tasks
    loadTasks();
    
    // Event listeners
    addTaskBtn.addEventListener('click', addNewTask);
    taskInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addNewTask();
      }
    });
    
    saveTaskBtn.addEventListener('click', saveEditedTask);
    closeModal.addEventListener('click', closeEditModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
      if (e.target === editTaskModal) {
        closeEditModal();
      }
    });
    
    // Setup Drag and Drop
    setupDragAndDrop();
  }
  
  // Load tasks from storage
  function loadTasks() {
    // Clear all task lists
    todoTasks.innerHTML = '';
    inProgressTasks.innerHTML = '';
    completedTasks.innerHTML = '';
    
    // Load todo tasks
    tasks.todo.forEach(task => {
      createTaskElement(task, todoTasks);
    });
    
    // Load in progress tasks
    tasks.inProgress.forEach(task => {
      createTaskElement(task, inProgressTasks);
    });
    
    // Load completed tasks
    tasks.completed.forEach(task => {
      createTaskElement(task, completedTasks);
    });
    
    // Update counters
    updateTaskCounts();
  }
  
  // Create a task element
  function createTaskElement(task, container) {
    const taskItem = document.createElement('div');
    taskItem.classList.add('task-item', `${task.priority}-priority`);
    taskItem.dataset.taskId = task.id;
    taskItem.draggable = true;
    
    const taskContent = document.createElement('div');
    taskContent.textContent = task.text;
    
    const taskActions = document.createElement('div');
    taskActions.classList.add('task-actions');
    
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn');
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.addEventListener('click', () => openEditModal(task));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', () => deleteTask(task.id, container.id));
    
    taskActions.appendChild(editBtn);
    taskActions.appendChild(deleteBtn);
    
    taskItem.appendChild(taskContent);
    taskItem.appendChild(taskActions);
    
    container.appendChild(taskItem);
    
    // Add insertion animation
    setTimeout(() => {
      taskItem.classList.add('inserted');
    }, 10);
    
    // Setup drag events for the task
    setupTaskDragEvents(taskItem);
  }
  
  // Add a new task
  function addNewTask() {
    const text = taskInput.value.trim();
    const priority = taskPriority.value;
    
    if (text === '') {
      shake(taskInput);
      return;
    }
    
    const task = {
      id: Date.now().toString(),
      text: text,
      priority: priority,
      createdAt: new Date().toISOString()
    };
    
    // Add to task list and update storage
    tasks.todo.push(task);
    saveTasksToStorage();
    
    // Create task element
    createTaskElement(task, todoTasks);
    
    // Clear input field
    taskInput.value = '';
    
    // Update counters
    updateTaskCounts();
  }
  
  // Delete a task
  function deleteTask(taskId, containerId) {
    let listName;
    
    switch (containerId) {
      case 'todo-tasks':
        listName = 'todo';
        break;
      case 'in-progress-tasks':
        listName = 'inProgress';
        break;
      case 'completed-tasks':
        listName = 'completed';
        break;
    }
    
    // Remove task from array
    tasks[listName] = tasks[listName].filter(task => task.id !== taskId);
    
    // Update storage
    saveTasksToStorage();
    
    // Remove element from DOM with animation
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    taskElement.style.opacity = '0';
    taskElement.style.transform = 'translateX(30px)';
    taskElement.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
      taskElement.remove();
      updateTaskCounts();
    }, 300);
  }
  
  // Open edit modal
  function openEditModal(task) {
    currentEditingTask = task;
    editTaskInput.value = task.text;
    editTaskPriority.value = task.priority;
    editTaskModal.style.display = 'block';
  }
  
  // Save edited task
  function saveEditedTask() {
    if (!currentEditingTask) return;
    
    // Find task in arrays
    let found = false;
    
    for (const listName of ['todo', 'inProgress', 'completed']) {
      const taskIndex = tasks[listName].findIndex(task => task.id === currentEditingTask.id);
      
      if (taskIndex !== -1) {
        // Update task
        tasks[listName][taskIndex].text = editTaskInput.value.trim();
        tasks[listName][taskIndex].priority = editTaskPriority.value;
        found = true;
        break;
      }
    }
    
    if (found) {
      // Update storage
      saveTasksToStorage();
      
      // Update task element
      const taskElement = document.querySelector(`[data-task-id="${currentEditingTask.id}"]`);
      taskElement.querySelector('div').textContent = editTaskInput.value.trim();
      
      // Update priority class
      taskElement.classList.remove('low-priority', 'medium-priority', 'high-priority');
      taskElement.classList.add(`${editTaskPriority.value}-priority`);
      
      // Close modal
      closeEditModal();
      
      // Show feedback
      showFeedback('Task updated successfully!');
    }
  }
  
  // Close edit modal
  function closeEditModal() {
    editTaskModal.style.display = 'none';
    currentEditingTask = null;
  }
  
  // Setup drag and drop functionality
  function setupDragAndDrop() {
    taskLists.forEach(container => {
      container.addEventListener('dragover', handleDragOver);
      container.addEventListener('dragleave', handleDragLeave);
      container.addEventListener('drop', handleDrop);
    });
  }
  
  // Setup drag events for a task
  function setupTaskDragEvents(taskElement) {
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);
  }
  
  // Handle drag start event
  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    e.target.classList.add('dragging');
    
    // For better drag image on some browsers
    setTimeout(() => {
      e.target.style.opacity = '0.4';
    }, 0);
  }
  
  // Handle drag end event
  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    e.target.style.opacity = '1';
  }
  
  // Handle drag over event
  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }
  
  // Handle drag leave event
  function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }
  
  // Handle drop event
  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const taskId = e.dataTransfer.getData('text/plain');
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    
    if (!taskElement) return;
    
    // Determine source and target containers
    const sourceContainerId = taskElement.parentElement.id;
    const targetContainerId = e.currentTarget.id;
    
    // No need to move if source and target are the same
    if (sourceContainerId === targetContainerId) return;
    
    // Find task in source array
    let sourceListName;
    let targetListName;
    
    switch (sourceContainerId) {
      case 'todo-tasks':
        sourceListName = 'todo';
        break;
      case 'in-progress-tasks':
        sourceListName = 'inProgress';
        break;
      case 'completed-tasks':
        sourceListName = 'completed';
        break;
    }
    
    switch (targetContainerId) {
      case 'todo-tasks':
        targetListName = 'todo';
        break;
      case 'in-progress-tasks':
        targetListName = 'inProgress';
        break;
      case 'completed-tasks':
        targetListName = 'completed';
        break;
    }
    
    // Find the task in the source list
    const taskIndex = tasks[sourceListName].findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) return;
    
    // Get the task and remove from source list
    const task = tasks[sourceListName].splice(taskIndex, 1)[0];
    
    // Add to target list
    tasks[targetListName].push(task);
    
    // Save changes
    saveTasksToStorage();
    
    // Move task element to target container
    e.currentTarget.appendChild(taskElement);
    
    // Update counters
    updateTaskCounts();
    
    // Show feedback
    showFeedback(`Task moved to ${targetListName.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
  }
  
  // Save tasks to local storage
  function saveTasksToStorage() {
    localStorage.setItem('taskManagerPro', JSON.stringify(tasks));
  }
  
  // Update task counts
  function updateTaskCounts() {
    todoCount.textContent = tasks.todo.length;
    inProgressCount.textContent = tasks.inProgress.length;
    completedCount.textContent = tasks.completed.length;
  }
  
  // Show feedback message
  function showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.classList.add('feedback');
    feedback.textContent = message;
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.right = '20px';
    feedback.style.backgroundColor = '#2ecc71';
    feedback.style.color = 'white';
    feedback.style.padding = '10px 20px';
    feedback.style.borderRadius = '4px';
    feedback.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    feedback.style.opacity = '0';
    feedback.style.transform = 'translateY(10px)';
    feedback.style.transition = 'all 0.3s ease-in-out';
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.style.opacity = '1';
      feedback.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translateY(10px)';
      setTimeout(() => {
        feedback.remove();
      }, 300);
    }, 3000);
  }
  
  // Shake animation for validation feedback
  function shake(element) {
    element.style.border = '1px solid #e74c3c';
    element.style.animation = 'shake 0.5s';
    
    element.addEventListener('animationend', function() {
      element.style.animation = '';
    });
    
    // Add CSS if not already present
    if (!document.querySelector('#shake-animation')) {
      const style = document.createElement('style');
      style.id = 'shake-animation';
      style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      element.style.border = '1px solid #ddd';
    }, 1000);
  }
  
  // Initialize
  init();
});