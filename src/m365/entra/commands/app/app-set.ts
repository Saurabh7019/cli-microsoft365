import { Application, KeyCredential, PublicClientApplication, SpaApplication, WebApplication } from '@microsoft/microsoft-graph-types';
import fs from 'fs';
import GlobalOptions from '../../../../GlobalOptions.js';
import { Logger } from '../../../../cli/Logger.js';
import request, { CliRequestOptions } from '../../../../request.js';
import { formatting } from '../../../../utils/formatting.js';
import GraphCommand from '../../../base/GraphCommand.js';
import commands from '../../commands.js';
import { cli } from '../../../../cli/cli.js';
import { optionsUtils } from '../../../../utils/optionsUtils.js';
import { entraApp } from '../../../../utils/entraApp.js';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  appId?: string;
  objectId?: string;
  name?: string;
  platform?: string;
  redirectUris?: string;
  redirectUrisToRemove?: string;
  uris?: string;
  certificateFile?: string;
  certificateBase64Encoded?: string;
  certificateDisplayName?: string;
  allowPublicClientFlows?: boolean;
}

class EntraAppSetCommand extends GraphCommand {
  private static aadApplicationPlatform: string[] = ['spa', 'web', 'publicClient'];

  public get name(): string {
    return commands.APP_SET;
  }

  public get description(): string {
    return 'Updates Entra app registration';
  }

