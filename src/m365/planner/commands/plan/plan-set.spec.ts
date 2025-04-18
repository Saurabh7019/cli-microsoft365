import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { formatting } from '../../../../utils/formatting.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './plan-set.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.PLAN_SET, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  const id = '2Vf8JHgsBUiIf-nuvBtv-ZgAAYw2';
  const title = 'Plan name';
  const ownerGroupName = 'Group name';
  const ownerGroupId = '00000000-0000-0000-0000-000000000002';
  const rosterId = '8bc07d47-c06f-41e1-8f00-1c113c8f6067';
  const newTitle = 'New Title';
  const user = 'user@contoso.com';
  const userId = '00000000-0000-0000-0000-000000000000';
  const user1 = 'user1@contoso.com';
  const user1Id = '00000000-0000-0000-0000-000000000001';
  const shareWithUserNames = `${user},${user1}`;
  const shareWithUserIds = `${userId},${user1Id}`;
  const category21 = 'ToDo';
  const category25 = 'Urgent';

  const userResponse = {
    "value": [
      {
        "id": userId,
        "userPrincipalName": user
      }
    ]
  };

  const user1Response = {
    "value": [
      {
        "id": user1Id,
        "userPrincipalName": user1
      }
    ]
  };

  const etagResponse = {
    "@odata.etag": "TestEtag"
  };

  const singleGroupsResponse = {
    value: [
      {
        id: ownerGroupId
      }
    ]
  };

  const singlePlansResponse = {
    value: [
      {
        '@odata.etag': 'abcdef',
        id: id,
        title: title
      }
    ]
  };

  const planResponse = {
    "id": id,
    "title": title
  };

  const planDetailsResponse = {
    "sharedWith": {
      "00000000-0000-0000-0000-000000000000": true,
      "00000000-0000-0000-0000-000000000001": true
    },
    "categoryDescriptions": {
      "category1": null,
      "category2": null,
      "category3": null,
      "category4": null,
      "category5": null,
      "category6": null,
      "category7": null,
      "category8": null,
      "category9": null,
      "category10": null,
      "category11": null,
      "category12": null,
      "category13": null,
      "category14": null,
      "category15": null,
      "category16": null,
      "category17": null,
      "category18": null,
      "category19": null,
      "category20": null,
      "category21": category21,
      "category22": null,
      "category23": null,
      "category24": null,
      "category25": category25
    }
  };

  const outputResponse = {
    ...planResponse,
    ...planDetailsResponse
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
    auth.connection.accessTokens[(command as any).resource] = {
      accessToken: 'abc',
      expiresOn: new Date()
    };
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
      request.get,
      request.patch,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.accessTokens = {};
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.PLAN_SET);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if the ownerGroupId is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        title: title,
        ownerGroupId: 'invalid guid'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if shareWithUserNames contains invalid user principal name', async () => {
    const shareWithUserNames = ['john.doe@contoso.com', 'foo'];
    const actual = await command.validate({
      options: {
        title: title,
        ownerGroupId: ownerGroupId,
        shareWithUserNames: shareWithUserNames.join(',')
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if neither the ownerGroupId nor ownerGroupName are provided when using title.', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        title: title
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when both ownerGroupId and ownerGroupName are specified when using title', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({
      options: {
        title: title,
        ownerGroupId: ownerGroupId,
        ownerGroupName: ownerGroupName
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if shareWithUserIds contains invalid guid.', async () => {
    const actual = await command.validate({
      options: {
        title: title,
        ownerGroupId: ownerGroupId,
        shareWithUserIds: "invalid guid"
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when both shareWithUserIds and shareWithUserNames are specified', async () => {
    const actual = await command.validate({
      options: {
        title: title,
        ownerGroupId: ownerGroupId,
        shareWithUserIds: shareWithUserIds,
        shareWithUserNames: shareWithUserNames
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when invalid category are specified', async () => {
    const actual = await command.validate({
      options: {
        id: id,
        category27: 'ToDo',
        category35: 'Urgent'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when valid title and ownerGroupId specified', async () => {
    const actual = await command.validate({
      options: {
        title: title,
        ownerGroupName: ownerGroupName
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid title, ownerGroupName, and shareWithUserIds specified', async () => {
    const actual = await command.validate({
      options: {
        title: title,
        ownerGroupId: ownerGroupId,
        shareWithUserIds: shareWithUserIds
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when valid title, ownerGroupName, and validShareWithUserNames specified', async () => {
    const actual = await command.validate({
      options: {
        title: title,
        ownerGroupId: ownerGroupId,
        shareWithUserNames: shareWithUserNames
      }
    }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('correctly updates planner plan title with given id (debug)', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}`) {
        return planResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return planDetailsResponse;
      }

      return 'Invalid request';
    });

    sinon.stub(request, 'patch').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}`) {
        return planResponse;
      }

      return 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        id: id,
        newTitle: newTitle
      }
    });

    assert(loggerLogSpy.calledWith(outputResponse));
  });

  it('correctly updates planner plan shareWithUserNames with given title and ownerGroupName', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups?$filter=displayName eq '${formatting.encodeQueryParameter(ownerGroupName)}'&$select=id`) {
        return singleGroupsResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/groups/${ownerGroupId}/planner/plans?$select=id,title`) {
        return singlePlansResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}`) {
        return planResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '${formatting.encodeQueryParameter(user)}'&$select=id,userPrincipalName`) {
        return userResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '${formatting.encodeQueryParameter(user1)}'&$select=id,userPrincipalName`) {
        return user1Response;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return planDetailsResponse;
      }

      return 'Invalid request';
    });

    sinon.stub(request, 'patch').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return outputResponse;
      }

      return 'Invalid request';
    });

    await command.action(logger, {
      options: {
        title: title,
        ownerGroupName: ownerGroupName,
        shareWithUserNames: shareWithUserNames
      }
    });

    assert(loggerLogSpy.calledWith(outputResponse));
  });

  it('correctly updates planner plan shareWithUserIds with given title and ownerGroupId', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups?$filter=displayName eq '${formatting.encodeQueryParameter(ownerGroupName)}'&$select=id`) {
        return singleGroupsResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/groups/${ownerGroupId}/planner/plans?$select=id,title`) {
        return singlePlansResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}`) {
        return planResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return planDetailsResponse;
      }

      return 'Invalid request';
    });

    sinon.stub(request, 'patch').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return outputResponse;
      }

      return 'Invalid request';
    });

    await command.action(logger, {
      options: {
        title: title,
        ownerGroupId: ownerGroupId,
        shareWithUserIds: shareWithUserIds
      }
    });

    assert(loggerLogSpy.calledWith(outputResponse));
  });

  it('correctly updates planner plan shareWithUserIds with given title and rosterId', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/beta/planner/rosters/${rosterId}/plans?$select=id`) {
        return singlePlansResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}`) {
        return planResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return planDetailsResponse;
      }

      return 'Invalid request';
    });

    sinon.stub(request, 'patch').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return outputResponse;
      }

      return 'Invalid request';
    });

    await command.action(logger, {
      options: {
        title: title,
        rosterId: rosterId,
        shareWithUserIds: shareWithUserIds
      }
    });

    assert(loggerLogSpy.calledWith(outputResponse));
  });


  it('correctly updates planner plan categories with given id', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}`) {
        return planResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return etagResponse;
      }

      return 'Invalid request';
    });

    sinon.stub(request, 'patch').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return outputResponse;
      }

      return 'Invalid request';
    });

    await command.action(logger, {
      options: {
        debug: true,
        id: id,
        category21: category21,
        category25: category25
      }
    });

    assert(loggerLogSpy.calledWith(outputResponse));
  });

  it('fails when an invalid user is specified', async () => {
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/groups?$filter=displayName eq '${formatting.encodeQueryParameter(ownerGroupName)}'&$select=id`) {
        return singleGroupsResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/groups/${ownerGroupId}/planner/plans?$select=id,title`) {
        return singlePlansResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}`) {
        return planResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '${formatting.encodeQueryParameter(user)}'&$select=id,userPrincipalName`) {
        return userResponse;
      }

      if (opts.url === `https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '${formatting.encodeQueryParameter(user1)}'&$select=id,userPrincipalName`) {
        return { value: [] };
      }

      return 'Invalid request';
    });

    sinon.stub(request, 'patch').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/planner/plans/${id}/details`) {
        return outputResponse;
      }

      return 'Invalid request';
    });

    await assert.rejects(command.action(logger, {
      options: {
        title: title,
        ownerGroupName: ownerGroupName,
        shareWithUserNames: shareWithUserNames
      }
    }), new CommandError(`Cannot proceed with planner plan creation. The following users provided are invalid: ${user1}`));
  });

  it('correctly handles API OData error', async () => {
    sinon.stub(request, 'get').rejects(new Error('An error has occurred.'));

    await assert.rejects(command.action(logger, { options: {} }), new CommandError('An error has occurred.'));
  });
});
