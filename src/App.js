import React, { useMemo, useState, useRef, useEffect} from "react";
import "./App.css";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/** —— 配色 —— */
const COLORS = {
  O: "#49d3c7",
  C: "#409be8",
  E: "#f6ad55",
  A: "#f687b3",
  N: "#9f7aea",
};
const PAGE_SIZE = 5;
const BASELINE = 3.0;

/** —— 50 题题库（每维 10 题）—— */
const QUESTIONS = [
  // 🌈 开放性 (O)
  { id: 1, text: "我喜欢尝试新事物，对未知充满好奇。", type: "O" },
  { id: 2, text: "我常常对艺术、音乐或文学作品保持兴趣。", type: "O" },
  { id: 3, text: "我愿意思考不同观点，并乐于接受新想法。", type: "O" },
  { id: 4, text: "我对抽象的思想或哲学问题感到好奇。", type: "O" },
  { id: 5, text: "我乐于打破常规，尝试不同的做事方式。", type: "O" },
  { id: 6, text: "我喜欢探索新的文化、食物或地方。", type: "O" },
  { id: 7, text: "我喜欢头脑风暴，提出新点子。", type: "O" },
  { id: 8, text: "我愿意接受与自己不同的观点。", type: "O" },
  { id: 9, text: "我在面对变化时感到兴奋，而不是害怕。", type: "O" },
  { id: 10, text: "我倾向于关注未来的可能性，而不仅仅是现在。", type: "O" },
  // 💼 尽责性 (C)
  { id: 11, text: "我做事情前通常会有计划。", type: "C" },
  { id: 12, text: "我对自己的承诺会认真执行。", type: "C" },
  { id: 13, text: "我会为自己设定目标并努力实现。", type: "C" },
  { id: 14, text: "我喜欢有条理的环境，不喜欢混乱。", type: "C" },
  { id: 15, text: "我觉得细节很重要，会认真核对。", type: "C" },
  { id: 16, text: "我能长时间专注完成一件事。", type: "C" },
  { id: 17, text: "我通常按时完成任务。", type: "C" },
  { id: 18, text: "我在团队中经常承担起责任。", type: "C" },
  { id: 19, text: "我会检查自己的进展以确保达标。", type: "C" },
  { id: 20, text: "我喜欢把事情做到最好。", type: "C" },
  // 🔆 外向性 (E)
  { id: 21, text: "我喜欢与人交往并从中获得能量。", type: "E" },
  { id: 22, text: "我在社交场合中表现活跃。", type: "E" },
  { id: 23, text: "我常常主动开启对话或活动。", type: "E" },
  { id: 24, text: "我喜欢成为注意力的焦点。", type: "E" },
  { id: 25, text: "我很容易与陌生人聊天。", type: "E" },
  { id: 26, text: "我喜欢团队合作胜过单独工作。", type: "E" },
  { id: 27, text: "我精力充沛，很少感到无聊。", type: "E" },
  { id: 28, text: "我在聚会中通常是最活跃的人。", type: "E" },
  { id: 29, text: "我喜欢结交新朋友。", type: "E" },
  { id: 30, text: "我愿意主动表达自己的意见。", type: "E" },
  // 💖 宜人性 (A)
  { id: 31, text: "我乐于帮助他人解决问题。", type: "A" },
  { id: 32, text: "我倾向于相信他人是善良的。", type: "A" },
  { id: 33, text: "我愿意倾听他人的烦恼。", type: "A" },
  { id: 34, text: "我喜欢与他人合作，而不是竞争。", type: "A" },
  { id: 35, text: "我重视人际关系的和谐。", type: "A" },
  { id: 36, text: "我常常体谅他人的处境。", type: "A" },
  { id: 37, text: "我容易宽恕别人的错误。", type: "A" },
  { id: 38, text: "我倾向于避免冲突。", type: "A" },
  { id: 39, text: "我愿意让步以维持良好关系。", type: "A" },
  { id: 40, text: "我认为共赢比输赢更重要。", type: "A" },
  // 🌧️ 神经质／情绪稳定性 (N)
  { id: 41, text: "我常常为小事感到焦虑。", type: "N" },
  { id: 42, text: "我容易因批评而情绪低落。", type: "N" },
  { id: 43, text: "我在压力下容易紧张或激动。", type: "N" },
  { id: 44, text: "我有时候会过度担心未来。", type: "N" },
  { id: 45, text: "我对他人的看法很敏感。", type: "N" },
  { id: 46, text: "我经常需要较长时间才能从失败中恢复。", type: "N" },
  { id: 47, text: "我容易被情绪波动影响。", type: "N" },
  { id: 48, text: "我有时会感到自己不够好。", type: "N" },
  { id: 49, text: "我比别人更容易感到紧张。", type: "N" },
  { id: 50, text: "我常常难以控制自己的情绪反应。", type: "N" },
];

