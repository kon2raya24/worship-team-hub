// PNG export for the Fretboard Explorer (Phase 5). Client-only — uses the DOM.
// Tailwind classes don't apply inside a serialized SVG, so we clone the live
// node and inline each element's computed fill/stroke/font. For a transparent
// "dots only" overlay we drop the board chrome; otherwise we add a solid bg.

function applyPaint(el: Element, attr: "fill" | "stroke", value: string) {
  if (!value) return;
  if (value === "none") {
    el.setAttribute(attr, "none");
    return;
  }
  // getComputedStyle returns rgba() for Tailwind's /opacity colors — split the
  // alpha into a *-opacity attribute since SVG's fill/stroke ignore it.
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((s) => s.trim());
    if (p.length === 4) {
      el.setAttribute(attr, `rgb(${p[0]}, ${p[1]}, ${p[2]})`);
      el.setAttribute(`${attr}-opacity`, p[3]);
      return;
    }
  }
  el.setAttribute(attr, value);
}

function cssVarColor(name: string): string {
  const probe = document.createElement("div");
  probe.style.color = `var(${name})`;
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c || "#0b0b12";
}

export function exportFretboardPng(
  svg: SVGSVGElement,
  opts: { dotsOnly: boolean; fileName: string; width: number; height: number; scale?: number },
) {
  const { dotsOnly, fileName, width, height, scale = 2 } = opts;
  const clone = svg.cloneNode(true) as SVGSVGElement;

  // Inline computed paints (live tree → clone tree, same order).
  const live = svg.querySelectorAll("*");
  const cl = clone.querySelectorAll("*");
  live.forEach((node, i) => {
    const cs = getComputedStyle(node);
    const dst = cl[i];
    if (!dst) return;
    applyPaint(dst, "fill", cs.fill);
    applyPaint(dst, "stroke", cs.stroke);
    if (cs.strokeWidth) dst.setAttribute("stroke-width", cs.strokeWidth);
    if (node.tagName === "text") {
      dst.setAttribute("font-size", cs.fontSize);
      dst.setAttribute("font-family", cs.fontFamily);
      dst.setAttribute("font-weight", cs.fontWeight);
    }
    if (cs.opacity && cs.opacity !== "1") dst.setAttribute("opacity", cs.opacity);
    dst.removeAttribute("class");
  });

  clone.querySelector('[data-layer="hit"]')?.remove();
  if (dotsOnly) {
    clone.querySelector('[data-layer="board"]')?.remove();
  } else {
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", String(width));
    bg.setAttribute("height", String(height));
    bg.setAttribute("fill", cssVarColor("--background"));
    clone.insertBefore(bg, clone.firstChild);
  }
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const xml = new XMLSerializer().serializeToString(clone);
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };
  img.src = url;
}
