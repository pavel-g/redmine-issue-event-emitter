import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'jsonc-parser';
import { MainConfigModel } from "../models/main-config-model";

export default (): MainConfigModel => {
  const rawData = readFileSync(join(__dirname, '..', '..', 'configs', 'main-config.jsonc'), {encoding: "utf-8"});
  const data: MainConfigModel = parse(rawData);
  return data;
};