  public allowUnknownOptions(): boolean | undefined {
    return true;
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
    this.#initOptionSets();
    this.#initTypes();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        appId: typeof args.options.appId !== 'undefined',
        objectId: typeof args.options.objectId !== 'undefined',
        name: typeof args.options.name !== 'undefined',
        platform: typeof args.options.platform !== 'undefined',
        redirectUris: typeof args.options.redirectUris !== 'undefined',
        redirectUrisToRemove: typeof args.options.redirectUrisToRemove !== 'undefined',
        uris: typeof args.options.uris !== 'undefined',
        certificateFile: typeof args.options.certificateFile !== 'undefined',
        certificateBase64Encoded: typeof args.options.certificateBase64Encoded !== 'undefined',
        certificateDisplayName: typeof args.options.certificateDisplayName !== 'undefined',
        allowPublicClientFlows: typeof args.options.allowPublicClientFlows !== 'undefined'
      });
      this.trackUnknownOptions(this.telemetryProperties, args.options);
    });
  }

  #initOptions(): void {
    this.options.unshift(
      { option: '--appId [appId]' },
      { option: '--objectId [objectId]' },
      { option: '-n, --name [name]' },
      { option: '-u, --uris [uris]' },
      { option: '-r, --redirectUris [redirectUris]' },
      { option: '--certificateFile [certificateFile]' },
      { option: '--certificateBase64Encoded [certificateBase64Encoded]' },
      { option: '--certificateDisplayName [certificateDisplayName]' },
      {
        option: '--platform [platform]',
        autocomplete: EntraAppSetCommand.aadApplicationPlatform
      },
      { option: '--redirectUrisToRemove [redirectUrisToRemove]' },
      {
        option: '--allowPublicClientFlows [allowPublicClientFlows]',
        autocomplete: ['true', 'false']
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => {
        if (args.options.certificateFile && args.options.certificateBase64Encoded) {
          return 'Specify either certificateFile or certificateBase64Encoded but not both';
        }

        if (args.options.certificateDisplayName && !args.options.certificateFile && !args.options.certificateBase64Encoded) {
          return 'When you specify certificateDisplayName you also need to specify certificateFile or certificateBase64Encoded';
        }

        if (args.options.certificateFile && !fs.existsSync(args.options.certificateFile as string)) {
          return 'Certificate file not found';
        }

        if (args.options.redirectUris && !args.options.platform) {
          return `When you specify redirectUris you also need to specify platform`;
        }

        if (args.options.platform &&
          EntraAppSetCommand.aadApplicationPlatform.indexOf(args.options.platform) < 0) {
          return `${args.options.platform} is not a valid value for platform. Allowed values are ${EntraAppSetCommand.aadApplicationPlatform.join(', ')}`;
        }

        return true;
      }
    );
  }

  #initOptionSets(): void {
    this.optionSets.push({ options: ['appId', 'objectId', 'name'] });
  }

  #initTypes(): void {
    this.types.boolean.push('allowPublicClientFlows');
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    try {
      let objectId = await this.getAppObjectId(args, logger);
      objectId = await this.updateUnknownOptions(args, objectId);
      objectId = await this.configureUri(args, objectId, logger);
      objectId = await this.configureRedirectUris(args, objectId, logger);
      objectId = await this.updateAllowPublicClientFlows(args, objectId, logger);
      await this.configureCertificate(args, objectId, logger);
    }
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }

  private async getAppObjectId(args: CommandArgs, logger: Logger): Promise<string> {
    if (args.options.objectId) {
      return args.options.objectId;
    }

    const { appId, name } = args.options;

    if (this.verbose) {
      await logger.logToStderr(`Retrieving information about Microsoft Entra app ${appId ? appId : name}...`);
    }

    if (appId) {
      const app = await entraApp.getAppRegistrationByAppId(appId, ['id']);
      return app.id!;
    }
    else {
      const requestOptions: CliRequestOptions = {
        url: `${this.resource}/v1.0/myorganization/applications?$filter=displayName eq '${formatting.encodeQueryParameter(name as string)}'&$select=id`,
        headers: {
          accept: 'application/json;odata.metadata=none'
        },
        responseType: 'json'
      };

      const res = await request.get<{ value: { id: string }[] }>(requestOptions);

      if (res.value.length === 1) {
        return res.value[0].id;
      }

      if (res.value.length === 0) {
        throw `No Microsoft Entra application registration with name ${name} found`;
      }

      const resultAsKeyValuePair = formatting.convertArrayToHashTable('id', res.value);
      const result = await cli.handleMultipleResultsFound<{ id: string }>(`Multiple Microsoft Entra application registration with name '${name}' found.`, resultAsKeyValuePair);
      return result.id;
    }
  }

  private async updateUnknownOptions(args: CommandArgs, objectId: string): Promise<string> {
    const unknownOptions = optionsUtils.getUnknownOptions(args.options, this.options);

    if (Object.keys(unknownOptions).length > 0) {
      const requestBody = {};
      optionsUtils.addUnknownOptionsToPayload(requestBody, unknownOptions);

      const requestOptions: CliRequestOptions = {
        url: `${this.resource}/v1.0/myorganization/applications/${objectId}`,
        headers: {
          'content-type': 'application/json;odata.metadata=none'
        },
        responseType: 'json',
        data: requestBody
      };
      await request.patch(requestOptions);
    }
    return objectId;
  }

  private async updateAllowPublicClientFlows(args: CommandArgs, objectId: string, logger: Logger): Promise<string> {
    if (args.options.allowPublicClientFlows === undefined) {
      return objectId;
    }

    if (this.verbose) {
      await logger.logToStderr(`Configuring Entra application AllowPublicClientFlows option...`);
    }

    const applicationInfo: any = {
      isFallbackPublicClient: args.options.allowPublicClientFlows
    };

    const requestOptions: CliRequestOptions = {
      url: `${this.resource}/v1.0/myorganization/applications/${objectId}`,
      headers: {
        'content-type': 'application/json;odata.metadata=none'
      },
      responseType: 'json',
      data: applicationInfo
    };

    await request.patch(requestOptions);
    return objectId;
  }

  private async configureUri(args: CommandArgs, objectId: string, logger: Logger): Promise<string> {
    if (!args.options.uris) {
      return objectId;
    }

    if (this.verbose) {
      await logger.logToStderr(`Configuring Microsoft Entra application ID URI...`);
    }

    const identifierUris: string[] = args.options.uris
      .split(',')
      .map(u => u.trim());

    const applicationInfo: any = {
      identifierUris: identifierUris
    };

    const requestOptions: CliRequestOptions = {
      url: `${this.resource}/v1.0/myorganization/applications/${objectId}`,
      headers: {
        'content-type': 'application/json;odata.metadata=none'
      },
      responseType: 'json',
      data: applicationInfo
    };

    await request.patch(requestOptions);
    return objectId;
  }

  private async configureRedirectUris(args: CommandArgs, objectId: string, logger: Logger): Promise<string> {
    if (!args.options.redirectUris && !args.options.redirectUrisToRemove) {
      return objectId;
    }

    if (this.verbose) {
      await logger.logToStderr(`Configuring Microsoft Entra application redirect URIs...`);
    }

    const getAppRequestOptions: CliRequestOptions = {
      url: `${this.resource}/v1.0/myorganization/applications/${objectId}`,
      headers: {
        'content-type': 'application/json;odata.metadata=none'
      },
      responseType: 'json'
    };

    const application = await request.get<Application>(getAppRequestOptions);

    const publicClientRedirectUris: string[] = (application.publicClient as PublicClientApplication).redirectUris as string[];
    const spaRedirectUris: string[] = (application.spa as SpaApplication).redirectUris as string[];
    const webRedirectUris: string[] = (application.web as WebApplication).redirectUris as string[];

    // start with existing redirect URIs
    const applicationPatch: Application = {
      publicClient: {
        redirectUris: publicClientRedirectUris
      },
      spa: {
        redirectUris: spaRedirectUris
      },
      web: {
        redirectUris: webRedirectUris
      }
    };

    if (args.options.redirectUrisToRemove) {
      // remove redirect URIs from all platforms
      const redirectUrisToRemove: string[] = args.options.redirectUrisToRemove
        .split(',')
        .map(u => u.trim());

      (applicationPatch.publicClient as PublicClientApplication).redirectUris =
        publicClientRedirectUris.filter(u => !redirectUrisToRemove.includes(u));
      (applicationPatch.spa as SpaApplication).redirectUris =
        spaRedirectUris.filter(u => !redirectUrisToRemove.includes(u));
      (applicationPatch.web as WebApplication).redirectUris =
        webRedirectUris.filter(u => !redirectUrisToRemove.includes(u));
    }

    if (args.options.redirectUris) {
      const urlsToAdd: string[] = args.options.redirectUris
        .split(',')
        .map(u => u.trim());

      // add new redirect URIs. If the URI is already present, it will be ignored
      switch (args.options.platform) {
        case 'spa':
          ((applicationPatch.spa as SpaApplication).redirectUris as string[])
            .push(...urlsToAdd.filter(u => !spaRedirectUris.includes(u)));
          break;
        case 'publicClient':
          ((applicationPatch.publicClient as PublicClientApplication).redirectUris as string[])
            .push(...urlsToAdd.filter(u => !publicClientRedirectUris.includes(u)));
          break;
        case 'web':
          ((applicationPatch.web as WebApplication).redirectUris as string[])
            .push(...urlsToAdd.filter(u => !webRedirectUris.includes(u)));
      }
    }

    const requestOptions: CliRequestOptions = {
      url: `${this.resource}/v1.0/myorganization/applications/${objectId}`,
      headers: {
        'content-type': 'application/json;odata.metadata=none'
      },
      responseType: 'json',
      data: applicationPatch
    };

    await request.patch(requestOptions);
    return objectId;
  }

  private async configureCertificate(args: CommandArgs, objectId: string, logger: Logger): Promise<void> {
    if (!args.options.certificateFile && !args.options.certificateBase64Encoded) {
      return;
    }

    if (this.verbose) {
      await logger.logToStderr(`Setting certificate for Microsoft Entra app...`);
    }

    const certificateBase64Encoded = await this.getCertificateBase64Encoded(args, logger);

    const currentKeyCredentials = await this.getCurrentKeyCredentialsList(args, objectId, certificateBase64Encoded, logger);
    if (this.verbose) {
      await logger.logToStderr(`Adding new keyCredential to list`);
    }

    // The KeyCredential graph type defines the 'key' property as 'NullableOption<number>'
    // while it is a base64 encoded string. This is why a cast to any is used here.
    const keyCredentials = currentKeyCredentials.filter(existingCredential => existingCredential.key !== certificateBase64Encoded as any);

    const newKeyCredential = {
      type: "AsymmetricX509Cert",
      usage: "Verify",
      displayName: args.options.certificateDisplayName,
      key: certificateBase64Encoded
    } as any;

    keyCredentials.push(newKeyCredential);

    return this.updateKeyCredentials(objectId, keyCredentials, logger);
  }

  private async getCertificateBase64Encoded(args: CommandArgs, logger: Logger): Promise<string> {
    if (args.options.certificateBase64Encoded) {
      return args.options.certificateBase64Encoded;
    }

    if (this.debug) {
      await logger.logToStderr(`Reading existing ${args.options.certificateFile}...`);
    }

    try {
      return fs.readFileSync(args.options.certificateFile as string, { encoding: 'base64' });
    }
    catch (e) {
      throw new Error(`Error reading certificate file: ${e}. Please add the certificate using base64 option '--certificateBase64Encoded'.`);
    }
  }

  // We first retrieve existing certificates because we need to specify the full list of certificates when updating the app.
  private async getCurrentKeyCredentialsList(args: CommandArgs, objectId: string, certificateBase64Encoded: string, logger: Logger): Promise<KeyCredential[]> {
    if (this.verbose) {
      await logger.logToStderr(`Retrieving current keyCredentials list for app`);
    }

    const getAppRequestOptions: CliRequestOptions = {
      url: `${this.resource}/v1.0/myorganization/applications/${objectId}?$select=keyCredentials`,
      headers: {
        'content-type': 'application/json;odata.metadata=none'
      },
      responseType: 'json'
    };

    const application = await request.get<Application>(getAppRequestOptions);
    return application.keyCredentials || [];
  }

  private async updateKeyCredentials(objectId: string, keyCredentials: KeyCredential[], logger: Logger): Promise<void> {
    if (this.verbose) {
      await logger.logToStderr(`Updating keyCredentials in Microsoft Entra app`);
    }

    const requestOptions: CliRequestOptions = {
      url: `${this.resource}/v1.0/myorganization/applications/${objectId}`,
      headers: {
        'content-type': 'application/json;odata.metadata=none'
      },
      responseType: 'json',
      data: {
        keyCredentials: keyCredentials
      }
    };

    return request.patch(requestOptions);
  }
}

export default new EntraAppSetCommand();