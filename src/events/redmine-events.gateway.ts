import { SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { Server } from "socket.io";
import { BehaviorSubject, interval, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { random } from "../utils/random";

@WebSocketGateway({namespace: 'redmine-events'})
export class RedmineEventsGateway {
  @WebSocketServer()
  server: Server;

  issuesChangesSubject: BehaviorSubject<number>;
  issuesChangesObservable: Observable<WsResponse<number>>;

  constructor() {
    this.issuesChangesSubject = new BehaviorSubject(-1)
    this.issuesChangesObservable = this.issuesChangesSubject.asObservable().pipe(map(issueNumber => {
      return {event: 'issues-changes', data: issueNumber}
    }))
    // DEBUG: begin
    interval(1000).subscribe((() => {
      this.issuesChangesSubject.next(random(1, 999999));
    }));
    // DEBUG: end
  }

  @SubscribeMessage('issues-changes')
  issuesChanges(): Observable<WsResponse<number>> {
    return this.issuesChangesObservable;
  }
}
