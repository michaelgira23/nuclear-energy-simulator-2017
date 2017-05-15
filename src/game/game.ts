import * as interact from 'interactjs';
import { Reactor, ReactorSize, reactorSpecs } from './reactor';
import { capitalize, leadingZeros, numberSign, numberWithCommas, round } from './utils';

declare const $: any;
declare const Tether: any;

export class Game {

	name: { first: string, last: string };

	$game: any;
	$buy: any;
	$status: any;
	$view: any;

	$overlayTutorial: any;
	$overlayWin: any;

	// Interact.js object for dragging reactors from shop to view
	reactorsInteractable: any;
	// Array of reactors on the view
	reactors: Reactor[] = [];
	// MWh each reactor is producing
	reactorsMwhProduction: { [id: string]: number } = {};

	// How many milliseconds should pass each game trick
	// 60 game ticks = 1 hour
	gameTick = 100;
	// How often player gains money and stuff (in game ticks)
	gameInterval = 10;
	// The setInterval for making the game do stuff
	gameTickInterval: any;

	// Player must surpass 7500 megawatts to convert the country to 100% nuclear and therefore win the game
	totalEnergyUsage = 7500;
	// Whether or not user has already recieved win prompt
	alreadyWon = false;

	private _totalMwh = 0;
	private _money: number;
	private _moneyGained: number;
	private _time: number;

	// MWh total from all reactors
	get totalMwh() {
		return this._totalMwh;
	}
	set totalMwh(value) {
		this._totalMwh = value;
		this.$status.find('.status-generated span').text(round(value));
		this.$status.find('.status-percentage span').text(round(this.nuclearPercentage));

		if (this.nuclearPercentage >= 100 && !this.alreadyWon) {
			this.win();
		}
	}

	// Get what percentage of the country is converted to nuclear
	get nuclearPercentage() {
		return (this.totalMwh / this.totalEnergyUsage) * 100;
	}

	// El DINERO
	get money() {
		return this._money;
	}
	set money(value: number) {
		this._money = value;
		this.$status.find('.status-money span').text(numberWithCommas(value));
		this.disableReactors();
	}

	// How much money gained every interval
	get moneyGained() {
		return this._moneyGained;
	}
	set moneyGained(value: number) {
		this._moneyGained = value;
		this.$status.find('.status-moneygained span').text(`${numberSign(value)}$${numberWithCommas(value)}`);
	}

	// How many game ticks have passed
	get time() {
		return this._time;
	}
	set time(value: number) {
		this._time = value;
		const seconds = value % 60;
		const minutes = Math.floor(value / 60);
		this.$status.find('.status-time span').text(`${minutes}:${leadingZeros(seconds)}`);
	}

	tutorial: Tutorial[] = [];

	/**
	 * Constructor
	 */

