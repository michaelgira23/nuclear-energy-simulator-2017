import uuid from 'uuid/v4';
import { Point } from './game';

export const cities: CityInterface[] = [
	// North City
	{
		topLeft: {
			x: 0,
			y: 0
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
	},
	// TEst City
	{
		topLeft: {
			x: 100,
			y: 100
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
