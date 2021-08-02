import { RssListenerParams } from "../rsslistener/rsslistener-params";

export type MailListenerParams = {
  issueNumberParser: string;
  imapSimpleConfig: Record<string, any>;
  updateInterval: number;
  boxName: string;
}