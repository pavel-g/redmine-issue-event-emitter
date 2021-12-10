import { BehaviorSubject } from "rxjs";
import * as ImapSimple from "imap-simple";
import { Injectable } from "@nestjs/common";
import { MailListenerParams } from "./maillistener-params";
import { CreateSubjectsParserByRegExp } from "../subjects-parser/subjects-parser";
import { EventsListener } from "../events/events-listener";

const UPDATE_INTERVAL_AFTER_ERROR = 5 * 60 * 1000;

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

    let connection;
    try {
      connection = await this.getConnection();
    } catch (ex) {
      console.error('Mail listener error on getConnection:', ex);
      this.closeConnection();
      this.repeatUpdate(UPDATE_INTERVAL_AFTER_ERROR);
      return;
    }

    const searchCriteria = [
      'UNSEEN'
    ];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: true
    };
    // const boxes = await connection.getBoxes();

    let messages;

    try {
      await connection.openBox(this.config.boxName)
      messages = await connection.search(searchCriteria, fetchOptions)
    } catch (ex) {
      console.error('Mail listener error on openBox and search:', ex);
      this.closeConnection();
      this.repeatUpdate(UPDATE_INTERVAL_AFTER_ERROR);
      return;
    }

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

    this.repeatUpdate(this.config.updateInterval);
  }

  private connection: ImapSimple.ImapSimple;
  async getConnection(): Promise<ImapSimple.ImapSimple> {
    if (!this.connection) {
      this.connection = await ImapSimple.connect(this.config.imapSimpleConfig as any);
    }
    return this.connection;
  }

  private repeatUpdate(interval: number): void {
    this.updateTimeout = setTimeout(() => {
      this.updateMessages().catch(reason => {
        console.error('Mail listener unknown error:', reason);
      });
    }, interval);
  }

  private closeConnection(): void {
    if (!this.connection) return;
    try {
      this.connection.closeBox(false);
    } catch (e) {
      console.error('Mail listener error at closeBox:', e);
    }
    this.connection = null;
  }

  // TODO: 2021-05-08 Добавить функцию получения списка папок на сервере

}