import * as interact from 'interactjs';
import uuid from 'uuid/v4';
import { cities, City } from './city';
import { shuffleFacts } from './fun-facts';
import { Reactor, ReactorSize, reactorSpecs, uranium } from './reactor';
import { capitalize, includes, leadingZeros, numberSign, numberWithCommas, round } from './utils';

declare const $: any;
declare const Tether: any;

export class Game {

	name: { first: string, last: string };

	tutorial: Tutorial[] = [];
	inTutorial = false;

	funFacts = shuffleFacts();
	funFactsIndex = 0;
	// How many seconds before checking if should add new fun fact
	funFactsTime = 30;
	funFactsInterval: any;

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

	// Array of cities on the view
	cities: City[] = [];
	// What the favor is for each city
	citiesFavor: { [id: string]: number } = {};

	// How many milliseconds should pass each game trick
	// 60 game ticks = 1 hour
	gameTick = 1000;
	// How often player gains money and stuff (in game ticks)
	gameInterval = 3;
	// The setInterval for making the game do stuff
	gameTickInterval: any;

	// Player must surpass 7500 megawatts to convert the country to 100% nuclear and therefore win the game
	totalEnergyUsage = 7500;
	// Whether or not user has already recieved win prompt
	alreadyWon = false;

	private _averageFavor = 0;
	private _totalMwh = 0;
	private _money: number;
	private _baseMoneyGained: number;
	private _time: number;

	// Average favor of all the cities
	get averageFavor() {
		return this._totalMwh;
	}
	set averageFavor(value) {
		this._totalMwh = value;
		this.$status.find('.status-favor span').text(round(value));
	}

	// MWh total from all reactors
	get totalMwh() {
		return this._totalMwh;
	}
	set totalMwh(value) {
		this._totalMwh = value;
		this.$status.find('.status-generated span').text(round(value));
		this.$status.find('.status-percentage span').text(round(this.nuclearPercentage));

		// Also update money gained
		const gained = this.moneyGained;
		this.$status.find('.status-moneygained span').text(`${numberSign(gained)}$${numberWithCommas(round(gained))}`);

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
		this.$status.find('.status-money span').text(numberWithCommas(round(value)));
		this.disableReactors();

		if (this.money <= 0) {
			this.lose('economic');
		}
	}

