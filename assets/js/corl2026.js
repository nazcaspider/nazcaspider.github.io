/**
 * CoRL 2026 talks page: renders assets/data/corl2026.json with filters,
 * search, shareable URL-hash state and click-to-load YouTube players.
 */
(function () {
  "use strict";

  const DATA_URL = "assets/data/corl2026.json?v=10";

  const DAY_OF_VIDEO = { d1: "1", d2: "2", d3a: "3", d3b: "3" };
  const DAY_LABEL = { "1": "Day 1 · Mon Nov 9", "2": "Day 2 · Tue Nov 10", "3": "Day 3 · Wed Nov 11" };
  const DAY_CHIP = { "1": "Day 1", "2": "Day 2", "3": "Day 3" };
  const TYPE_LABEL = {
    keynote: "Keynote",
    "early-career-keynote": "Early-Career Keynote",
    oral: "Oral",
    spotlight: "Spotlight",
    sponsor: "Sponsor",
    panel: "Panel",
    fireside: "Fireside Chat",
    welcome: "Welcome",
    closing: "Closing"
  };
  const TYPE_ORDER = Object.keys(TYPE_LABEL);
  const AWARD_LABEL = { winner: "Award winners", finalist: "Award finalists" };

  const GROUPS = ["day", "type", "topic", "award"];
  const state = { day: new Set(), type: new Set(), topic: new Set(), award: new Set(), session: "", q: "" };

  let data = null;
  let talks = [];
  // Sessions the visitor opened or closed by hand (id -> open?). Without an
  // entry, a session starts closed, or open while filters or a search are active.
  const sessionOpen = new Map();

  const $ = (sel, root = document) => root.querySelector(sel);

  // GoatCounter custom event; silently does nothing if the script is blocked.
  function track(path, title) {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: "corl/" + path, title: title || path, event: true });
      }
    } catch (e) { /* analytics must never break the page */ }
  }

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  function fmtTime(s) {
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = String(m).padStart(h ? 2 : 1, "0");
    return (h ? h + ":" : "") + mm + ":" + String(sec).padStart(2, "0");
  }

  function fmtDuration(s) {
    const m = Math.round(s / 60);
    return m < 1 ? "<1 min" : m + " min";
  }

  function slug(str) {
    return str.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").slice(0, 60);
  }

  function awardKind(t) {
    if (!t.award) return null;
    return t.award.startsWith("winner") ? "winner" : "finalist";
  }

  function awardName(t) {
    if (!t.award) return "";
    if (t.award.startsWith("winner:")) return t.award.slice(7);
    return "Award finalist";
  }

  /* ---------- URL hash state ---------- */

  function readHash() {
    const params = new URLSearchParams(location.hash.replace(/^#/, ""));
    for (const g of GROUPS) {
      state[g] = new Set((params.get(g) || "").split(",").filter(Boolean));
    }
    state.session = params.get("session") || "";
    state.q = params.get("q") || "";
    return params.get("talk");
  }

  function writeHash() {
    const params = new URLSearchParams();
    for (const g of GROUPS) if (state[g].size) params.set(g, [...state[g]].join(","));
    if (state.session) params.set("session", state.session);
    if (state.q) params.set("q", state.q);
    const str = params.toString();
    const url = location.pathname + location.search + (str ? "#" + str : "");
    history.replaceState(null, "", url);
  }

  /* ---------- Filtering ---------- */

  function matches(t, skipGroup) {
    if (skipGroup !== "day" && state.day.size && !state.day.has(t._day)) return false;
    if (skipGroup !== "type" && state.type.size && !state.type.has(t.type)) return false;
    if (skipGroup !== "topic" && state.topic.size && !(t.topics || []).some((x) => state.topic.has(x))) return false;
    if (skipGroup !== "award" && state.award.size) {
      const k = awardKind(t);
      // Winners are also finalists.
      const ok = (state.award.has("winner") && k === "winner") || (state.award.has("finalist") && k !== null);
      if (!ok) return false;
    }
    if (skipGroup !== "session" && state.session && t.session !== state.session) return false;
    if (state.q) {
      const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.every((term) => t._search.includes(term))) return false;
    }
    return true;
  }

  /* ---------- Filter UI ---------- */

  function buildChips() {
    const options = {
      day: ["1", "2", "3"].map((v) => [v, DAY_CHIP[v]]),
      type: TYPE_ORDER.filter((ty) => talks.some((t) => t.type === ty)).map((v) => [v, TYPE_LABEL[v]]),
      topic: [...new Set(talks.flatMap((t) => t.topics || []))]
        .sort((a, b) => countFor("topic", b) - countFor("topic", a) || a.localeCompare(b))
        .map((v) => [v, v]),
      award: ["winner", "finalist"].filter((k) => talks.some((t) => awardKind(t) && (k === "finalist" || awardKind(t) === k))).map((v) => [v, AWARD_LABEL[v]])
    };
    for (const g of GROUPS) {
      const box = $(`.corl-group[data-group="${g}"] .corl-chips`);
      box.textContent = "";
      if (!options[g].length) {
        box.closest(".corl-group").hidden = true;
        continue;
      }
      for (const [value, label] of options[g]) {
        const icon = g === "award" ? el("i", { class: value === "winner" ? "bi bi-trophy-fill" : "bi bi-award", "aria-hidden": "true" }) : null;
        box.append(
          el("button", {
            type: "button",
            class: "corl-chip",
            "data-group": g,
            "data-value": value,
            "aria-pressed": "false",
            onclick: () => {
              const on = !state[g].has(value);
              on ? state[g].add(value) : state[g].delete(value);
              if (on) track(`filter/${g}/${value}`, `Filter ${g}: ${label}`);
              update();
            }
          }, icon, el("span", { text: label }), el("span", { class: "corl-chip-n" }))
        );
      }
    }

    const sel = $("#corl-session");
    for (const s of data.sessions) {
      sel.append(el("option", { value: s.id, text: s.short || s.title }));
    }
    sel.addEventListener("change", () => {
      state.session = sel.value;
      if (sel.value) track(`filter/session/${sel.value}`, `Filter session: ${sel.value}`);
      update();
    });

    const q = $("#corl-q");
    let timer = null;
    let searchTimer = null;
    q.addEventListener("input", () => {
      clearTimeout(timer);
      clearTimeout(searchTimer);
      timer = setTimeout(() => {
        state.q = q.value.trim();
        update();
      }, 150);
      // Record the query once the visitor stops typing, not every keystroke.
      searchTimer = setTimeout(() => {
        const term = q.value.trim().toLowerCase();
        if (term.length >= 3) track(`search/${term.slice(0, 60)}`, `Search: ${term.slice(0, 60)}`);
      }, 1500);
    });

    $("#corl-clear").addEventListener("click", () => {
      for (const g of GROUPS) state[g].clear();
      state.session = "";
      state.q = "";
      update();
    });
  }

  function countFor(group, value) {
    return talks.filter((t) => {
      if (!matchesValue(t, group, value)) return false;
      return data ? matches(t, group) : true;
    }).length;
  }

  function matchesValue(t, group, value) {
    if (group === "day") return t._day === value;
    if (group === "type") return t.type === value;
    if (group === "topic") return (t.topics || []).includes(value);
    if (group === "award") return value === "winner" ? awardKind(t) === "winner" : awardKind(t) !== null;
    return false;
  }

  function syncControls() {
    document.querySelectorAll(".corl-chip").forEach((chip) => {
      const g = chip.dataset.group;
      const v = chip.dataset.value;
      const on = state[g].has(v);
      chip.classList.toggle("active", on);
      chip.setAttribute("aria-pressed", String(on));
      const n = countFor(g, v);
      chip.querySelector(".corl-chip-n").textContent = n;
      chip.classList.toggle("empty", n === 0 && !on);
    });
    $("#corl-session").value = state.session;
    const q = $("#corl-q");
    if (document.activeElement !== q) q.value = state.q;
    $("#corl-clear").hidden = !filtering();
  }

  function filtering() {
    return Boolean(GROUPS.some((g) => state[g].size) || state.session || state.q);
  }

  function setAllSessions(open) {
    document.querySelectorAll("details.corl-session").forEach((d) => {
      sessionOpen.set(d.dataset.session, open);
      d.open = open;
    });
    track(open ? "expand-all" : "collapse-all", open ? "Expand all sessions" : "Collapse all sessions");
  }

  /* ---------- Rendering ---------- */

  function player(t) {
    const video = data.videos[t.video];
    const wrap = el("div", { class: "corl-player" });
    const start = Math.floor(t.start);
    const end = Math.ceil(t.end);
    const watchUrl = `https://youtu.be/${video.id}?t=${start}`;
    const thumbSrc = t.thumb || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    const thumbAlt = t.thumb && (t.presenters || []).length ? `${t.presenters[0]} on stage` : "";
    if (video.embeddable === false) {
      // The uploader has blocked embedding for this recording: link out instead.
      wrap.append(el("a", {
        class: "corl-facade",
        href: watchUrl,
        target: "_blank",
        rel: "noopener",
        "aria-label": `Watch "${t.title}" on YouTube (${fmtTime(start)} to ${fmtTime(end)})`
      },
        el("img", { src: thumbSrc, alt: thumbAlt, loading: "lazy" }),
        el("span", { class: "corl-play", "aria-hidden": "true" }, el("i", { class: "bi bi-box-arrow-up-right" })),
        el("span", { class: "corl-stamp", text: `${fmtTime(start)} – ${fmtTime(end)}` })
      ));
      wrap.append(el("div", { class: "corl-player-meta" },
        el("span", { text: `${video.label} · ${fmtDuration(end - start)} · plays on YouTube` })));
      appendReel(wrap, t, (sec) => {
        track(`play/${t._id}`, `Play: ${t.title}`);
        window.open(`https://youtu.be/${video.id}?t=${sec}`, "_blank", "noopener");
      });
      return wrap;
    }
    let frame = null;
    // Play the talk inline from `sec` (absolute seconds in the recording).
    const playAt = (sec) => {
      track(`play/${t._id}`, `Play: ${t.title}`);
      const src = `https://www.youtube-nocookie.com/embed/${video.id}?start=${sec}&end=${end}&autoplay=1&rel=0&modestbranding=1`;
      if (frame) {
        frame.src = src;
        return;
      }
      frame = el("iframe", {
        src,
        title: t.title,
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowfullscreen: true,
        referrerpolicy: "strict-origin-when-cross-origin"
      });
      btn.replaceWith(frame);
    };
    const btn = el(
      "button",
      {
        type: "button",
        class: "corl-facade",
        "aria-label": `Play "${t.title}" (${fmtTime(start)} to ${fmtTime(end)})`,
        onclick: () => playAt(start)
      },
      el("img", { src: thumbSrc, alt: thumbAlt, loading: "lazy" }),
      el("span", { class: "corl-play", "aria-hidden": "true" }, el("i", { class: "bi bi-play-fill" })),
      el("span", { class: "corl-stamp", text: `${fmtTime(start)} – ${fmtTime(end)}` })
    );
    wrap.append(btn);
    wrap.append(
      el("div", { class: "corl-player-meta" },
        el("span", { text: `${video.label} · ${fmtDuration(end - start)}` }),
        el("a", { href: watchUrl, target: "_blank", rel: "noopener" }, "Open on YouTube ", el("i", { class: "bi bi-box-arrow-up-right", "aria-hidden": "true" }))
      )
    );
    appendReel(wrap, t, playAt);
    return wrap;
  }

  /* ---------- Keyframe reel + progress breadcrumbs ---------- */

  // Each reel is a still strip of keyframes stacked vertically; the page steps
  // through it, so the breadcrumbs always match the visible frame. (An animated
  // image drifts: iOS Safari pauses animations offscreen and in Low Power Mode.)
  // Where each keyframe was captured, as a fraction of the talk (strip order).
  const REEL_FRACS = [0.10, 0.22, 0.35, 0.60, 0.80, 0.92];
  const REEL_FRAME_MS = 1200;
  const liveReels = new Set();   // loaded and on screen
  let reelTimer = null;

  function showFrame(r, idx) {
    r.idx = idx;
    r.frame.style.backgroundPosition = `0 ${(idx / (REEL_FRACS.length - 1)) * 100}%`;
    r.dots.forEach((d, n) => d.classList.toggle("active", n === idx));
    r.fill.style.width = (REEL_FRACS[idx] * 100) + "%";
    r.label.textContent = r.labels[idx];
  }

  function tickReels() {
    const now = performance.now();
    for (const r of liveReels) {
      if (!r.root.isConnected) { liveReels.delete(r); continue; }
      if (now - r.shownAt < REEL_FRAME_MS) continue;
      r.shownAt = now;
      showFrame(r, (r.idx + 1) % REEL_FRACS.length);
    }
    if (!liveReels.size) { clearInterval(reelTimer); reelTimer = null; }
  }

  function setLive(r, on) {
    if (!on || !r.loaded) { liveReels.delete(r); return; }
    r.shownAt = performance.now();
    liveReels.add(r);
    if (!reelTimer) reelTimer = setInterval(tickReels, 100);
  }

  // Load strips shortly before they scroll into view, and only animate visible ones.
  const reelObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      const r = e.target._reel;
      r.visible = e.isIntersecting;
      if (r.visible && !r.requested) loadReel(r);
      setLive(r, r.visible);
    }
  }, { rootMargin: "300px 0px" }) : null;

  function loadReel(r) {
    r.requested = true;
    const img = new Image();
    img.onload = () => {
      r.frame.style.backgroundImage = `url("${r.src}")`;
      r.root.classList.add("is-loaded");
      r.loaded = true;
      showFrame(r, 0);
      setLive(r, r.visible);
    };
    img.src = r.src;
  }

  // Keyframe slideshow (a quick visual summary of the talk) with a progress
  // track showing how far into the talk the current frame is.
  function appendReel(wrap, t, playAt) {
    if (!t.reel) return;
    const dur = Math.max(1, t.end - t.start);
    const total = fmtTime(dur);
    const r = { src: t.reel, idx: 0, labels: REEL_FRACS.map((f) => `${fmtTime(f * dur)} / ${total}`) };
    r.fill = el("span", { class: "corl-crumb-fill" });
    r.dots = REEL_FRACS.map((f, n) => el("button", {
      type: "button",
      class: "corl-crumb",
      style: `left: ${f * 100}%`,
      title: `Play from ${fmtTime(f * dur)}`,
      "aria-label": `Keyframe ${n + 1}: play from ${fmtTime(f * dur)} of ${total}`,
      onclick: () => playAt(Math.floor(t.start + f * dur))
    }));
    r.label = el("span", { class: "corl-crumb-label", text: r.labels[0] });
    r.frame = el("div", { class: "corl-reel-frame", role: "img", "aria-label": `Keyframes from "${t.title}"` });
    r.root = el("figure", { class: "corl-reel" },
      r.frame,
      el("div", { class: "corl-crumbs" }, el("span", { class: "corl-crumb-track" }, r.fill), r.dots),
      el("figcaption", null, el("span", { text: "Keyframes" }), r.label));
    r.root._reel = r;
    if (reelObserver) reelObserver.observe(r.root);
    else { r.visible = true; loadReel(r); }
    wrap.append(r.root);
  }

  // Authors with numbered affiliations, the way papers print them:
  // "A¹, B¹ ²" then "¹ Univ X  ² Company Y". Plain names if affiliations are unknown.
  function authorList(t) {
    const aff = t.author_affiliations || [];
    if (!aff.some(Boolean)) return [el("p", { text: t.authors.join(", ") })];
    const inst = [];
    const marks = aff.map((a) => (a || "").split(" / ").filter(Boolean).map((x) => {
      if (!inst.includes(x)) inst.push(x);
      return inst.indexOf(x) + 1;
    }));
    const names = el("p");
    t.authors.forEach((name, n) => {
      if (n) names.append(", ");
      names.append(name);
      if (marks[n] && marks[n].length) names.append(el("sup", { text: marks[n].join(",") }));
    });
    const legend = el("p", { class: "corl-affils" });
    inst.forEach((x, n) => legend.append(el("span", null, el("sup", { text: String(n + 1) }), x)));
    return [names, legend];
  }

  function card(t) {
    const kind = awardKind(t);
    const people = (t.presenters || []).join(", ");
    const authors = (t.authors || []).length > 1 ? authorList(t) : null;

    const badges = el("div", { class: "corl-badges" },
      el("span", { class: `corl-badge type-${t.type}`, text: TYPE_LABEL[t.type] || t.type }),
      kind && el("span", { class: `corl-badge award-${kind}` },
        el("i", { class: kind === "winner" ? "bi bi-trophy-fill" : "bi bi-award", "aria-hidden": "true" }), " ", awardName(t)),
      (t.topics || []).map((tp) => el("button", {
        type: "button",
        class: "corl-tag",
        title: `Show only ${tp}`,
        onclick: () => { track(`filter/topic-tag/${tp}`, `Topic tag: ${tp}`); state.topic = new Set([tp]); update(); $("#corl-filters").scrollIntoView({ behavior: "smooth" }); }
      }, tp))
    );

    const links = el("div", { class: "corl-links" },
      t.arxiv_url && el("a", { href: t.arxiv_url, target: "_blank", rel: "noopener" }, el("i", { class: "bi bi-file-earmark-text", "aria-hidden": "true" }), " arXiv"),
      t.website && (/github\.com\//.test(t.website)
        ? el("a", { href: t.website, target: "_blank", rel: "noopener" }, el("i", { class: "bi bi-github", "aria-hidden": "true" }), " Code")
        : el("a", { href: t.website, target: "_blank", rel: "noopener" }, el("i", { class: "bi bi-globe", "aria-hidden": "true" }), " Project page")),
      t.paper_url && el("a", { href: t.paper_url, target: "_blank", rel: "noopener" }, el("i", { class: "bi bi-chat-square-text", "aria-hidden": "true" }), " OpenReview"),
      el("a", { href: `#talk=${t._id}`, class: "corl-permalink", onclick: (e) => { e.preventDefault(); copyLink(t, e.currentTarget); } },
        el("i", { class: "bi bi-link-45deg", "aria-hidden": "true" }), " Link")
    );

    return el("article", { class: `corl-card${kind ? " is-" + kind : ""}`, id: t._id },
      el("div", { class: "corl-body" },
        badges,
        el("h4", { class: "corl-title", text: t.title }),
        people && el("p", { class: "corl-presenters" },
          el("i", { class: "bi bi-person", "aria-hidden": "true" }), " ",
          // Several speakers: each name followed by its own affiliation.
          t.presenter_affiliations
            ? t.presenters.map((name, n) => [n ? ", " : "", name,
                t.presenter_affiliations[n] ? el("span", { class: "corl-affil", text: ` (${t.presenter_affiliations[n]})` }) : null]).flat()
            : people,
          t.affiliation ? el("span", { class: "corl-affil", text: " · " + t.affiliation }) : null,
          t.presenter_inferred ? el("span", { class: "corl-affil", title: "The presenter was not named in the recording, so the paper's first author is shown", text: " (presenter not named; first author shown)" }) : null),
        authors && el("details", { class: "corl-authors" }, el("summary", { text: "All authors" }), ...authors),
        t.summary && el("p", { class: "corl-summary", text: t.summary }),
        (t.takeaways || []).length > 0 && el("div", { class: "corl-takeaways" },
          el("h5", { text: "Key takeaways" }),
          el("ul", null, t.takeaways.map((k) => el("li", { text: k })))),
        links
      ),
      player(t)
    );
  }

  function copyLink(t, anchor) {
    const url = location.origin + location.pathname + "#talk=" + t._id;
    const done = () => {
      const old = anchor.lastChild.textContent;
      anchor.lastChild.textContent = " Copied";
      setTimeout(() => { anchor.lastChild.textContent = old; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, () => { location.hash = "talk=" + t._id; });
    } else {
      location.hash = "talk=" + t._id;
    }
  }

  function render() {
    const list = $("#corl-list");
    if (reelObserver) reelObserver.disconnect();
    liveReels.clear();
    list.textContent = "";
    const visible = talks.filter((t) => matches(t));
    $("#corl-count").textContent = `${visible.length} of ${talks.length} presentations`;

    if (!visible.length) {
      list.append(el("p", { class: "corl-empty" }, "No presentations match these filters. ",
        el("button", { type: "button", class: "corl-clear-inline", onclick: () => $("#corl-clear").click() }, "Clear filters")));
      return;
    }

    list.append(el("div", { class: "corl-toggle-all" },
      el("button", { type: "button", onclick: () => setAllSessions(true) },
        el("i", { class: "bi bi-arrows-expand", "aria-hidden": "true" }), " Expand all"),
      el("button", { type: "button", onclick: () => setAllSessions(false) },
        el("i", { class: "bi bi-arrows-collapse", "aria-hidden": "true" }), " Collapse all")));

    const perSession = {};
    for (const t of visible) perSession[t.session] = (perSession[t.session] || 0) + 1;
    const openByDefault = filtering();

    let lastDay = null;
    let lastSession = null;
    let sessionBox = null;
    for (const t of visible) {
      if (t._day !== lastDay) {
        list.append(el("h3", { class: "corl-day", text: DAY_LABEL[t._day] }));
        lastDay = t._day;
        lastSession = null;
      }
      if (t.session !== lastSession) {
        const s = data._sessionById[t.session] || { title: t.session };
        const n = perSession[t.session];
        const sid = t.session;
        const box = el("details", { class: "corl-session", "data-session": sid },
          el("summary", { class: "corl-session-head" },
            el("i", { class: "bi bi-chevron-right corl-session-caret", "aria-hidden": "true" }),
            el("div", { class: "corl-session-text" },
              el("h4", { text: s.title }),
              (s.chair || s.venue) && el("p", { text: [s.time, s.venue, s.chair && "Chair: " + s.chair].filter(Boolean).join(" · ") })),
            el("span", { class: "corl-session-n", text: n === 1 ? "1 talk" : `${n} talks` })));
        box.open = sessionOpen.has(sid) ? sessionOpen.get(sid) : openByDefault;
        let initial = box.open; // opening at render fires one "toggle"; skip it
        box.addEventListener("toggle", () => {
          if (initial) { initial = false; return; }
          if (sessionOpen.get(sid) === box.open) return; // set by code, not a click
          sessionOpen.set(sid, box.open);
          if (box.open) track(`open-session/${sid}`, `Open: ${s.title}`);
        });
        sessionBox = box;
        list.append(sessionBox);
        lastSession = t.session;
      }
      sessionBox.append(card(t));
    }
  }

  function update() {
    syncControls();
    render();
    writeHash();
  }

  /* ---------- Boot ---------- */

  function prepare(json) {
    data = json;
    data._sessionById = Object.fromEntries(data.sessions.map((s) => [s.id, s]));
    const order = Object.fromEntries(data.sessions.map((s, i) => [s.id, i]));
    const videoOrder = Object.keys(data.videos);
    const used = new Set();
    talks = data.talks.map((t) => {
      let id = slug(t.title) || "talk";
      while (used.has(id)) id += "-2";
      used.add(id);
      return Object.assign({}, t, {
        _id: id,
        _day: DAY_OF_VIDEO[t.video],
        _search: [t.title, (t.presenters || []).join(" "), (t.authors || []).join(" "), t.affiliation, (t.author_affiliations || []).join(" "), (t.presenter_affiliations || []).join(" "), t.summary, (t.takeaways || []).join(" "), (t.topics || []).join(" "), t.session]
          .filter(Boolean).join(" ").toLowerCase()
      });
    });
    talks.sort((a, b) =>
      videoOrder.indexOf(a.video) - videoOrder.indexOf(b.video) || a.start - b.start || (order[a.session] ?? 0) - (order[b.session] ?? 0));
  }

  /* ---------- Conference overview ---------- */

  function renderOverview() {
    const o = data.overview;
    const box = $("#corl-overview");
    if (!o || !box) return;
    const idByTitle = Object.fromEntries(talks.map((t) => [t.title, t._id]));
    const talkLink = (title) => idByTitle[title]
      ? el("a", { href: `#talk=${idByTitle[title]}`, class: "corl-ov-talk" }, title)
      : null;
    const items = (list, heading, cls) => (list || []).length > 0 && el("div", { class: cls },
      el("h4", { text: heading }),
      list.map((x) => el("div", { class: "corl-ov-item" }, el("h5", { text: x.title }), el("p", { text: x.body }))));

    // Headline, numbers and summary stay visible; the long tail folds away.
    const more = el("details", { class: "corl-ov-more" },
      el("summary", null, el("span", { class: "corl-ov-more-open", text: "Read the full overview" }),
        el("span", { class: "corl-ov-more-close", text: "Hide the full overview" }),
        el("i", { class: "bi bi-chevron-down", "aria-hidden": "true" })));
    more.addEventListener("toggle", () => { if (more.open) track("overview-more", "Read full overview"); });

    box.append(
      el("p", { class: "corl-ov-kicker", text: "Conference overview" }),
      el("h3", { id: "corl-overview-title", class: "corl-ov-headline", text: o.headline }),
      (o.stats || []).length > 0 && el("dl", { class: "corl-ov-stats" },
        o.stats.map((s) => el("div", { class: "corl-ov-stat" },
          el("dt", { text: s.label }), el("dd", { text: s.value }), s.note ? el("span", { text: s.note }) : null))),
      el("div", { class: "corl-ov-summary" }, (o.summary || []).map((p) => el("p", { text: p }))),
      more
    );
    more.append(
      (o.themes || []).length > 0 && el("div", { class: "corl-ov-themes" },
        el("h4", { text: "Themes" }),
        el("div", { class: "corl-ov-grid" }, o.themes.map((th) => el("article", { class: "corl-ov-theme" },
          el("h5", { text: th.title }),
          el("p", { text: th.body }),
          (th.talks || []).length > 0 && el("p", { class: "corl-ov-refs" },
            el("span", { text: "See: " }),
            th.talks.map(talkLink).filter(Boolean).flatMap((a, n) => n ? ["; ", a] : [a])))))),
      el("div", { class: "corl-ov-cols" },
        items(o.since_2025, "Since CoRL 2025", "corl-ov-col"),
        items(o.outlook_2027, "Looking ahead to 2027", "corl-ov-col")),
      (o.takeaways || []).length > 0 && el("div", { class: "corl-ov-takeaways" },
        el("h4", { text: "Key takeaways" }),
        el("ol", null, o.takeaways.map((k) => el("li", { text: k })))),
      (o.sources || []).length > 0 && el("p", { class: "corl-ov-sources" },
        el("span", { text: "Sources: " }),
        o.sources.map((s) => el("a", { href: s.url, target: "_blank", rel: "noopener" }, s.label))
          .flatMap((a, n) => n ? [" · ", a] : [a]))
    );
    box.hidden = false;
  }

  // Did the visitor get past the overview into the talk list? Started after the
  // overview renders, so the filter bar starts out below the fold.
  function watchReachedTalks() {
    const filters = $("#corl-filters");
    if (!filters || !("IntersectionObserver" in window) || location.hash) return;
    requestAnimationFrame(() => {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          track("reached-talks", "Scrolled to talk list");
          io.disconnect();
        }
      });
      io.observe(filters);
    });
  }

  function focusTalk(id) {
    const node = document.getElementById(id);
    if (!node) return;
    const box = node.closest("details.corl-session");
    if (box && !box.open) {
      sessionOpen.set(box.dataset.session, true);
      box.open = true;
    }
    node.classList.add("is-focused");
    node.scrollIntoView({ block: "start", behavior: "instant" });
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(r.status + " " + r.statusText);
        return r.json();
      })
      .then((json) => {
        prepare(json);
        renderOverview();
        watchReachedTalks();
        const talkId = readHash();
        buildChips();
        syncControls();
        render();
        if (talkId) focusTalk(talkId);
      })
      .catch((err) => {
        $("#corl-list").textContent = "Could not load the presentation list (" + err.message + ").";
      });

    // Outbound clicks (papers, project pages, YouTube) and overview → talk jumps.
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a");
      if (!a) return;
      const card = a.closest(".corl-card");
      const id = card ? card.id : "";
      const href = a.getAttribute("href") || "";
      if (a.classList.contains("corl-ov-talk")) {
        track(`overview-link/${href.replace(/^#talk=/, "")}`, `Overview → ${a.textContent}`);
      } else if (card && a.target === "_blank") {
        const kind = /arxiv\.org/.test(href) ? "arxiv" : /openreview\.net/.test(href) ? "openreview"
          : /youtu/.test(href) ? "youtube" : /github\.com\//.test(href) ? "code" : "project";
        track(`outbound/${kind}/${id}`, `${kind}: ${card.querySelector(".corl-title").textContent}`);
      } else if (a.classList.contains("corl-permalink")) {
        track(`share/${id}`, "Copy link");
      }
    });

    window.addEventListener("hashchange", () => {
      const talkId = readHash();
      if (talkId) {
        for (const g of GROUPS) state[g].clear();
        state.session = "";
        state.q = "";
        syncControls();
        render();
        focusTalk(talkId);
      } else {
        syncControls();
        render();
      }
    });
  });
})();
