import uuid from 'uuid/v4';
import { Reactor, uranium } from './reactor';
import { capitalize, round } from './utils';

declare const $: any;

export class ReactorDetails {

	id: string = uuid();
	closed = false;

	constructor(private reactor: Reactor) {
		reactor.$elem.popover({
			content: `
				<div id="reactor-details-${this.id}" class="reactor-details">
					<h5><i class="fa fa-bolt" aria-hidden="true"></i> <strong><span class="reactor-details-mw-label"></span> MWh</strong></h5>
					<h6><strong><span class="reactor-details-supply-label"></span> lbs</strong> of Uranium</h6>
					<div class="reactor-details-supply-progress progress">
						<div class="progress-bar"></div>
					</div>
					<h6>Uranium is <strong><span class="reactor-details-enriched-label"></span>% enriched</strong></h6>
					<div class="reactor-details-enriched-progress progress">
						<div class="progress-bar"></div>
					</div>
					<button class="reactor-details-start btn btn-success btn-block">Start Reactor</button>
					<button class="reactor-details-stop btn btn-danger btn-block">Stop Reactor</button>
					<button class="reactor-details-buy btn btn-info btn-block btn-sm">Buy Uranium</button>
					<button class="reactor-details-enrich btn btn-primary btn-block btn-sm">Enrich Uranium</button>
					<button class="reactor-details-stop-enrich btn btn-warning btn-block btn-sm">Stop Enrichment</button>
				</div>
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
		const $mwLabel = $(`#reactor-details-${this.id} .reactor-details-mw-label`);
		const $supplyLabel = $(`#reactor-details-${this.id} .reactor-details-supply-label`);
		const $supplyProgress = $(`#reactor-details-${this.id} .reactor-details-supply-progress .progress-bar`);
		const $enrichedLabel = $(`#reactor-details-${this.id} .reactor-details-enriched-label`);
		const $enrichedProgress = $(`#reactor-details-${this.id} .reactor-details-enriched-progress .progress-bar`);
		// Control buttons
		const $start = $(`#reactor-details-${this.id} .reactor-details-start`);
		const $stop = $(`#reactor-details-${this.id} .reactor-details-stop`);
		const $buyUranium = $(`#reactor-details-${this.id} .reactor-details-buy`);
		const $enrich = $(`#reactor-details-${this.id} .reactor-details-enrich`);
		const $stopEnrich = $(`#reactor-details-${this.id} .reactor-details-stop-enrich`);

		const supplyPercentage = (this.reactor.uraniumSupply / this.reactor.specs.uraniumCapacity) * 100;
		// Use logarithmic function to determine progress bar
		const enrichedProgressPercentage = Math.log(this.reactor.uraniumEnrichment + 1) * (100 / Math.log(uranium.thresholds.weaponsGrade + 1));

		// Cost how much it would take to fill uranium supply
		let cost = (this.reactor.specs.uraniumCapacity * uranium.cost.perPound) + uranium.cost.extra;
		// If player is poor and doesn't have enough money, fallback to using all of the player's money to buy only a freaction of the uranium
		if (cost > this.reactor.game.money && this.reactor.game.money > 0) {
			cost = this.reactor.game.money;
		}

		// Add how many megawatts plant is producing
		$mwLabel.text(`${round(this.reactor.mw, 0)}/${this.reactor.specs.mwCapacity}`);

		// How much uranium the plant has
		$supplyLabel.text(`${round(this.reactor.uraniumSupply)}/${this.reactor.specs.uraniumCapacity}`);

		// Uranium supply progress bar
		$supplyProgress.text(`${round(supplyPercentage)}%`);
		$supplyProgress.css({ width: `${supplyPercentage}%` });

		// How enriched the uranium is
		$enrichedLabel.text(`${this.reactor.uraniumEnrichment}`);

		// Uranium enrichment progress bar
		$enrichedProgress.text(`${this.reactor.uraniumEnrichment}%`);
		$enrichedProgress.css({ width: `${enrichedProgressPercentage}%` });

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

		// Push its buttons to turn it on
		$start.off('click');
		$start.click(event => {
			this.reactor.turnOn();
		});

		$stop.off('click');
		$stop.click(event => {
			this.reactor.turnOff();
		});

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
