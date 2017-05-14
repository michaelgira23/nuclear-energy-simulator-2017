import uuid from 'uuid/v4';
import { Reactor } from './reactor';
import { capitalize } from './utils';

declare const $: any;

export class ReactorDetails {

	closed = false;

	constructor(private reactor: Reactor) {
		this.reactor.$elem.popover({
			content: `
				<h5><strong>20 tons / 50 tons capacity</strong> of Uranium</h5>
				<div class="progress">
					<div class="progress-bar" style="width: 25%">25%</div>
				</div>
				<h5>Uranium is <strong>20% enriched</strong></h5>
				<div class="progress">
					<div class="progress-bar" style="width: 25%">25%</div>
				</div>
			`,
			html: true,
			title: `${capitalize(this.reactor.size)} Reactor`
		});
	}

	open() {
		this.reactor.$elem.popover('show');
		this.closed = false;
	}

	close() {
		this.reactor.$elem.popover('hide');
		this.closed = true;
	}

	toggle() {
		if (this.closed) {
			this.open();
		} else {
			this.close();
		}
	}
}
