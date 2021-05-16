export class SubjectsParser {

  constructor(private parser: (string) => number) {}

  getIssueNumber(subject: string): number {
    return this.parser(subject)
  }

}

export function CreateSubjectsParserByRegExp(regexp: RegExp): SubjectsParser {
  const parser = (subject: string): number => {
    const res = subject.match(regexp)
    return res && res.length > 0 ? Number(res[0]) : -1;
  }
  return new SubjectsParser(parser)
}