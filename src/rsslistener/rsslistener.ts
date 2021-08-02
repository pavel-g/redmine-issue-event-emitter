import { Injectable } from "@nestjs/common";
import { RssListenerDefaultParams, RssListenerParams, RssListenerSubscriptionParams } from "./rsslistener-params";
import { BehaviorSubject } from "rxjs";
import { CreateSubjectsParserByRegExp } from "../subjects-parser/subjects-parser";
import { EventsListener } from "../events/events-listener";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Parser = require('rss-parser');
const parser = new Parser();

@Injectable()
export class RssListener implements EventsListener {

  issues = new BehaviorSubject<number[]>([])

  private updateTimeout;

  private lastTimeUpdate: Date | null = null;

  constructor(private config: RssListenerParams = RssListenerDefaultParams) {
  }

  start(): void {
    this.updateMessages();
  }

  stop(): void {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = null;
  }

  private async updateMessages(): Promise<void> {
    const issues = await this.getIssues();
    this.issues.next(issues);
    this.updateTimeout = setTimeout(() => {
      this.updateMessages();
    }, this.config.updateInterval);
  }

  private async getIssues(): Promise<number[]> {
    const promises = this.config.subscriptions.map(sub => this.createSubscriptionPromise(sub));
    const issues = await Promise.all(promises);
    this.lastTimeUpdate = new Date();
    return this.getFlatIssueNumbers(issues);
  }

  private async createSubscriptionPromise(subscription: RssListenerSubscriptionParams): Promise<number[]> {
    const url = subscription.url;
    const regexp = new RegExp(subscription.issueNumberParser);
    const subjectParser = CreateSubjectsParserByRegExp(regexp);
    const feed = await parser.parseURL(url);
    const issueNumbers: number[] = feed.items
      .filter(item => {
        const itemDate = new Date(item.pubDate);
        return itemDate >= this.lastTimeUpdate;
      })
      .map(item => {
        const issueNumber = subjectParser.getIssueNumber(item.title);
        return issueNumber;
      });
    return issueNumbers;
  }

  private getFlatIssueNumbers(issues: number[][]): number[] {
    const res: number[] = [];
    issues.forEach(issueNumbers => {
      issueNumbers.forEach(num => {
        if (res.indexOf(num) < 0) {
          res.push(num);
        }
      });
    });
    return res;
  }

}