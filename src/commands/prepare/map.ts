import { flags as oclifFlags } from '@oclif/command';
import { isValidProviderName } from '@superfaceai/ast';
import { normalizeSuperJsonDocument } from '@superfaceai/one-sdk';
import { parseDocumentId } from '@superfaceai/parser';

import type { ILogger } from '../../common';
import { loadSuperJson } from '../../common';
import type { Flags } from '../../common/command.abstract';
import { Command } from '../../common/command.abstract';
import type { UserError } from '../../common/error';
import { ProfileId } from '../../common/profile';
import { prepareMap } from '../../logic/prepare/map';

export class Map extends Command {
  public static strict = true;

  public static description =
    'Prepares map, based on profile and provider on a local filesystem. Created file contains prepared structure with information from profile and provider files. Before running this command you should have prepared profile (run sf prepare:profile) and provider (run sf prepare:provider)';

  public static flags = {
    ...Command.flags,
    // Inputs
    profileId: oclifFlags.string({
      description: 'Profile Id in format [scope](optional)/[name]',
      required: true,
    }),
    providerName: oclifFlags.string({
      description: 'Name of provider.',
      required: true,
    }),
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
    const { flags } = this.parse(Map);
    await super.initialize(flags);
    await this.execute({
      logger: this.logger,
      userError: this.userError,
      flags,
    });
  }

  public async execute({
    logger,
    userError,
    flags,
  }: {
    logger: ILogger;
    userError: UserError;
    flags: Flags<typeof Map.flags>;
  }): Promise<void> {
    // Check inputs
    const parsedProfileId = parseDocumentId(flags.profileId);
    if (parsedProfileId.kind == 'error') {
      throw userError(`Invalid profile id: ${parsedProfileId.message}`, 1);
    }

    if (!isValidProviderName(flags.providerName)) {
      throw userError(`Invalid provider name: "${flags.providerName}"`, 1);
    }
    if (flags.profileId == undefined) {
      throw userError(
        '--profileId must be specified when using --providerName',
        1
      );
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
    const { superJson, superJsonPath } = await loadSuperJson({
      scan: flags.scan,
      userError,
    });

    const normalized = normalizeSuperJsonDocument(superJson);

    // Check super.json
    if (normalized.profiles[flags.profileId] === undefined) {
      throw userError(
        `Unable to prepare, profile: "${flags.profileId}" not found in super.json`,
        1
      );
    }

    if (normalized.providers[flags.providerName] === undefined) {
      throw userError(
        `Unable to prepare, provider: "${flags.providerName}" not found in super.json`,
        1
      );
    }

    await prepareMap(
      {
        id: {
          profile: ProfileId.fromId(flags.profileId, { userError }),
          provider: flags.providerName,
          // TODO: pass variant
          variant: undefined,
        },
        superJson,
        superJsonPath,
        options: {
          force: flags.force,
          station: flags.station,
        },
      },
      {
        userError,
        logger,
      }
    );
  }
}
