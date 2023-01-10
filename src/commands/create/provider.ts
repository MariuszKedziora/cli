import { flags as oclifFlags } from '@oclif/command';
import { isValidProviderName } from '@superfaceai/ast';
import { loadSuperJson, META_FILE, NodeFileSystem } from '@superfaceai/one-sdk';
import { join as joinPath } from 'path';

import type { ILogger } from '../../common';
import type { Flags } from '../../common/command.abstract';
import { Command } from '../../common/command.abstract';
import type { UserError } from '../../common/error';
import { createProvider } from '../../logic/create/provider';
import { detectSuperJson } from '../../logic/install';

export class Provider extends Command {
  public static strict = true;

  public static description =
    'Prepares provider on a local filesystem and adds it to super.json. You do not have to touch super.json or created provider.json file after running this command.';

  public static examples = [
    '$ superface prepare:provider swapi --force',
    '$ superface prepare:provider swapi -s 3',
    '$ superface prepare:provider swapi --station',
  ];

  public static args = [
    { name: 'providerName', description: 'Name of provider', required: true },
  ];

  public static flags = {
    ...Command.flags,
    // Inputs
    scan: oclifFlags.integer({
      char: 's',
      description:
        'When number provided, scan for super.json outside cwd within range represented by this number.',
      required: false,
    }),
    force: oclifFlags.boolean({
      char: 'f',
      description:
        'When set to true and when profile exists in local filesystem, overwrites them.',
      default: false,
    }),
    station: oclifFlags.boolean({
      default: false,
      description:
        'When set to true, command will create map in folder structure of Superface station',
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = this.parse(Provider);
    await super.initialize(flags);
    await this.execute({
      logger: this.logger,
      userError: this.userError,
      flags,
      args,
    });
  }

  public async execute({
    logger,
    userError,
    flags,
    args,
  }: {
    logger: ILogger;
    userError: UserError;
    flags: Flags<typeof Provider.flags>;
    args: { providerName?: string };
  }): Promise<void> {
    // Check inputs
    if (args.providerName === undefined) {
      throw userError(`Argument provider name must be provided`, 1);
    }
    if (!isValidProviderName(args.providerName)) {
      throw userError(`Invalid provider name: ${args.providerName}`, 1);
    }

    if (
      flags.scan !== undefined &&
      (typeof flags.scan !== 'number' || flags.scan > 5)
    ) {
      throw userError(
        '--scan/-s : Number of levels to scan cannot be higher than 5',
        1
      );
    }

    const superPath: string | undefined = await detectSuperJson(
      process.cwd(),
      flags.scan
    );
    if (superPath === undefined) {
      throw userError('Unable to load super.json, super.json not found', 1);
    }
    // Load super json
    const superJsonPath = joinPath(superPath, META_FILE);
    const loadedResult = await loadSuperJson(superJsonPath, NodeFileSystem);
    const superJson = loadedResult.match(
      v => v,
      err => {
        throw userError(`Unable to load super.json: ${err.formatShort()}`, 1);
      }
    );

    await createProvider(
      {
        provider: args.providerName,
        superJson,
        superJsonPath,
        options: {
          force: flags.force,
          station: flags.station,
        },
      },
      {
        logger,
        userError,
      }
    );
  }
}
