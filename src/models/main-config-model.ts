export type MainConfigModel = {
  imapSimpleConfig: any,
  issueNumberParser: string,
  issueChangesQueue: {
    updateInterval: number,
    itemsLimit: number
  },
  mailListener: {
    updateInterval: number,
    boxName: string
  },
  redmineUrlPrefix: string
}