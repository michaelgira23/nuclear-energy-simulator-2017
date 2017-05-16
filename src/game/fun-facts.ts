import shuffle from 'shuffle-array';

/* tslint:disable:max-line-length */
export const funFacts: Fact[] = [
	{
		fact: '1 kg of coal can generate 12 kWh. To put this in perspective, 1 kg of uranium-235 can produce 24,000,000 kWh!',
		sources: ['European Nuclear Society'],
		links: ['("Fuel Comparison")']
	},
	{
		fact: 'Currently, 31 out of the 196 countries around the world have adopted nuclear power which accounts for about 11% of the world’s power generation.',
		sources: ['World Nuclear Association'],
		links: ['("Nuclear Power in the World")']
	},
	{
		fact: 'While 11% of the world\'s power is generated by nuclear, another 85% of the world’s energy is derived from fossil fuels, coal, oil, and gas. The burning of fossil fuels releases 23 billion tons of carbon dioxide into the atmosphere every year and has a detrimental impact on the environment.',
		sources: ['World Nuclear Association', 'Environmentalists for Nuclear Energy'],
		links: ['("Nuclear Power in the World")', '(Comby)']
	},
	{
		fact: 'Nuclear energy was pioneered by physicist Enrico Fermi in 1934. By colliding uranium atoms with neutrons, he created the first self-sustaining nuclear reaction in 1942.',
		sources: ['EBSCO Host'],
		links: ['("History of Nuclear")']
	},
	{
		fact: 'The United Nations (UN) was formed as a result of World War II and established the UN Atomic Energy Commission “to deal with the problems raised by the discovery of atomic energy” (“Atomic Energy”). Subsequently, in 1957, the International Atomic Energy Agency (IAEA) was created—an independent organization that works closely with the United Nations monitoring issues concerning nuclear technology (“International Atomic”). ',
		sources: ['United Nations', 'Gale Global Issues in Context'],
		links: ['("Atomic Energy")', '("International Atomic")']
	}
];
/* tslint:enable:max-line-length */

export function shuffleFacts(): Fact[] {
	return shuffle(funFacts, { copy: true });
}

export interface Fact {
	fact: string;
	sources: string[];
	links: string[];
}