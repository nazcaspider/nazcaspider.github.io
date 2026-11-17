/**
 * CoRL 2026 talks page: renders assets/data/corl2026.json with filters,
 * search, shareable URL-hash state and click-to-load YouTube players.
 */
(function () {
  "use strict";

  const DATA_URL = "assets/data/corl2026.json?v=10";

  const DAY_OF_VIDEO = { d1: "1", d2: "2", d3a: "3", d3b: "3" };
  const TYPE_ORDER = ["keynote", "early-career-keynote", "oral", "spotlight", "sponsor", "panel", "fireside", "welcome", "closing"];

  /* ---------- Languages ----------
   * Page text lives here; talk summaries/takeaways, session titles and the
   * overview are translated in assets/data/corl2026.<lang>.json, loaded on demand.
   * Paper titles, names and affiliations stay in English. */
  // Enabled languages. zh and ja are translated (I18N below + data files kept outside
  // the repo) but held back for a staged rollout: to enable one, add it here, add its
  // button in work-corl2026.html, and add assets/data/corl2026.<lang>.json.
  const LANGS = ["en", "es"];
  const LANG_TAG = { en: "en", es: "es", zh: "zh-Hans", ja: "ja" };
  const I18N = {
    en: {
      dayLabel: { "1": "Day 1 · Mon Nov 9", "2": "Day 2 · Tue Nov 10", "3": "Day 3 · Wed Nov 11" },
      dayChip: { "1": "Day 1", "2": "Day 2", "3": "Day 3" },
      weekday: {},
      type: { keynote: "Keynote", "early-career-keynote": "Early-Career Keynote", oral: "Oral", spotlight: "Spotlight",
        sponsor: "Sponsor", panel: "Panel", fireside: "Fireside Chat", welcome: "Welcome", closing: "Closing" },
      awardChip: { winner: "Award winners", finalist: "Award finalists" },
      award: {},
      awardFinalist: "Award finalist",
      topic: {},
      video: {},
      count: (v, n) => `${v} of ${n} presentations`,
      empty: "No presentations match these filters. ",
      clear: "Clear filters",
      expandAll: "Expand all",
      collapseAll: "Collapse all",
      talksN: (n) => (n === 1 ? "1 talk" : `${n} talks`),
      chair: "Chair: ",
      allAuthors: "All authors",
      keyTakeaways: "Key takeaways",
      projectPage: "Project page",
      code: "Code",
      link: "Link",
      copied: "Copied",
      showOnly: (tp) => `Show only ${tp}`,
      notNamed: " (presenter not named; first author shown)",
      notNamedTitle: "The presenter was not named in the recording, so the paper's first author is shown",
      min: "min",
      playsOnYouTube: "plays on YouTube",
      openOnYouTube: "Open on YouTube",
      watchAria: (title, a, b) => `Watch "${title}" on YouTube (${a} to ${b})`,
      playAria: (title, a, b) => `Play "${title}" (${a} to ${b})`,
      keyframes: "Keyframes",
      keyframesAlt: (title) => `Keyframes from "${title}"`,
      playFrom: (t) => `Play from ${t}`,
      keyframeAria: (n, t, total) => `Keyframe ${n}: play from ${t} of ${total}`,
      ovKicker: "Conference overview",
      ovMore: "Read the full overview",
      ovLess: "Hide the full overview",
      ovThemes: "Themes",
      ovSee: "See: ",
      ovSince: "Since CoRL 2025",
      ovOutlook: "Looking ahead to 2027",
      ovSources: "Sources: ",
      loadError: (m) => `Could not load the presentation list (${m}).`,
      langError: "This translation could not be loaded; showing English.",
      page: {}
    },
    es: {
      dayLabel: { "1": "Día 1 · lun 9 nov", "2": "Día 2 · mar 10 nov", "3": "Día 3 · mié 11 nov" },
      dayChip: { "1": "Día 1", "2": "Día 2", "3": "Día 3" },
      weekday: { Mon: "lun", Tue: "mar", Wed: "mié" },
      type: { keynote: "Conferencia magistral", "early-career-keynote": "Magistral de carrera temprana", oral: "Oral",
        spotlight: "Spotlight", sponsor: "Patrocinador", panel: "Panel", fireside: "Charla informal", welcome: "Bienvenida", closing: "Clausura" },
      awardChip: { winner: "Ganadores", finalist: "Finalistas" },
      award: { "Best Conference Paper Award": "Premio al Mejor Artículo de la Conferencia", "Best Student Paper Award": "Premio al Mejor Artículo Estudiantil" },
      awardFinalist: "Finalista del premio",
      topic: {
        "Community": "Comunidad", "Dexterous & Tactile": "Destreza y tacto", "Generalist Policies / VLA": "Políticas generalistas / VLA",
        "HRI & Safety": "Interacción humano-robot y seguridad", "Humanoids & Locomotion": "Humanoides y locomoción",
        "Imitation & Human Data": "Imitación y datos humanos", "Industry & Deployment": "Industria y despliegue", "Manipulation": "Manipulación",
        "Multi-Agent": "Multiagente", "Navigation & Autonomy": "Navegación y autonomía", "Perception": "Percepción",
        "Planning & Reasoning": "Planificación y razonamiento", "Reinforcement Learning": "Aprendizaje por refuerzo",
        "Sim, Data & Benchmarks": "Simulación, datos y benchmarks", "World Models": "Modelos del mundo"
      },
      video: { d1: "Grabación del día 1", d2: "Grabación del día 2", d3a: "Grabación de la mañana del día 3", d3b: "Grabación de la tarde del día 3" },
      count: (v, n) => `${v} de ${n} presentaciones`,
      empty: "Ninguna presentación coincide con estos filtros. ",
      clear: "Borrar filtros",
      expandAll: "Expandir todo",
      collapseAll: "Contraer todo",
      talksN: (n) => (n === 1 ? "1 charla" : `${n} charlas`),
      chair: "Moderación: ",
      allAuthors: "Todos los autores",
      keyTakeaways: "Conclusiones clave",
      projectPage: "Página del proyecto",
      code: "Código",
      link: "Enlace",
      copied: "Copiado",
      showOnly: (tp) => `Mostrar solo ${tp}`,
      notNamed: " (no se nombró al presentador; se muestra el primer autor)",
      notNamedTitle: "En la grabación no se nombró al presentador, así que se muestra el primer autor del artículo",
      min: "min",
      playsOnYouTube: "se reproduce en YouTube",
      openOnYouTube: "Abrir en YouTube",
      watchAria: (title, a, b) => `Ver "${title}" en YouTube (de ${a} a ${b})`,
      playAria: (title, a, b) => `Reproducir "${title}" (de ${a} a ${b})`,
      keyframes: "Fotogramas clave",
      keyframesAlt: (title) => `Fotogramas clave de "${title}"`,
      playFrom: (t) => `Reproducir desde ${t}`,
      keyframeAria: (n, t, total) => `Fotograma ${n}: reproducir desde ${t} de ${total}`,
      ovKicker: "Panorama de la conferencia",
      ovMore: "Leer el panorama completo",
      ovLess: "Ocultar el panorama completo",
      ovThemes: "Temas",
      ovSee: "Ver: ",
      ovSince: "Desde CoRL 2025",
      ovOutlook: "Mirando hacia 2027",
      ovSources: "Fuentes: ",
      loadError: (m) => `No se pudo cargar la lista de presentaciones (${m}).`,
      langError: "No se pudo cargar esta traducción; se muestra en inglés.",
      page: {
        title: "CoRL 2026 &mdash; Cada charla, analizada por IA",
        intro: 'La <a href="https://www.corl.org/program">Conferencia sobre Aprendizaje de Robots (CoRL) 2026</a> (Austin, Texas, 9&ndash;12 de noviembre) transmitió todo su programa principal en cuatro largas grabaciones. Aquí se dividen en presentaciones individuales: conferencias magistrales, presentaciones orales, spotlights, charlas de patrocinadores y el panel de debate. Cada entrada tiene un resumen breve, conclusiones clave y un reproductor que empieza y termina en esa charla.',
        note: "Los resúmenes se redactaron a partir de los subtítulos de la transmisión y de los resúmenes de los artículos. Cada artículo enlaza a arXiv y a su página de proyecto cuando existen, y a OpenReview. Los títulos de los artículos, los nombres y las afiliaciones se mantienen en inglés.",
        disclaimer: "<strong>Aviso:</strong> Esta página fue generada con Claude Opus 5.5 y no ha sido revisada por completo, por lo que puede contener errores. La traducción al español también fue hecha con IA. Conviene verificar los detalles en la grabación o el artículo originales. Todas las charlas, artículos, diapositivas y grabaciones pertenecen a sus autores y a CoRL 2026.",
        day: "Día", type: "Tipo", topic: "Tema", award: "Premios", session: "Sesión",
        search: "Buscar títulos, presentadores, resúmenes…", searchAria: "Buscar presentaciones", allSessions: "Todas las sesiones",
        filtersAria: "Filtrar presentaciones", loading: "Cargando presentaciones…", clear: "Borrar filtros"
      }
    },
    zh: {
      dayLabel: { "1": "第1天 · 11月9日 周一", "2": "第2天 · 11月10日 周二", "3": "第3天 · 11月11日 周三" },
      dayChip: { "1": "第1天", "2": "第2天", "3": "第3天" },
      weekday: { Mon: "周一", Tue: "周二", Wed: "周三" },
      type: { keynote: "主题演讲", "early-career-keynote": "青年学者主题演讲", oral: "口头报告", spotlight: "亮点报告",
        sponsor: "赞助商报告", panel: "小组讨论", fireside: "炉边谈话", welcome: "开幕致辞", closing: "闭幕" },
      awardChip: { winner: "获奖论文", finalist: "入围论文" },
      award: { "Best Conference Paper Award": "最佳会议论文奖", "Best Student Paper Award": "最佳学生论文奖" },
      awardFinalist: "最佳论文入围",
      topic: {
        "Community": "社区", "Dexterous & Tactile": "灵巧与触觉", "Generalist Policies / VLA": "通用策略 / VLA",
        "HRI & Safety": "人机交互与安全", "Humanoids & Locomotion": "人形机器人与运动", "Imitation & Human Data": "模仿学习与人类数据",
        "Industry & Deployment": "产业与部署", "Manipulation": "操作", "Multi-Agent": "多智能体", "Navigation & Autonomy": "导航与自主",
        "Perception": "感知", "Planning & Reasoning": "规划与推理", "Reinforcement Learning": "强化学习",
        "Sim, Data & Benchmarks": "仿真、数据与基准", "World Models": "世界模型"
      },
      video: { d1: "第1天录像", d2: "第2天录像", d3a: "第3天上午录像", d3b: "第3天下午录像" },
      count: (v, n) => `显示 ${v} / ${n} 场报告`,
      empty: "没有符合筛选条件的报告。",
      clear: "清除筛选",
      expandAll: "全部展开",
      collapseAll: "全部折叠",
      talksN: (n) => `${n} 场报告`,
      chair: "主持：",
      allAuthors: "全部作者",
      keyTakeaways: "要点",
      projectPage: "项目主页",
      code: "代码",
      link: "链接",
      copied: "已复制",
      showOnly: (tp) => `只看「${tp}」`,
      notNamed: "（录像中未提及报告人，显示第一作者）",
      notNamedTitle: "录像中未提及报告人，因此显示论文第一作者",
      min: "分钟",
      playsOnYouTube: "在 YouTube 播放",
      openOnYouTube: "在 YouTube 打开",
      watchAria: (title, a, b) => `在 YouTube 观看“${title}”（${a}–${b}）`,
      playAria: (title, a, b) => `播放“${title}”（${a}–${b}）`,
      keyframes: "关键帧",
      keyframesAlt: (title) => `“${title}”的关键帧`,
      playFrom: (t) => `从 ${t} 开始播放`,
      keyframeAria: (n, t, total) => `关键帧 ${n}：从 ${t} 开始播放（共 ${total}）`,
      ovKicker: "会议综述",
      ovMore: "阅读完整综述",
      ovLess: "收起完整综述",
      ovThemes: "主题",
      ovSee: "参见：",
      ovSince: "与 CoRL 2025 相比",
      ovOutlook: "展望 2027",
      ovSources: "来源：",
      loadError: (m) => `无法加载报告列表（${m}）。`,
      langError: "无法加载该译文，显示英文版本。",
      page: {
        title: "CoRL 2026 &mdash; 每场报告，AI 逐一解读",
        intro: '<a href="https://www.corl.org/program">2026 年机器人学习大会（CoRL 2026）</a>（美国得克萨斯州奥斯汀，11 月 9&ndash;12 日）以四段长录像直播了全部主会议程。本页将其拆分为单场报告：主题演讲、口头报告、亮点报告、赞助商报告和辩论小组讨论。每个条目都有简短摘要、要点，以及一个只播放该场报告的播放器。',
        note: "摘要依据直播字幕和论文摘要撰写。每篇论文在有条件时链接到 arXiv 和项目主页，并链接到 OpenReview。论文标题、姓名和单位保留英文。",
        disclaimer: "<strong>免责声明：</strong>本页由 Claude Opus 5.5 生成，尚未经过完整审核，可能存在错误。中文译文同样由 AI 翻译。具体细节请以原始录像或论文为准。所有报告、论文、幻灯片和录像的权利归其作者及 CoRL 2026 所有。",
        day: "日期", type: "类型", topic: "主题", award: "奖项", session: "场次",
        search: "搜索标题、报告人、摘要…", searchAria: "搜索报告", allSessions: "全部场次",
        filtersAria: "筛选报告", loading: "正在加载报告…", clear: "清除筛选"
      }
    },
    ja: {
      dayLabel: { "1": "1日目 · 11月9日（月）", "2": "2日目 · 11月10日（火）", "3": "3日目 · 11月11日（水）" },
      dayChip: { "1": "1日目", "2": "2日目", "3": "3日目" },
      weekday: { Mon: "月", Tue: "火", Wed: "水" },
      type: { keynote: "基調講演", "early-career-keynote": "若手研究者基調講演", oral: "口頭発表", spotlight: "スポットライト",
        sponsor: "スポンサー講演", panel: "パネル", fireside: "対談", welcome: "開会挨拶", closing: "閉会" },
      awardChip: { winner: "受賞論文", finalist: "最終候補" },
      award: { "Best Conference Paper Award": "最優秀論文賞", "Best Student Paper Award": "最優秀学生論文賞" },
      awardFinalist: "最優秀論文賞 最終候補",
      topic: {
        "Community": "コミュニティ", "Dexterous & Tactile": "巧緻操作・触覚", "Generalist Policies / VLA": "汎用方策 / VLA",
        "HRI & Safety": "HRI・安全性", "Humanoids & Locomotion": "ヒューマノイド・歩行", "Imitation & Human Data": "模倣学習・人間データ",
        "Industry & Deployment": "産業・実運用", "Manipulation": "マニピュレーション", "Multi-Agent": "マルチエージェント",
        "Navigation & Autonomy": "ナビゲーション・自律性", "Perception": "知覚", "Planning & Reasoning": "計画・推論",
        "Reinforcement Learning": "強化学習", "Sim, Data & Benchmarks": "シミュレーション・データ・ベンチマーク", "World Models": "世界モデル"
      },
      video: { d1: "1日目の録画", d2: "2日目の録画", d3a: "3日目午前の録画", d3b: "3日目午後の録画" },
      count: (v, n) => `${n}件中 ${v}件の発表`,
      empty: "条件に一致する発表はありません。",
      clear: "フィルターをクリア",
      expandAll: "すべて展開",
      collapseAll: "すべて折りたたむ",
      talksN: (n) => `${n}件`,
      chair: "座長：",
      allAuthors: "全著者",
      keyTakeaways: "要点",
      projectPage: "プロジェクトページ",
      code: "コード",
      link: "リンク",
      copied: "コピーしました",
      showOnly: (tp) => `「${tp}」のみ表示`,
      notNamed: "（録画で発表者名が言及されていないため、筆頭著者を表示）",
      notNamedTitle: "録画で発表者名が言及されていないため、論文の筆頭著者を表示しています",
      min: "分",
      playsOnYouTube: "YouTube で再生",
      openOnYouTube: "YouTube で開く",
      watchAria: (title, a, b) => `「${title}」を YouTube で見る（${a}〜${b}）`,
      playAria: (title, a, b) => `「${title}」を再生（${a}〜${b}）`,
      keyframes: "キーフレーム",
      keyframesAlt: (title) => `「${title}」のキーフレーム`,
      playFrom: (t) => `${t} から再生`,
      keyframeAria: (n, t, total) => `キーフレーム ${n}：${t} から再生（全 ${total}）`,
      ovKicker: "カンファレンス概要",
      ovMore: "概要をすべて読む",
      ovLess: "概要を閉じる",
      ovThemes: "テーマ",
      ovSee: "関連：",
      ovSince: "CoRL 2025 からの変化",
      ovOutlook: "2027年への展望",
      ovSources: "出典：",
      loadError: (m) => `発表一覧を読み込めませんでした（${m}）。`,
      langError: "この翻訳を読み込めなかったため、英語で表示しています。",
      page: {
        title: "CoRL 2026 &mdash; 全講演を AI が徹底解説",
        intro: '<a href="https://www.corl.org/program">ロボット学習国際会議 CoRL 2026</a>（米国テキサス州オースティン、11月9日&ndash;12日）は、メインプログラム全体を4本の長時間録画として配信しました。このページではそれを個々の発表に分割しています：基調講演、口頭発表、スポットライト、スポンサー講演、そしてディベート形式のパネル。各項目には短い要約、要点、そしてその発表の区間だけを再生するプレーヤーがあります。',
        note: "要約は配信の字幕と論文のアブストラクトをもとに作成しています。各論文は、利用可能な場合は arXiv とプロジェクトページに、また OpenReview にリンクしています。論文タイトル、氏名、所属は英語のままです。",
        disclaimer: "<strong>免責事項：</strong>このページは Claude Opus 5.5 で生成したもので、完全には確認されていないため、誤りを含む可能性があります。日本語訳も AI によるものです。詳細は元の録画や論文で確認してください。すべての講演、論文、スライド、録画の権利は、その著者および CoRL 2026 に帰属します。",
        day: "日程", type: "種類", topic: "トピック", award: "受賞", session: "セッション",
        search: "タイトル、発表者、要約を検索…", searchAria: "発表を検索", allSessions: "すべてのセッション",
        filtersAria: "発表を絞り込む", loading: "発表を読み込み中…", clear: "フィルターをクリア"
      }
    }
  };
  /* ---------- Acronyms ----------
   * Underlined, with the meaning in a tooltip on hover or tap. Names of methods,
   * products and benchmarks (LIBERO, SAM, GRAIL…) and everyday terms (AI, GPU) are left out.
   * [English, English plural, Spanish] */
  const ACRONYMS = {
    AV: ["audio-visual", null, "audiovisual"],
    ATE: ["absolute trajectory error", null, "error absoluto de trayectoria"],
    BC: ["behavior cloning", null, "clonación de comportamiento"],
    CAD: ["computer-aided design", null, "diseño asistido por computadora"],
    DAgger: ["Dataset Aggregation, an interactive imitation-learning method", null, "Dataset Aggregation, un método de aprendizaje por imitación interactivo"],
    DAGGER: ["Dataset Aggregation, an interactive imitation-learning method", null, "Dataset Aggregation, un método de aprendizaje por imitación interactivo"],
    DiT: ["diffusion transformer", null, "transformer de difusión"],
    DoF: ["degrees of freedom", null, "grados de libertad"],
    EKF: ["extended Kalman filter", null, "filtro de Kalman extendido"],
    ELBO: ["evidence lower bound", null, "cota inferior de la evidencia"],
    FEM: ["finite element method", null, "método de elementos finitos"],
    GAE: ["generalized advantage estimation", null, "estimación de ventaja generalizada"],
    HRI: ["human-robot interaction", null, "interacción humano-robot"],
    HSR: ["Human Support Robot (Toyota)", null, "Human Support Robot (Toyota)"],
    IK: ["inverse kinematics", null, "cinemática inversa"],
    KV: ["key-value (attention cache)", null, "clave-valor, de la caché de atención"],
    LiDAR: ["laser-based 3D range sensor", null, "sensor de distancia 3D por láser"],
    LLM: ["large language model", "large language models", "modelo de lenguaje grande"],
    LoRA: ["low-rank adaptation, a light fine-tuning method", null, "adaptación de bajo rango, un método ligero de ajuste fino"],
    LSTM: ["long short-term memory network", null, "red de memoria a corto y largo plazo"],
    MCTS: ["Monte Carlo tree search", null, "búsqueda de árbol de Monte Carlo"],
    MDP: ["Markov decision process", null, "proceso de decisión de Markov"],
    MLP: ["multilayer perceptron", null, "perceptrón multicapa"],
    MPC: ["model predictive control", null, "control predictivo basado en modelo"],
    MPPI: ["model predictive path integral control", null, "control predictivo por integral de trayectorias"],
    NAIRR: ["National AI Research Resource (US)", null, "National AI Research Resource (EE. UU.)"],
    OOD: ["out-of-distribution", null, "fuera de distribución"],
    PCA: ["principal component analysis", null, "análisis de componentes principales"],
    PI: ["Physical Intelligence, the company", null, "Physical Intelligence, la empresa"],
    PPO: ["Proximal Policy Optimization, an RL algorithm", null, "Proximal Policy Optimization, un algoritmo de RL"],
    QA: ["quality assurance", null, "control de calidad"],
    RL: ["reinforcement learning", null, "aprendizaje por refuerzo"],
    RNN: ["recurrent neural network", "recurrent neural networks", "red neuronal recurrente"],
    ROS: ["Robot Operating System", null, "Robot Operating System"],
    RTC: ["real-time chunking", null, "real-time chunking (fragmentación en tiempo real)"],
    RTE: ["relative trajectory error", null, "error relativo de trayectoria"],
    SAC: ["Soft Actor-Critic, an RL algorithm", null, "Soft Actor-Critic, un algoritmo de RL"],
    SFT: ["supervised fine-tuning", null, "ajuste fino supervisado"],
    SLAM: ["simultaneous localization and mapping", null, "localización y mapeo simultáneos"],
    SMPL: ["a standard parametric 3D human body model", null, "un modelo paramétrico estándar del cuerpo humano en 3D"],
    SPAD: ["single-photon avalanche diode", null, "diodo de avalancha de fotón único"],
    STL: ["signal temporal logic", null, "lógica temporal de señales"],
    ToF: ["time-of-flight", null, "tiempo de vuelo"],
    UAV: ["unmanned aerial vehicle", "unmanned aerial vehicles", "vehículo aéreo no tripulado"],
    UGV: ["unmanned ground vehicle", "unmanned ground vehicles", "vehículo terrestre no tripulado"],
    UMI: ["Universal Manipulation Interface, a handheld data-collection gripper", null, "Universal Manipulation Interface, una pinza manual para recopilar datos"],
    VLA: ["vision-language-action model", "vision-language-action models", "modelo de visión-lenguaje-acción"],
    VLM: ["vision-language model", "vision-language models", "modelo de visión y lenguaje"],
    XPBD: ["extended position-based dynamics", null, "dinámica basada en posiciones extendida"]
  };
  // ACRONYM, optional plural "s", then any hyphenated continuation ("BC-pretrained").
  const ACR_RE = new RegExp("\\b(" + Object.keys(ACRONYMS).sort((a, b) => b.length - a.length).join("|") +
    ")(s?)((?:-[A-Za-z0-9]+)*)(?![\\w])", "g");

  // Names that start with an acronym, left as they are ("RL Token" is a method).
  const NAMES_WITH_ACR = [["RL", " Token"]];

  // The English term behind an acronym, where the English entry is a description.
  const ACR_ORIGINAL = { LiDAR: "light detection and ranging", SMPL: "Skinned Multi-Person Linear model" };

  // Translated tooltips also show the original English term in brackets,
  // unless the translation already contains it or is practically the same.
  function acrMeaning(acr, plural) {
    const g = ACRONYMS[acr];
    if (LANG === "en") return plural && g[1] ? g[1] : g[0];
    const local = g[2];
    const original = ACR_ORIGINAL[acr] || g[0].split(",")[0].replace(/\s*\(.*\)$/, "");
    const norm = (x) => x.toLowerCase().replace(/[^a-z]/g, "");
    if (norm(local).includes(norm(original))) return local;
    // Right after the term itself: "adaptación de bajo rango (low-rank adaptation), un método…"
    const cut = local.indexOf(", ");
    return cut < 0 ? `${local} (${original})` : `${local.slice(0, cut)} (${original})${local.slice(cut)}`;
  }

  // One shared tooltip, kept inside the viewport: centered on the acronym when it
  // fits, shifted sideways near the edges, and below the word if there is no room above.
  let tipEl = null;
  function showTip(abbr) {
    if (!tipEl) {
      tipEl = el("div", { class: "corl-tip", role: "tooltip", id: "corl-tip", hidden: true });
      document.body.append(tipEl);
    }
    tipEl.textContent = abbr.dataset.tip;
    tipEl.hidden = false;
    abbr.setAttribute("aria-describedby", "corl-tip");
    const r = abbr.getBoundingClientRect();
    const w = tipEl.offsetWidth;
    const h = tipEl.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8);
    const top = r.top - h - 6 >= 8 ? r.top - h - 6 : r.bottom + 6;
    tipEl.style.left = left + "px";
    tipEl.style.top = top + "px";
  }
  function hideTip() {
    if (tipEl) tipEl.hidden = true;
  }
  document.addEventListener("mouseover", (e) => { const a = e.target.closest && e.target.closest(".corl-abbr"); if (a) showTip(a); });
  document.addEventListener("mouseout", (e) => { if (e.target.closest && e.target.closest(".corl-abbr") && document.activeElement !== e.target) hideTip(); });
  document.addEventListener("focusin", (e) => { if (e.target.classList && e.target.classList.contains("corl-abbr")) showTip(e.target); });
  document.addEventListener("focusout", (e) => { if (e.target.classList && e.target.classList.contains("corl-abbr")) hideTip(); });
  window.addEventListener("scroll", () => { if (tipEl && !tipEl.hidden) { const a = document.activeElement; a && a.classList && a.classList.contains("corl-abbr") ? showTip(a) : hideTip(); } }, { passive: true });

  // Text → nodes, with each acronym underlined and its meaning in a tooltip.
  function gloss(text) {
    if (!text) return [];
    const out = [];
    let last = 0;
    ACR_RE.lastIndex = 0;
    for (let m; (m = ACR_RE.exec(text));) {
      const [whole, acr, plural, rest] = m;
      if (NAMES_WITH_ACR.some(([x, after]) => x === acr && text.startsWith(after, m.index + whole.length))) continue;
      const meaning = acrMeaning(acr, Boolean(plural));
      out.push(text.slice(last, m.index));
      out.push(el("abbr", { class: "corl-abbr", "data-tip": meaning, tabindex: "0" }, acr + plural));
      if (rest) out.push(rest);
      last = m.index + whole.length;
    }
    out.push(text.slice(last));
    return out;
  }

  let LANG = "en";
  const tr = {};          // loaded translation files by language
  // Look up a page string in the current language, falling back to English.
  function T(key, ...args) {
    const d = I18N[LANG] || I18N.en;
    const v = d[key] !== undefined ? d[key] : I18N.en[key];
    return typeof v === "function" ? v(...args) : v;
  }
  const typeLabel = (ty) => T("type")[ty] || ty;
  const topicLabel = (tp) => T("topic")[tp] || tp;
  const trData = () => (LANG !== "en" && tr[LANG]) || null;
  const sessionTitle = (s) => (trData() && trData().sessions && trData().sessions[s.id]) || s.title;
  const sessionTime = (time) => (time || "").replace(/^(Mon|Tue|Wed)\b/, (d) => T("weekday")[d] || d);
  const videoLabel = (key) => T("video")[key] || data.videos[key].label;

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
    return m < 1 ? `<1 ${T("min")}` : `${m} ${T("min")}`;
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
    if (t.award.startsWith("winner:")) { const n = t.award.slice(7); return T("award")[n] || n; }
    return T("awardFinalist");
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
      day: ["1", "2", "3"].map((v) => [v, T("dayChip")[v]]),
      type: TYPE_ORDER.filter((ty) => talks.some((t) => t.type === ty)).map((v) => [v, typeLabel(v)]),
      topic: [...new Set(talks.flatMap((t) => t.topics || []))]
        .sort((a, b) => countFor("topic", b) - countFor("topic", a) || a.localeCompare(b))
        .map((v) => [v, topicLabel(v)]),
      award: ["winner", "finalist"].filter((k) => talks.some((t) => awardKind(t) && (k === "finalist" || awardKind(t) === k))).map((v) => [v, T("awardChip")[v]])
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
    while (sel.options.length > 1) sel.remove(1);
    for (const s of data.sessions) {
      sel.append(el("option", { value: s.id, text: sessionTitle(s) }));
    }
  }

  // Search box, session menu and "Clear filters": wired once.
  function bindControls() {
    const sel = $("#corl-session");
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
        "aria-label": T("watchAria", t.title, fmtTime(start), fmtTime(end))
      },
        el("img", { src: thumbSrc, alt: thumbAlt, loading: "lazy" }),
        el("span", { class: "corl-play", "aria-hidden": "true" }, el("i", { class: "bi bi-box-arrow-up-right" })),
        el("span", { class: "corl-stamp", text: `${fmtTime(start)} – ${fmtTime(end)}` })
      ));
      wrap.append(el("div", { class: "corl-player-meta" },
        el("span", { text: `${videoLabel(t.video)} · ${fmtDuration(end - start)} · ${T("playsOnYouTube")}` })));
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
        "aria-label": T("playAria", t.title, fmtTime(start), fmtTime(end)),
        onclick: () => playAt(start)
      },
      el("img", { src: thumbSrc, alt: thumbAlt, loading: "lazy" }),
      el("span", { class: "corl-play", "aria-hidden": "true" }, el("i", { class: "bi bi-play-fill" })),
      el("span", { class: "corl-stamp", text: `${fmtTime(start)} – ${fmtTime(end)}` })
    );
    wrap.append(btn);
    wrap.append(
      el("div", { class: "corl-player-meta" },
        el("span", { text: `${videoLabel(t.video)} · ${fmtDuration(end - start)}` }),
        el("a", { href: watchUrl, target: "_blank", rel: "noopener" }, T("openOnYouTube") + " ", el("i", { class: "bi bi-box-arrow-up-right", "aria-hidden": "true" }))
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
      title: T("playFrom", fmtTime(f * dur)),
      "aria-label": T("keyframeAria", n + 1, fmtTime(f * dur), total),
      onclick: () => playAt(Math.floor(t.start + f * dur))
    }));
    r.label = el("span", { class: "corl-crumb-label", text: r.labels[0] });
    r.frame = el("div", { class: "corl-reel-frame", role: "img", "aria-label": T("keyframesAlt", t.title) });
    r.root = el("figure", { class: "corl-reel" },
      r.frame,
      el("div", { class: "corl-crumbs" }, el("span", { class: "corl-crumb-track" }, r.fill), r.dots),
      el("figcaption", null, el("span", { text: T("keyframes") }), r.label));
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
      el("span", { class: `corl-badge type-${t.type}`, text: typeLabel(t.type) }),
      kind && el("span", { class: `corl-badge award-${kind}` },
        el("i", { class: kind === "winner" ? "bi bi-trophy-fill" : "bi bi-award", "aria-hidden": "true" }), " ", awardName(t)),
      (t.topics || []).map((tp) => el("button", {
        type: "button",
        class: "corl-tag",
        title: T("showOnly", topicLabel(tp)),
        onclick: () => { track(`filter/topic-tag/${tp}`, `Topic tag: ${tp}`); state.topic = new Set([tp]); update(); $("#corl-filters").scrollIntoView({ behavior: "smooth" }); }
      }, topicLabel(tp)))
    );

    const links = el("div", { class: "corl-links" },
      t.arxiv_url && el("a", { href: t.arxiv_url, target: "_blank", rel: "noopener" }, el("i", { class: "bi bi-file-earmark-text", "aria-hidden": "true" }), " arXiv"),
      t.website && (/github\.com\//.test(t.website)
        ? el("a", { href: t.website, target: "_blank", rel: "noopener" }, el("i", { class: "bi bi-github", "aria-hidden": "true" }), " " + T("code"))
        : el("a", { href: t.website, target: "_blank", rel: "noopener" }, el("i", { class: "bi bi-globe", "aria-hidden": "true" }), " " + T("projectPage"))),
      t.paper_url && el("a", { href: t.paper_url, target: "_blank", rel: "noopener" }, el("i", { class: "bi bi-chat-square-text", "aria-hidden": "true" }), " OpenReview"),
      el("a", { href: `#talk=${t._id}`, class: "corl-permalink", onclick: (e) => { e.preventDefault(); copyLink(t, e.currentTarget); } },
        el("i", { class: "bi bi-link-45deg", "aria-hidden": "true" }), " " + T("link"))
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
          t.presenter_inferred ? el("span", { class: "corl-affil", title: T("notNamedTitle"), text: T("notNamed") }) : null),
        authors && el("details", { class: "corl-authors" }, el("summary", { text: T("allAuthors") }), ...authors),
        t.summary && el("p", { class: "corl-summary" }, gloss(t.summary)),
        (t.takeaways || []).length > 0 && el("div", { class: "corl-takeaways" },
          el("h5", { text: T("keyTakeaways") }),
          el("ul", null, t.takeaways.map((k) => el("li", null, gloss(k))))),
        links
      ),
      player(t)
    );
  }

  function copyLink(t, anchor) {
    const url = location.origin + location.pathname + "#talk=" + t._id;
    const done = () => {
      const old = anchor.lastChild.textContent;
      anchor.lastChild.textContent = " " + T("copied");
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
    $("#corl-count").textContent = T("count", visible.length, talks.length);

    if (!visible.length) {
      list.append(el("p", { class: "corl-empty" }, T("empty"),
        el("button", { type: "button", class: "corl-clear-inline", onclick: () => $("#corl-clear").click() }, T("clear"))));
      return;
    }

    list.append(el("div", { class: "corl-toggle-all" },
      el("button", { type: "button", onclick: () => setAllSessions(true) },
        el("i", { class: "bi bi-arrows-expand", "aria-hidden": "true" }), " " + T("expandAll")),
      el("button", { type: "button", onclick: () => setAllSessions(false) },
        el("i", { class: "bi bi-arrows-collapse", "aria-hidden": "true" }), " " + T("collapseAll"))));

    const perSession = {};
    for (const t of visible) perSession[t.session] = (perSession[t.session] || 0) + 1;
    const openByDefault = filtering();

    let lastDay = null;
    let lastSession = null;
    let sessionBox = null;
    for (const t of visible) {
      if (t._day !== lastDay) {
        list.append(el("h3", { class: "corl-day", text: T("dayLabel")[t._day] }));
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
              el("h4", { text: sessionTitle(s) }),
              (s.chair || s.venue) && el("p", { text: [sessionTime(s.time), s.venue, s.chair && T("chair") + s.chair].filter(Boolean).join(" · ") })),
            el("span", { class: "corl-session-n", text: T("talksN", n) })));
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
        _en: { summary: t.summary, takeaways: t.takeaways },
        _searchEn: [t.title, (t.presenters || []).join(" "), (t.authors || []).join(" "), t.affiliation, (t.author_affiliations || []).join(" "), (t.presenter_affiliations || []).join(" "), t.summary, (t.takeaways || []).join(" "), (t.topics || []).join(" "), t.session]
          .filter(Boolean).join(" ").toLowerCase()
      });
    });
    localizeTalks();
    talks.sort((a, b) =>
      videoOrder.indexOf(a.video) - videoOrder.indexOf(b.video) || a.start - b.start || (order[a.session] ?? 0) - (order[b.session] ?? 0));
  }

  // Swap in the current language's summary/takeaways; search matches both
  // English and the translation, plus translated topic and session names.
  function localizeTalks() {
    const d = trData();
    for (const t of talks) {
      const x = d && d.talks && d.talks[t.title];
      t.summary = (x && x.summary) || t._en.summary;
      t.takeaways = (x && x.takeaways && x.takeaways.length) ? x.takeaways : t._en.takeaways;
      t._search = !d ? t._searchEn : [t._searchEn, x && x.summary, x && (x.takeaways || []).join(" "),
        (t.topics || []).map(topicLabel).join(" "), typeLabel(t.type), data._sessionById[t.session] && sessionTitle(data._sessionById[t.session])]
        .filter(Boolean).join(" ").toLowerCase();
    }
  }

  // The overview in the current language: translated text over the English structure.
  function localOverview() {
    const o = data.overview;
    const x = trData() && trData().overview;
    if (!o || !x) return o;
    const pair = (en, t) => (en || []).map((it, i) => Object.assign({}, it, (t || [])[i] || {}));
    return Object.assign({}, o, {
      headline: x.headline || o.headline,
      summary: (x.summary || []).length === (o.summary || []).length ? x.summary : o.summary,
      stats: pair(o.stats, x.stats).map((s, i) => Object.assign(s, { value: o.stats[i].value })),
      themes: pair(o.themes, x.themes).map((th, i) => Object.assign(th, { talks: o.themes[i].talks })),
      since_2025: pair(o.since_2025, x.since_2025),
      outlook_2027: pair(o.outlook_2027, x.outlook_2027),
      takeaways: (x.takeaways || []).length === (o.takeaways || []).length ? x.takeaways : o.takeaways
    });
  }

  /* ---------- Conference overview ---------- */

  function renderOverview() {
    const o = localOverview();
    const box = $("#corl-overview");
    if (!o || !box) return;
    const wasOpen = Boolean(box.querySelector("details.corl-ov-more[open]"));
    box.textContent = "";
    const idByTitle = Object.fromEntries(talks.map((t) => [t.title, t._id]));
    const talkLink = (title) => idByTitle[title]
      ? el("a", { href: `#talk=${idByTitle[title]}`, class: "corl-ov-talk" }, title)
      : null;
    const g = gloss;
    const items = (list, heading, cls) => (list || []).length > 0 && el("div", { class: cls },
      el("h4", { text: heading }),
      list.map((x) => el("div", { class: "corl-ov-item" }, el("h5", { text: x.title }), el("p", null, g(x.body)))));

    // Headline, numbers and summary stay visible; the long tail folds away.
    const more = el("details", { class: "corl-ov-more" },
      el("summary", null, el("span", { class: "corl-ov-more-open", text: T("ovMore") }),
        el("span", { class: "corl-ov-more-close", text: T("ovLess") }),
        el("i", { class: "bi bi-chevron-down", "aria-hidden": "true" })));
    more.open = wasOpen;
    more.addEventListener("toggle", () => { if (more.open) track("overview-more", "Read full overview"); });

    box.append(
      el("p", { class: "corl-ov-kicker", text: T("ovKicker") }),
      el("h3", { id: "corl-overview-title", class: "corl-ov-headline" }, g(o.headline)),
      (o.stats || []).length > 0 && el("dl", { class: "corl-ov-stats" },
        o.stats.map((s) => el("div", { class: "corl-ov-stat" },
          el("dt", { text: s.label }), el("dd", { text: s.value }), s.note ? el("span", null, g(s.note)) : null))),
      el("div", { class: "corl-ov-summary" }, (o.summary || []).map((p) => el("p", null, g(p)))),
      more
    );
    more.append(
      (o.themes || []).length > 0 && el("div", { class: "corl-ov-themes" },
        el("h4", { text: T("ovThemes") }),
        el("div", { class: "corl-ov-grid" }, o.themes.map((th) => el("article", { class: "corl-ov-theme" },
          el("h5", { text: th.title }),
          el("p", null, g(th.body)),
          (th.talks || []).length > 0 && el("p", { class: "corl-ov-refs" },
            el("span", { text: T("ovSee") }),
            th.talks.map(talkLink).filter(Boolean).flatMap((a, n) => n ? ["; ", a] : [a])))))),
      el("div", { class: "corl-ov-cols" },
        items(o.since_2025, T("ovSince"), "corl-ov-col"),
        items(o.outlook_2027, T("ovOutlook"), "corl-ov-col")),
      (o.takeaways || []).length > 0 && el("div", { class: "corl-ov-takeaways" },
        el("h4", { text: T("keyTakeaways") }),
        el("ol", null, o.takeaways.map((k) => el("li", null, g(k))))),
      (o.sources || []).length > 0 && el("p", { class: "corl-ov-sources" },
        el("span", { text: T("ovSources") }),
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

  /* ---------- Language switch ---------- */

  function initialLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(q)) return q;
    try { const s = localStorage.getItem("corl-lang"); if (LANGS.includes(s)) return s; } catch (e) { /* storage blocked */ }
    return "en";
  }

  function loadLang(lang) {
    if (lang === "en" || tr[lang]) return Promise.resolve();
    return fetch(DATA_URL.replace(".json", `.${lang}.json`))
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((j) => { tr[lang] = j; });
  }

  // Static text in the page header and filter bar. English is read from the HTML once.
  function applyStaticText() {
    const page = I18N[LANG].page || {};
    document.querySelectorAll("[data-i18n]").forEach((n) => {
      const k = n.dataset.i18n;
      if (n._en === undefined) n._en = n.innerHTML;
      n.innerHTML = (LANG !== "en" && page[k]) || n._en;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((n) => {
      for (const pair of n.dataset.i18nAttr.split(";")) {
        const [attr, k] = pair.split(":");
        n._enAttr = n._enAttr || {};
        if (n._enAttr[attr] === undefined) n._enAttr[attr] = n.getAttribute(attr);
        n.setAttribute(attr, (LANG !== "en" && page[k]) || n._enAttr[attr]);
      }
    });
    document.documentElement.lang = LANG_TAG[LANG];
    document.querySelectorAll(".corl-lang button").forEach((b) => {
      const on = b.dataset.lang === LANG;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  function rememberLang() {
    try { localStorage.setItem("corl-lang", LANG); } catch (e) { /* storage blocked */ }
    const params = new URLSearchParams(location.search);
    if (LANG === "en") params.delete("lang"); else params.set("lang", LANG);
    const qs = params.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  function setLang(lang, fromClick) {
    if (!LANGS.includes(lang)) lang = "en";
    return loadLang(lang).catch(() => {
      lang = "en";
      if (fromClick) alert(I18N.en.langError);
    }).then(() => {
      LANG = lang;
      applyStaticText();
      if (!data) return;
      localizeTalks();
      renderOverview();
      buildChips();
      syncControls();
      render();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".corl-lang button").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.lang === LANG) return;
      track(`lang/${b.dataset.lang}`, `Language: ${b.dataset.lang}`);
      setLang(b.dataset.lang, true).then(rememberLang);
    }));
    const lang = initialLang();
    Promise.all([
      fetch(DATA_URL).then((r) => {
        if (!r.ok) throw new Error(r.status + " " + r.statusText);
        return r.json();
      }),
      loadLang(lang).then(() => lang, () => "en")
    ])
      .then(([json, okLang]) => {
        LANG = okLang;
        // Keep ?lang= in the address so copied links keep the language; drop a stale or disabled one.
        if (LANG !== "en" || new URLSearchParams(location.search).has("lang")) rememberLang();
        applyStaticText();
        prepare(json);
        renderOverview();
        watchReachedTalks();
        const talkId = readHash();
        buildChips();
        bindControls();
        syncControls();
        render();
        if (talkId) focusTalk(talkId);
      })
      .catch((err) => {
        $("#corl-list").textContent = T("loadError", err.message);
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
