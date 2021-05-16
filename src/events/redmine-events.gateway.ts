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

@WebSocketGateway({namespace: 'redmine-events'})
export class RedmineEventsGateway {
  @WebSocketServer()
  server: Server;

  issuesChangesObservable: Observable<WsResponse<number[]>>;
  issuesFullChangesObservable: Observable<WsResponse<RedmineIssueData[]>>;
  mailListener: MailListener | null = null;

  private issueNumberParser = /\b\d+\b/; // TODO: 2021-05-08 Перенести параметр в конфиг

  constructor() {
    this.getMailListener().messagesSubject.pipe(
      map(subjects => {
        return subjects.map(subject => {
          return this.getSubjectsParser().getIssueNumber(subject)
        })
      })
    ).subscribe((issueNumbers) => {
      this.getIssuesChangesQueue().add(issueNumbers);
    });

    this.issuesChangesObservable = this.getIssuesChangesQueue().queue.pipe(map(issueNumbers => {
      return {event: 'issues-changes', data: issueNumbers};
    }));
    this.issuesChangesObservable.subscribe((data) => console.debug('Issue numbers:', data));

    this.issuesFullChangesObservable = this.getIssuesChangesQueue().queue.pipe(
      switchMap((issues) => {
        const promise: Promise<RedmineIssueData[]> = this.getRedmineDataLoader().loadIssues(issues)
          .catch((error) => {
            console.error(error);
            this.getIssuesChangesQueue().add(issues);
            return [];
          });
        return fromPromise(promise) as Observable<RedmineIssueData[]>
      }),
      map((issuesData: RedmineIssueData[]) => {
        return {event: 'issues-full-changes', data: issuesData}
      })
    );
    this.issuesFullChangesObservable.subscribe((data) => console.debug('Issues data:', data));

    this.getIssuesChangesQueue().start();

    this.getMailListener().start();
  }

  getMailListener(): MailListener {
    if (!this.mailListener) {
      this.mailListener = new MailListener();
    }
    return this.mailListener;
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
      this.issuesChangesQueue = new Queue<number>(5 * 1000, 3); // TODO: 2021-05-14 Перенести параметры в конфиг
    }
    return this.issuesChangesQueue;
  }

  private redmineDataLoader: RedmineDataLoader;
  getRedmineDataLoader(): RedmineDataLoader {
    if (!this.redmineDataLoader) {
      this.redmineDataLoader = new RedmineDataLoader();
    }
    return this.redmineDataLoader;
  }
}
