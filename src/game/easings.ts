/**
 * Easing Functions
 * x is the fraction of the animation progress, in the range 0..1
 */

const pow = Math.pow;
const sqrt = Math.sqrt;
const sin = Math.sin;
const cos = Math.cos;
const PI = Math.PI;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = ( 2 * PI ) / 3;
const c5 = ( 2 * PI ) / 4.5;

export function easeInBack(x: number) {
	return c3 * x * x * x - c1 * x * x;
}

// export function easeInExpo(x: number) {
// 	return x === 0 ? 0 : pow( 2, 10 * x - 10 );
// }

export function easeInOutQuart(x: number) {
	return x < 0.5 ?
		8 * x * x * x * x :
		1 - pow(-2 * x + 2, 4) / 2;
}
