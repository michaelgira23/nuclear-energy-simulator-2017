const port = 2100;

const express = require('express');
const app = express();

const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/', express.static(path.join(__dirname, 'public', 'images', 'favicon')));
app.use('/', express.static(path.join(__dirname, 'public')));

// Main page
app.get('/', (req, res) => {
	res.render('pages/index');
});

app.listen(port, () => console.log(`Server listening on *:${port}`));
