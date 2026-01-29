const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Simple in-memory storage
let tasks = [];
let categories = ['All', 'Coding', 'Study', 'Project', 'Meeting', 'Personal'];

app.get('/', (req, res) => {
    let { search = '', category = 'All', priority = 'All' } = req.query;
    
    let filteredTasks = tasks;
    
    // Filters
    if (search) {
        filteredTasks = filteredTasks.filter(task => 
            task.text.toLowerCase().includes(search.toLowerCase())
        );
    }
    if (category !== 'All') {
        filteredTasks = filteredTasks.filter(task => task.category === category);
    }
    if (priority !== 'All') {
        filteredTasks = filteredTasks.filter(task => task.priority.toString() === priority);
    }
    
    // Stats
    const stats = {
        total: tasks.length,
        urgent: tasks.filter(t => t.priority == 1).length,
        completed: tasks.filter(t => t.completed).length,
        overdue: tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length
    };
    
    res.render('index', { 
        tasks: filteredTasks, 
        categories, 
        stats, 
        search, 
        categoryFilter: category, 
        priorityFilter: priority 
    });
});

app.post('/add', (req, res) => {
    const newTask = {
        id: Date.now().toString(),  // NO UUID - timestamp ही काफी!
        text: req.body.task,
        priority: parseInt(req.body.priority),
        category: req.body.category || 'Personal',
        dueDate: req.body.dueDate || '',
        completed: false,
        createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    res.redirect(`/?added=1`);
});

app.post('/toggle/:id', (req, res) => {
    const task = tasks.find(t => t.id === req.params.id);
    if (task) {
        task.completed = !task.completed;
    }
    res.redirect('back');
});

app.get('/task/:id', (req, res) => {
    const task = tasks.find(t => t.id === req.params.id);
    res.render('task', { task: task || {} });
});

// 404
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// VERCEL के लिए CRITICAL!
module.exports = app;