	// How much money gained every interval
	get moneyGained() {
		return this._baseMoneyGained + (this.totalMwh * uranium.nuclearSave);
	}
	set baseMoneyGained(value: number) {
		this._baseMoneyGained = value;
		const gained = this.moneyGained;
		this.$status.find('.status-moneygained span').text(`${numberSign(gained)}$${numberWithCommas(round(gained))}`);
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
		this.money = 17500;
		this.baseMoneyGained = 800;

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
					<p>Up to <strong>+${reactor.mwCapacity} MWh</strong></p>
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
					this.addReactor(reactorSize, { x, y });
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

		// Add city hitboxes onto the game
		for (const city of Object.keys(cities)) {
			this.addCity(city, cities[city].topLeft, cities[city].dimensions);
		}

		/* tslint:disable:max-line-length */
		// Tutorial after stuff is initialized
		this.tutorial = [
			{
				section: 'view',
				target: this.$view,
				title: 'Welcome!',
				text: '<strong>Welcome to Nuclear Energy Simulator 2017!</strong> This is the overview of your country and you are the president. <strong>The goal of the game is to convert your country to 100% nuclear.</strong> Along the way, you will encounter some of the political, social, and economic challenges that come with the adoption of nuclear energy.',
				direction: 'center'
			},
			{
				section: 'status',
				target: this.$status,
				title: 'Status Bar',
				text: 'This is the status bar. This has current information about your game.',
				direction: 'top'
			},
			{
				section: 'status',
				target: this.$status.find('.status-generated'),
				title: 'Status Bar',
				text: 'The electricity produced by a nuclear reactor is measured in units called megawatts (MW). Surprisingly, the amount of megawatts produced in one hour is called a megawatt-hour (MWh). <strong>This label is the total amount of megawatt-hours generated by nuclear in your country.</strong>',
				direction: 'top'
			},
			{
				section: 'status',
				target: this.$status.find('.status-percentage'),
				title: 'Status Bar',
				text: 'This is the percentage of your electricity that is produced by nuclear. <strong>Convert your country to 100% nuclear to win!</strong>',
				direction: 'top'
			},
			{
				section: 'status',
				target: this.$status.find('.status-favor'),
				title: 'Social Challenges',
				text: 'This is what percent of the population supports the ues of nuclear energy. <strong>The closer a nuclear reactor is built to a city, the lower the percentage initially decreases. However, the percentage will increase over time as more and more energy is generated by nuclear. Watch out though, this is just an average! Click on individual cities on the board to make sure none of them reach 0% support losing you the game!</strong>',
				direction: 'top'
			},
			{
				section: 'status',
				target: this.$status.find('.status-money'),
				title: 'Economic Challenges',
				text: 'This is how much money you have. <strong>You use money to build nuclear reactors and buy uranium to run the reactors.</strong>',
				direction: 'top'
			},
			{
				section: 'status',
				target: this.$status.find('.status-moneygained'),
				title: 'Economic Challenges',
				// text: 'This is how much money you gain per (in game) hour. <strong>You get more money depending on how much the public likes nuclear energy.</strong> The public likes nuclear the closer/longer they live by a nuclear reactor. <strong>You also gain more money if oil prices increase.</strong>',
				text: 'This is how much money you gain per (in game) hour. <strong>The more electricity you produce from nuclear, the more money you save.</strong>',
				direction: 'top'
			},
			{
				section: ['buy', 'view'],
				target: this.$buy,
				title: 'Build a Reactor!',
				text: 'This is the shop where you can buy nuclear reactors. <strong>Drag the small reactor onto your country.</strong>',
				direction: 'right',
				nextEvent: 'reactor:create'
			},
			{
				section: 'view',
				target: () => this.$view.find('.reactor'),
				title: 'Manage a Reactor!',
				text: 'You\'ve successfully built your first reactor! <strong>To manage it, simply click.</strong>',
				direction: 'left',
				nextEvent: 'reactor:details:open'
			},
			{
				section: 'view',
				target: () => $('.reactor-details-buy'),
				title: 'Manage a Reactor!',
				text: 'You need uranium in order to run a nuclear reactor! <strong>Click the \'Buy Uranium\' button.</strong>',
				direction: 'left',
				nextEvent: 'reactor:buy',
				backEvent: 'reactor:details:close'
			},
			{
				section: 'view',
				target: () => $('.reactor-details-enrich'),
				title: 'Manage a Reactor!',
				text: 'Before the uranium can be used, it must be enriched. <strong>Click on the \'Enrich Uranium\' button.</strong>',
				direction: 'left',
				nextEvent: 'reactor:enrich'
			},
			{
				section: 'view',
				target: () => $('.reactor-details-enriched-progress'),
				title: 'Manage a Reactor!',
				text: '<strong>The optimal level is 5% enriched uranium. You lose the game if you enrich weapons-grade uranium which is above 90%.</strong>',
				direction: 'left',
				backEvent: 'reactor:stopenrich'
			},
			{
				section: 'view',
				target: () => $('.reactor-details-stop-enrich'),
				title: 'Manage a Reactor!',
				text: '<strong>Once the uranium is at 5%, click the \'Stop Enrichment\' button.</strong>',
				direction: 'left',
				nextEvent: 'reactor:stopenrich'
			},
			{
				section: 'view',
				target: () => $('.reactor-details-start'),
				title: 'Manage a Reactor!',
				text: 'Let\'s get started now! <strong>Click the \'Start Reactor\' button to start generating electricity.</strong>',
				direction: 'left',
				nextEvent: 'reactor:on',
				backEvent: 'reactor:enrich'
			},
			{
				section: 'view',
				target: () => $('.reactor-details-supply-progress'),
				title: 'Manage a Reactor!',
				text: 'Don\'t forget to check on your reactors once in a while to replenish your uranium supply!',
				direction: 'left'
			},
			{
				section: 'none',
				target: this.$game,
				title: 'You\'re all set!',
				text: '<strong>Keep building nuclear reactors until you convert your entire country to nuclear.</strong> Good luck!',
				direction: 'center'
			}
		];
		/* tslint:enable:max-line-length */

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

			// Only start game when the player starts to enrich the uranium
			// That way the user isn't reading a bunch of information then becomes a millionaire
			this.$game.one('reactor:enrich', () => {
				this.start();
			});
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

		this.funFactsInterval = setInterval(() => {
			this.showFact();
		}, this.funFactsTime * 1000);
	}

	/**
	 * Pause the game
	 */

