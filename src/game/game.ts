import * as interact from 'interactjs';
import { Reactor, reactorSpecs } from './reactor';
import { numberWithCommas } from './utils';

declare const $: any;

export class Game {

	$game: any;
	$view: any;
	reactorsInteractable: any;

	name: { first: string, last: string };
	reactors: Reactor[] = [];

	// How many milliseconds should pass each game trick
	gameTick = 100;
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
	set money(value) {
		this._money = value;
		this.$game.find('.status-money span').text(numberWithCommas(value));
	}

	// How much money gained every interval
	get moneyGained() {
		return this._moneyGained;
	}
	set moneyGained(value) {
		this._moneyGained = value;
		// Whether or not to add `+` or `-` symbol
		let sign = '';
		switch (Math.sign(value)) {
			case 1:
				sign = '+';
				break;
			case -1:
				sign = '-';
				break;
		}
		this.$game.find('.status-moneygained span').text(`${sign}$${numberWithCommas(value)}`);
	}

	// Percentage between 0 and 1 (inclusive) how much pollution there is
	get pollution() {
		return this._pollution;
	}
	set pollution(value) {
		this._pollution = value;
	}

	// How many game ticks have passed
	get time() {
		return this._time;
	}
	set time(value) {
		this._time = value;
		const seconds = value % 60;
		const minutes = Math.floor(value / 60);
		this.$game.find('.status-time span').text(`${minutes}:${seconds < 9 ? '0' + seconds : seconds}`);
	}

	constructor(query: string, firstName: string, lastName: string) {

		// Game initialization

		this.$game = $(query);
		this.$view = this.$game.find('.game-view');
		this.name = {
			first: firstName,
			last: lastName
		};

		this.money = 400;
		this.moneyGained = 100;
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
				<div class="buy-reactor" data-size="${size}">
					<h5 class="reactor-name">${size[0].toUpperCase() + size.substr(1)} Reactor</h5>
					<img class="reactor-image" src="images/reactors/${size}/${size}.png">
					<p>Cost <strong>$${numberWithCommas(reactor.cost)}</strong></p>
					<p>Generates <strong>${reactor.mw} MW</strong></p>
				</div>
			`);
		}

		// Make reactors in shop draggable
		this.reactorsInteractable = interact('.buy-reactor')
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

				this.reactors.push(new Reactor(this, event.target.getAttribute('data-size'), x, y));
				event.target.style.transform = 'none';
				event.target.classList.remove('dragging');
			});
	}
}
