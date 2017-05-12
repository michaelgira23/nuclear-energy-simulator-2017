import { Reactor } from './reactor';

declare const $: any;

export class Game {

	$game: any;

	name: { first: string, last: string };
	reactors: Reactor[] = [];

	// How many milliseconds should pass each game trick
	gameTick = 100;
	// How often player gains money and stuff (in game ticks)
	gameInterval = 10;

	private _money: number;
	private _moneyGained: number;
	private _time: number;

	// El DINERO
	get money() {
		return this._money;
	}
	set money(value) {
		this._money = value;
		this.$game.find('.status-money span').text(value);
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
		this.$game.find('.status-moneygained span').text(`${sign}$${value}`);
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
		this.$game = $(query);
		this.name = {
			first: firstName,
			last: lastName
		};

		this.money = 420;
		this.moneyGained = 100;

		this.time = 0;
		setInterval(() => {
			if (++this.time % this.gameInterval === 0) {
				this.money += this.moneyGained;
			}
		}, this.gameTick);
	}
}
