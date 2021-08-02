export type RssListenerSubscriptionParams = {
  url: string;
  issueNumberParser: string;
};

export type RssListenerParams = {
  subscriptions: RssListenerSubscriptionParams[];
  updateInterval: number;
};

export const RssListenerDefaultParams: RssListenerParams = {
  subscriptions: [],
  updateInterval: 300000 // 5min
}