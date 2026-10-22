import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

type MarkdownBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; text: string }
  | { kind: "table"; rows: string[][] };

function cleanMarkdown(value: string) {
  return value.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`([^`]+)`/g, "$1").trim();
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r/g, "").split("\n");
  let paragraph: string[] = [];
  let tableRows: string[][] = [];

  const flushParagraph = () => {
    const value = paragraph.join(" ").trim();
    if (value) blocks.push({ kind: "paragraph", text: cleanMarkdown(value) });
    paragraph = [];
  };
  const flushTable = () => {
    if (tableRows.length) blocks.push({ kind: "table", rows: tableRows });
    tableRows = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushTable();
      blocks.push({ kind: "heading", level: heading[1].length, text: cleanMarkdown(heading[2]) });
    } else if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushParagraph();
      const cells = trimmed.slice(1, -1).split("|").map((cell) => cleanMarkdown(cell));
      if (!cells.every((cell) => /^:?-{2,}:?$/.test(cell))) tableRows.push(cells);
    } else if (/^[-*+]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      flushParagraph(); flushTable();
      blocks.push({ kind: "list", text: cleanMarkdown(trimmed.replace(/^([-*+]\s+|\d+[.)]\s+)/, "")) });
    } else if (!trimmed) {
      flushParagraph(); flushTable();
    } else {
      flushTable();
      paragraph.push(trimmed.replace(/^>\s?/, ""));
    }
  }
  flushParagraph(); flushTable();
  return blocks;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadReportDocx(
  markdown: string,
  filename: string,
  options?: { title?: string; isAr?: boolean }
) {
  const isAr = options?.isAr ?? /[\u0600-\u06FF]/.test(markdown);
  const title = options?.title || (isAr ? "مذكرة القرار المؤسسي التنفيذي" : "RippleIQ Decision Brief");
  const subtitle = isAr
    ? "تحليل آثار القرارات المؤسسية · وثيقة استراتيجية خاضعة للحوكمة والمراجعة البشرية"
    : "Decision impact analysis · Human review required";

  const content: (Paragraph | Table)[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
      alignment: isAr ? "right" : "left",
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: subtitle,
          italics: true,
          color: "64748B",
        }),
      ],
      spacing: { after: 360 },
      alignment: isAr ? "right" : "left",
    }),
  ];

  for (const block of parseMarkdown(markdown)) {
    if (block.kind === "heading") {
      const heading = block.level === 1 ? HeadingLevel.HEADING_1 : block.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      content.push(
        new Paragraph({
          text: block.text,
          heading,
          spacing: { before: 200, after: 100 },
          keepNext: true,
          alignment: isAr ? "right" : "left",
        })
      );
    } else if (block.kind === "paragraph") {
      content.push(
        new Paragraph({
          text: block.text,
          spacing: { after: 120 },
          alignment: isAr ? "right" : "left",
        })
      );
    } else if (block.kind === "list") {
      content.push(
        new Paragraph({
          text: block.text,
          bullet: { level: 0 },
          spacing: { after: 70 },
          alignment: isAr ? "right" : "left",
        })
      );
    } else {
      const columnCount = Math.max(1, ...block.rows.map((row) => row.length));
      const cellWidth = Math.floor(9360 / columnCount);
      const rows = block.rows.map((row, rowIndex) => new TableRow({
        tableHeader: rowIndex === 0,
        children: Array.from({ length: columnCount }, (_, index) => new TableCell({
          width: { size: cellWidth, type: WidthType.DXA },
          shading: rowIndex === 0 ? { fill: "E0E7FF" } : undefined,
          children: [
            new Paragraph({
              children: [new TextRun({ text: row[index] ?? "", bold: rowIndex === 0 })],
              alignment: isAr ? "right" : "left",
            }),
          ],
        })),
      }));
      content.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: Array.from({ length: columnCount }, () => cellWidth),
        rows,
        borders: Object.fromEntries(["top", "bottom", "left", "right", "insideHorizontal", "insideVertical"].map((side) => [side, { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" }])) as never,
      }));
      content.push(new Paragraph({ text: "", spacing: { after: 100 } }));
    }
  }

  if (!/human review|مراجعة بشرية/i.test(markdown)) {
    content.push(
      new Paragraph({
        text: isAr
          ? "تنبيه الحوكمة: هذه المحاكاة استشرافية لدعم اتخاذ القرار ولا تغني عن التقدير والتدقيق البشري المسؤول."
          : "Human review required: this analysis is advisory and does not replace accountable human judgment.",
        spacing: { before: 300 },
        alignment: isAr ? "right" : "left",
      })
    );
  }

  const document = new Document({
    creator: "RippleIQ",
    title,
    description: "Decision impact analysis report",
    sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children: content }],
  });
  downloadBlob(await Packer.toBlob(document), filename.replace(/\.md$/i, ".docx"));
}
