import uuid from 'uuid/v4';
import { Reactor, uranium } from './reactor';
import { capitalize } from './utils';

declare const $: any;

export class ReactorDetails {

	id: string = uuid();
	closed = false;

	constructor(private reactor: Reactor) {
		reactor.$elem.popover({
			content: `
				<h5>Generating <strong><span id="reactor-details-mw-label-${this.id}"></span> MWh</strong></h5>
				<h5><strong><span id="reactor-details-supply-label-${this.id}"></span> lbs</strong> of Uranium</h5>
				<div class="progress">
					<div id="reactor-details-supply-progress-${this.id}" class="progress-bar"></div>
				</div>
				<h5>Uranium is <strong><span id="reactor-details-enriched-label-${this.id}"></span>% enriched</strong></h5>
				<div class="progress">
					<div id="reactor-details-enriched-progress-${this.id}" class="progress-bar"></div>
				</div>
				<button id="reactor-details-start-${this.id}" class="btn btn-success">Start Reactor</button>
				<button id="reactor-details-stop-${this.id}" class="btn btn-danger">Stop Reactor</button>
				<button id="reactor-details-buy-${this.id}" class="btn btn-info">Buy Uranium</button>
				<button id="reactor-details-enrich-${this.id}" class="btn btn-primary">Enrich Uranium</button>
				<butto id="reactor-details-stop-enrich-${this.id}"n class="btn btn-warning">Stop Enrichment</button>
			`,
			html: true,
			title: `${capitalize(this.reactor.size)} Reactor`
		});

		this.updateData();

		reactor.$elem.on('shown.bs.popover', event => this._onOpen(event));
		reactor.$elem.on('hidden.bs.popover', event => this._onClose(event));
	}

	updateData() {
		const $mwLabel = $(`#reactor-details-mw-label-${this.id}`);
		$mwLabel.text(`${this.reactor.mw}/${this.reactor.specs.mwCapacity}`);

		const supplyPercentage = (this.reactor.uraniumSupply / this.reactor.specs.uraniumCapacity) * 100;
		const $supplyLabel = $(`#reactor-details-supply-label-${this.id}`);
		$supplyLabel.text(`${this.reactor.uraniumSupply}/${this.reactor.specs.uraniumCapacity}`);

		const $supplyProgress = $(`#reactor-details-supply-progress-${this.id}`);
		$supplyProgress.text(`${supplyPercentage}%`);
		$supplyProgress.css({ width: `${supplyPercentage}%` });

		const $enrichedLabel = $(`#reactor-details-enriched-label-${this.id}`);
		$enrichedLabel.text(`${this.reactor.uraniumEnrichment}`);

		const $enrichedProgress = $(`#reactor-details-enriched-progress-${this.id}`);
		$enrichedProgress.text(`${this.reactor.uraniumEnrichment}%`);
		$enrichedProgress.css({ width: `${this.reactor.uraniumEnrichment}%` });

		if (this.reactor.enriching) {
			$enrichedProgress.addClass('progress-bar-striped progress-bar-animated');
		} else {
			$enrichedProgress.removeClass('progress-bar-striped progress-bar-animated');
		}

		if (this.reactor.uraniumEnrichment <= uranium.thresholds.sweetSpot) {
			// Between 0% and 5% - Good
			$enrichedProgress.addClass('bg-success');
			$enrichedProgress.removeClass('bg-warning bg-danger');
		} else if (this.reactor.uraniumEnrichment < uranium.thresholds.danger) {
			// Between 6% and 20% - Warning
			$enrichedProgress.addClass('bg-warning');
			$enrichedProgress.removeClass('bg-success bg-danger');
		} else {
			// Between 21% and 100% - Danger/Lose
			$enrichedProgress.addClass('bg-danger');
			$enrichedProgress.removeClass('bg-success bg-warning');
		}

		const $start = $(`#reactor-details-start-${this.id}`);
		$start.prop('disabled', this.reactor.uraniumSupply <= 0);
		const $stop = $(`#reactor-details-stop-${this.id}`);
		if (this.reactor.running) {
			$start.hide();
			$stop.show();
		} else {
			$start.show();
			$stop.hide();
		}

		const $buyUranium = $(`#reactor-details-buy-${this.id}`);
		let cost = this.reactor.specs.uraniumCapacity * uranium.costPerPound;
		if (cost > this.reactor.game.money && this.reactor.game.money > 0) {
			cost = this.reactor.game.money;
		}
		$buyUranium.text(`Buy Uranium ($${cost})`);
		$buyUranium.prop('disabled', this.reactor.game.money <= 0);

		const $enrich = $(`#reactor-details-enrich-${this.id}`);
		const $stopEnrich = $(`#reactor-details-stop-enrich-${this.id}`);
		if (this.reactor.enriching) {
			$enrich.hide();
			$stopEnrich.show();
		} else {
			$enrich.show();
			$stopEnrich.hide();
		}
	}

	private _onOpen(event) {
		console.log('open very much');
		this.closed = false;
		this.updateData();
	}

	private _onClose(event) {
		this.closed = true;
	}
}
