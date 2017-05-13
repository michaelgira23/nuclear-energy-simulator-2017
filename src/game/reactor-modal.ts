import uuid from 'uuid/v4';
import { Reactor } from './reactor';
import { capitalize } from './utils';

declare const $: any;

export class ReactorModal {

	id: string;
	closed = false;
	$modal: any;

	constructor(private reactor: Reactor, private x: number, private y: number) {
		this.id = uuid();

		this.reactor.game.$view.append(`
			<div id="${this.id}" class="reactor-details">
				<h3>
					${capitalize(this.reactor.size)} Reactor
					<button class="close reactor-details-close">&times;</button>
				</h3>
			</div>
		`);

		this.$modal = $(`.reactor-details#${this.id}`);

		this.$modal.css({
			left: x,
			top: y
		});

		this.$modal.find('.reactor-details-close').click(() => {
			this.close();
			this.closed = true;
		});
	}

	close() {
		this.$modal.remove();
	}
}