/** —— 各维度「子因子」定义（5 个/维）—— */
const SUBFACTORS = {
  O: ["想象力", "抽象思维", "求新求变", "包容开放", "变化适应"],
  C: ["条理性", "责任感", "目标达成", "自律程度", "谨慎稳妥"],
  E: ["活力", "社交倾向", "自我表达", "主导性", "积极情绪"],
  A: ["共情", "信任", "合作", "宽容", "冲突回避"],
  N: ["情绪敏感", "压力反应", "自我怀疑", "恢复力", "焦虑倾向"],
};

/** —— 维度中文名 —— */
const CN = { O: "开放性", C: "尽责性", E: "外向性", A: "宜人性", N: "情绪稳定性" };

/** —— 等级标签 —— */
function levelTag(score) {
  if (score >= 4) return { tag: "高分", className: "tag tag-high" };
  if (score >= 3) return { tag: "中等", className: "tag tag-mid" };
  return { tag: "低分", className: "tag tag-low" };
}

/** —— 维度个性化说明与建议（基于分数段） —— */
function traitAdvice(trait, score) {
  const high = {
    O: {
      show: ["创意足、喜欢探索新方法与新领域", "思想开放、能整合多元观点"],
      tips: ["把创意落到结构化项目上：从原型→验证→规模化", "为团队建立“创新日/探新卡片”制度"],
    },
    C: {
      show: ["自律可靠、执行力强、注重质量", "擅长设定目标并推进落地"],
      tips: ["避免“完美主义拖延”，为任务设置 80/20 完成阈值", "尝试委托与复盘，提升产能"],
    },
    E: {
      show: ["外向活跃、善于表达与影响", "在群体中能够快速建立连接"],
      tips: ["训练“倾听 60% / 表达 40%”的沟通节奏", "将能量投入到可衡量的成果上"],
    },
    A: {
      show: ["温和友善、善解人意、擅长协作", "能够维持人际关系稳定"],
      tips: ["保持边界感：在“好说话”与“好说不”之间找到平衡", "用“期望-反馈-感谢”三步法处理分歧"],
    },
    N: {
      show: ["情绪更稳定、抗压性较好", "遇到挑战能较快恢复"],
      tips: ["在稳定区之外设置“训练区”小挑战", "用运动/冥想维持情绪资本"],
    },
  };
  const mid = {
    O: {
      show: ["能在稳定与变化之间取得平衡", "对新鲜事物有选择地接受"],
      tips: ["每月尝试一个小新事物，降低变化的心理成本", "记录一次“从好奇到实践”的闭环"],
    },
    C: {
      show: ["条理度尚可，能按计划完成任务", "在复杂任务上偶有失衡"],
      tips: ["把任务拆成 ≤25 分钟的番茄钟", "用“周目标-日三件事”降低负荷"],
    },
    E: {
      show: ["在舒适圈内社交自然", "表达顺畅但不抢镜"],
      tips: ["练习提问式沟通：5 个开放问题带动交流", "每周两次主动同步进展"],
    },
    A: {
      show: ["乐于合作也能坚守原则", "能在适当时表达不同意见"],
      tips: ["冲突情境里先复述对方观点再表达立场", "将反馈写成“事实-感受-请求”"],
    },
    N: {
      show: ["对压力敏感度适中", "能自我调节，但波动时需要外部支持"],
      tips: ["建立“情绪刻度表”(1-10) 并记录触发因素", "采用“睡前卸载法”写下担忧清单"],
    },
  };
  const low = {
    O: {
      show: ["偏好已验证的方法，谨慎面对变化", "在创意讨论中更关注现实限制"],
      tips: ["为变化设置“安全阈值”：先微调再大改", "给自己 2 周一个“微创新”目标"],
    },
    C: {
      show: ["更享受当下，容易随性", "在组织性与稳定执行上有提升空间"],
      tips: ["建立固定的晨间例行与日清单", "用“环境引导法”减少分心（手机折叠、番茄钟）"],
    },
    E: {
      show: ["社交偏保守，倾向深度而非广度", "更适合一对一或小组沟通"],
      tips: ["准备 3 个常用自我介绍版本", "用“先书面、后口头”的方式提升表达效率"],
    },
    A: {
      show: ["更关注原则与事实，直率表达", "冲突中偏理性评估"],
      tips: ["练习“同理心三问”：他在乎什么？担心什么？需要什么？", "在重要协作前对齐预期与边界"],
    },
    N: {
      show: ["情绪更敏感、容易受环境影响", "压力下恢复较慢"],
      tips: ["建立“复原流程”：呼吸 4-7-8 → 记录 → 行动", "为自己设置稳定的睡眠与运动仪式"],
    },
  };

  if (score >= 4) return high[trait];
  if (score >= 3) return mid[trait];
  return low[trait];
}

