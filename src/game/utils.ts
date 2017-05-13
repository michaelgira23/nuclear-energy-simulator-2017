export function numberWithCommas(num: number) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Opposite of communismize
export function capitalize(str: string) {
	return str[0].toUpperCase() + str.substr(1);
}
