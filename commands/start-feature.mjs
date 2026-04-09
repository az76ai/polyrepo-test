import { COORDINATOR_PATH, GROUPS } from "../config.mjs";
import git from "simple-git";
import ora from "ora";
import chalk from "chalk";
import path from "path";

export default async function startFeature(name, groupName) {
  const group = GROUPS[groupName];
  if (!group) {
    console.error(chalk.red(`Ошибка: Группа "${groupName}" не найдена.`));
    process.exit(1);
  }

  const branch = `feature/${name}`;
  const spinner = ora(
    `Создаём ${branch} в группе ${groupName} и зависимых...`,
  ).start();

  const allModules = collectModules(groupName);

  for (const modulePath of allModules) {
    const fullPath = path.join(COORDINATOR_PATH, modulePath);
    if (!fsExists(fullPath + "/.git")) continue;

    try {
      const g = git(fullPath);
      await g.checkoutLocalBranch(branch).catch(() => g.checkout(branch));
      console.log(chalk.green(`  ✓ ${modulePath}`));
    } catch (e) {
      console.log(chalk.yellow(`  ⚠ ${modulePath}: ${e.message}`));
    }
  }

  spinner.succeed(
    `Ветка ${branch} создана в группе ${groupName} и всех зависимых проектах.`,
  );
}

// Рекурсивно собираем все модули группы + зависимые
function collectModules(groupName, visited = new Set()) {
  if (visited.has(groupName)) return [];
  visited.add(groupName);

  const group = GROUPS[groupName];
  if (!group) return [];

  let modules = [...group.modules];

  for (const depGroup of group.dependentGroups) {
    modules = modules.concat(collectModules(depGroup, visited));
  }

  return [...new Set(modules)]; // убираем дубли
}

function fsExists(p) {
  try {
    return require("fs").existsSync(p);
  } catch {
    return false;
  }
}
