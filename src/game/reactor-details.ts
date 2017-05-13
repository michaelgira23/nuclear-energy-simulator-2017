import uuid from 'uuid/v4';
import { Reactor } from './reactor';
import { capitalize } from './utils';

declare const $: any;

export class ReactorDetails {

	closed = false;

	constructor(private reactor: Reactor) {
		this.reactor.$elem.popover({
			content: `
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