	constructor(query: string, firstName: string, lastName: string) {

		// Game initialization

		this.$game = $(query);
		this.$buy = this.$game.find('.game-buy');
		this.$status = this.$game.find('.game-status');
		this.$view = this.$game.find('.game-view');

		this.$overlayTutorial = this.$game.find('.overlay-prompt.tutorial').hide();
		this.$overlayWin = this.$game.find('.overlay-prompt.win').hide();

		this.name = {
			first: firstName,
			last: lastName
		};

		// this.money = 0;
		this.money = 20000;
		this.moneyGained = 1000;

		this.time = 0;

		// Add reactors from array into the HTML
		const $buy = this.$game.find('.buy-reactors');
		for (const size of Object.keys(reactorSpecs)) {
			const reactor = reactorSpecs[size];
			$buy.append(`
				<div class="buy-reactor" data-size="${size}" data-cost="${reactor.cost}">
					<h5 class="reactor-name">${capitalize(size)} Reactor</h5>
					<img class="reactor-image" src="images/reactors//${size}.png">
					<p>Cost <strong>$${numberWithCommas(reactor.cost)}</strong></p>
					<p>Generate up to <strong>${reactor.mwCapacity} MW</strong></p>
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
				event.target.setAttribute('data-original-x', dimensions.left);
				event.target.setAttribute('data-original-y', dimensions.top);
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
				const reactorDimensions = event.target.getBoundingClientRect();
				const buyDimensions = this.$buy.get(0).getBoundingClientRect();

				// Get mouse x position
				const x = event.clientX
					// Add coordinates mouse started dragging relative to reactor position
					+ Number(event.target.getAttribute('data-mouse-offset-x'))
					// Make it in the center of the div
					+ (reactorDimensions.width / 2)
					// Subtract width of buy div
					- buyDimensions.width;

				// Get mouse y position
				const y = event.clientY
					// Add coordinates mouse started dragging relative to reactor position
					+ Number(event.target.getAttribute('data-mouse-offset-y'))
					// Make it in the center of the div
					+ (reactorDimensions.height / 2);

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

		// Tutorial after stuff is initialized
		this.tutorial = [
			{
				section: 'view',
				target: this.$view,
				text: 'This is the game view. You have an overview of your country, and can manage your nuclear reactors by clicking on them.',
				attachment: 'center center',
				targetAttachment: 'center center'
			},
			{
				section: 'status',
				target: this.$status,
				text: 'This is the status bar. This has current information about your game.',
				attachment: 'bottom center',
				targetAttachment: 'top center'
			},
			{
				section: 'all',
				target: this.$game,
				text: 'Good luck!',
				attachment: 'center center',
				targetAttachment: 'center center'
			}
		];

		// Ask user if they want to have a tutorial
		this.focus('none');
		this.$overlayTutorial.fadeIn();

		const $yesTutorial = this.$overlayTutorial.find('.tutorial-yes');
		const $noTutorial = this.$overlayTutorial.find('.tutorial-no');

		// If player doesn't want tutorial, close overlay
		$noTutorial.click(event => {
			$yesTutorial.off('click');
			$noTutorial.off('click');
			this.$overlayTutorial.fadeOut();
			this.focus('all');
			this.start();
		});

		// If player does want overlay, start tutorial
		$yesTutorial.click(event => {
			$yesTutorial.off('click');
			$noTutorial.off('click');
			this.$overlayTutorial.fadeOut();
			this.focus('all');
			this.startTutorial();
		});

	}

	/**
	 * Start the game
	 */

	start() {
		if (this.gameTickInterval) {
			return;
		}

		this.gameTickInterval = setInterval(() => {
			this.time++;
			this.reactors.forEach(reactor => reactor.onTick());
			if (this.time % this.gameInterval === 0) {
				this.money += this.moneyGained;
				this.reactors.forEach(reactor => reactor.onInterval());
			}
		}, this.gameTick);
	}

	/**
	 * Pause the game
	 */

	pause() {
		if (this.gameTickInterval) {
			clearInterval(this.gameTickInterval);
		}
		this.gameTickInterval = null;
	}

	/**
	 * Adds a reactor onto the game
	 */

	addReactor(size: ReactorSize, x: number, y: number) {
		this.reactors.push(new Reactor(this, size, x, y));
	}

	/**
	 * Set the MWh a specific reactor is producing
	 */

	changeReactorProduction(id: string, mwh: number) {
		this.reactorsMwhProduction[id] = mwh;
		this.totalMwh = Object.keys(this.reactorsMwhProduction).reduce((acc, val) => {
			return acc + this.reactorsMwhProduction[val];
		}, 0);
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

	/**
	 * Call this when the player wins the game
	 */

	win() {
		/** @todo Do some back-end logic to log game */

		this.alreadyWon = true;

		// Ask user if they want to have a tutorial
		this.focus('none');
		this.$overlayWin.fadeIn();

		const $keepPlaying = this.$overlayWin.find('.win-keepplaying');
		const $done = this.$overlayWin.find('.win-done');

		// If player wants to keep playing, resume game
		$keepPlaying.click(event => {
			$keepPlaying.off('click');
			$done.off('click');
			this.$overlayWin.fadeOut();
			this.focus('all');
			this.start();
		});

		// If player wants to stop, redirect to win page
		$done.click(event => {
			$keepPlaying.off('click');
			$done.off('click');
			this.$overlayWin.fadeOut();

			window.location.href = '/win';
		});
	}

	/**
	 * Call this when the player loses the game
	 */

	lose(reason: Reason) {
		/** @todo Do some back-end logic to log game */
		window.location.href = `/lose?reason=${reason}`;
	}

	/**
	 * Tutorial for the uneducated
	 */

	startTutorial(i = 0) {
		this.tutorialTextBox(this.tutorial[i], () => {
			if (this.tutorial[++i]) {
				this.startTutorial(i);
			}
		});
	}

	tutorialTextBox(tutorial: Tutorial, callback?: () => any) {
		this.focus(tutorial.section);

		const box = this.$view.append(`
			<div class="tutorial-box">
				<p>${tutorial.text}</p>
				<button class="btn btn-primary">Got it!</buttton>
			</div>
		`);
		const $box = $('.tutorial-box').hide().fadeIn();
		const tether = new Tether({
			element: $box,
			target: tutorial.target,
			attachment: tutorial.attachment,
			targetAttachment: tutorial.targetAttachment
		});

		$box.find('button').click(event => {
			$box.fadeOut();
			this.focus('all');

			setInterval(() => {
				tether.destroy();
				$box.remove();
			}, 400);

			if (typeof callback === 'function') {
				callback();
			}
		});
	}

	/**
	 * Add an overlay to every part of the game except for the specified section.
	 * Null will open all sections
	 */

	focus(section: GameSection) {
		if (section === 'all') {
			this.$buy.removeClass('overlay');
			this.$status.removeClass('overlay');
			this.$view.removeClass('overlay');
			return;
		}
		if (section === 'none') {
			this.$buy.addClass('overlay');
			this.$status.addClass('overlay');
			this.$view.addClass('overlay');
			return;
		}

		if (section === 'buy') {
			this.$buy.removeClass('overlay');
		} else {
			this.$buy.addClass('overlay');
		}

		if (section === 'status') {
			this.$game.find('.game-status').removeClass('overlay');
		} else {
			this.$game.find('.game-status').addClass('overlay');
		}

		if (section === 'view') {
			this.$view.removeClass('overlay');
		} else {
			this.$view.addClass('overlay');
		}
	}
}

export type Reason = 'political' | 'social' | 'economic';
export type GameSection = 'all' | 'buy' | 'status' | 'view' | 'none';

interface Tutorial {
	section: GameSection;
	target: any;
	text: string;
	attachment: string;
	targetAttachment: string;
}