	pause() {
		if (this.gameTickInterval) {
			clearInterval(this.gameTickInterval);
		}
		this.gameTickInterval = null;
		if (this.funFactsInterval) {
			clearInterval(this.funFactsInterval);
		}
		this.funFactsInterval = null;
	}

	/**
	 * Adds a reactor onto the game
	 */

	addReactor(size: ReactorSize, position: Point) {
		const reactor = new Reactor(this, size, position);
		this.reactors.push(reactor);

		const distancesToCities = [];

		for (const city of this.cities) {
			distancesToCities.push(city.getDistanceToReactor(reactor.id));
		}

		const maxDistance = Math.max(...distancesToCities);

		for (const city of this.cities) {
			const distance = city.getDistanceToReactor(reactor.id);
			const distanceRatio = distance / maxDistance;

			const maxPercentageDecrease = {
				small: 10,
				medium: 15,
				large: 20
			};

			city.favor -= maxPercentageDecrease[size] * (1 - distanceRatio);
		}
	}

	/**
	 * Add a city onto the game
	 */

	addCity(name: string, topLeft: Point, dimensions: Point) {
		this.cities.push(new City(this, name, topLeft, dimensions));
	}

	/**
	 * Set favor percentage of a city
	 */

	changeCityFavor(id: string, favor: number) {
		this.citiesFavor[id] = favor;
		const citiesKeys = Object.keys(this.citiesFavor);
		this.averageFavor = citiesKeys.reduce((acc, val) => {
			return acc + this.citiesFavor[val];
		}, 0) / citiesKeys.length;
	}

	/**
	 * Increase all cities' support for nucearl energy by this much
	 */

