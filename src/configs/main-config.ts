import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'jsonc-parser';

export default () => {
  const rawData = readFileSync(join(__dirname, '..', '..', 'configs', 'main-config.jsonc'), {encoding: "utf-8"});
  const data = parse(rawData);
  return data;
};