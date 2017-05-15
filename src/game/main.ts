import { Game } from './game';

declare const $: any;

const game = new Game('#game', 'Michael', 'Gira');
// game.addReactor('large', 1036, 280);

const $overlay = $('.game-overlay');
// $overlay.hide();

const $yesTutorial = $('.tutorial .tutorial-yes');
const $noTutorial = $('.tutorial .tutorial-no');

// If player doesn't want tutorial, close overlay
$noTutorial.click(event => {
	$overlay.fadeOut();

	$yesTutorial.off('click');
	$noTutorial.off('click');
});

// If player does want overlay, start tutorial
$yesTutorial.click(event => {
	$overlay.fadeOut();

	$yesTutorial.off('click');
	$noTutorial.off('click');

	game.startTutorial();
});
