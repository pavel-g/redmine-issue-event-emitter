import { BehaviorSubject } from "rxjs";
import * as ImapSimple from "imap-simple";

export class MailListener {

  // TODO: 2021-05-08 Вынести в конфиг параметры доступа к почте
  config = {
    imap: {
      user: 'pavel.gnedov',
      password: 'FiH925p$',
      host: 'mail.eltex.loc',
      port: 143,
      // tls: true,
      autotls: 'always',
      authTimeout: 5000
    }
  };

  // TODO: 2021-05-08 Вынести в конфиг параметр
  updateInterval: number = 10 * 1000; // 30sec

  // TODO: 2021-05-08 Вынести в конфиг параметр
  boxName = 'INBOX.Redmine';

  messagesSubject = new BehaviorSubject<string[]>([])

  private updateTimeout;

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