// Opposite of communismize
export function capitalize(str: string) {
	return str[0].toUpperCase() + str.substr(1);
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
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

// Round a number to a certain amount of decimal pounts
export function round(num: number, precision = 2) {
	const factor = Math.pow(10, precision);
	const tempNumber = num * factor;
	const roundedTempNumber = Math.round(tempNumber);
	return roundedTempNumber / factor;
}
