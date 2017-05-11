var boundaries = {
	padding: 25,
	range: 25
};

console.log(paper.view.viewSize);

var countryBorder = [];

// for(var i = 0; i < 4; i++) {
// 	// var
// }

function generateRandomPoint(rect) {
	var x = getRandomNumber(0, rect.width) + rect.x;
	var y = getRandomNumber(0, rect.height) + rect.y;
	return new Point(x, y);
}

// Random number from min (inclusive) to max (exclusive)
function getRandomNumber(min, max) {
	return Math.random() * (max - min) + min;
}
