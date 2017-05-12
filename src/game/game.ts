import { array, Reactor } from './reactor';

export class Game {

	name: { first: string, last: string };
	reactors: Reactor[] = [];

	private _money = 0;

	get money() {
		return this._money;
	}
	set money(value) {
		this._money = value;
	}

	constructor(firstName: string, lastName: string) {
		this.name = {
			first: firstName,
			last: lastName
		};
	}
}
