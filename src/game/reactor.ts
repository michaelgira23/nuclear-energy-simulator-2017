export class Reactor {

	specs: ReactorSpec;

	constructor(public size: string, public x: number, public y: number) {
		if (reactorSpecs[size]) {
			this.specs = reactorSpecs[size];
		} else {
			// Default to small reactor
			this.specs = reactorSpecs.small;
		}
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
