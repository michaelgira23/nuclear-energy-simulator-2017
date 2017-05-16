import uuid from 'uuid/v4';
import { Point } from './game';

export const cities: CityInterface[] = [
	// North City
	{
		topLeft: {
			x: 44,
			y: 18
		},
		dimensions: {
			x: 9,
			y: 12
		}
	},
	// East City
	{
		topLeft: {
			x: 58,
			y: 30
		},
		dimensions: {
			x: 9,
			y: 12
		}
	},
	// South City
	{
		topLeft: {
			x: 47,
			y: 74
		},
		dimensions: {
			x: 9,
			y: 12
		}
	},
	// West City
	{
		topLeft: {
			x: 26,
			y: 37
		},
		dimensions: {
			x: 12,
			y: 19
		}
	}
];

export class City {

	id = uuid();
	$elem: any;

	constructor(private game: any, public topLeft: Point, public dimensions: Point) {
		game.$view.append(`
			<div id="${this.id}" class="city"></div>
		`);

		this.$elem = this.game.$view.find(`.city#${this.id}`);

		this.$elem.css({
			left: `${topLeft.x}%`,
			top: `${topLeft.y}%`,
			width: `${dimensions.x}%`,
			height: `${dimensions.y}%`
		});
	}

}

interface CityInterface {
	topLeft: Point; // In percentages
	dimensions: Point; // In percentages
}
