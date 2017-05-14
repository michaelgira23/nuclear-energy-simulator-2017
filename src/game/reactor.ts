import uuid from 'uuid/v4';
import { ReactorDetails } from './reactor-details';
import { capitalize } from './utils';

declare const $: any;

export class Reactor {

	id: string;
	$elem: any;
	specs: ReactorSpec;
	detailsPopup: ReactorDetails;

	constructor(public game, public size: string, public x: number, public y: number) {

		// Generate a Universally Unique Identifier
		this.id = uuid();

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
}

export const reactorSpecs: { [key: string]: ReactorSpec } = {
	small: {
		cost: 17000,
		mw: 500
	},
	medium: {
		cost: 27200,
		mw: 800
	},
	large: {
		cost: 51000,
		mw: 1500
	}
};

export const uranium = {
	// How many US dollars for one pound of uranium
	costPerPound: 20,
	// Greater than this percentage is considered dangerous (highly enriched uranium or HEU)
	// Anything lower than this is considered low-enriched uranium (LEU)
	dangerThreshold: 20
};

export interface ReactorSpec {
	cost: number;
	mw: number;
}
