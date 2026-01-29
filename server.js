const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Sample data file
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data
const initData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({
            tasks: [],
            categories: ['All', 'Coding', 'Study', 'Project', 'Meeting', 'Personal']
        }, null, 2));
    }
};

// Load data
const loadData = () => {
    initData();
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

// Save data
const saveData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Routes
app.get('/', (req, res) => {
    const data = loadData();
    let { search = '', category = 'All', priority = 'All' } = req.query;
    
    let tasks = data.tasks;
    
    // Search filter
    if (search) {
        tasks = tasks.filter(task => 
            task.text.toLowerCase().includes(search.toLowerCase()) ||
            task.category.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    // Category filter
    if (category !== 'All') {
        tasks = tasks.filter(task => task.category === category);
    }
    
    // Priority filter
    if (priority !== 'All') {
        tasks = tasks.filter(task => task.priority == priority);
    }
    
    // Stats
    const stats = {
        total: data.tasks.length,
        urgent: data.tasks.filter(t => t.priority == 1).length,
        completed: data.tasks.filter(t => t.completed).length,
        overdue: data.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length
    };
    
    res.render('index', { 
        tasks, 
        categories: data.categories, 
        stats, 
        search, 
        categoryFilter: category, 
        priorityFilter: priority 
    });
});

app.get('/task/:id', (req, res) => {
    const data = loadData();
    const task = data.tasks.find(t => t.id == req.params.id);
    res.render('task', { task });
});

app.post('/add', (req, res) => {
    const data = loadData();
    const newTask = {
        id: Date.now().toString(),
        text: req.body.task,
        priority: parseInt(req.body.priority),
        category: req.body.category || 'Personal',
        dueDate: req.body.dueDate || null,
        completed: false,
        createdAt: new Date().toISOString()
    };
    data.tasks.unshift(newTask);
    saveData(data);
    res.redirect(`/added`);
});

app.post('/toggle/:id', (req, res) => {
    const data = loadData();
    const task = data.tasks.find(t => t.id == req.params.id);
    if (task) {
        task.completed = !task.completed;
        saveData(data);
    }
    res.redirect('back');
});

app.delete('/delete/:id', (req, res) => {
    const data = loadData();
    data.tasks = data.tasks.filter(t => t.id != req.params.id);
    saveData(data);
    res.json({ success: true });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404');
});

// Vercel export (CRITICAL for deployment)
module.exports = app;