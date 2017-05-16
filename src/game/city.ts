import uuid from 'uuid/v4';
import { Point } from './game';
import { capitalize, round } from './utils';

declare const $: any;

export const cities: { [name: string]: CityInterface } = {
	// North City
	north: {
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
	east: {
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
	south: {
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
	west: {
		topLeft: {
			x: 10,
			y: 37
		},
		dimensions: {
			x: 20,
			y: 19
		}
	}
};

export class City {

	id = uuid();
	$elem: any;

	closed = true;

	// Percentage (0 to 100 inclusive) that favor nuclear energy
	private _favor: number;

	get favor() {
		return this._favor;
	}
	set favor(value) {
		this._favor = value;
		this.updateDetails();

		if (value <= 0) {
			this.game.lose('social');
		}
	}

	constructor(private game: any, public name: string, public topLeft: Point, public dimensions: Point) {

		game.$view.append(`
			<div id="${this.id}" class="city"></div>
		`);

		this.$elem = this.game.$view.find(`.city#${this.id}`);

		this.favor = round((Math.random() * 10) + 10, 0);
		console.log(this.favor);
		this.favor = 20;

		const bgDimensions = game.getBackgroundDimensions();
		const viewDimensions = game.$view.get(0).getBoundingClientRect();

		this.$elem.css({
			left: (bgDimensions.left - viewDimensions.left) + (bgDimensions.width * (topLeft.x / 100)),
			top: (bgDimensions.top - viewDimensions.top) + (bgDimensions.height * (topLeft.y / 100)),
			width: bgDimensions.width * (dimensions.x / 100),
			height: bgDimensions.height * (dimensions.y / 100)
		});

		this.$elem.popover({
			content: `
				<div id="city-details-${this.id}" class="city-details">
					<h6><strong><span class="city-details-favor"></span>% of the population want nuclear energy</strong></h6>
					<div class="city-details-favor-progress progress">
						<div class="progress-bar"></div>
					</div>
				</div>
			`,
			html: true,
			title: `${capitalize(name)} City`
		});

		this.updateDetails();

		this.$elem.on('shown.bs.popover', event => this._onOpen(event));
		this.$elem.on('hidden.bs.popover', event => this._onClose(event));
	}

	updateDetails() {
		const $favorLabel = $(`#city-details-${this.id} .city-details-favor`);
		const $favorProgress = $(`#city-details-${this.id} .city-details-favor-progress .progress-bar`);

		$favorLabel.text(round(this.favor));
		$favorProgress.css({ width: `${this.favor}%` });
	}

	// Get distance (in pixels) from this city to a reactor
	getDistanceToReactor(reactorId: string) {
		const $reactor = $(`.reactor#${reactorId}`);
		const cityPoint = this.getCenter(this.$elem.get(0));
		const reactorPoint = this.getCenter($reactor.get(0));
		return this.getDistance(cityPoint, reactorPoint);
	}

	// Get distance between two points
	getDistance(a: Point, b: Point) {
		return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
	}

	// Get center point (in pixels) of DOM element
	getCenter(element: any): Point {
		const dimensions = element.getBoundingClientRect();
		return {
			x: dimensions.left + (dimensions.width / 2),
			y: dimensions.top + (dimensions.height / 2)
		};
	}

	private _onOpen(event) {
		this.closed = false;
		this.updateDetails();
		// Emit reactor event for tutorial
		console.log('trigger city:details:open');
		this.game.$game.trigger('city:details:open');
	}

	private _onClose(event) {
		this.closed = true;
		// Emit reactor event for tutorial
		console.log('trigger city:details:close');
		this.game.$game.trigger('city:details:close');
	}

}

interface CityInterface {
	topLeft: Point; // In percentages
	dimensions: Point; // In percentages
}
