import { BehaviorSubject } from "rxjs";
import * as ImapSimple from "imap-simple";
import { Injectable } from "@nestjs/common";
import { MailListenerParams } from "./maillistener-params";
import { CreateSubjectsParserByRegExp } from "../subjects-parser/subjects-parser";
import { EventsListener } from "../events/events-listener";

@Injectable()
export class MailListener implements EventsListener {

  issues = new BehaviorSubject<number[]>([])

  private updateTimeout;

  constructor(private config: MailListenerParams | null = null) {}

  start(): void {
    this.updateMessages();
  }

  stop(): void {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }

  private async updateMessages(): Promise<void> {
    if (!this.config) {
      console.error('Mail listener config not defined');
      return;
    }
    const connection = await this.getConnection();
    const searchCriteria = [
      'UNSEEN'
    ];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: true
    };
    // const boxes = await connection.getBoxes();
    await connection.openBox(this.config.boxName)
    const messages = await connection.search(searchCriteria, fetchOptions)
    const subjects: string[] = messages.map(message => {
      return message.parts.filter(function (part) {
        return part.which === 'HEADER';
      })[0].body.subject[0]
    });
    const regexp = new RegExp(this.config.issueNumberParser);
    const subjectParser = CreateSubjectsParserByRegExp(regexp);
    const numbers: number[] = subjects.map(subject => {
      return subjectParser.getIssueNumber(subject);
    });
    this.issues.next(numbers);
    this.updateTimeout = setTimeout(() => {
      this.updateMessages();
    }, this.config.updateInterval);
  }

  private connection: ImapSimple.ImapSimple;
  async getConnection(): Promise<ImapSimple.ImapSimple> {
    if (!this.connection) {
      this.connection = await ImapSimple.connect(this.config.imapSimpleConfig as any);
    }
    return this.connection;
  }

  // TODO: 2021-05-08 Добавить функцию получения списка папок на сервере

}