/** —— 八卦推断 —— */
function baguaKeyByScores(avgs) {
  const { O, C, E, A, N } = avgs;
  const yang = (O || 0) + (E || 0); // 创新/表达
  const yin = (C || 0) + (A || 0) + (N || 0); // 稳定/协作/内省
  const top = Object.entries(avgs).sort((a, b) => b[1] - a[1])[0][0];
  if (yang >= yin) {
    if (top === "O") return "乾";
    if (top === "E") return "离";
    if (top === "C") return "震";
    if (top === "A") return "兑";
    return "乾";
  } else {
    if (top === "C") return "艮";
    if (top === "A") return "巽";
    if (top === "N") return "坎";
    return "坤";
  }
}

/** —— 八卦文化内容（东方智慧分析）—— */
const BAGUA = {
  乾: {
    icon: "☰",
    name: "乾（天）｜创新型领导者",
    meaning: "天行健，君子以自强不息。",
    psyche: ["志向高远、目标敏锐、擅定方向", "意志坚定，行动果断"],
    grow: [
      "学会“收”：为计划留出 20% 弹性，避免过载。",
      "设“反对者角色”，故意寻找反例校准盲点。",
      "将愿景拆分为季度-月-周里程碑，迭代胜过跃进。",
    ],
    hint: "乾为天，贵在持久。以恒心兑现愿景，比一时炫目更重要。",
  },
  坤: {
    icon: "☷",
    name: "坤（地）｜稳定型支持者",
    meaning: "地势坤，君子以厚德载物。",
    psyche: ["包容温厚、耐心踏实、能托底", "乐于成全他人，可靠度高"],
    grow: [
      "建立“温柔的边界”：清晰说出不能做/不能承诺的范围。",
      "每周一次“主导时段”，主动推动一个改进点。",
      "给支持工作设置“可衡量产出”，从隐形走向可见。",
    ],
    hint: "坤为地，重在滋养。助人亦要助己，平衡给予与自护。",
  },
  离: {
    icon: "☲",
    name: "离（火）｜表达与灵感者",
    meaning: "日中则昃，月盈则食。",
    psyche: ["表达力强、感染力足、善连接", "富灵感与审美，期待被理解"],
    grow: [
      "让热情落地：采用“结论-依据-例子”的结构化表达。",
      "降低对外部认可的依赖，建立自我评估标准。",
      "每次沟通加入“复述-确认-推进”三步，闭环共识。",
    ],
    hint: "离为火，贵在温度。热力需要节奏，光亮也需界限。",
  },
  坎: {
    icon: "☵",
    name: "坎（水）｜理性与内省者",
    meaning: "习坎入坎，心定则渡。",
    psyche: ["洞察深、风险意识强、思虑缜密", "情绪起伏时更需安全感"],
    grow: [
      "用“可控/不可控”清单管理担忧，把精力投向可控。",
      "建立“复原流程”：呼吸 4-7-8 → 记录 → 行动。",
      "为自己设计“低风险试水”，逐步扩展边界。",
    ],
    hint: "坎为水，重在流动。接纳波动，保持流向与出路。",
  },
  震: {
    icon: "☳",
    name: "震（雷）｜行动与推动者",
    meaning: "震来虩虩，恐致其福。",
    psyche: ["反应快、敢破局、能开局", "执行力强，偏好即时行动"],
    grow: [
      "设置“12 小时延迟判断”，避免热冲动造成失误。",
      "行动-复盘成对：每推进 3 步就做一次复盘。",
      "把速度用于“关键路径”，其他事项学会放手。",
    ],
    hint: "震为雷，贵在节律。快不等于乱，动要有章法。",
  },
  巽: {
    icon: "☴",
    name: "巽（风）｜协作与感知者",
    meaning: "巽以申命，行而不争。",
    psyche: ["敏锐通融、洞察情感、擅协调", "重和谐，偶有犹豫"],
    grow: [
      "明确边界与时限：决策设定“48 小时窗口”。",
      "用事实与数据支撑判断，减少情绪反复。",
      "将感受力转化为洞察力：先理解，再引导。",
    ],
    hint: "巽为风，重在入局。随风而行非随波逐流。",
  },
  艮: {
    icon: "☶",
    name: "艮（山）｜自律与守护者",
    meaning: "艮其背，不获其身。",
    psyche: ["稳重克制、耐心专注、质量导向", "完美主义倾向"],
    grow: [
      "允许“80 分完成”，把时间释放给复盘与优化。",
      "定期“止于当止”清单：停下无效执念。",
      "加入放松训练：舒缓→扩展弹性→再专注。",
    ],
    hint: "艮为山，贵在安定中求通达，耐心不等于封闭。",
  },
  兑: {
    icon: "☱",
    name: "兑（泽）｜愉悦与连接者",
    meaning: "丽泽，兑，君子以朋友讲习。",
    psyche: ["亲和力强、让人放松、善社交", "情绪驱动，取舍不易"],
    grow: [
      "明确“价值优先级”，避免被情绪牵引决策。",
      "在热情与独处中找到节拍：输出-充电循环。",
      "练习“换位三问”，同时守住原则与温度。",
    ],
    hint: "兑为泽，重在润物。喜悦是力量，但须有边界与深度。",
  },
  坤兮补: {}, // 占位，无用
};

