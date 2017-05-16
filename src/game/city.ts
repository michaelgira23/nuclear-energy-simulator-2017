import uuid from 'uuid/v4';
import { Point } from './game';

export const cities: CityInterface[] = [
	// North City
	{
		topLeft: {
			x: 41,
			y: 19
		},
		dimensions: {
			x: 13,
			y: 10
		}
	},
	// East City
	{
		topLeft: {
			x: 65,
			y: 30
		},
		dimensions: {
			x: 12,
			y: 12
		}
	},
	// South City
	{
		topLeft: {
			x: 45,
			y: 74
		},
		dimensions: {
			x: 14,
			y: 12
		}
	},
	// West City
	{
		topLeft: {
			x: 10,
			y: 37
		},
		dimensions: {
			x: 20,
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

		const bgDimensions = game.getBackgroundDimensions();
		const viewDimensions = game.$view.get(0).getBoundingClientRect();

		this.$elem.css({
			left: (bgDimensions.left - viewDimensions.left) + (bgDimensions.width * (topLeft.x / 100)),
			top: (bgDimensions.top - viewDimensions.top) + (bgDimensions.height * (topLeft.y / 100)),
			width: bgDimensions.width * (dimensions.x / 100),
			height: bgDimensions.height * (dimensions.y / 100)
		});
	}

}

interface CityInterface {
	topLeft: Point; // In percentages
	dimensions: Point; // In percentages
}
