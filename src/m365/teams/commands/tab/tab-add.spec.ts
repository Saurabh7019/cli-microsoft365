import assert from 'assert';
import Sinon, * as sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './tab-add.js';

describe(commands.TAB_ADD, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
    commandInfo = cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: async (msg: string) => {
        log.push(msg);
      },
      logRaw: async (msg: string) => {
        log.push(msg);
      },
      logToStderr: async (msg: string) => {
        log.push(msg);
      }
    };
    loggerLogSpy = sinon.spy(logger, 'log');
    (command as any).items = [];
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.TAB_ADD);
  });

  it('fails validation if the teamId is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000',
        appId: 'com.microsoft.teamspace.tab.web',
        appName: 'test',
        contentUrl: '/',
        channelId: '19:552b7125655c46d5b5b86db02ee7bfdf@thread.skype'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('allows unknown properties', () => {
    const allowUnknownOptions = command.allowUnknownOptions();
    assert.strictEqual(allowUnknownOptions, true);
  });

  it('fails validates for a incorrect channelId missing leading 19:.', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '552b7125655c46d5b5b86db02ee7bfdf@thread.skype',
        appId: 'com.microsoft.teamspace.tab.web',
        appName: 'test',
        contentUrl: '/'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validates for a incorrect channelId missing trailing @thread.skype.', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:552b7125655c46d5b5b86db02ee7bfdf@thread',
        appId: 'com.microsoft.teamspace.tab.web',
        appName: 'test',
        contentUrl: '/'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('validates for a correct input.', async () => {
    const actual = await command.validate({
      options: {
        teamId: '00000000-0000-0000-0000-000000000000',
        channelId: '19:552b7125655c46d5b5b86db02ee7bfdf@thread.skype',
        appId: 'com.microsoft.teamspace.tab.web',
        appName: 'test',
        contentUrl: '/'
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('creates tab in channel within the Microsoft Teams team in the tenant', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://graph.microsoft.com/v1.0/teams/3b4797e5-bdf3-48e1-a552-839af71562ef`) > -1) {
        return {
          "id": "19:f3dcbb1674574677abcae89cb626f1e6@thread.skype",
          "displayName": "testweb",
          "webUrl": "https://teams.microsoft.com/l/channel/19:f3dcbb1674574677abcae89cb626f1e6@thread.skype/"
        };
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        teamId: '3b4797e5-bdf3-48e1-a552-839af71562ef',
        channelId: '9:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        appId: 'com.microsoft.teamspace.tab.web',
        appName: 'testweb',
        contentUrl: 'https://contoso.sharepoint.com/Shared%20Documents/'
      }
    });
    assert(loggerLogSpy.calledWith({
      "id": "19:f3dcbb1674574677abcae89cb626f1e6@thread.skype",
      "displayName": "testweb",
      "webUrl": "https://teams.microsoft.com/l/channel/19:f3dcbb1674574677abcae89cb626f1e6@thread.skype/"
    }));
  });

  it('creates tab in channel within the Microsoft Teams team in the tenant with all options', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://graph.microsoft.com/v1.0/teams/3b4797e5-bdf3-48e1-a552-839af71562ef`) > -1) {
        return {
          "id": "19:f3dcbb1674574677abcae89cb626f1e6@thread.skype",
          "displayName": "testweb",
          "webUrl": "https://teams.microsoft.com/l/channel/19:f3dcbb1674574677abcae89cb626f1e6@thread.skype/"
        };
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        teamId: '3b4797e5-bdf3-48e1-a552-839af71562ef',
        channelId: '9:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        appId: 'com.microsoft.teamspace.tab.web',
        appName: 'testweb',
        entityId: 'https://contoso.sharepoint.com/Shared%20Documents/',
        removeUrl: 'https://contoso.sharepoint.com/Shared%20Documents/',
        contentUrl: 'https://contoso.sharepoint.com/Shared%20Documents/',
        websiteUrl: 'https://contoso.sharepoint.com/Shared%20Documents/',
        unknown: 'unknown value'
      }
    });
    assert(loggerLogSpy.calledWith({
      "id": "19:f3dcbb1674574677abcae89cb626f1e6@thread.skype",
      "displayName": "testweb",
      "webUrl": "https://teams.microsoft.com/l/channel/19:f3dcbb1674574677abcae89cb626f1e6@thread.skype/"
    }));
  });

  it('ignores global options when creating request data', async () => {
    const postStub: Sinon.SinonStub = sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`https://graph.microsoft.com/v1.0/teams/3b4797e5-bdf3-48e1-a552-839af71562ef`) > -1) {
        return {
          "id": "19:f3dcbb1674574677abcae89cb626f1e6@thread.skype",
          "displayName": "testweb",
          "webUrl": "https://teams.microsoft.com/l/channel/19:f3dcbb1674574677abcae89cb626f1e6@thread.skype/"
        };
      }
      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        verbose: true,
        output: "text",
        teamId: '3b4797e5-bdf3-48e1-a552-839af71562ef',
        channelId: '9:f3dcbb1674574677abcae89cb626f1e6@thread.skype',
        appId: 'com.microsoft.teamspace.tab.web',
        appName: 'testweb',
        entityId: 'https://contoso.sharepoint.com/Shared%20Documents/',
        removeUrl: 'https://contoso.sharepoint.com/Shared%20Documents/',
        contentUrl: 'https://contoso.sharepoint.com/Shared%20Documents/',
        websiteUrl: 'https://contoso.sharepoint.com/Shared%20Documents/',
        unknown: 'unknown value'
      }
    });
    assert.deepEqual(postStub.firstCall.args[0].data, {
      'teamsApp@odata.bind': 'https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/com.microsoft.teamspace.tab.web',
      configuration: {
        contentUrl: 'https://contoso.sharepoint.com/Shared%20Documents/',
        entityId: 'https://contoso.sharepoint.com/Shared%20Documents/',
        removeUrl: 'https://contoso.sharepoint.com/Shared%20Documents/',
        unknown: 'unknown value',
        websiteUrl: 'https://contoso.sharepoint.com/Shared%20Documents/'
      },
      displayName: 'testweb'
    });
  });

  it('correctly handles error when adding a tab', async () => {
    const error = {
      "error": {
        "code": "UnknownError",
        "message": "An error has occurred",
        "innerError": {
          "date": "2022-02-14T13:27:37",
          "request-id": "77e0ed26-8b57-48d6-a502-aca6211d6e7c",
          "client-request-id": "77e0ed26-8b57-48d6-a502-aca6211d6e7c"
        }
      }
    };

    sinon.stub(request, 'post').rejects(error);

    await assert.rejects(command.action(logger, {
      options: {
        teamId: '3b4797e5-bdf3-48e1-a552-839af71562ef',
        channelId: '19:eab8fda0837c48edb542574d419ff8ab@thread.skype/tabs',
        appId: 'com.microsoft.teamspace.tab.web',
        appName: 'testweb',
        contentUrl: 'https://contoso.sharepoint.com/Shared%20Documents/',
        websiteUrl: 'https://contoso.sharepoint.com/Shared%20Documents/'
      }
    } as any), new CommandError('An error has occurred'));
  });

});
