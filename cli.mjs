#!/usr/bin/env node

import { program } from "commander";
import { GROUPS } from "./config.mjs";

program
  .name("project-flow")
  .description("Git-flow для Coordinated Polyrepo с поддержкой групп проектов");

program
  .command("start-feature <name> [group]")
  .description(
    "Создать feature-ветку в указанной группе и всех зависимых (по умолчанию: base)",
  )
  .action(async (name, group = "base") => {
    const cmd = await import("./commands/start-feature.mjs");
    await cmd.default(name, group);
  });

program
  .command("finish-feature <name> [group]")
  .description(
    "Завершить feature и распространить изменения (по умолчанию: base)",
  )
  .action(async (name, group = "base") => {
    const cmd = await import("./commands/finish-feature.mjs");
    await cmd.default(name, group);
  });

program
  .command("start-hotfix <name> [group]")
  .description("Создать hotfix-ветку")
  .action(async (name, group = "base") => {
    const cmd = await import("./commands/start-hotfix.mjs");
    await cmd.default(name, group);
  });

program
  .command("finish-hotfix <name> [group]")
  .description("Завершить hotfix и обновить только production-группы")
  .action(async (name, group = "base") => {
    const cmd = await import("./commands/finish-hotfix.mjs");
    await cmd.default(name, group);
  });

program.parse();
