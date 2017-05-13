// Opposite of communismize
export function capitalize(str: string) {
	return str[0].toUpperCase() + str.substr(1);
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
