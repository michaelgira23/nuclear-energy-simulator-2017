import uuid from 'uuid/v4';
import { ReactorDetails } from './reactor-details';
import { capitalize } from './utils';

declare const $: any;

export class Reactor {

	id: string = uuid();
	$elem: any;
	specs: ReactorSpec;
	detailsPopup: ReactorDetails;

	private _running = false;
	private _mw = 0;
	private _uraniumSupply = 0;
	private _uraniumEnrichment = 0;
	private _enriching = false;

	// Whether or not the reactor is running
	get running() {
		return this._running;
	}
	set running(value: boolean) {
		this._running = value;
		this.detailsPopup.updateData();
	}

	// Megawatts per hour the reactor is currently producing
	get mw() {
		return this._mw;
	}
	set mw(value: number) {
		this._mw = value;
		this.detailsPopup.updateData();
	}

	// How much uranium is in the nuclear reactor (in pounds)
	get uraniumSupply() {
		return this._uraniumSupply;
	}
	set uraniumSupply(value: number) {
		this._uraniumSupply = value;
		this.detailsPopup.updateData();
	}

	// Percentage of uranium enriched (between 0 and 100 inclusive)
	get uraniumEnrichment() {
		return this._uraniumEnrichment;
	}
	set uraniumEnrichment(value: number) {
		this._uraniumEnrichment = value;
		this.detailsPopup.updateData();
	}

	// Whether or not currently enriching uranium
	get enriching() {
		return this._enriching;
	}
	set enriching(value: boolean) {
		this._enriching = value;
		this.detailsPopup.updateData();
	}

	constructor(public game, public size: string, public x: number, public y: number) {
		if (reactorSpecs[size]) {
			this.specs = reactorSpecs[size];
		} else {
			// Default to small reactor
			this.specs = reactorSpecs.small;
		}

		this.game.$view.append(`
			<div id="${this.id}" class="reactor">
				<img src="images/reactors/${size}.png">
			</div>
		`);

		this.$elem = $(`.reactor#${this.id}`);

		this.$elem.css({
			left: x - 65,
			top: y - 73
		});

		this.detailsPopup = new ReactorDetails(this);
	}

	// Buy a certain amount of uranium (in pounds)
	buyUranium(pounds: number) {
		const cost = (pounds * uranium.cost.perPound) + uranium.cost.extra;

		// If the user can't afford this amount of uranium
		if (this.game.money < cost) {
			return;
		}

		// Check if uranium is already enriched
		if (this.uraniumEnrichment > 0) {
			return;
		}

		// Check if reactor has the capacity for this
		if ((this.uraniumSupply + pounds) > this.specs.uraniumCapacity) {
			return;
		}

		this.game.money -= cost;
		this.uraniumSupply += pounds;
	}
}

export const uranium = {
	// Economic
	cost: {
		// How many US dollars for one pound of uranium
		perPound: 30,
		// How many additional US dollars for buying uranium (like transportation and stuff)
		// This is fixed no matter how much uranium you buy
		extra: 100
	},
	// Different constants for the percentage of enriching uranium
	thresholds: {
		// Anything from here to above will produce the max amount of electricity
		sweetSpot: 5,
		// Greater than this percentage is considered dangerous (highly enriched uranium or HEU)
		// Anything lower than this is considered low-enriched uranium (LEU)
		// You lose the game if you go over this percentage
		danger: 20
	},
	// How many megawatt are produced from one pound of uranium
	mwPerPound: 10886
};

export const reactorSpecs: { [key: string]: ReactorSpec } = {
	small: {
		cost: 17000,
		mwCapacity: 500,
		uraniumCapacity: 1.1
	},
	medium: {
		cost: 27200,
		mwCapacity: 800,
		uraniumCapacity: 1.8
	},
	large: {
		cost: 51000,
		mwCapacity: 1500,
		uraniumCapacity: 3.3
	}
};

export interface ReactorSpec {
	cost: number;
	mwCapacity: number; // Thge maximum megawatts the reactor can produce
	uraniumCapacity: number; // How much uranium in pounds
}
