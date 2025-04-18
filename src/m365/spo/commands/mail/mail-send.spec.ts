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
import command from './mail-send.js';

describe(commands.MAIL_SEND, () => {
  let log: any[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  let requests: any[];

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
    requests = [];
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
    assert.strictEqual(command.name, commands.MAIL_SEND);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('Send an email to one recipient (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email' } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email' } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient and from someone (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', from: 'someone@contoso.com', verbose: true } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient and from someone', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', from: 'someone@contoso.com' } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient and from some peoples (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', from: 'user@contoso.com,someone@consotos.com', verbose: true } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient and from some peoples', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', from: 'user@contoso.com,someone@consotos.com' } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient and CC someone (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', cc: 'someone@contoso.com', verbose: true } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient and CC someone', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', cc: 'someone@contoso.com' } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient and BCC someone (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', bcc: 'someone@contoso.com', verbose: true } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient and BCC someone', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', bcc: 'someone@contoso.com' } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient with additional header (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', additionalHeaders: '{"X-Custom": "My Custom Header Value"}', verbose: true } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('Send an email to one recipient with additional header', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      requests.push(opts);
      if ((opts.url as string).indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1) {
        return '';
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', additionalHeaders: '{"X-Custom": "My Custom Header Value"}' } });
    let correctRequestIssued = false;
    requests.forEach(r => {
      if (r.url.indexOf(`/_api/SP.Utilities.Utility.SendEmail`) > -1 &&
        r.data) {
        correctRequestIssued = true;
      }
    });

    assert(correctRequestIssued);
  });

  it('correctly handles random API error', async () => {
    sinon.stub(request, 'post').callsFake(() => {
      throw 'An error has occurred';
    });

    await assert.rejects(command.action(logger, { options: { webUrl: "https://contoso.sharepoint.com", to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email', additionalHeaders: '{"X-Custom": "My Custom Header Value"}' } } as any),
      new CommandError('An error has occurred'));
  });

  it('supports specifying URL', () => {
    const options = command.options;
    let containsTypeOption = false;
    options.forEach(o => {
      if (o.option.indexOf('<webUrl>') > -1) {
        containsTypeOption = true;
      }
    });
    assert(containsTypeOption);
  });

  it('fails validation if the webUrl option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo', to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if at least the webUrl \'to\', \'subject\' and \'body\' are sprecified', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', to: 'user@contoso.com', subject: 'Subject of the email', body: 'Content of the email' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});
