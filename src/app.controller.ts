import { Body, Controller, Post } from "@nestjs/common";
import { AppService } from './app.service';
import { RedmineEventsGateway } from "./events/redmine-events.gateway";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redmineEventsGateway: RedmineEventsGateway
  ) {}

  @Post("append-issues")
  async appendIssues(@Body() issues: number[]): Promise<void> {
    this.redmineEventsGateway.addIssues(issues)
  }
}