	increaseCitiesFavor(favor: number) {
		for (const city of this.cities) {
			city.favor += favor;
		}
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
	 * Show a fun fact that's fun for the whole family
	 */

	showFact() {
		if (this.inTutorial) {
			return;
		}

		const $funFacts = this.$view.find('.fun-facts');

		// Don't add another fact if there's still one on the screen
		if ($funFacts.children().length > 0) {
			return;
		}

		const fact = this.funFacts[this.funFactsIndex % this.funFacts.length];

		const sourceButtons = [];
		// for (let i = 0; i < fact.sources.length; i++) {
		for (const source of fact.sources) {
			// sourceButtons.push(`<a href="${fact.links[i]}" target="_blank" class="alert-link">${fact.sources[i]}</a>`);
			sourceButtons.push(`<a href="/bibliography" target="_blank" class="alert-link">${source}</a>`);
		}

		this.$view.find('.fun-facts').append(`
			<div class="alert alert-info alert-dismissible fade show" role="alert">
				<button type="button" class="close" data-dismiss="alert" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
				<strong>Did you know?</strong>
				<p>${fact.fact}</p>
				<p>Sources: ${sourceButtons.join(', ')}</p>
			</div>
		`);

		this.funFactsIndex++;
	}

	/**
	 * Tutorial for the uneducated
	 */

	startTutorial(i = 0) {
		this.inTutorial = true;
		this.tutorialTextBox(this.tutorial[i], i + 1, next => {
			if (next) {
				i++;
			} else {
				i--;
			}
			if (this.tutorial[i]) {
				this.startTutorial(i);
			} else {
				this.inTutorial = false;
				this.start();
			}
		});
	}

	tutorialTextBox(tutorial: Tutorial, index: number, callback?: (next: boolean) => any) {
		this.focus(tutorial.section);

		const id = uuid();

		let $target;
		if (typeof tutorial.target === 'function') {
			$target = $(tutorial.target())
		} else {
			$target = $(tutorial.target);
		}

		// Create an element in exact position as target, so we don't mess up any existing popovers
		$('body').append(`<div id="tutorial-target-${id}" class="tutorial-target"></div>`);
		const $tutorialOverlay = $(`#tutorial-target-${id}`);

		$tutorialOverlay.width($target.width())
			.height($target.height());

		const tetherTarget = new Tether({
			element: $tutorialOverlay,
			target: $target,
			attachment: 'center center',
			targetAttachment: 'center center'
		});

		$tutorialOverlay.popover({
			content: `
				<div id="tutorial-${id}" class="tutorial-box">
					<p>${tutorial.text}</p>
					${tutorial.nextEvent ? '' : '<button class="btn btn-primary">Got It!</button>'}
				</div>
			`,
			html: true,
			placement: tutorial.direction === 'center' ? 'left' : tutorial.direction,
			title: `Tutorial (${index} / ${this.tutorial.length})${tutorial.title ? ' - ' + tutorial.title : ''}`
		});

		// Remove directional class and move to center if direction is center
		$tutorialOverlay.on('shown.bs.popover', event => {
			// Sorta hacky but it's 2:20am
			if (tutorial.direction === 'center') {
				const $popover = $(`#tutorial-${id}`).parents('.popover');
				// Remove popover class to get rid of arrow
				$popover.removeClass('bs-tether-element-attached-right bs-tether-target-attached-left');
				// Add a new tether for the center of the element
				const tetherPopup = new Tether({
					element: $popover,
					target: $tutorialOverlay,
					attachment: 'center center',
					targetAttachment: 'center center'
				});
			}
		});

		$tutorialOverlay.popover('show');

		const eventHandlerFactory = next => {
			return event => {
				// Clear event handlers
				if (tutorial.nextEvent) {
					this.$game.off(tutorial.nextEvent);
				}
				if (tutorial.backEvent) {
					this.$game.off(tutorial.backEvent);
				}

				$tutorialOverlay.popover('hide');
				this.focus('all');

				setTimeout(() => {
					$tutorialOverlay.popover('dispose');
				}, 400);

				if (typeof callback === 'function') {
					callback(next);
				}
			}
		}

		if (tutorial.nextEvent) {
			this.$game.on(tutorial.nextEvent, eventHandlerFactory(true));
		} else {
			$(`#tutorial-${id} button`).click(eventHandlerFactory(true));
		}

		if (tutorial.backEvent) {
			this.$game.on(tutorial.backEvent, eventHandlerFactory(false))
		}
	}

	/**
	 * Add an overlay to every part of the game except for the specified section.
	 * Null will open all sections
	 */

	focus(section: GameSection | GameSection[]) {
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

		if (section === 'buy' || (Array.isArray(section) && includes(section, 'buy'))) {
			this.$buy.removeClass('overlay');
		} else {
			this.$buy.addClass('overlay');
		}

		if (section === 'status' || (Array.isArray(section) && includes(section, 'status'))) {
			this.$game.find('.game-status').removeClass('overlay');
		} else {
			this.$game.find('.game-status').addClass('overlay');
		}

		if (section === 'view' || (Array.isArray(section) && includes(section, 'view'))) {
			this.$view.removeClass('overlay');
		} else {
			this.$view.addClass('overlay');
		}
	}

	/**
	 * Gets the coordinates of where the map image should be
	 */

	getBackgroundDimensions() {
		// Width / height
		const imageRatio = 4 / 3;

		const viewWidth = this.$view.width();
		const viewHeight = this.$view.height();

		// Assume that width is fixed, height is infinite
		const unlimitedHeight = viewWidth / imageRatio;

		// Assume that height is fixed, width is infinite
		const unlimitedWidth = viewHeight * imageRatio;

		this.$view.append('<div class="background-visualizer"></div>');
		const $border = $('.background-visualizer');

		let backgroundWidth;
		let backgroundHeight;

		if (unlimitedHeight <= viewHeight) {
			backgroundWidth = viewWidth;
			backgroundHeight = unlimitedHeight;
			$border.width(viewWidth).height(unlimitedHeight);
		}

		if (unlimitedWidth <= viewWidth) {
			backgroundWidth = unlimitedWidth;
			backgroundHeight = viewHeight;
			$border.width(unlimitedWidth).height(viewHeight);
		}

		const tether = new Tether({
			element: $border,
			target: this.$view,
			attachment: 'center center',
			targetAttachment: 'center center'
		});

		const dimensions = $border.get(0).getBoundingClientRect();
		$border.remove();
		return dimensions;
	}

	/**
	 * Converts pixels to percentage on the board
	 */

	pixelsToPercent({x, y}: Point): Point {
		return {
			x: (x / this.$view.width()) * 100,
			y: (y / this.$view.height()) * 100
		}
	}
}

export type Reason = 'political' | 'social' | 'economic';
export type GameSection = 'all' | 'buy' | 'status' | 'view' | 'none';
export type Direction = 'top' | 'right' | 'bottom' | 'left' | 'center';

interface Tutorial {
	section: GameSection | GameSection[];
	target: any;
	title?: string;
	text: string;
	direction: Direction; // Direction relative to target
	nextEvent?: string;
	backEvent?: string;
}

export interface Point {
	x: number;
	y: number;
}
