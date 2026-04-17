import fs from "fs";
import path from "path";

export function walk(dir: string): string[] {
  let results: string[] = [];

  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      if (file === "node_modules" || file.startsWith(".")) return;
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });

  return results;
}