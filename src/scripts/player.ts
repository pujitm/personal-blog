// One YouTube player for the whole site. Click an incipit to queue a piece's
// movements; start/end on each track trims talking and applause.

import { swapFunctions } from "astro:transitions/client";
import type { Track } from "../lib/commonplace";

declare global {
    interface Window {
        YT?: any;
        onYouTubeIframeAPIReady?: () => void;
    }
}

const ENDED = 0;
const PLAYING = 1;
const BUFFERING = 3;

const state = {
    queue: [] as Track[],
    index: 0,
    piece: "",
    playing: false,
    error: "",
    player: undefined as any,
};

let api: Promise<any> | undefined;

function loadApi(): Promise<any> {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    return (api ??= new Promise((resolve, reject) => {
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            previous?.();
            resolve(window.YT);
        };
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.onerror = () => {
            api = undefined;
            reject(new Error("Couldn't load the YouTube player."));
        };
        document.head.append(script);
    }));
}

const $ = <T extends HTMLElement>(selector: string) =>
    document.querySelector<T>(selector);

function render() {
    const root = $("#now-playing");
    if (!root) return;
    const track = state.queue[state.index];
    root.hidden = !track;
    if (track) {
        const title = $<HTMLAnchorElement>("#now-playing-title")!;
        title.textContent = track.title;
        title.href = track.href;
        $("#now-playing-sub")!.textContent = state.error || track.subtitle;
        $("#now-playing-toggle")!.textContent = state.playing ? "❚❚" : "▶";
        $("#now-playing-toggle")!.setAttribute(
            "aria-label",
            state.playing ? "Pause" : "Play",
        );
        $("#now-playing-prev")!.hidden = state.queue.length < 2;
        $("#now-playing-next")!.hidden = state.queue.length < 2;
    }
    document
        .querySelectorAll<HTMLElement>("[data-tracks][data-piece]")
        .forEach((button) => {
            // Collage pieces play the whole piece; movement rows play one movement.
            const isMovement = !!button.closest("[data-movement]");
            const active =
                !!track &&
                button.dataset.piece === state.piece &&
                (!isMovement || Number(button.dataset.trackIndex) === state.index);
            button.setAttribute("aria-pressed", String(active));
            button.dataset.state = active && state.playing ? "playing" : "paused";
        });
}

function onStateChange(event: { data: number }) {
    if (event.data === ENDED) {
        if (state.index < state.queue.length - 1) return go(state.index + 1);
        state.playing = false;
    } else {
        state.playing = event.data === PLAYING || event.data === BUFFERING;
    }
    render();
}

// 100: removed or private; 101/150: the owner doesn't allow embedding.
function onError(event: { data: number }) {
    state.playing = false;
    state.error = [100, 101, 150].includes(event.data)
        ? "This recording can't be played here."
        : "Something went wrong playing this.";
    render();
}

async function go(index: number) {
    const track = state.queue[index];
    if (!track) return;
    state.index = index;
    state.playing = true;
    state.error = "";
    render();
    let YT;
    try {
        YT = await loadApi();
    } catch {
        state.playing = false;
        state.error = "Couldn't reach YouTube.";
        return render();
    }
    if (state.player) {
        state.player.loadVideoById({
            videoId: track.youtube,
            startSeconds: track.start ?? 0,
            endSeconds: track.end,
        });
        return;
    }
    state.player = new YT.Player("now-playing-video", {
        host: "https://www.youtube-nocookie.com",
        videoId: track.youtube,
        playerVars: {
            autoplay: 1,
            start: track.start ?? 0,
            end: track.end,
            playsinline: 1,
            rel: 0,
        },
        events: { onStateChange, onError },
    });
}

export function play(piece: string, tracks: Track[], index = 0) {
    state.queue = tracks;
    state.piece = piece;
    go(index);
}

function toggle() {
    if (!state.player) return;
    if (state.playing) state.player.pauseVideo();
    else state.player.playVideo();
}

function close() {
    state.player?.stopVideo?.();
    state.queue = [];
    state.playing = false;
    render();
}

document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLElement>("[data-tracks]");
    if (button) {
        event.preventDefault();
        const piece = button.dataset.piece ?? "";
        const index = Number(button.dataset.trackIndex ?? 0);
        const isCurrent =
            piece === state.piece &&
            !!state.queue.length &&
            (!button.closest("[data-movement]") || index === state.index);
        if (isCurrent && state.player) return toggle();
        return play(piece, JSON.parse(button.dataset.tracks!), index);
    }
    if (target.closest("#now-playing-toggle")) toggle();
    if (target.closest("#now-playing-close")) close();
    if (target.closest("#now-playing-next")) go(state.index + 1);
    if (target.closest("#now-playing-prev")) go(Math.max(0, state.index - 1));
});

// Warm up the API when someone is about to press play.
document.addEventListener(
    "pointerover",
    (event) => {
        if ((event.target as HTMLElement).closest?.("[data-tracks]"))
            loadApi().catch(() => {});
    },
    { passive: true },
);

// Keep the music going across client-side navigation between commonplace
// pages. Astro's default swap replaces <body>, which would reload the iframe,
// so while something is playing we swap everything except the player.
document.addEventListener("astro:before-swap", (event: any) => {
    const doc: Document = event.newDocument;
    const keep = document.getElementById("now-playing");
    if (!keep || keep.hidden || !doc.getElementById("now-playing")) {
        // Leaving (or nothing playing): let the player go with the page.
        state.player?.destroy?.();
        state.player = undefined;
        state.queue = [];
        state.playing = false;
        return;
    }
    event.swap = () => {
        swapFunctions.deselectScripts(doc);
        swapFunctions.swapRootAttributes(doc);
        swapFunctions.swapHeadElements(doc);
        const restoreFocus = swapFunctions.saveFocus();
        const body = document.body;
        doc.getElementById("now-playing")!.remove();
        for (const { name } of [...body.attributes]) body.removeAttribute(name);
        for (const { name, value } of [...doc.body.attributes])
            body.setAttribute(name, value);
        for (const node of [...body.childNodes]) if (node !== keep) node.remove();
        keep.before(...doc.body.childNodes);
        restoreFocus();
    };
});

document.addEventListener("astro:page-load", render);
