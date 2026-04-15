import { Game } from './core/Game.js';

window.addEventListener('load', () => {
    // Initialize UI Loader
    const game = new Game();

    // Simulate asset loading
    setTimeout(() => {
        game.ui.hideLoader();
    }, 1500);
});
