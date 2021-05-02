import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { DataLoaderService } from "../data-loader/data-loader.service";
import { Client, Server } from "socket.io";

@WebSocketGateway( {namespace: 'issue-change'})
export class IssueChangeGateway {
  @WebSocketServer()
  server: Server;

  constructor(private dataLoader: DataLoaderService) {
    this.initIssueChangeListener()
  }

  @SubscribeMessage('issue-change')
  handleMessage(@ConnectedSocket() client: Client, payload: any): string {
    return 'Hello world!';
  }

  private initIssueChangeListener(): void {
    this.dataLoader.loader.issueChanged.on("issueChanged", (issueNumbers) => {
      this.sendIssueChangedData(issueNumbers)
    })
  }

  private sendIssueChangedData(issueNumbers: number[]): void {
    this.server.emit('issue-change', issueNumbers);
  }
}
