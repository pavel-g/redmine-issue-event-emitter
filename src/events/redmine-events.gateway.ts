import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { MailListener } from "../maillistener/maillistener";
import { CreateSubjectsParserByRegExp, SubjectsParser } from "../subjects-parser/subjects-parser";
import { Queue } from "../queue/queue";
import { RedmineDataLoader } from "../redmine-data-loader/redmine-data-loader";
import { RedmineIssueData } from "../models/RedmineIssueData";
import { fromPromise } from "rxjs/internal-compatibility";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { WebhookConfigItemModel } from "../models/webhook-config-item-model";

type IssuesChangesQueueParams = {
  updateInterval: number,
  itemsLimit: number
}

@WebSocketGateway({namespace: 'redmine-events'})
export class RedmineEventsGateway {
  @WebSocketServer()
  server: Server;

  issuesChangesObservable: Observable<WsResponse<number[]>>;
  issuesFullChangesObservable: Observable<WsResponse<RedmineIssueData[]>>;

  private issueNumberParser: RegExp;
  private issuesChangesQueueParams: IssuesChangesQueueParams

  constructor(
    private config: ConfigService,
    private redmineDataLoader: RedmineDataLoader,
    private mailListener: MailListener
  ) {
    this.issueNumberParser = new RegExp(this.config.get<string>("issueNumberParser"))
    this.issuesChangesQueueParams = this.config.get<IssuesChangesQueueParams>("issueChangesQueue")
    this.mailListener.messagesSubject.pipe(
      map(subjects => {
        return subjects.map(subject => {
          return this.getSubjectsParser().getIssueNumber(subject)
        })
      })
    ).subscribe((issueNumbers) => {
      this.getIssuesChangesQueue().add(issueNumbers);
    });

    this.issuesChangesObservable = this.getIssuesChangesQueue().queue.pipe(map(issueNumbers => {
      this.sendWebHookIssueNumbersEvents(issueNumbers);
      return {event: 'issues-changes', data: issueNumbers};
    }));
    this.issuesChangesObservable.subscribe((data) => console.debug('Issue numbers:', data));

    this.issuesFullChangesObservable = this.getIssuesChangesQueue().queue.pipe(
      switchMap((issues) => {
        const promise: Promise<RedmineIssueData[]> = this.redmineDataLoader.loadIssues(issues)
          .catch((error) => {
            console.error(error);
            this.getIssuesChangesQueue().add(issues);
            return [];
          });
        return fromPromise(promise) as Observable<RedmineIssueData[]>
      }),
      map((issuesData: RedmineIssueData[]) => {
        this.sendWebHookFullDataEvents(issuesData);
        return {event: 'issues-full-changes', data: issuesData}
      })
    );
    this.issuesFullChangesObservable.subscribe((data) => console.debug('Issues data:', data));

    this.getIssuesChangesQueue().start();

    this.mailListener.start();
  }

  @SubscribeMessage('issues-changes')
  issuesChanges(@MessageBody() data: any): Observable<WsResponse<number[]>> {
    return this.issuesChangesObservable;
  }

  @SubscribeMessage('issues-full-changes')
  issuesFullChanges(@MessageBody() data: any): Observable<WsResponse<RedmineIssueData[]>> {
    return this.issuesFullChangesObservable;
  }

  private subjectsParser: SubjectsParser;
  getSubjectsParser(): SubjectsParser {
    if (!this.subjectsParser) {
      this.subjectsParser = CreateSubjectsParserByRegExp(this.issueNumberParser);
    }
    return this.subjectsParser;
  }

  private issuesChangesQueue: Queue<number>;
  getIssuesChangesQueue(): Queue<number> {
    if (!this.issuesChangesQueue) {
      this.issuesChangesQueue = new Queue<number>(
        this.issuesChangesQueueParams.updateInterval,
        this.issuesChangesQueueParams.itemsLimit
      );
    }
    return this.issuesChangesQueue;
  }

  addIssues(issues: number[]): void {
    this.issuesChangesQueue.add(issues);
  }

  private sendWebHookIssueNumbersEvents(data: number[]): void {
    const webhooks = this.config.get<WebhookConfigItemModel[]>("webhooks");
    webhooks.filter(webhook => webhook.fullData === false).forEach(webhook => {
      let config = undefined;
      if (webhook.apiKeyName && webhook.apiKeyValue) {
        config = {headers: {}};
        config.headers[webhook.apiKeyName] = webhook.apiKeyValue;
      }
      axios.post<any>(webhook.url, data, config);
    });
  }

  private sendWebHookFullDataEvents(data: RedmineIssueData[]): void {
    const webhooks = this.config.get<WebhookConfigItemModel[]>("webhooks");
    webhooks.filter(webhook => webhook.fullData === true).forEach(webhook => {
      let config = undefined;
      if (webhook.apiKeyName && webhook.apiKeyValue) {
        config = {headers: {}};
        config.headers[webhook.apiKeyName] = webhook.apiKeyValue;
      }
      axios.post(webhook.url, data, config);
    });
  }
}
