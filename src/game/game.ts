import * as interact from 'interactjs';
import { Reactor, reactorSpecs } from './reactor';
import { capitalize, leadingZeros, numberSign, numberWithCommas } from './utils';

declare const $: any;

export class Game {

	$game: any;
	$view: any;
	reactorsInteractable: any;

	name: { first: string, last: string };
	reactors: Reactor[] = [];

	// How many milliseconds should pass each game trick
	gameTick = 500;
	// How often player gains money and stuff (in game ticks)
	gameInterval = 10;

	private _money: number;
	private _moneyGained: number;
	private _pollution: number;
	private _time: number;

	// El DINERO
	get money() {
		return this._money;
	}
	set money(value: number) {
		this._money = value;
		this.$game.find('.status-money span').text(numberWithCommas(value));
		this.disableReactors();
	}

	// How much money gained every interval
	get moneyGained() {
		return this._moneyGained;
	}
	set moneyGained(value: number) {
		this._moneyGained = value;
		this.$game.find('.status-moneygained span').text(`${numberSign(value)}$${numberWithCommas(value)}`);
	}

	// Percentage between 0 and 1 (inclusive) how much pollution there is
	get pollution() {
		return this._pollution;
	}
	set pollution(value: number) {
		this._pollution = value;
	}

	// How many game ticks have passed
	get time() {
		return this._time;
	}
	set time(value: number) {
		this._time = value;
		const seconds = value % 60;
		const minutes = Math.floor(value / 60);
		this.$game.find('.status-time span').text(`${minutes}:${leadingZeros(seconds)}`);
	}

	/**
	 * Constructor
	 */

	constructor(query: string, firstName: string, lastName: string) {

		// Game initialization

		this.$game = $(query);
		this.$view = this.$game.find('.game-view');
		this.name = {
			first: firstName,
			last: lastName
		};

		// this.money = 0;
		this.money = 200000;
		this.moneyGained = 10000;
		this.pollution = 0.8

		this.time = 0;
		setInterval(() => {
			if (++this.time % this.gameInterval === 0) {
				this.money += this.moneyGained;
			}
		}, this.gameTick);

		// Add reactors from array into the HTML
		const $buy = this.$game.find('.buy-reactors');
		for (const size of Object.keys(reactorSpecs)) {
			const reactor = reactorSpecs[size];
			$buy.append(`
				<div class="buy-reactor" data-size="${size}" data-cost="${reactor.cost}">
					<h5 class="reactor-name">${capitalize(size)} Reactor</h5>
					<img class="reactor-image" src="images/reactors//${size}.png">
					<p>Cost <strong>$${numberWithCommas(reactor.cost)}</strong></p>
					<p>Generates <strong>${reactor.mw} MW</strong></p>
				</div>
			`);
		}
		// After reactors are added to the shop, make sure they're updated
		this.disableReactors();

		// Make reactors in shop draggable
		this.reactorsInteractable = interact('.buy-reactor:not(.disabled)')
			.draggable({
				snap: {
					targets: [
						interact.createSnapGrid({ x: 30, y: 30 })
					],
					range: Infinity,
					relativePoints: [{ x: 0, y: 0 }]
				}
			})
			.on('dragstart', event => {
				event.target.classList.add('dragging');
				event.target.setAttribute('data-x', 0);
				event.target.setAttribute('data-y', 0);
				// Get starting dimensions so we know how to compensate when placing reactors
				const dimensions = event.target.getBoundingClientRect();
				event.target.setAttribute('data-mouse-offset-x', dimensions.left - event.clientX);
				event.target.setAttribute('data-mouse-offset-y', dimensions.top - event.clientY);
			})
			.on('dragmove', event => {
				let x = parseFloat(event.target.getAttribute('data-x'));
				let y = parseFloat(event.target.getAttribute('data-y'));

				x += event.dx;
				y += event.dy;

				event.target.style.transform = `translate(${x}px, ${y}px)`;

				event.target.setAttribute('data-x', x);
				event.target.setAttribute('data-y', y);
			})
			.on('dragend', event => {
				const dimensions = event.target.getBoundingClientRect();
				const x = event.clientX + Number(event.target.getAttribute('data-mouse-offset-x')) + (dimensions.width / 2);
				const y = event.clientY + Number(event.target.getAttribute('data-mouse-offset-y')) + (dimensions.height / 2);

				// Only add if player has enough money
				const reactorSize = event.target.getAttribute('data-size');
				const reactorCost = reactorSpecs[reactorSize].cost;
				if (this.money >= reactorCost) {
					this.money -= reactorCost;
					this.addReactor(reactorSize, x, y);
				}
				event.target.style.transform = 'none';
				event.target.classList.remove('dragging');
			});

		// Dismiss any popovers if player clicks outside them
		// this.$view.click(event => {
		// 	const target = $(event.target);
		// 	if (!target.hasClass('popover') && !target.hasClass('.reactor') && target.parents('.popover.show').length === 0) {
		// 		$('.reactor').popover('hide');
		// 	}
		// });
	}

	/**
	 * Adds a reactor onto the game
	 */

	addReactor(size: string, x: number, y: number) {
		this.reactors.push(new Reactor(this, size, x, y));
	}

	/**
	 * Disable nuclear reactors that player can't afford
	 */

	disableReactors(value: number = this.money) {
		this.$game.find('.buy-reactor')
			.each(function() {
				if (value >= parseFloat($(this).attr('data-cost'))) {
					$(this).removeClass('disabled');
				} else {
					$(this).addClass('disabled');
				}
			});
	}
}
