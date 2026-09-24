import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const isCheck = process.argv.includes("--check");
const sourceDir = "articles";
const outputDir = "qiita/public";
const imageBaseUrl = process.env.IMAGE_BASE_URL?.replace(/\/$/, "");
const zennUsername = "ryu_ssss";
const configuredIds = existsSync("qiita-article-ids.json")
  ? JSON.parse(readFileSync("qiita-article-ids.json", "utf8"))
  : {};

function splitFrontmatter(source, file) {
  const matched = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!matched) throw new Error(`${file}: Zenn Front Matter がありません。`);
  return { metadata: matched[1], body: matched[2] };
}

function scalar(metadata, key, file) {
  const matched = metadata.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
  if (!matched) throw new Error(`${file}: ${key} がありません。`);
  return matched[1].replace(/^['"]|['"]$/g, "");
}

function topics(metadata, file) {
  const raw = scalar(metadata, "topics", file);
  if (!raw.startsWith("[") || !raw.endsWith("]")) {
    throw new Error(`${file}: topics は [\"tag\"] 形式にしてください。`);
  }
  return raw.slice(1, -1).split(",").map((topic) => topic.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
}

function existingId(outputPath) {
  if (!existsSync(outputPath)) return "null";
  const matched = readFileSync(outputPath, "utf8").match(/^id:\s*(.+?)\s*$/m);
  return matched?.[1] ?? "null";
}

const files = readdirSync(sourceDir).filter((file) => file.endsWith(".md")).sort();
const generated = new Map();

for (const file of files) {
  const { metadata, body } = splitFrontmatter(readFileSync(join(sourceDir, file), "utf8"), file);
  const title = scalar(metadata, "title", file);
  const published = scalar(metadata, "published", file) === "true";
  const target = join(outputDir, file);
  const slug = basename(file, ".md");
  const zennUrl = `https://zenn.dev/${zennUsername}/articles/${slug}`;
  const qiitaBody = imageBaseUrl
    ? body.replaceAll(/\]\(\/images\/([^\)]+)\)/g, `](${imageBaseUrl}/images/$1)`)
    : body;
  const header = [
    "---",
    `title: ${JSON.stringify(title)}`,
    "tags:",
    ...topics(metadata, file).map((topic) => `  - ${JSON.stringify(topic)}`),
    "private: false",
    'updated_at: ""',
    `id: ${configuredIds[basename(file, ".md")] ?? existingId(target)}`,
    "organization_url_name: null",
    "slide: false",
    `ignorePublish: ${!published}`,
    "posting_campaign_uuid: null",
    "agreed_posting_campaign_term: false",
    "---",
    ""
  ].join("\n");
  generated.set(target, `${header}${qiitaBody.trimEnd()}\n\n---\n\n> [Zenn版はこちら](${zennUrl})\n`);
}

if (isCheck) {
  for (const [file, content] of generated) {
    if (!existsSync(file) || readFileSync(file, "utf8") !== content) {
      throw new Error(`${file} が最新ではありません。npm run sync:qiita を実行してください。`);
    }
  }
  process.exit(0);
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
for (const [file, content] of generated) writeFileSync(file, content, "utf8");
console.log(`${generated.size} 本のQiita用記事を生成しました。`);
