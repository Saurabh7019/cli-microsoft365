import { Logger } from '../../../../cli/Logger.js';
import GlobalOptions from '../../../../GlobalOptions.js';
import request, { CliRequestOptions } from '../../../../request.js';
import { formatting } from '../../../../utils/formatting.js';
import DelegatedGraphCommand from '../../../base/DelegatedGraphCommand.js';
import commands from '../../commands.js';
import { ToDoList } from '../../ToDoList.js';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  id?: string;
  name?: string;
}

class TodoListGetCommand extends DelegatedGraphCommand {
  public get name(): string {
    return commands.LIST_GET;
  }

  public get description(): string {
    return 'Gets a specific list of Microsoft To Do task lists';
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initOptionSets();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        id: typeof args.options.id !== 'undefined',
        name: typeof args.options.name !== 'undefined'
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-i, --id [id]'
      },
      {
        option: '-n, --name [name]'
      }
    );
  }

  #initOptionSets(): void {
    this.optionSets.push({ options: ['id', 'name'] });
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    try {
      const item = await this.getList(args.options);
      await logger.log(item);
    }
    catch (err: any) {
      this.handleRejectedODataJsonPromise(err);
    }
  }

  private async getList(options: Options): Promise<any> {
    const requestOptions: CliRequestOptions = {
      headers: {
        accept: 'application/json;odata.metadata=none'
      },
      responseType: 'json'
    };

    if (options.id) {
      requestOptions.url = `${this.resource}/v1.0/me/todo/lists/${options.id}`;
      const result = await request.get<ToDoList>(requestOptions);
      return result;
    }

    requestOptions.url = `${this.resource}/v1.0/me/todo/lists?$filter=displayName eq '${formatting.encodeQueryParameter(options.name!)}'`;
    const result = await request.get<{ value: ToDoList[] }>(requestOptions);

    if (result.value.length === 0) {
      throw `The specified list '${options.name}' does not exist.`;
    }

    return result.value[0];
  }
}

export default new TodoListGetCommand();