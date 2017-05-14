const port = 2100;

const express = require('express');
const app = express();

const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/', express.static(path.join(__dirname, 'public', 'images', 'favicon')));
app.use('/', express.static(path.join(__dirname, 'public')));

// Main pages
app.get('/', (req, res) => {
	res.render('pages/main');
});

app.get('/play', (req, res) => {
	res.render('pages/play');
});

app.listen(port, () => console.log(`Server listening on *:${port}`));
