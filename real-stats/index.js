const cheerio = require('cheerio');
const request = require('request');

/*
 * Obligatory MLA 8 Works Cited
 *
 * "World Nuclear Power Plants in Operation." Nuclear Energy Institute,
 *     www.nei.org/Knowledge-Center/Nuclear-Statistics/World-Statistics/World-Nuclear-Power-Plants-in-Operation.
 *     Accessed 11 May 2017.
 */

const url = 'https://www.nei.org/Knowledge-Center/Excel-Files/World-Nuclear-Power-Plants-in-Operation';

request(url, (err, res, body) => {
	if (err) throw err;
	const $ = cheerio.load(body);
	const table = $('table.xl6513636');

	const reactors = [];

	table.find('tr').filter(function(index, element) {
		return Number($(this).attr('height')) === 18;
	})
		.each(function(index, element) {
			const td = $(this).find('td');
			const reactor = {
				country: td.eq(0).text(),
				name: td.eq(1).text(),
				type: td.eq(2).text(),
				capacity: Number(td.eq(3).text().replace(/,/g, '')),
				date: Number(td.eq(4).text().replace(/,/g, ''))
			};
			reactors.push(reactor);
		});

	let total = 0;

	let highestIndex = 0;
	let lowestIndex = 0;

	console.log(reactors[0]);

	for (let i = 0; i < reactors.length; i++) {
		const capacity = reactors[i].capacity;
		total += capacity;

		if (reactors[highestIndex].capacity < capacity) {
			highestIndex = i;
		}
		if (capacity < reactors[lowestIndex].capacity) {
			lowestIndex = i;
		}
	}

	const average = total / reactors.length;

	console.log(`
The biggest capacity was ${JSON.stringify(reactors[highestIndex])}
The smallest was ${JSON.stringify(reactors[lowestIndex])}
And with an average of ${average} MW
`);

});
