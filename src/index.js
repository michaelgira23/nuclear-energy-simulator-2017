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

app.get('/win', (req, res) => {
	res.render('pages/end', {
		end: {
			title: 'Nuclear Energy Simulator 2017 - Winner!',
			exclamation: 'Good Job!',
			message: 'You\'ve avoided all the political, social, and economic challenges that come with adopting nuclear energy. Want to learn more?',
			link: '/essay'
		}
	});
});

app.get('/lose', (req, res) => {
	const reasons = {
		generic: {
			title: 'Nuclear Energy Simulator 2017 - Loser!',
			exclamation: 'Better luck next time!',
			message: 'Want to learn more about nuclear energy?',
			link: '/essay'
		},
		political: {
			title: 'Nuclear Energy Simulator 2017 - Loser!',
			exclamation: 'Uh oh!',
			message: 'You\'ve enriched your uranium over 90%. That\'s weapons-grade uranium! Other countries are getting worried and have placed sanctions preventing you from using nuclear technology. Want to learn more?',
			link: '/essay#political'
		},
		social: {
			title: 'Nuclear Energy Simulator 2017 - Loser!',
			exclamation: 'Is too much of a good thing a bad thing?',
			message: 'By building too many nuclear reactors too fast, people have stopped voting for you and you\'ve lost your funding! What to learn more?',
			link: '/essay#social'
		},
		economic: {
			title: 'Nuclear Energy Simulator 2017 - Loser!',
			exclamation: 'Times are getting rough, man.',
			message: 'You ran out of money! Who knew a nuclear reactor would be so expensive? Well actually, you would\'ve known if you read the essay. Want to learn more?',
			link: '/essay#economic'
		}
	};
	res.render('pages/end', { end: reasons[req.query.reason] || reasons.generic });
});

app.get('/essay', (req, res) => {
	res.render('pages/essay');
});

app.listen(port, () => console.log(`Server listening on *:${port}`));
