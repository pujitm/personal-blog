// Engraves ABC incipits with abcjs once they're near the viewport.

type Abcjs = typeof import("abcjs");

let abcjs: Promise<Abcjs> | undefined;
const load = () =>
    (abcjs ??= import("abcjs").then((m) => ((m as any).default ?? m) as Abcjs));

export async function renderIncipit(el: HTMLElement) {
    const abc = el.dataset.incipit;
    const target = el.querySelector<HTMLElement>(".incipit__score");
    if (!abc || !target || el.hasAttribute("data-rendered")) return;
    const { renderAbc } = await load();
    target.textContent = "";
    renderAbc(target, `X:1\n${abc}`, {
        responsive: "resize",
        add_classes: true,
        staffwidth: 640,
        paddingtop: 4,
        paddingbottom: 0,
        paddingleft: 0,
        paddingright: 2,
        foregroundColor: "currentColor",
    });
    el.setAttribute("data-rendered", "");
}

let observer: IntersectionObserver | undefined;

export function observeIncipits(root: ParentNode = document) {
    observer ??= new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observer!.unobserve(entry.target);
                renderIncipit(entry.target as HTMLElement);
            }
        },
        { rootMargin: "600px" },
    );
    root
        .querySelectorAll<HTMLElement>("[data-incipit]:not([data-rendered])")
        .forEach((el) => observer!.observe(el));
}

document.addEventListener("astro:page-load", () => observeIncipits());
