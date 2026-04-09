import path from "path";

export const WORKSPACE = path.resolve(
  process.env.HOME || "/home/user",
  "workspace",
);
export const COORDINATOR_PATH = path.join(WORKSPACE, "coordinator");

export const GROUPS = {
  base: {
    name: "base",
    modules: ["base-shared", "base-cms", "base-site"],
    // от base зависит всё остальное
    dependentGroups: ["dev", "project1" /* , "project2", "project3" */],
  },

  dev: {
    name: "dev",
    modules: ["dev-cms", "dev-site"],
    dependentGroups: ["project1" /* , "project2", "project3" */],
  },

  project1: {
    name: "project1",
    modules: [
      "sites/site1",
      "cms/cms1",
      "sites/site1/shared", // если есть отдельный site-shared
    ],
    dependentGroups: [], // конечная группа
  },

  project2: {
    name: "project2",
    modules: ["sites/site2", "cms/cms2"],
    dependentGroups: [],
  },

  // Добавляйте новые проекты сюда:
  // project3: { ... },
};

export const PRODUCTION_GROUPS = new Set(["project1", "project2"]); // для hotfix
