


(() => {
    "use strict";

    // Flask renders the correct static URL even when the app is mounted under
    // a URL prefix. Keep the file name's capitalization identical to disk.
    const AUDIO_URL = document.body.dataset.musicUrl || "/static/audio/Aviator.mp3";
    const DEFAULT_VOLUME = 0.45;
    const MUSIC_SELECTOR = '.toggle[data-setting="music"]';

    const audio = new Audio(AUDIO_URL);

    audio.loop = true;
    audio.preload = "auto";
    audio.volume = DEFAULT_VOLUME;

    // Music is enabled by default whenever the game page loads.
    let musicEnabled = true;
    let playbackStarted = false;

    function updateMusicToggle() {
        document.querySelectorAll(MUSIC_SELECTOR).forEach(toggle => {
            toggle.classList.toggle("active", musicEnabled);
            toggle.setAttribute("role", "switch");
            toggle.setAttribute("aria-checked", String(musicEnabled));
            toggle.setAttribute("tabindex", "0");
            toggle.setAttribute(
                "aria-label",
                musicEnabled ? "Music On" : "Music Off"
            );
        });
    }

    async function musicOn() {
        musicEnabled = true;
        updateMusicToggle();
        // Keep looping even if another script or browser event changed it.
        audio.loop = true;
        try {
            await audio.play();
            playbackStarted = true;
        } catch (error) {
            playbackStarted = false;
            // Autoplay can be blocked until the visitor interacts with the
            // page. Keep the requested default-on state and retry then.
            updateMusicToggle();
            console.warn(
                `Unable to play Aviator.mp3 (${AUDIO_URL}). Check that the file is served and MP3 playback is supported.`,
                error
            );
        }
    }

    // Browsers may reject autoplay before a user gesture. Keep the switch on
    // and retry on the first interaction so music starts as soon as permitted.
    function resumeMusicAfterGesture() {
        if (!musicEnabled || playbackStarted || !audio.paused) return;
        musicOn();
    }

    document.addEventListener("pointerdown", event => {
        // Let the Music switch handle its own click, otherwise a blocked
        // autoplay retry and the toggle action could cancel each other.
        if (event.target.closest(MUSIC_SELECTOR)) return;
        resumeMusicAfterGesture();
    });
    document.addEventListener("keydown", event => {
        if (event.target.closest(MUSIC_SELECTOR)) return;
        resumeMusicAfterGesture();
    });

    // If the file reaches its end, restart it while Music remains enabled.
    // The loop property normally handles this; this is a fallback for browsers
    // or media states where looping is interrupted.
    audio.addEventListener("ended", () => {
        if (!musicEnabled) return;
        audio.currentTime = 0;
        audio.play().then(() => {
            playbackStarted = true;
        }).catch(error => {
            playbackStarted = false;
            console.warn("Unable to restart Aviator.mp3 after it ended.", error);
        });
    });

    function musicOff() {
        musicEnabled = false;
        playbackStarted = false;
        audio.pause();
        audio.currentTime = 0;
        updateMusicToggle();
    }

    function toggleMusic() {
        if (musicEnabled) {
            musicOff();
        } else {
            musicOn();
        }
    }

    // Listen at the document level so this also works if the side menu is
    // rendered or replaced after this script runs. Capture phase runs before
    // the generic side-menu handler, so playback uses the intended next state.
    document.addEventListener("click", event => {
        const toggle = event.target.closest(MUSIC_SELECTOR);
        if (!toggle) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        if (musicEnabled && playbackStarted) musicOff();
        else musicOn();
    }, true);

    document.addEventListener("keydown", event => {
        const toggle = event.target.closest(MUSIC_SELECTOR);
        if (!toggle || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (musicEnabled && playbackStarted) musicOff();
        else musicOn();
    }, true);

    // Optional controls for other JavaScript files.
    window.AviatorSound = {
        play: musicOn,
        stop: musicOff,
        toggle: toggleMusic,

        setVolume(value) {
            const volume = Number(value);

            if (Number.isFinite(volume)) {
                audio.volume = Math.max(0, Math.min(1, volume));
            }
        },

        get enabled() {
            return musicEnabled;
        }
    };

    updateMusicToggle();
    // Attempt immediately. If autoplay is blocked, the gesture listeners above
    // retry without changing the enabled switch state.
    musicOn();
})();
