import assert from 'assert';
import sinon from 'sinon';
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
import command from './app-remove.js';
import { settingsNames } from '../../../../settingsNames.js';
import { entraApp } from '../../../../utils/entraApp.js';

describe(commands.APP_REMOVE, () => {
  let log: string[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  let promptIssued: boolean = false;
  let deleteRequestStub: sinon.SinonStub;

  //#region Mocked Responses 
  const appResponse = {
    value: [
      {
        "id": "d75be2e1-0204-4f95-857d-51a37cf40be8"
      }
    ]
  };
  //#endregion

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

    sinon.stub(cli, 'promptForConfirmation').callsFake(() => {
      promptIssued = true;
      return Promise.resolve(false);
    });

    promptIssued = false;

    sinon.stub(entraApp, 'getAppRegistrationByAppId').resolves(appResponse.value[0]);

    sinon.stub(request, 'get').callsFake(async (opts: any) => {
      if ((opts.url as string).indexOf(`/v1.0/myorganization/applications?$filter=`) > -1) {
        // fake call for getting app
        if (opts.url.indexOf('startswith') === -1) {
          return {
            "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#applications(id)",
            "value": [
              {
                "id": "d75be2e1-0204-4f95-857d-51a37cf40be8"
              }
            ]
          };
        }
      }
      throw 'Invalid request';
    });

    deleteRequestStub = sinon.stub(request, 'delete').callsFake(async (opts: any) => {
      if (opts.url === 'https://graph.microsoft.com/v1.0/myorganization/applications/d75be2e1-0204-4f95-857d-51a37cf40be8') {
        return;
      }
      throw 'Invalid request';
    });
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      request.delete,
      cli.promptForConfirmation,
      cli.getSettingWithDefaultValue,
      cli.handleMultipleResultsFound,
      entraApp.getAppRegistrationByAppId
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.APP_REMOVE);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if appId and name specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { appId: '9b1b1e42-794b-4c71-93ac-5ed92488b67f', name: 'My app' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if objectId and name specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { objectId: '9b1b1e42-794b-4c71-93ac-5ed92488b67f', name: 'My app' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if neither appId, objectId, nor name specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: {} }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the objectId is not a valid guid', async () => {
    const actual = await command.validate({ options: { objectId: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the appId is not a valid guid', async () => {
    const actual = await command.validate({ options: { appId: 'abc' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if required options specified (appId)', async () => {
    const actual = await command.validate({ options: { appId: '9b1b1e42-794b-4c71-93ac-5ed92488b67f' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if required options specified (objectId)', async () => {
    const actual = await command.validate({ options: { objectId: '9b1b1e42-794b-4c71-93ac-5ed92488b67f' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if required options specified (name)', async () => {
    const actual = await command.validate({ options: { name: 'My app' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('prompts before removing the app when force option not passed', async () => {
    await command.action(logger, {
      options: {
        appId: 'd75be2e1-0204-4f95-857d-51a37cf40be8'
      }
    });

    assert(promptIssued);
  });

  it('aborts removing the app when prompt not confirmed', async () => {
    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        appId: 'd75be2e1-0204-4f95-857d-51a37cf40be8'
      }
    });
    assert(deleteRequestStub.notCalled);
  });

  it('deletes app when prompt confirmed (debug)', async () => {
    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        debug: true,
        appId: 'd75be2e1-0204-4f95-857d-51a37cf40be8'
      }
    });
    assert(deleteRequestStub.called);
  });

  it('deletes app with specified app (client) ID', async () => {
    await command.action(logger, {
      options: {
        appId: 'd75be2e1-0204-4f95-857d-51a37cf40be8',
        force: true
      }
    });
    assert(deleteRequestStub.called);
  });

  it('deletes app with specified object ID', async () => {
    await command.action(logger, {
      options: {
        objectId: 'd75be2e1-0204-4f95-857d-51a37cf40be8',
        force: true
      }
    });
    assert(deleteRequestStub.called);
  });

  it('deletes app with specified name', async () => {
    await command.action(logger, {
      options: {
        name: 'myapp',
        force: true
      }
    });
    assert(deleteRequestStub.called);
  });

  it('fails to get app by id when app does not exists', async () => {
    sinonUtil.restore(entraApp.getAppRegistrationByAppId);
    const error = `App with appId 'd75be2e1-0204-4f95-857d-51a37cf40be8' not found in Microsoft Entra ID`;
    sinon.stub(entraApp, 'getAppRegistrationByAppId').rejects(new Error(error));

    await assert.rejects(command.action(logger, { options: { debug: true, appId: 'd75be2e1-0204-4f95-857d-51a37cf40be8', force: true } } as any), new CommandError(error));
  });

  it('fails to get app by name when app does not exists', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/v1.0/myorganization/applications?$filter=`) > -1) {
        return { value: [] };
      }
      throw 'No Microsoft Entra application registration with name myapp found';
    });

    await assert.rejects(command.action(logger, { options: { debug: true, name: 'myapp', force: true } } as any), new CommandError("No Microsoft Entra application registration with name myapp found"));
  });

  it('fails when multiple apps with same name exists', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/v1.0/myorganization/applications?$filter=`) > -1) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#applications",
          "value": [
            {
              "id": "d75be2e1-0204-4f95-857d-51a37cf40be8"
            },
            {
              "id": "340a4aa3-1af6-43ac-87d8-189819003952"
            }
          ]
        };
      }

      throw "Multiple Microsoft Entra application registration with name 'myapp' found.";
    });

    await assert.rejects(command.action(logger, {
      options: {
        debug: true,
        name: 'myapp',
        force: true
      }
    }), new CommandError("Multiple Microsoft Entra application registration with name 'myapp' found. Found: d75be2e1-0204-4f95-857d-51a37cf40be8, 340a4aa3-1af6-43ac-87d8-189819003952."));
  });

  it('handles selecting single result when multiple apps with the specified name found and cli is set to prompt', async () => {
    sinonUtil.restore(request.get);
    sinon.stub(request, 'get').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/myorganization/applications?$filter=displayName eq 'myapp'&$select=id`) {
        return {
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#applications",
          "value": [
            { "id": "d75be2e1-0204-4f95-857d-51a37cf40be8" },
            { "id": "340a4aa3-1af6-43ac-87d8-189819003952" }
          ]
        };
      }

      throw "Multiple Microsoft Entra application registration with name 'myapp' found.";
    });

    sinon.stub(cli, 'handleMultipleResultsFound').resolves({ id: 'd75be2e1-0204-4f95-857d-51a37cf40be8' });

    await command.action(logger, {
      options: {
        name: 'myapp',
        force: true
      }
    });
    assert(deleteRequestStub.called);
  });
});
