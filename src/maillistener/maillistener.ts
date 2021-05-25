import { BehaviorSubject } from "rxjs";
import * as ImapSimple from "imap-simple";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailListener {

  config: any;
  updateInterval: number;
  boxName: string;

  messagesSubject = new BehaviorSubject<string[]>([])

  private updateTimeout;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<any>('imapSimpleConfig')
    this.updateInterval = this.configService.get<number>('mailListener.updateInterval');
    this.boxName = this.configService.get<string>('mailListener.boxName')
  }

  start(): void {
    this.updateMessages();
  }

  stop(): void {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }

  private async updateMessages(): Promise<void> {
    const connection = await this.getConnection();
    const searchCriteria = [
      'UNSEEN'
    ];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: true
    };
    const boxes = await connection.getBoxes();
    await connection.openBox(this.boxName)
    const messages = await connection.search(searchCriteria, fetchOptions)
    const subjects: string[] = messages.map(message => {
      return message.parts.filter(function (part) {
        return part.which === 'HEADER';
      })[0].body.subject[0]
    })
    this.messagesSubject.next(subjects)
    this.updateTimeout = setTimeout(() => {
      this.updateMessages()
    }, this.updateInterval)
  }

  private connection: ImapSimple.ImapSimple;
  async getConnection(): Promise<ImapSimple.ImapSimple> {
    if (!this.connection) {
      this.connection = await ImapSimple.connect(this.config);
    }
    return this.connection;
  }

  // TODO: 2021-05-08 Добавить функцию получения списка папок на сервере

}