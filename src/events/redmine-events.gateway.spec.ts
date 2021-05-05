import { Test, TestingModule } from '@nestjs/testing';
import { RedmineEventsGateway } from './redmine-events.gateway';

describe('RedmineEventsGateway', () => {
  let gateway: RedmineEventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedmineEventsGateway],
    }).compile();

    gateway = module.get<RedmineEventsGateway>(RedmineEventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
