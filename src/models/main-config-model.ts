import { WebhookConfigItemModel } from "./webhook-config-item-model";
import { RssListenerParams } from "../rsslistener/rsslistener-params";
import { MailListenerParams } from "../maillistener/maillistener-params";

export type MainConfigModel = {
  issueChangesQueue: {
    updateInterval: number,
    itemsLimit: number
  },
  mailListener: MailListenerParams | null,
  rssListener: RssListenerParams | null,
  redmineUrlPrefix: string,
  webhooks: WebhookConfigItemModel[]
}