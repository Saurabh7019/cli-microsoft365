import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import config from '../../../../config.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import { spo } from '../../../../utils/spo.js';
import commands from '../../commands.js';
import command from './serviceprincipal-grant-add.js';

describe(commands.SERVICEPRINCIPAL_GRANT_ADD, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(spo, 'getRequestDigest').resolves({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    });
    auth.connection.active = true;
    auth.connection.spoUrl = 'https://contoso.sharepoint.com';
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
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.SERVICEPRINCIPAL_GRANT_ADD);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('grants the specified API permission (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1 &&
        opts.headers &&
        opts.headers['X-RequestDigest'] &&
        opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectPath Id="6" ObjectPathId="5" /><ObjectPath Id="8" ObjectPathId="7" /><Query Id="9" ObjectPathId="7"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><Constructor Id="3" TypeId="{104e8f06-1e00-4675-99c6-1b9b504ed8d8}" /><Property Id="5" ParentId="3" Name="PermissionRequests" /><Method Id="7" ParentId="5" Name="Approve"><Parameters><Parameter Type="String">Microsoft Graph</Parameter><Parameter Type="String">Mail.Read</Parameter></Parameters></Method></ObjectPaths></Request>`) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8224.1210", "ErrorInfo": null, "TraceCorrelationId": "53df9d9e-50fd-0000-37ae-14a315385835"
          }, 18, {
            "IsNull": false
          }, 20, {
            "IsNull": false
          }, 22, {
            "IsNull": false
          }, 23, {
            "_ObjectType_": "Microsoft.Online.SharePoint.TenantAdministration.Internal.SPOWebAppServicePrincipalPermissionGrant", "ClientId": "868668f8-583a-4c66-b3ce-d4e14bc9ceb3", "ConsentType": "AllPrincipals", "IsDomainIsolated": false, "ObjectId": "-GiGhjpYZkyzztThS8nOs8VG6EHn4S1OjgiedYOfUrQ", "PackageName": null, "Resource": "Microsoft Graph", "ResourceId": "41e846c5-e1e7-4e2d-8e08-9e75839f52b4", "Scope": "Mail.Read"
          }
        ]);
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { debug: true, resource: 'Microsoft Graph', scope: 'Mail.Read' } });
    assert(loggerLogSpy.calledWith({
      "ClientId": "868668f8-583a-4c66-b3ce-d4e14bc9ceb3", "ConsentType": "AllPrincipals", "IsDomainIsolated": false, "ObjectId": "-GiGhjpYZkyzztThS8nOs8VG6EHn4S1OjgiedYOfUrQ", "PackageName": null, "Resource": "Microsoft Graph", "ResourceId": "41e846c5-e1e7-4e2d-8e08-9e75839f52b4", "Scope": "Mail.Read"
    }));
  });

  it('grants the specified API permission', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf('/_vti_bin/client.svc/ProcessQuery') > -1 &&
        opts.headers &&
        opts.headers['X-RequestDigest'] &&
        opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="4" ObjectPathId="3" /><ObjectPath Id="6" ObjectPathId="5" /><ObjectPath Id="8" ObjectPathId="7" /><Query Id="9" ObjectPathId="7"><Query SelectAllProperties="true"><Properties /></Query></Query></Actions><ObjectPaths><Constructor Id="3" TypeId="{104e8f06-1e00-4675-99c6-1b9b504ed8d8}" /><Property Id="5" ParentId="3" Name="PermissionRequests" /><Method Id="7" ParentId="5" Name="Approve"><Parameters><Parameter Type="String">Microsoft Graph</Parameter><Parameter Type="String">Mail.Read</Parameter></Parameters></Method></ObjectPaths></Request>`) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8224.1210", "ErrorInfo": null, "TraceCorrelationId": "53df9d9e-50fd-0000-37ae-14a315385835"
          }, 18, {
            "IsNull": false
          }, 20, {
            "IsNull": false
          }, 22, {
            "IsNull": false
          }, 23, {
            "_ObjectType_": "Microsoft.Online.SharePoint.TenantAdministration.Internal.SPOWebAppServicePrincipalPermissionGrant", "ClientId": "868668f8-583a-4c66-b3ce-d4e14bc9ceb3", "ConsentType": "AllPrincipals", "IsDomainIsolated": false, "ObjectId": "-GiGhjpYZkyzztThS8nOs8VG6EHn4S1OjgiedYOfUrQ", "PackageName": null, "Resource": "Microsoft Graph", "ResourceId": "41e846c5-e1e7-4e2d-8e08-9e75839f52b4", "Scope": "Mail.Read"
          }
        ]);
      }

      throw 'Invalid request';
    });
    await command.action(logger, { options: { resource: 'Microsoft Graph', scope: 'Mail.Read' } });
    assert(loggerLogSpy.calledWith({
      "ClientId": "868668f8-583a-4c66-b3ce-d4e14bc9ceb3", "ConsentType": "AllPrincipals", "IsDomainIsolated": false, "ObjectId": "-GiGhjpYZkyzztThS8nOs8VG6EHn4S1OjgiedYOfUrQ", "PackageName": null, "Resource": "Microsoft Graph", "ResourceId": "41e846c5-e1e7-4e2d-8e08-9e75839f52b4", "Scope": "Mail.Read"
    }));
  });

  it('correctly handles error when the specified resource doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async () => {
      return JSON.stringify([
        {
          "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8224.1210", "ErrorInfo": {
            "ErrorMessage": "A service principal with the name Microsoft Graph1 could not be found.\r\nParameter name: resourceName", "ErrorValue": null, "TraceCorrelationId": "5fdf9d9e-00e9-0000-37ae-14e6d75290f3", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
          }, "TraceCorrelationId": "5fdf9d9e-00e9-0000-37ae-14e6d75290f3"
        }
      ]);
    });
    await assert.rejects(command.action(logger, { options: { resource: 'Microsoft Graph1', scope: 'Mail.Read' } } as any),
      new CommandError('A service principal with the name Microsoft Graph1 could not be found.\r\nParameter name: resourceName'));
  });

  it('correctly handles error when the specified scope doesn\'t exist', async () => {
    sinon.stub(request, 'post').callsFake(async () => {
      return JSON.stringify([
        {
          "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8224.1210", "ErrorInfo": {
            "ErrorMessage": "An OAuth permission with the scope Calendar.Read could not be found.\r\nParameter name: permissionRequest", "ErrorValue": null, "TraceCorrelationId": "51df9d9e-d075-0000-37ae-1d4e6902cc2e", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
          }, "TraceCorrelationId": "51df9d9e-d075-0000-37ae-1d4e6902cc2e"
        }
      ]);
    });
    await assert.rejects(command.action(logger, { options: { resource: 'Microsoft Graph', scope: 'Calendar.Read' } } as any),
      new CommandError('An OAuth permission with the scope Calendar.Read could not be found.\r\nParameter name: permissionRequest'));
  });

  it('correctly handles error when the specified permission has already been granted', async () => {
    sinon.stub(request, 'post').callsFake(async () => {
      return JSON.stringify([
        {
          "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.8224.1210", "ErrorInfo": {
            "ErrorMessage": "An OAuth permission with the resource Microsoft Graph and scope Mail.Read already exists.\r\nParameter name: permissionRequest", "ErrorValue": null, "TraceCorrelationId": "1bdf9d9e-1088-0000-38d6-3b6395428c90", "ErrorCode": -2147024809, "ErrorTypeName": "System.ArgumentException"
          }, "TraceCorrelationId": "1bdf9d9e-1088-0000-38d6-3b6395428c90"
        }
      ]);
    });
    await assert.rejects(command.action(logger, { options: { resource: 'Microsoft Graph', scope: 'Mail.Read' } } as any),
      new CommandError('An OAuth permission with the resource Microsoft Graph and scope Mail.Read already exists.\r\nParameter name: permissionRequest'));
  });

  it('correctly handles random API error', async () => {
    sinon.stub(request, 'post').callsFake(() => { throw 'An error has occurred'; });
    await assert.rejects(command.action(logger, { options: { resource: 'Microsoft Graph', scope: 'Mail.Read' } } as any),
      new CommandError('An error has occurred'));
  });

  it('defines alias', () => {
    const alias = command.alias();
    assert.notStrictEqual(typeof alias, 'undefined');
  });
});
