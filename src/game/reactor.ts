import uuid from 'uuid/v4';

declare const $: any;

export class Reactor {

	id: string;
	specs: ReactorSpec;
	$elem: any;

	constructor(private game, public size: string, public x: number, public y: number) {

		// Generate a Universally Unique Identifier
		this.id = uuid();

		if (reactorSpecs[size]) {
			this.specs = reactorSpecs[size];
		} else {
			// Default to small reactor
			this.specs = reactorSpecs.small;
		}

		this.game.$view.append(`
			<div id="${this.id}" class="game-reactor">
				<img src="images/reactors/${size}/${size}.png">
			</div>
		`);

		this.$elem = $(`.game-reactor#${this.id}`);

		this.$elem.css({
			left: x - 50,
			top: y - 55
		});
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

export interface ReactorSpec {
	cost: number;
	mw: number;
}
