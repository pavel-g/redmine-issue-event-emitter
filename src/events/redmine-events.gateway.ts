import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { MailListener } from "../maillistener/maillistener";
import { Queue } from "../queue/queue";
import { RedmineDataLoader } from "../redmine-data-loader/redmine-data-loader";
import { RedmineIssueData } from "../models/RedmineIssueData";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { WebhookConfigItemModel } from "../models/webhook-config-item-model";
import { RssListener } from "../rsslistener/rsslistener";
import { EventsListener } from "./events-listener";

type IssuesChangesQueueParams = {
  updateInterval: number,
  itemsLimit: number
}

@WebSocketGateway({namespace: 'redmine-events'})
export class RedmineEventsGateway {
  @WebSocketServer()
  server: Server;

  issuesChangesObservable: Observable<WsResponse<RedmineIssueData[]>>;

  private issueNumberParser: RegExp;
  private issuesChangesQueueParams: IssuesChangesQueueParams

  constructor(
    private config: ConfigService,
    private redmineDataLoader: RedmineDataLoader
  ) {
    this.issuesChangesQueueParams = this.config.get<IssuesChangesQueueParams>("issueChangesQueue")
    this.initRedmineEventsGateway();
  }

  @SubscribeMessage('issues-changes')
  issuesChanges(@MessageBody() data: any): Observable<WsResponse<RedmineIssueData[]>> {
    return this.issuesChangesObservable;
  }

  private issuesChangesQueue: Queue<number, RedmineIssueData>;
  getIssuesChangesQueue(): Queue<number, RedmineIssueData> {
    if (!this.issuesChangesQueue) {
      this.issuesChangesQueue = new Queue<number, RedmineIssueData>(
        this.issuesChangesQueueParams.updateInterval,
        this.issuesChangesQueueParams.itemsLimit,
        async (issueNumbers) => {
          let res;
          try {
            res = await this.redmineDataLoader.loadIssues(issueNumbers);
          } catch (e) {
            console.error('Error load issues:', e, 'for issues:', issueNumbers);
            return [];
          }
          return res;
        }
      );
      this.issuesChangesQueue.start();
    }
    return this.issuesChangesQueue;
  }

  addIssues(issues: number[]): void {
    issues.forEach(issue => {
      if (!this.issuesChangesQueue.isItemExists(issue)) {
        this.issuesChangesQueue.add([issue]);
      }
    });
  }

  private sendWebHookFullDataEvents(data: RedmineIssueData[]): void {
    const webhooks = this.config.get<WebhookConfigItemModel[]>("webhooks");
    webhooks.forEach(webhook => {
      let config = undefined;
      if (webhook.apiKeyName && webhook.apiKeyValue) {
        config = {headers: {}};
        config.headers[webhook.apiKeyName] = webhook.apiKeyValue;
      }
      axios.post(webhook.url, data, config).catch((err) => {
        console.error('Error at webhook send request:', err)
      });
    });
  }

  private mailListener: MailListener|null|undefined;
  private getMailListener(): MailListener|null {
    if (typeof this.mailListener === 'undefined') {
      const mailListenerParams = this.config.get<any>('mailListener');
      if (mailListenerParams) {
        this.mailListener = new MailListener(mailListenerParams);
      } else {
        this.mailListener = null;
      }
    }
    return this.mailListener;
  }

  private rssListener: RssListener|null|undefined;
  private getRssListener(): RssListener|null {
    if (typeof this.rssListener === 'undefined') {
      const rssListenerParams = this.config.get<any>('rssListener');
      if (rssListenerParams) {
        this.rssListener = new RssListener(rssListenerParams);
      } else {
        this.rssListener = null;
      }
    }
    return this.rssListener;
  }

  private listener: EventsListener|null|undefined;
  private getMainListener(): EventsListener|null {
    if (typeof this.listener !== 'undefined') {
      return this.listener;
    }

    const mailListener = this.getMailListener();
    const rssListener = this.getRssListener();
    if (mailListener) {
      this.listener = mailListener;
    } else if (rssListener) {
      this.listener = rssListener;
    } else {
      this.listener = null;
    }
    if (this.listener) {
      this.listener.start();
    }
    return this.listener;
  }

  private initWebSocketsSendData(): void {
    const queue: Queue<number, RedmineIssueData> = this.getIssuesChangesQueue();
    this.issuesChangesObservable = queue.queue.pipe(map(data => {
      return {event: 'issues-changes', data: data}
    }));
  }

  private initWebHooksSendData(): void {
    const queue: Queue<number, RedmineIssueData> = this.getIssuesChangesQueue();
    queue.queue.subscribe(data => this.sendWebHookFullDataEvents(data));
  }

  private initRedmineEventsGateway(): boolean {
    const listener = this.getMainListener();
    if (!listener) {
      console.error('Listener not created');
      return false;
    }
    const issuesChangesQueue = this.getIssuesChangesQueue();
    listener.issues.subscribe(issues => {
      issuesChangesQueue.add(issues);
    });
    this.initWebSocketsSendData();
    this.initWebHooksSendData();
    return true;
  }
}
