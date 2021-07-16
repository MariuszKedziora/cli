import { SuperJson } from '@superfaceai/one-sdk';
import { getLocal } from 'mockttp';
import { join as joinPath } from 'path';

import { exists, mkdir, mkdirQuiet, readFile, rimraf } from '../common/io';
import { OutputStream } from '../common/output-stream';
import { execCLI, mockResponsesForProfile, setUpTempDir } from '../test/utils';

const mockServer = getLocal();

describe('Install CLI command', () => {
  //File specific path
  const TEMP_PATH = joinPath('test', 'tmp');
  let tempDir: string;

  beforeAll(async () => {
    await mkdir(TEMP_PATH, { recursive: true });
    await mockServer.start();
    await mockResponsesForProfile(mockServer, 'starwars/character-information');
    await mockResponsesForProfile(
      mockServer,
      'starwars/character-information@1.0.2'
    );
  });

  beforeEach(async () => {
    tempDir = await setUpTempDir(TEMP_PATH);
  });

  afterEach(async () => {
    await rimraf(tempDir);
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  describe('when installing new profile', () => {
    it('installs the newest profile', async () => {
      const paths = [
        joinPath(
          tempDir,
          'superface',
          'types',
          'starwars',
          'character-information' + '.js'
        ),
        joinPath(
          tempDir,
          'superface',
          'types',
          'starwars',
          'character-information' + '.d.ts'
        ),
        joinPath(tempDir, 'superface', 'sdk.js'),
        joinPath(tempDir, 'superface', 'sdk.d.ts'),
      ];
      await expect(exists(paths[0])).resolves.toBe(false);
      await expect(exists(paths[1])).resolves.toBe(false);
      await expect(exists(paths[2])).resolves.toBe(false);
      await expect(exists(paths[3])).resolves.toBe(false);

      const result = await execCLI(
        tempDir,
        ['install', 'starwars/character-information'],
        mockServer.url
      );
      expect(result.stdout).toMatch(
        'All profiles (1) have been installed successfully.'
      );
      await expect(
        exists(joinPath(tempDir, 'superface', 'super.json'))
      ).resolves.toBe(true);
      await expect(
        exists(
          joinPath(
            tempDir,
            'superface',
            'grid',
            'starwars',
            'character-information@1.0.1.supr'
          )
        )
      ).resolves.toBe(true);

      await expect(exists(paths[0])).resolves.toBe(true);
      await expect(exists(paths[1])).resolves.toBe(true);
      await expect(exists(paths[2])).resolves.toBe(true);
      await expect(exists(paths[3])).resolves.toBe(true);
    }, 30000);

    it('installs the specified profile version with default provider configuration', async () => {
      const result = await execCLI(
        tempDir,
        ['install', 'starwars/character-information@1.0.2'],
        mockServer.url
      );
      expect(result.stdout).toMatch(
        'All profiles (1) have been installed successfully.'
      );
      await expect(
        exists(joinPath(tempDir, 'superface', 'super.json'))
      ).resolves.toBe(true);

      await expect(
        exists(
          joinPath(
            tempDir,
            'superface',
            'grid',
            'starwars',
            'character-information@1.0.2.supr'
          )
        )
      ).resolves.toBe(true);
    }, 20000);

    it('installs local profile', async () => {
      const profileId = 'starwars/character-information';
      const profileIdRequest =
        '../../../fixtures/profiles/starwars/character-information.supr';

      const result = await execCLI(
        tempDir,
        ['install', profileIdRequest, '--local'],
        mockServer.url
      );
      expect(result.stdout).toMatch(
        'All profiles (1) have been installed successfully.'
      );
      await expect(
        exists(joinPath(tempDir, 'superface', 'super.json'))
      ).resolves.toBe(true);

      const superJson = (
        await SuperJson.load(joinPath(tempDir, 'superface', 'super.json'))
      ).unwrap();

      expect(superJson.document.profiles![profileId]).toEqual({
        file: `../${profileIdRequest}`,
      });
    }, 20000);

    it('adds new typings to previously generated', async () => {
      const profileId = 'starwars/character-information';
      const anotherProfileId = 'starwars/spaceship-information';
      const profileIdRequest =
        '../../../fixtures/profiles/starwars/spaceship-information.supr';

      const paths = [
        joinPath(tempDir, 'superface', 'types', profileId + '.js'),
        joinPath(tempDir, 'superface', 'types', profileId + '.d.ts'),
        joinPath(tempDir, 'superface', 'sdk.js'),
        joinPath(tempDir, 'superface', 'sdk.d.ts'),
        joinPath(tempDir, 'superface', 'types', anotherProfileId + '.js'),
        joinPath(tempDir, 'superface', 'types', anotherProfileId + '.d.ts'),
      ];
      await expect(exists(paths[0])).resolves.toBe(false);
      await expect(exists(paths[1])).resolves.toBe(false);
      await expect(exists(paths[2])).resolves.toBe(false);
      await expect(exists(paths[3])).resolves.toBe(false);
      await expect(exists(paths[4])).resolves.toBe(false);
      await expect(exists(paths[5])).resolves.toBe(false);

      let result = await execCLI(
        tempDir,
        ['install', 'starwars/character-information'],
        mockServer.url
      );
      expect(result.stdout).toMatch(
        'All profiles (1) have been installed successfully.'
      );

      await expect(exists(paths[0])).resolves.toBe(true);
      await expect(exists(paths[1])).resolves.toBe(true);
      await expect(exists(paths[2])).resolves.toBe(true);
      await expect(exists(paths[3])).resolves.toBe(true);
      await expect(exists(paths[4])).resolves.toBe(false);
      await expect(exists(paths[5])).resolves.toBe(false);

      result = await execCLI(
        tempDir,
        ['install', profileIdRequest, '--local'],
        mockServer.url
      );
      expect(result.stdout).toMatch(
        'All profiles (1) have been installed successfully.'
      );

      await expect(exists(paths[0])).resolves.toBe(true);
      await expect(exists(paths[1])).resolves.toBe(true);
      await expect(exists(paths[2])).resolves.toBe(true);
      await expect(exists(paths[3])).resolves.toBe(true);
      await expect(exists(paths[4])).resolves.toBe(true);
      await expect(exists(paths[5])).resolves.toBe(true);

      const sdk = (await readFile(paths[2])).toString();

      expect(sdk).toMatch(/starwarsCharacterInformation/);
      expect(sdk).toMatch(/starwarsSpaceshipInformation/);
    }, 50000);

    it('error when installing non-existent local profile', async () => {
      const profileIdRequest = 'none.supr';

      const result = await execCLI(
        tempDir,
        ['install', profileIdRequest, '--local'],
        mockServer.url
      );
      expect(result.stdout).toMatch('❌ No profiles have been installed');

      await expect(
        exists(joinPath(tempDir, 'superface', 'super.json'))
      ).resolves.toBe(true);

      const superJson = (
        await SuperJson.load(joinPath(tempDir, 'superface', 'super.json'))
      ).unwrap();

      expect(superJson.document.profiles).toStrictEqual({});
    }, 20000);

    it('errors without a force flag', async () => {
      const profileId = 'starwars/character-information';

      //set existing super.json
      const localSuperJson = {
        profiles: {
          [profileId]: {
            file:
              '../../../../fixtures/profiles/starwars/character-information.supr',
          },
        },
        providers: {},
      };
      await mkdirQuiet(joinPath(tempDir, 'superface'));
      await OutputStream.writeOnce(
        joinPath(tempDir, 'superface', 'super.json'),
        JSON.stringify(localSuperJson, undefined, 2)
      );

      const result = await execCLI(
        tempDir,
        ['install', 'starwars/character-information'],
        mockServer.url
      );

      expect(result.stdout).toMatch('File already exists:');

      expect(result.stdout).toMatch('❌ No profiles have been installed');
    }, 20000);
  });
});
