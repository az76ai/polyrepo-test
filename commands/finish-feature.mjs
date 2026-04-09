import { COORDINATOR_PATH, GROUPS } from "../config.mjs";
import git from "simple-git";
import ora from "ora";
import chalk from "chalk";
import path from "path";
import fs from "fs";

export default async function finishFeature(name, groupName) {
  const group = GROUPS[groupName];
  if (!group) {
    console.error(chalk.red(`Ошибка: Группа "${groupName}" не найдена.`));
    process.exit(1);
  }

  const branch = `feature/${name}`;
  const spinner = ora(
    `Завершаем feature/${name} для группы ${groupName}...`,
  ).start();

  const coordinatorGit = git(COORDINATOR_PATH);
  await coordinatorGit
    .checkout(branch)
    .catch(() => coordinatorGit.checkout("main"));

  const allModules = collectModules(groupName);

  // 1. Коммитим изменения внутри модулей
  spinner.text = "Коммитим изменения в модулях...";
  for (const modPath of allModules) {
    const fullPath = path.join(COORDINATOR_PATH, modPath);
    if (!fs.existsSync(fullPath)) continue;

    const g = git(fullPath);
    const status = await g.status();

    if (!status.isClean()) {
      await g.add(".");
      await g.commit(`feat: changes for feature/${name} in ${modPath}`);
      await g.push("origin", "HEAD");
      console.log(chalk.green(`  ✓ Запушено: ${modPath}`));
    }
  }

  // 2. Обновляем указатели в координаторе
  spinner.text = "Обновляем координатор...";
  await coordinatorGit.add(".");
  await coordinatorGit
    .commit(`chore(submodules): update after feature/${name}`, {
      "--allow-empty": null,
    })
    .catch(() => {});
  await coordinatorGit.push();

  // 3. Propagation по зависимым модулям
  spinner.text = "Propagating изменения...";
  for (const modPath of allModules) {
    const dependents = findDependents(modPath);
    for (const depPath of dependents) {
      const fullDep = path.join(COORDINATOR_PATH, depPath);
      if (!fs.existsSync(fullDep)) continue;

      try {
        const dg = git(fullDep);
        await dg.checkout(branch).catch(() => dg.checkout("main"));
        await dg
          .submoduleUpdate([path.basename(modPath), "--remote", "--init"])
          .catch(() => {});
        await dg.add(".");
        await dg
          .commit(
            `chore(submodules): update ${modPath} after feature/${name}`,
            { "--allow-empty": null },
          )
          .catch(() => {});
        await dg.push();
        console.log(chalk.green(`  → ${depPath} обновлён`));
      } catch (e) {
        console.log(chalk.yellow(`  ⚠ ${depPath}: ${e.message}`));
      }
    }
  }

  spinner.succeed(
    `✅ Feature ${name} завершена для группы ${groupName} и всех зависимых проектов!`,
  );
}

// Вспомогательные функции
function collectModules(groupName, visited = new Set()) {
  if (visited.has(groupName)) return [];
  visited.add(groupName);

  const group = GROUPS[groupName];
  let modules = [...(group?.modules || [])];

  for (const dep of group?.dependentGroups || []) {
    modules = modules.concat(collectModules(dep, visited));
  }
  return [...new Set(modules)];
}

function findDependents(changedModule) {
  const dependents = [];
  for (const [groupName, group] of Object.entries(GROUPS)) {
    for (const mod of group.modules) {
      if (
        mod === changedModule ||
        mod.endsWith("/" + path.basename(changedModule))
      ) {
        // находим все группы, которые зависят от этой
        for (const depGroupName of group.dependentGroups) {
          dependents.push(...GROUPS[depGroupName].modules);
        }
      }
    }
  }
  return [...new Set(dependents)];
}
