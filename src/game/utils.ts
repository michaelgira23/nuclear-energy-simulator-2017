import { Point, Rect } from './game';

// Opposite of communismize
export function capitalize(str: string) {
	return str[0].toUpperCase() + str.substr(1);
}

// Use Pythagorean Theorem
export function getDistance(a: Point, b: Point) {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Get random integer between min and max (inclusive)
export function getRandomIntInclusive(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check if element within array
export function includes(haystack: any[], needle: any) {
	return haystack.indexOf(needle) > -1;
}

// Add a '0' to the beginning of a number if it takes less than the required length
export function leadingZeros(num: number, places = 2) {
	let str = num.toString();
	while (str.length < places) {
		str = '0' + str;
	}
	return str;
}

// Return number with commas every thousands place
export function numberWithCommas(num: number) {
	const parts = num.toString().split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return parts.join('.');
}

// Get sign for number. ('+', '-', or '' if 0)
export function numberSign(num: number) {
	switch (Math.sign(num)) {
		case 1:
			return '+';
		case -1:
			return '-';
		default:
			return '';
	}
}

// Accepts a rectangle like one from getBoundingClientRect (with `left`, `top`, `width`, and `height`) and determines if point is within it
export function pointWithinRect(rect: Rect, point: Point) {
	// Check within X
	return (rect.left <= point.x && point.x <= (rect.left + rect.width))
		// Check within Y
		&& (rect.top <= point.y && point.y <= (rect.top + rect.height));
}

// Round a number to a certain amount of decimal pounts
export function round(num: number, precision = 2) {
	const factor = Math.pow(10, precision);
	const tempNumber = num * factor;
	const roundedTempNumber = Math.round(tempNumber);
	return roundedTempNumber / factor;
}