/** —— 生成青绿色 SVG 卦图（内联 DataURL）—— */
function svgBadge(unicode) {
  const svg = `
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="35%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#e8f7f4"/>
      <stop offset="100%" stop-color="#c9efe7"/>
    </radialGradient>
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#g)" stroke="#2b7a78" stroke-width="2"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="28" fill="#2b7a78">${unicode}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** —— 子因子平均分计算（每维 10 题 → 2 题/子因子）—— */
function computeSubfactorScores(answers) {
  const map = { O: 1, C: 11, E: 21, A: 31, N: 41 };
  const result = {};
  Object.keys(map).forEach((t) => {
    const start = map[t];
    const parts = [];
    for (let i = 0; i < 5; i++) {
      const a = answers[start + i * 2] || 0;
      const b = answers[start + i * 2 + 1] || 0;
      const avg = (a + b) / 2 || 0;
      parts.push(Number(avg.toFixed(2)));
    }
    result[t] = parts;
  });
  return result;
}

function App() {
  const [answers, setAnswers] = useState({});
  const [page, setPage] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const resultRef = useRef(null);

  const totalPages = Math.ceil(QUESTIONS.length / PAGE_SIZE);

  // 检查是否已完成测试
  useEffect(() => {
    const lsFlag = localStorage.getItem("tested_bigfive") === "true";
    const cookieFlag = document.cookie.split(";").some(c => c.trim().startsWith("tested_bigfive="));
    if (lsFlag && cookieFlag) {
      setAlreadyDone(true);
    }
  }, []);

  /** —— 分页 —— */
  const pageQuestions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return QUESTIONS.slice(start, start + PAGE_SIZE);
  }, [page]);

  const canNext = pageQuestions.every((q) => answers[q.id] != null);

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: Number(value) }));
  };

  const handleNext = () => {
  if (!canNext) return alert("请先完成本页所有题目");

  if (page < totalPages) {
    setPage((p) => p + 1);
  } else {
    // 最后一页，提交测评 + 设置“已完成”标记
    localStorage.setItem("tested_bigfive", "true");
    document.cookie = "tested_bigfive=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";

    setSubmitted(true);
    setAlreadyDone(true);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  /** —— 总分与均分 —— */
  const totals = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const counts = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  QUESTIONS.forEach((q) => {
    const v = answers[q.id] || 0;
    totals[q.type] += v;
    counts[q.type] += 1;
  });
  const avgs = {
    O: totals.O / counts.O || 0,
    C: totals.C / counts.C || 0,
    E: totals.E / counts.E || 0,
    A: totals.A / counts.A || 0,
    N: totals.N / counts.N || 0,
  };
  const fmt = (x) => (typeof x === "number" ? x.toFixed(2) : x);

  /** —— 概览图数据 —— */
  const radarData = [
    { type: "开放性 (O)", value: avgs.O },
    { type: "尽责性 (C)", value: avgs.C },
    { type: "外向性 (E)", value: avgs.E },
    { type: "宜人性 (A)", value: avgs.A },
    { type: "情绪稳定性 (N)", value: avgs.N },
  ];
  const barData = [
    { name: "开放性", value: avgs.O, fill: COLORS.O },
    { name: "尽责性", value: avgs.C, fill: COLORS.C },
    { name: "外向性", value: avgs.E, fill: COLORS.E },
    { name: "宜人性", value: avgs.A, fill: COLORS.A },
    { name: "情绪稳定性", value: avgs.N, fill: COLORS.N },
  ];

  /** —— 个人画像摘要 —— */
  const ranking = Object.entries(avgs)
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => b.v - a.v);
  const strengths = ranking.slice(0, 2).map((r) => CN[r.k]);
  const weakness = ranking[ranking.length - 1].k;
  const summaryAdvices = [
    `核心优势：${strengths.join("、")} 维度表现突出。`,
    `建议：将优势“场景化”，在学习/工作中主动承担与这两类特质匹配的任务（如：${strengths
      .map((n) => (n === "尽责性" ? "进度管理" : n === "开放性" ? "创意探索" : n))
      .join(" + ")}）。`,
    `优先改进：${CN[weakness]}。从下方“实操建议”中挑 1–2 条，设置一个 2 周可验证的小目标。`,
  ];

  /** —— 子因子分 —— */
  const subScores = computeSubfactorScores(answers);

  /** —— 八卦象限 —— */
  const baguaKey = baguaKeyByScores(avgs);

  /** —— PDF 导出 —— */
/** —— PDF 导出（单页 + 背景水印均匀、不重复、不挡内容） —— */
const handleDownloadPDF = async () => {
  const element = resultRef.current;
  if (!element) return;

  try {
    setExporting(true);

    // 隐藏按钮，防止出现在 PDF 中
    const buttons = element.querySelectorAll(".nav button");
    buttons.forEach(btn => (btn.style.visibility = "hidden"));

    // 等待页面完全渲染
    window.scrollTo(0, 0);
    await new Promise(r =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );

    // 捕获整个结果页面
    const totalWidth = element.scrollWidth;
    const totalHeight = element.scrollHeight;
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: totalWidth,
      height: totalHeight,
      windowWidth: totalWidth,
      windowHeight: totalHeight,
      scrollX: 0,
      scrollY: -window.scrollY,
    });

    // 创建副本画布加水印
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, 0);

    // ======== 添加淡色水印 ========
    const watermarkText = "自愈力研究所 · 测评报告";
    ctx.font = "bold 80px 'Noto Sans SC', sans-serif";
    ctx.fillStyle = "rgba(180, 220, 220, 0.10)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const angle = (-35 * Math.PI) / 180;
    ctx.save();
    ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    ctx.rotate(angle);

    // 根据旋转角度调整实际间距（保持视觉均匀）
    const spacing = 1100; // 原始间距
    const xSpacing = spacing / Math.cos(angle); // 水平方向补偿
    const ySpacing = spacing / Math.cos(angle); // 垂直方向补偿

    const cols = Math.ceil(tempCanvas.width / xSpacing) + 2;
    const rows = Math.ceil(tempCanvas.height / ySpacing) + 2;

    for (let i = -cols; i <= cols; i++) {
      for (let j = -rows; j <= rows; j++) {
        ctx.fillText(watermarkText, i * xSpacing, j * ySpacing);
      }
    }

    ctx.restore();
    // ======== 水印结束 ========

    // 输出 PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth() - 16;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const customPageHeight = imgHeight + 16;
    pdf.internal.pageSize.height = customPageHeight;
    pdf.setFont("NotoSansCJKsc-Regular", "normal");
    pdf.addImage(tempCanvas.toDataURL("image/png", 1.0), "PNG", 8, 8, imgWidth, imgHeight);

    pdf.save("自愈力研究所_OCEAN测评报告.pdf");
  } catch (e) {
    console.error(e);
    alert("导出失败，请重试。");
  } finally {
    // 恢复按钮
    const buttons = resultRef.current?.querySelectorAll(".nav button");
    buttons?.forEach(btn => (btn.style.visibility = "visible"));
    setExporting(false);
  }
};


  /** —— 页面动画 —— */
  const pageVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>大五人格测评（OCEAN）</h1>
        <p className="sub">比 MBTI 更稳定、更精准的科学人格模型 · 自愈力研究所</p>
      </header>

      {/* —— 问卷 —— */}
      {/* —— 已测过：阻止继续 —— */}
{alreadyDone && !submitted ? (
  <div
    className="card"
    style={{
      padding: "45px 30px",
      textAlign: "center",
      borderRadius: 24,
      background: "#ffffff",
      border: "1px solid #e3f1ef",
      boxShadow: "0 10px 30px rgba(0,0,0,0.07)",
    }}
  >
    <div
      style={{
        marginBottom: 18,
        display: "inline-block",
        padding: "18px 24px",
        borderRadius: "50%",
        background: "rgba(43, 122, 120, 0.1)",
      }}
    >
      <span style={{ fontSize: 34, color: "#2b7a78" }}>🔒</span>
    </div>

    <h2
      className="section-title"
      style={{
        fontSize: 28,
        marginBottom: 12,
        color: "#1d4946",
        letterSpacing: "0.8px",
      }}
    >
      测评访问已锁定
    </h2>

    <p
      style={{
        marginTop: 12,
        fontSize: 16,
        color: "#40514e",
        lineHeight: 1.85,
      }}
    >
      你已经完成过本次 OCEAN 大五人格测评。
      <br />
      为确保结果的科学性与稳定性，每位用户仅可参与一次。
    </p>

    <div
      style={{
        marginTop: 32,
        padding: "22px 26px",
        borderRadius: 18,
        background: "linear-gradient(135deg, #e5f8f4 0%, #d4efe9 100%)",
        textAlign: "left",
        fontSize: 15.5,
        color: "#1f4745",
        lineHeight: 1.8,
        boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: 6,
          color: "#2b7a78",
        }}
      >
        📌 测评说明
      </div>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        <li>你的结果已成功被系统记录。</li>
        <li>系统检测到你之前已经完成过此测评，因此当前入口已关闭。</li>
        <li>本测评侧重趣味与自我认知，仅供参考，不代表专业心理结论。</li>
      </ul>
    </div>
  </div>
) : !submitted ? (
  /* —— 问卷 —— */
  <div className="card">
    <AnimatePresence mode="wait">
      <motion.div
        key={page}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="progress-wrap">
          <div className="progress-top">
            <span>进度</span>
            <span>
              {(
                (page / Math.ceil(QUESTIONS.length / PAGE_SIZE)) *
                100
              ).toFixed(0)}
              %
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-inner"
              style={{
                width: `${
                  (page / Math.ceil(QUESTIONS.length / PAGE_SIZE)) * 100
                }%`,
              }}
            />
          </div>
        </div>

        <h2 className="section-title">
          第 {page} 页 / 共 {Math.ceil(QUESTIONS.length / PAGE_SIZE)} 页
        </h2>

        <div className="q-list">
          {pageQuestions.map((q) => (
            <div key={q.id} className="q-item">
              <div className="q-text">
                <span className="q-id">{q.id}</span>
                <span>{q.text}</span>
              </div>
              <div className="likert">
                {[1, 2, 3, 4, 5].map((v) => (
                  <label
                    key={v}
                    className={`likert-option ${
                      answers[q.id] === v ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      value={v}
                      checked={answers[q.id] === v}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                    />
                    <div className="dot" />
                    <div className="lbl">{v}</div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="nav">
          {page > 1 && (
            <button className="btn ghost" onClick={handlePrev}>
              上一页
            </button>
          )}
          <button
            className="btn primary"
            onClick={handleNext}
            disabled={!canNext}
          >
            {page < totalPages ? "下一页" : "提交测评"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
) : (
  /* —— 结果页 —— */
  <motion.div
    ref={resultRef}
    className="card"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    {/* 概览摘要卡片 */}
    <h2 className="section-title center">测评结果</h2>
    <div className="summary-grid">
      {["O", "C", "E", "A", "N"].map((t) => {
        const lev = levelTag(avgs[t]);
        return (
          <div className="sum-card" key={t}>
            <div className="sum-top">
              <div className="sum-name">{CN[t]}</div>
              <span className={lev.className}>{lev.tag}</span>
            </div>
            <div className="sum-score">{fmt(avgs[t])}</div>
            <div className="sum-brief">
              {t === "O" && "想象力 / 创新 / 接纳新事物"}
              {t === "C" && "自律 / 条理 / 目标达成"}
              {t === "E" && "活力 / 表达 / 社交倾向"}
              {t === "A" && "共情 / 合作 / 信任"}
              {t === "N" && "情绪调节 / 抗压"}
            </div>
          </div>
        );
      })}
    </div>

    {/* 图表区 */}
    <div className="charts-grid">
      <div className="chart-card">
        <div className="chart-title">五维度柱状对比</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[1, 5]} />
            <Tooltip />
            <ReferenceLine
              y={BASELINE}
              label="平均线"
              stroke="#94b8b5"
              strokeDasharray="4 3"
            />
            <Bar dataKey="value">
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v) => Number(v).toFixed(2)}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-card">
        <div className="chart-title">五维度雷达图</div>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="type" />
            <PolarRadiusAxis domain={[1, 5]} />
            <Radar
              name="平均分"
              dataKey="value"
              stroke="#2b7364"
              fill="#9de3d1"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* 个人画像摘要 */}
    <div className="profile">
      <div className="profile-title">个人画像摘要</div>
      <div className="profile-grid">
        <div className="profile-card">
          <div className="profile-subtitle">优势倾向</div>
          <ul className="bullet">
            {summaryAdvices.slice(0, 2).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="profile-card">
          <div className="profile-subtitle">可能的风险点</div>
          <ul className="bullet">
            <li>较弱维度：{CN[weakness]}（建议优先改进）。</li>
            <li>
              做法：从该维度“实操建议”中挑 1–2 条，设置 2 周可验证的小目标。
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* 维度详情 */}
    <div className="detail">
      {["O", "C", "E", "A", "N"].map((t) => {
        const lev = levelTag(avgs[t]);
        const advice = traitAdvice(t, avgs[t]);
        const subs = SUBFACTORS[t];
        const values = subScores[t];
        const data = subs.map((name, idx) => ({
          name,
          value: values[idx] || 0,
        }));
        return (
          <div className="detail-card" key={t}>
            <div className="detail-head">
              <div className="detail-name">
                {CN[t]}（{t}）
              </div>
              <div className="detail-score">
                <span className={lev.className}>{lev.tag}</span>
                <span className="num" style={{ marginLeft: 8 }}>
                  {fmt(avgs[t])}
                </span>
              </div>
            </div>
            <div className="detail-brief">
              {t === "O" && "想象力 / 创新 / 接纳新事物"}
              {t === "C" && "自律 / 条理 / 目标达成"}
              {t === "E" && "活力 / 表达 / 社交倾向"}
              {t === "A" && "共情 / 合作 / 信任"}
              {t === "N" && "情绪调节 / 抗压"}
            </div>

            <div className="subchart">
              <div className="chart-title sm">子因子分布</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[1, 5]} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.map((_, idx) => {
                      const shadeSets = {
                        O: ["#0f8b83", "#27a59c", "#49d3c7", "#7de4da", "#baf2eb"],
                        C: ["#1f4fb8", "#3670cc", "#5d94e0", "#8bb8f2", "#bcd5fa"],
                        E: ["#c46a00", "#e38320", "#f6ad55", "#f9c98b", "#fde2b9"],
                        A: ["#b3367d", "#d15595", "#f687b3", "#fab8d2", "#fcd7e8"],
                        N: ["#5e34b1", "#7a4dcc", "#9f7aea", "#c3a5f4", "#e2ccfb"],
                      };
                      return <Cell key={idx} fill={shadeSets[t][idx]} />;
                    })}
                    <LabelList dataKey="value" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="advice">
              <div>
                <div className="advice-title">您可能的表现</div>
                <ul className="bullet">
                  {advice.show.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="advice-title">提升建议</div>
                <ul className="bullet">
                  {advice.tips.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* —— 东方智慧分析 —— */}
    <div className="detail-card" style={{ marginTop: 16 }}>
      <div className="detail-head">
        <div className="detail-name">东方智慧分析（阴阳八卦人格）</div>
        <div className="detail-score">
          <span className="num">
            您的主象：{BAGUA[baguaKey].icon} {BAGUA[baguaKey].name}
          </span>
        </div>
      </div>

      <div className="profile-grid" style={{ marginTop: 12 }}>
        {["乾", "坤", "震", "巽", "坎", "离", "艮", "兑"].map((k) => {
          const it = BAGUA[k];
          return (
            <div className="profile-card" key={k}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <img
                  src={svgBadge(it.icon)}
                  alt={it.name}
                  width={44}
                  height={44}
                />
                <div className="profile-subtitle">{it.name}</div>
              </div>
              <div className="detail-brief" style={{ marginBottom: 6 }}>
                <strong>象征含义：</strong>
                {it.meaning}
              </div>
              <div className="advice" style={{ gridTemplateColumns: "1fr" }}>
                <div>
                  <div className="advice-title">心理特征</div>
                  <ul className="bullet">
                    {it.psyche.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="advice-title">成长方向</div>
                  <ul className="bullet">
                    {it.grow.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="desc" style={{ marginTop: 6 }}>
                <em>文化启示：</em> {it.hint}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* 按钮：只保留导出报告 */}
    <div className="nav" style={{ justifyContent: "center" }}>
      <button
        className="btn primary"
        onClick={handleDownloadPDF}
        disabled={exporting}
      >
        {exporting ? "生成中..." : "📄 导出报告"}
      </button>
    </div>
  </motion.div>
)}


      <footer className="footer">© 2025 自愈力研究所 | OCEAN 测评报告</footer>
    </div>
  );
}

export default App;
