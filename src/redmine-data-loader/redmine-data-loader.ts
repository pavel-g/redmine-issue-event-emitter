import axios from "axios";
import { RedmineIssueData } from "../models/RedmineIssueData";

export class RedmineDataLoader {

  // TODO: 2021-05-16 Перенести параметр в конфиг
  urlPrefix = "http://pavel.gnedov:FiH925p$@red.eltex.loc"

  async loadIssues(issues: number[]): Promise<RedmineIssueData[]> {
    const promises = issues.map(issue => this.loadIssue(issue));
    return Promise.all(promises)
  }

  async loadIssue(issueNumber: number): Promise<RedmineIssueData> {
    const url = this.getUrl(issueNumber)
    const resp = await axios.get(url)
    if (!resp || !resp.data || !resp.data.issue) {
      console.error("Failed to load data from redmine")
      return null
    }
    const data = resp.data.issue
    return data
  }

  private getUrl(issueNumber: number): string {
    if (typeof this.urlPrefix !== 'string' || this.urlPrefix.length === 0) {
      throw 'REDMINE_URL_PREFIX is undefined'
    }
    return `${this.urlPrefix}/issues/${issueNumber}.json?include=children,journals`
  }

}