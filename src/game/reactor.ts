import uuid from 'uuid/v4';
import { ReactorModal } from './reactor-modal';
import { capitalize } from './utils';

declare const $: any;

export class Reactor {

	id: string;
	$elem: any;
	specs: ReactorSpec;
	modal: ReactorModal;

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
				<img src="images/reactors/${size}/${size}.png">
			</div>
		`);

		this.$elem = $(`.reactor#${this.id}`);

		this.$elem.css({
			left: x - 50,
			top: y - 55
		});

		this.$elem.click(event => {
			console.log(event);
			const dimensions = event.target.getBoundingClientRect();
			// Toggle modal
			if (this.modal && !this.modal.closed) {
				this.closeDetails();
			} else {
				this.openDetails(dimensions.right, dimensions.top);
			}
		});
	}

	openDetails(x: number, y: number) {
		if (this.modal && !this.modal.closed) {
			return;
		}
		this.modal = new ReactorModal(this, x, y);
	}

	closeDetails() {
		if (this.modal) {
			this.modal.close();
		}
		this.modal = null;
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
