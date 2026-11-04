import { gzipSync, gunzipSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";

const sourcePath = new URL("../data/jmdict/JMdict_e.gz", import.meta.url);
const outputPath = new URL("../public/data/jmdict/index.json.gz.data", import.meta.url);
const kanjiSourcePath = new URL("../data/kanjidic2/kanjidic2.xml.gz", import.meta.url);
const kanjiOutputPath = new URL("../public/data/kanjidic2/index.json.gz.data", import.meta.url);
const source = await readFile(sourcePath);
const xml = gunzipSync(source).toString("utf8");
const parser = new XMLParser({
  ignoreAttributes: true,
  processEntities: { maxExpandedLength: 100_000_000 },
});
const entries = parser.parse(xml)?.JMdict?.entry;

if (!Array.isArray(entries) || entries.length === 0) {
  throw new Error("JMdict did not contain any dictionary entries.");
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function uniqueText(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value))];
}

const index = entries.flatMap((entry) => {
  const kanji = uniqueText(asArray(entry.k_ele).flatMap((element) => asArray(element.keb)));
  const readings = uniqueText(asArray(entry.r_ele).flatMap((element) => asArray(element.reb)));
  const senses = asArray(entry.sense).map((sense) => ({
    g: uniqueText(asArray(sense.gloss)),
    p: uniqueText(asArray(sense.pos)),
  })).filter((sense) => sense.g.length);

  if (!senses.length) return [];

  const priorities = [
    ...asArray(entry.k_ele).flatMap((element) => asArray(element.ke_pri)),
    ...asArray(entry.r_ele).flatMap((element) => asArray(element.re_pri)),
  ];

  return [{
    k: kanji,
    r: readings,
    s: senses,
    p: priorities.some((priority) => /^(ichi1|news1|spec1|gai1)$/.test(priority)) ? 1 : 0,
  }];
});

const output = gzipSync(Buffer.from(JSON.stringify(index)), { level: 9 });
await mkdir(new URL("../public/data/jmdict/", import.meta.url), { recursive: true });
await writeFile(outputPath, output);
console.log(`Built JMdict search index: ${index.length.toLocaleString()} entries, ${(output.length / 1024 / 1024).toFixed(1)} MiB compressed.`);

const kanjiXml = gunzipSync(await readFile(kanjiSourcePath)).toString("utf8");
const kanjiParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: { maxExpandedLength: 100_000_000 },
});
const kanjiEntries = kanjiParser.parse(kanjiXml)?.kanjidic2?.character;

if (!Array.isArray(kanjiEntries) || kanjiEntries.length === 0) {
  throw new Error("KANJIDIC2 did not contain any kanji entries.");
}

function textContent(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return typeof value?.["#text"] === "string" ? value["#text"] : "";
}

const kanjiIndex = kanjiEntries.flatMap((entry) => {
  if (typeof entry.literal !== "string" || !entry.reading_meaning) return [];

  const groups = asArray(entry.reading_meaning.rmgroup);
  const readings = groups.flatMap((group) => asArray(group.reading));
  const meanings = groups.flatMap((group) => asArray(group.meaning)
    .filter((meaning) => !meaning?.["@_m_lang"] || meaning["@_m_lang"] === "en")
    .map(textContent));
  const misc = entry.misc || {};
  const on = uniqueText(readings
    .filter((reading) => reading?.["@_r_type"] === "ja_on")
    .map(textContent)
    .map((reading) => reading.replaceAll(".", "")));
  const kun = uniqueText(readings
    .filter((reading) => reading?.["@_r_type"] === "ja_kun")
    .map(textContent)
    .map((reading) => reading.replaceAll(".", "")));

  return [{
    character: entry.literal,
    on,
    kun,
    meanings: uniqueText(meanings),
    strokes: Number(asArray(misc.stroke_count)[0]) || 0,
    grade: Number(misc.grade) || 0,
    jlpt: Number(misc.jlpt) || 0,
  }];
});

const kanjiOutput = gzipSync(Buffer.from(JSON.stringify(kanjiIndex)), { level: 9 });
await mkdir(new URL("../public/data/kanjidic2/", import.meta.url), { recursive: true });
await writeFile(kanjiOutputPath, kanjiOutput);
console.log(`Built KANJIDIC2 index: ${kanjiIndex.length.toLocaleString()} kanji, ${(kanjiOutput.length / 1024).toFixed(1)} KiB compressed.`);
