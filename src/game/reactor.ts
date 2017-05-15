import uuid from 'uuid/v4';
import { ReactorDetails } from './reactor-details';
import { capitalize } from './utils';

declare const $: any;

export class Reactor {

	id: string = uuid();
	$elem: any;
	specs: ReactorSpec;
	detailsPopup: ReactorDetails;

	// How many ticks since last state change (turn off or on)
	ticksSinceStateChange = 0;
	// How many megawatts reactor was producing at the time of the last state change
	mwSinceStateChange = 0;

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
		this.ticksSinceStateChange = 0;
		this.mwSinceStateChange = this.mw;
		this.detailsPopup.updateData();
	}

	// Megawatts per hour the reactor is currently producing
	get mw() {
		return this._mw;
	}
	set mw(value: number) {
		this._mw = value;
		this.game.changeReactorProduction(this.id, value);
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

	constructor(public game, public size: ReactorSize, public x: number, public y: number) {
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

	startEnrichment() {
		this.enriching = true;
	}

	stopEnrichment() {
		this.enriching = false;
	}

	turnOn() {
		this.running = true;
	}

	turnOff() {
		this.running = false;
	}

	onTick() {
		this.ticksSinceStateChange++;

		if (this.uraniumSupply <= 0) {
			this.turnOff();
			this.uraniumEnrichment = 0;
		}

		let targetUsage = 0;
		if (this.running) {
			if (this.uraniumEnrichment < uranium.thresholds.sweetSpot) {
				// How many megawatts-hours reactor should eventually be producing
				targetUsage = (this.uraniumEnrichment / uranium.thresholds.sweetSpot) * this.specs.mwCapacity;
			} else {
				// Going any more enriched than sweet spot should flat out at MW capacity
				targetUsage = this.specs.mwCapacity;
			}
		}

		// How many ticks until reactor goes from original state to new state
		const startupDuration = 5;
		let startupEasingPercentage = this.ticksSinceStateChange / startupDuration;
		if (startupEasingPercentage > 1) {
			startupEasingPercentage = 1;
		}

		// How many megawatts-hours reactor should be producing this tick
		let produceMwh = (reactorPowerEasing(startupEasingPercentage) * (targetUsage - this.mwSinceStateChange)) + this.mwSinceStateChange;
		// How many pounds of uranium needed to produce target mw at this current moment in the easing
		let useUranium = (produceMwh / uranium.mwPerPound) / 60;

		// If we need to use more uranium than in supply, just use rest of supply
		if (useUranium > this.uraniumSupply) {
			useUranium = this.uraniumSupply;
			produceMwh = useUranium * uranium.mwPerPound;
		}

		this.uraniumSupply -= useUranium;
		this.mw = produceMwh;
	}

	onInterval() {
		if (this.enriching) {
			// Increase the uranium enrichment by 1 percent every interval
			if (++this.uraniumEnrichment > uranium.thresholds.weaponsGrade) {
				/** @todo lose game */
			}
		}
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
		danger: 20,
		// How enriched uranium should be to be used for weapons
		weaponsGrade: 90
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

// When reactor is turned on, don't immediately produce full power.
// x is the fraction of the animation progress, in the range 0..1
function reactorPowerEasing(x: number) {
	return x < 0.5 ?
		8 * x * x * x * x :
		1 - Math.pow(-2 * x + 2, 4) / 2;
}

export interface ReactorSpec {
	cost: number;
	mwCapacity: number; // Thge maximum megawatts the reactor can produce
	uraniumCapacity: number; // How much uranium in pounds
}

export type ReactorSize = 'small' | 'medium' | 'large';
