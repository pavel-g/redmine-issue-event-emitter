import { Test, TestingModule } from '@nestjs/testing';
import { IssueChangeGateway } from './issue-change.gateway';

describe('IssueChangeGateway', () => {
  let gateway: IssueChangeGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IssueChangeGateway],
    }).compile();

    gateway = module.get<IssueChangeGateway>(IssueChangeGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
