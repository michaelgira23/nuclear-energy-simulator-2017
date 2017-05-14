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
				<button id="reactor-details-stop-enrich-${this.id}"n class="btn btn-warning">Stop Enrichment</button>
			`,
			html: true,
			title: `${capitalize(this.reactor.size)} Reactor`
		});

		this.updateData();

		reactor.$elem.on('shown.bs.popover', event => this._onOpen(event));
		reactor.$elem.on('hidden.bs.popover', event => this._onClose(event));
	}

	updateData() {
		// Labels and progress bar
		const $mwLabel = $(`#reactor-details-mw-label-${this.id}`);
		const $supplyLabel = $(`#reactor-details-supply-label-${this.id}`);
		const $supplyProgress = $(`#reactor-details-supply-progress-${this.id}`);
		const $enrichedLabel = $(`#reactor-details-enriched-label-${this.id}`);
		const $enrichedProgress = $(`#reactor-details-enriched-progress-${this.id}`);
		// Control buttons
		const $start = $(`#reactor-details-start-${this.id}`);
		const $stop = $(`#reactor-details-stop-${this.id}`);
		const $buyUranium = $(`#reactor-details-buy-${this.id}`);
		const $enrich = $(`#reactor-details-enrich-${this.id}`);
		const $stopEnrich = $(`#reactor-details-stop-enrich-${this.id}`);

		const supplyPercentage = (this.reactor.uraniumSupply / this.reactor.specs.uraniumCapacity) * 100;

		// Cost how much it would take to fill uranium supply
		let cost = (this.reactor.specs.uraniumCapacity * uranium.cost.perPound) + uranium.cost.extra;
		// If player is poor and doesn't have enough money, fallback to using all of the player's money to buy only a freaction of the uranium
		if (cost > this.reactor.game.money && this.reactor.game.money > 0) {
			cost = this.reactor.game.money;
		}

		// Add how many megawatts plant is producing
		$mwLabel.text(`${this.reactor.mw}/${this.reactor.specs.mwCapacity}`);

		// How much uranium the plant has
		$supplyLabel.text(`${this.reactor.uraniumSupply}/${this.reactor.specs.uraniumCapacity}`);

		// Uranium supply progress bar
		$supplyProgress.text(`${supplyPercentage}%`);
		$supplyProgress.css({ width: `${supplyPercentage}%` });

		// How enriched the uranium is
		$enrichedLabel.text(`${this.reactor.uraniumEnrichment}`);

		// Uranium enrichment progress bar
		$enrichedProgress.text(`${this.reactor.uraniumEnrichment}%`);
		$enrichedProgress.css({ width: `${this.reactor.uraniumEnrichment}%` });

		// If currently enriching uranium, make the progress bar striped and animated
		if (this.reactor.enriching) {
			$enrichedProgress.addClass('progress-bar-striped progress-bar-animated');
		} else {
			$enrichedProgress.removeClass('progress-bar-striped progress-bar-animated');
		}

		// Change enrichment bar depending on level of enrichment
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

		// Disable start button if not enough uranium or uranium isn't enriched
		$start.prop('disabled', this.reactor.uraniumSupply <= 0 || this.reactor.uraniumEnrichment <= 0);

		// Hide start button if already running and vice versa
		if (this.reactor.running) {
			$start.hide();
			$stop.show();
		} else {
			$start.show();
			$stop.hide();
		}

		// Update button to show how much it would cost to buy uranium for the plant
		$buyUranium.text(`Buy Uranium ($${cost})`);
		// Disable button if not enough money
		$buyUranium.prop('disabled', this.reactor.game.money <= 0
			// Or uranium supply is already full
			|| this.reactor.uraniumSupply >= this.reactor.specs.uraniumCapacity
			// Or uranium already enriched
			|| this.reactor.uraniumEnrichment > 0);

		// Add click handler for buying uranium
		$buyUranium.off('click');
		$buyUranium.click(event => {
			// Reverse the cost algorithm above in case if the player is poor and we had to lower the cost
			this.reactor.buyUranium((cost - uranium.cost.extra) / uranium.cost.perPound);
		});

		// Disable uranium enrichment if there's no uranium
		$enrich.prop('disabled', this.reactor.uraniumSupply <= 0);

		// Hide enrich button if already enriching and vice versa
		if (this.reactor.enriching) {
			$enrich.hide();
			$stopEnrich.show();
		} else {
			$enrich.show();
			$stopEnrich.hide();
		}

		// Add click handler for enriching uranium
		$enrich.off('click');
		$enrich.click(event => {
			this.reactor.startEnrichment();
		});

		// Add click handler for enriching uranium
		$stopEnrich.off('click');
		$stopEnrich.click(event => {
			this.reactor.stopEnrichment();
		});
	}

	private _onOpen(event) {
		this.closed = false;
		this.updateData();
	}

	private _onClose(event) {
		this.closed = true;
	}
}
