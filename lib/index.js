// dsh-paper-sizes — 纸张尺寸标准（ISO A/B/C 系列 + 常见印刷尺寸）。纯 Node。
import { defineTool } from "@deepseek-ai/dsh-tools";

const name = "纸张尺寸";
const inject = ["tools"];

// ISO 216 A 系列（mm）
const A = {
  "A0": [841, 1189], "A1": [594, 841], "A2": [420, 594], "A3": [297, 420],
  "A4": [210, 297], "A5": [148, 210], "A6": [105, 148], "A7": [74, 105], "A8": [52, 74],
};
// B 系列（mm）
const B = {
  "B0": [1000, 1414], "B1": [707, 1000], "B2": [500, 707], "B3": [353, 500],
  "B4": [250, 353], "B5": [176, 250], "B6": [125, 176], "B7": [88, 125],
};
// C 系列（信封，mm）
const C = {
  "C0": [917, 1297], "C1": [648, 917], "C2": [458, 648], "C3": [324, 458],
  "C4": [229, 324], "C5": [162, 229], "C6": [114, 162], "C7": [81, 114],
};
// 常见特殊尺寸（mm）
const SPECIAL = [
  { id: "Letter", size: [216, 279], note: "北美信纸，近 A4" },
  { id: "Legal", size: [216, 356], note: "北美法律文书" },
  { id: "Tabloid", size: [279, 432], note: "北美报纸/海报" },
  { id: "名帖", size: [90, 54], note: "常见名片（90×54mm）" },
  { id: "明信片", size: [148, 100], note: "标准明信片" },
];

function rows(map) {
  return Object.entries(map).map(([id, wh]) => ({ id, width: wh[0], height: wh[1] }));
}

async function apply(ctx, _config) {
  ctx.tools.register(defineTool({
    name: "paper_size",
    description: "查询纸张尺寸（ISO A/B/C 系列与 Letter/Legal 等）。`id` 传如 A4、B5、C4、Letter；返回宽高（mm）。",
    parameters: { id: { type: "string", required: true, description: "纸张型号，如 A4。" } },
    output: {
      schema: {
        type: "object", additionalProperties: false,
        properties: { id: { type: "string", required: true }, width_mm: { type: "number", required: true }, height_mm: { type: "number", required: true }, note: { type: "string", required: true } },
      },
      render: (_a, v) => [{ type: "text", text: `${v.id}：${v.width_mm} × ${v.height_mm} mm（${v.note}）` }],
    },
    execute: async (args) => {
      const key = String(args.id).trim().toUpperCase();
      const all = { ...A, ...B, ...C };
      if (all[key]) {
        const [w, h] = all[key];
        return { id: key, width_mm: w, height_mm: h, note: `${key} 系列` };
      }
      const sp = SPECIAL.find((s) => s.id.toUpperCase() === key);
      if (sp) return { id: sp.id, width_mm: sp.size[0], height_mm: sp.size[1], note: sp.note };
      throw new Error(`未知纸张型号：${args.id}（可用 A0-A8 / B0-B7 / C0-C7 / Letter / Legal / Tabloid 等）`);
    },
  }));

  ctx.tools.register(defineTool({
    name: "list_paper_sizes",
    description: "列出 ISO A/B/C 系列纸张尺寸（mm）与常见特殊尺寸。",
    parameters: {},
    output: {
      schema: {
        type: "object", additionalProperties: false,
        properties: {
          a: { type: "array", required: true, items: { type: "object", additionalProperties: false, properties: { id: { type: "string", required: true }, width: { type: "number", required: true }, height: { type: "number", required: true } } } },
          b: { type: "array", required: true, items: { type: "object", additionalProperties: false, properties: { id: { type: "string", required: true }, width: { type: "number", required: true }, height: { type: "number", required: true } } } },
          c: { type: "array", required: true, items: { type: "object", additionalProperties: false, properties: { id: { type: "string", required: true }, width: { type: "number", required: true }, height: { type: "number", required: true } } } },
          special: { type: "array", required: true, items: { type: "object", additionalProperties: false, properties: { id: { type: "string", required: true }, width: { type: "number", required: true }, height: { type: "number", required: true }, note: { type: "string", required: true } } } },
        },
      },
      render: (_a, v) => [{ type: "text", text: "A 系列：\n" + v.a.map((r) => `  ${r.id} ${r.width}×${r.height}mm`).join("\n") + "\nB 系列：\n" + v.b.map((r) => `  ${r.id} ${r.width}×${r.height}mm`).join("\n") + "\nC 系列（信封）：\n" + v.c.map((r) => `  ${r.id} ${r.width}×${r.height}mm`).join("\n") + "\n特殊：\n" + v.special.map((r) => `  ${r.id} ${r.width}×${r.height}mm（${r.note}）`).join("\n") }],
    },
    execute: async () => ({ a: rows(A), b: rows(B), c: rows(C), special: SPECIAL.map((s) => ({ id: s.id, width: s.size[0], height: s.size[1], note: s.note })) }),
  }));

  ctx.tools.register(defineTool({
    name: "paper_scale",
    description: "返回纸张缩放换算：同系列相邻型号面积差一倍（长边对折得到下一型号），并给出缩放比例。",
    parameters: { id: { type: "string", required: true, description: "纸张型号，如 A4。" } },
    output: {
      schema: {
        type: "object", additionalProperties: false,
        properties: { id: { type: "string", required: true }, half: { type: "string", required: true }, double: { type: "string", required: true }, scale: { type: "number", required: true } },
      },
      render: (_a, v) => [{ type: "text", text: `${v.id} 对半裁切 → ${v.half}，放大一倍 → ${v.double}（面积缩放 ${v.scale}）` }],
    },
    execute: async (args) => {
      const key = String(args.id).trim().toUpperCase();
      const m = key.match(/^([ABC])(\d+)$/);
      if (!m) throw new Error(`无法识别型号：${args.id}（如 A4、B5、C4）`);
      const series = m[1], n = Number(m[2]);
      const half = n + 1 <= (series === "A" ? 8 : 7) ? `${series}${n + 1}` : "（已超出系列）";
      const double = n - 1 >= 0 ? `${series}${n - 1}` : "（已超出系列）";
      return { id: key, half, double, scale: 0.5 };
    },
  }));
}

export { apply, inject, name };
