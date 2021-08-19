import { CLIError } from '@oclif/errors';
import { MapDocumentNode, ProfileDocumentNode } from '@superfaceai/ast';
import { ServiceClient } from '@superfaceai/service-client';
import { mocked } from 'ts-jest/utils';

import { exists, readFile } from '../common/io';
import { Parser } from '../common/parser';
import { publish } from './publish';

//Mock service client
jest.mock('@superfaceai/service-client');

//Mock io
jest.mock('../common/io', () => ({
  exists: jest.fn(),
  readFile: jest.fn(),
}));

//Mock parser
jest.mock('@superfaceai/parser', () => ({
  ...jest.requireActual<Record<string, unknown>>('@superfaceai/parser'),
  parseMap: jest.fn(),
  parseProfile: jest.fn(),
}));

describe('Publish logic', () => {
  describe('when publishing', () => {
    const mockProfileName = 'character-information';
    const mockProviderName = 'swapi';
    const mockScope = 'starwars';

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('publishes profile', async () => {
      const mockProfileDocument: ProfileDocumentNode = {
        kind: 'ProfileDocument',
        header: {
          kind: 'ProfileHeader',
          name: 'test-profile',
          version: {
            major: 1,
            minor: 0,
            patch: 0,
          },
        },
        definitions: [],
      };
      const mockPath = '/test/path.supr';
      const mockContent = 'profile content';

      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      const parseSpy = jest
        .spyOn(Parser, 'parseProfile')
        .mockResolvedValue(mockProfileDocument);

      const createSpy = jest
        .spyOn(ServiceClient.prototype, 'createProfile')
        .mockResolvedValue(undefined);

      const info = {
        profileName: mockProfileName,
        providerName: mockProviderName,
        scope: mockScope,
      };
      await expect(publish(mockPath, info)).resolves.toBeUndefined();

      expect(createSpy).toHaveBeenCalledWith(mockContent);

      expect(parseSpy).toHaveBeenCalledWith(
        mockContent,
        `${info.scope}/${info.profileName}`,
        info
      );
    });

    it('does not publish profile with --dry-run flag', async () => {
      const mockProfileDocument: ProfileDocumentNode = {
        kind: 'ProfileDocument',
        header: {
          kind: 'ProfileHeader',
          name: 'test-profile',
          version: {
            major: 1,
            minor: 0,
            patch: 0,
          },
        },
        definitions: [],
      };
      const mockPath = '/test/path.supr';
      const mockContent = 'profile content';
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      const parseSpy = jest
        .spyOn(Parser, 'parseProfile')
        .mockResolvedValue(mockProfileDocument);
      const createSpy = jest
        .spyOn(ServiceClient.prototype, 'createProfile')
        .mockResolvedValue(undefined);
      const info = {
        profileName: mockProfileName,
        providerName: mockProviderName,
      };

      await expect(
        publish(mockPath, info, { dryRun: true })
      ).resolves.toBeUndefined();

      expect(createSpy).not.toHaveBeenCalled();
      expect(parseSpy).toHaveBeenCalledWith(
        mockContent,
        info.profileName,
        info
      );
    });

    it('publishes map', async () => {
      const mockMapDocument: MapDocumentNode = {
        kind: 'MapDocument',
        header: {
          kind: 'MapHeader',
          profile: {
            name: 'different-test-profile',
            scope: 'some-map-scope',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
            },
          },
          provider: 'test-profile',
        },
        definitions: [],
      };
      const mockPath = '/test/path.suma';
      const mockContent = 'map content';
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      const parseSpy = jest
        .spyOn(Parser, 'parseMap')
        .mockResolvedValue(mockMapDocument);
      const createSpy = jest
        .spyOn(ServiceClient.prototype, 'createMap')
        .mockResolvedValue(undefined);
      const info = {
        profileName: mockProfileName,
        providerName: mockProviderName,
        scope: mockScope,
      };

      await expect(publish(mockPath, info)).resolves.toBeUndefined();

      expect(createSpy).toHaveBeenCalledWith(mockContent);
      expect(parseSpy).toHaveBeenCalledWith(
        mockContent,
        `${info.scope}/${info.profileName}.${info.providerName}`,
        info
      );
    });

    it('does not publish map with --dry-run flag', async () => {
      const mockMapDocument: MapDocumentNode = {
        kind: 'MapDocument',
        header: {
          kind: 'MapHeader',
          profile: {
            name: 'different-test-profile',
            scope: 'some-map-scope',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
            },
          },
          provider: 'test-profile',
        },
        definitions: [],
      };
      const mockPath = '/test/path.suma';
      const mockContent = 'map content';
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      const parseSpy = jest
        .spyOn(Parser, 'parseMap')
        .mockResolvedValue(mockMapDocument);
      const createSpy = jest
        .spyOn(ServiceClient.prototype, 'createMap')
        .mockResolvedValue(undefined);
      const info = {
        profileName: mockProfileName,
        providerName: mockProviderName,
      };

      await expect(
        publish(mockPath, info, { dryRun: true })
      ).resolves.toBeUndefined();

      expect(createSpy).not.toHaveBeenCalled();
      expect(parseSpy).toHaveBeenCalledWith(
        mockContent,
        `${info.profileName}.${info.providerName}`,
        info
      );
    });

    it('publishes provider', async () => {
      const mockPath = '/test/path.json';
      const mockContent = JSON.stringify({
        name: 'swapi',
        services: [
          {
            id: 'default',
            baseUrl: 'https://swapi.dev/api',
          },
        ],
        defaultService: 'default',
      });
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      const createSpy = jest
        .spyOn(ServiceClient.prototype, 'createProvider')
        .mockResolvedValue(undefined);
      await expect(
        publish(mockPath, {
          profileName: mockProfileName,
          providerName: mockProviderName,
          scope: mockScope,
        })
      ).resolves.toBeUndefined();

      expect(createSpy).toHaveBeenCalledWith(mockContent);
    });

    it('does not publish provider with --dry-run flag', async () => {
      const mockPath = '/test/path.json';
      const mockContent = JSON.stringify({
        name: 'swapi',
        services: [
          {
            id: 'default',
            baseUrl: 'https://swapi.dev/api',
          },
        ],
        defaultService: 'default',
      });
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      const createSpy = jest
        .spyOn(ServiceClient.prototype, 'createProvider')
        .mockResolvedValue(undefined);
      await expect(
        publish(
          mockPath,
          {
            profileName: mockProfileName,
            providerName: mockProviderName,
            scope: mockScope,
          },
          { dryRun: true }
        )
      ).resolves.toBeUndefined();

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('throws when path does not exist', async () => {
      const mockPath = '/test/path.suma';
      mocked(exists).mockResolvedValue(false);
      await expect(
        publish(mockPath, {
          profileName: mockProfileName,
          providerName: mockProviderName,
          scope: mockScope,
        })
      ).rejects.toEqual(new CLIError('Path does not exist'));
    });

    it('throws when path has ast.json extension', async () => {
      mocked(exists).mockResolvedValue(true);
      await expect(
        publish('/test/test.suma.ast.json', {
          profileName: mockProfileName,
          providerName: mockProviderName,
          scope: mockScope,
        })
      ).rejects.toEqual(
        new CLIError(
          'Please use a .supr or .suma file instead of .ast.json compiled file'
        )
      );
      await expect(
        publish('/test/test.supr.ast.json', {
          profileName: mockProfileName,
          providerName: mockProviderName,
          scope: mockScope,
        })
      ).rejects.toEqual(
        new CLIError(
          'Please use a .supr or .suma file instead of .ast.json compiled file'
        )
      );
    });

    it('throws when path has unknown extension', async () => {
      const mockContent = 'someContent';
      const moskPath = '/test/path.stp';
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      await expect(
        publish(moskPath, {
          profileName: mockProfileName,
          providerName: mockProviderName,
          scope: mockScope,
        })
      ).rejects.toEqual(new CLIError('Unknown file extension'));
    });

    it('throws when loaded file has not provider json structure', async () => {
      const mockContent = JSON.stringify({ test: 'test' });
      const moskPath = '/test/path.json';
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      await expect(
        publish(moskPath, {
          profileName: mockProfileName,
          providerName: mockProviderName,
          scope: mockScope,
        })
      ).rejects.toEqual(
        new CLIError('File does not have provider json structure')
      );
    });

    it('throws when loaded file has not profile document node structure', async () => {
      const mockProfileDocument = {
        kind: '',
        header: {
          extra: 'extra',
          kind: 'ProfileHeader',
          name: 'test-profile',
          version: {
            major: 1,
            minor: 0,
            patch: 0,
          },
        },
        definitions: [],
      };
      const mockContent = '';
      const moskPath = '/test/path.supr';
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      const parseSpy = jest
        .spyOn(Parser, 'parseProfile')
        .mockResolvedValue(mockProfileDocument as ProfileDocumentNode);
      const info = {
        profileName: mockProfileName,
        providerName: mockProviderName,
        scope: mockScope,
      };

      await expect(publish(moskPath, info)).rejects.toEqual(
        new CLIError('Unknown profile file structure')
      );
      expect(parseSpy).toHaveBeenCalledWith(
        mockContent,
        `${info.scope}/${info.profileName}`,
        info
      );
    });

    it('throws when loaded file has not map document node structure', async () => {
      const mockMapDocument = {
        kind: '',
        header: {
          kind: 'MapHeader',
          profile: {
            name: 'different-test-profile',
            scope: 'some-map-scope',
            version: {
              major: 1,
              minor: 0,
              patch: 0,
            },
          },
          provider: 'test-profile',
        },
        definitions: [],
      };
      const mockContent = '';
      const moskPath = '/test/path.suma';
      mocked(exists).mockResolvedValue(true);
      mocked(readFile).mockResolvedValue(mockContent);
      const parseSpy = jest
        .spyOn(Parser, 'parseMap')
        .mockResolvedValue(mockMapDocument as MapDocumentNode);
      const info = {
        profileName: mockProfileName,
        providerName: mockProviderName,
        scope: mockScope,
      };
      await expect(publish(moskPath, info)).rejects.toEqual(
        new CLIError('Unknown map file structure')
      );
      expect(parseSpy).toHaveBeenCalledWith(
        mockContent,
        `${info.scope}/${info.profileName}.${info.providerName}`,
        info
      );
    });
  });
});
