const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

// ✅ EMPTY TASKS ARRAY - ZERO ON START
let tasks = []; 

let categories = ['All', 'Study', 'Projects', 'Coding', 'Personal', 'Work'];

app.get('/', (req, res) => {
  const search = req.query.search || '';
  const categoryFilter = req.query.category || 'All';
  const priorityFilter = req.query.priority || 'All';
  
  let filteredTasks = tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || task.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  res.render('index', { 
    tasks: filteredTasks, 
    categories,
    search,
    categoryFilter,
    priorityFilter,
    stats: calculateStats(filteredTasks)
  });
});

// Baki routes same...
app.post('/add', (req, res) => {
  const { task, priority, category, dueDate } = req.body;
  tasks.unshift({
    id: uuidv4(),
    text: task,
    priority,
    category: category || 'Personal',
    dueDate: dueDate || '',
    completed: false,
    createdAt: new Date()
  });
  res.redirect('/');
});

app.post('/delete/:id', (req, res) => {
  tasks = tasks.filter(task => task.id !== req.params.id);
  res.redirect('/');
});

app.post('/toggle/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (task) task.completed = !task.completed;
  res.redirect('/');
});

app.get('/task/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.redirect('/');
  res.render('task-detail', { task, categories });
});

app.post('/edit/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (task) {
    task.text = req.body.task;
    task.priority = req.body.priority;
    task.category = req.body.category;
    task.dueDate = req.body.dueDate;
  }
  res.redirect(`/task/${req.params.id}`);
});

function calculateStats(tasks) {
  const total = tasks.length;
  const urgent = tasks.filter(t => t.priority === '1').length;
  const completed = tasks.filter(t => t.completed).length;
  const overdue = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
  ).length;
  return { total, urgent, completed, overdue };
}

app.listen(PORT, () => {
  console.log(`🚀 TaskFlow Pro running on http://localhost:${PORT}`);
});