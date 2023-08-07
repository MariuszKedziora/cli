import { isValidDocumentName } from '@superfaceai/ast';

import { createUserError } from '../common/error';
import { exists } from '../common/io';
import type { ILogger } from '../common/log';
import { MockLogger } from '../common/log';
import { ProfileId } from '../common/profile';
import { isCompatible } from '../logic';
import { installProvider } from '../logic/configure';
import { initSuperface } from '../logic/init';
import { detectSuperJson } from '../logic/install';
import { CommandInstance } from '../test/utils';
import Configure from './configure';

jest.mock('../common/io', () => ({
  exists: jest.fn(),
}));
jest.mock('@superfaceai/ast', () => ({
  ...jest.requireActual('@superfaceai/ast'),
  isValidDocumentName: jest.fn(),
}));
jest.mock('../logic/init', () => ({
  initSuperface: jest.fn(),
}));
jest.mock('../logic/install', () => ({
  detectSuperJson: jest.fn(),
}));
jest.mock('../logic/configure', () => ({
  installProvider: jest.fn(),
}));

jest.mock('../logic/configure.utils', () => ({
  isCompatible: jest.fn(),
}));

describe('Configure CLI command', () => {
  let instance: Configure;
  let logger: ILogger;
  const userError = createUserError(false, false);

  beforeEach(() => {
    instance = CommandInstance(Configure);
    logger = new MockLogger();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('when running configure command', () => {
    const provider = 'twilio';
    const superPath = 'some/path';
    const profileId = ProfileId.fromScopeName(undefined, 'sms');

    it('does not configure on invalid provider name', async () => {
      jest.mocked(isValidDocumentName).mockReturnValue(false);
      await expect(
        instance.execute({
          logger,
          userError,
          args: {
            providerName: 'U7!O',
          },
          flags: {
            profile: 'test',
          },
        })
      ).rejects.toThrow('Invalid provider name');

      expect(detectSuperJson).not.toHaveBeenCalled();
      expect(installProvider).not.toHaveBeenCalled();
    });

    it('does not configure on non-existent map path', async () => {
      jest.mocked(isValidDocumentName).mockReturnValue(false);
      jest.mocked(exists).mockResolvedValue(false);
      await expect(
        instance.execute({
          logger,
          userError,
          args: {
            providerName: 'swapi',
          },
          flags: {
            profile: 'test',
            localMap: 'some/path',
          },
        })
      ).rejects.toThrow('Local path: "some/path" does not exist');

      expect(detectSuperJson).not.toHaveBeenCalled();
      expect(installProvider).not.toHaveBeenCalled();
    });

    it('does not configure on non-existent provider path', async () => {
      jest.mocked(isValidDocumentName).mockReturnValue(false);
      jest.mocked(exists).mockResolvedValue(false);
      await expect(
        instance.execute({
          logger,
          userError,
          args: { providerName: 'swapi' },
          flags: { profile: 'test', localMap: 'some/path' },
        })
      ).rejects.toThrow('Local path: "some/path" does not exist');

      expect(detectSuperJson).not.toHaveBeenCalled();
      expect(installProvider).not.toHaveBeenCalled();
    });

    it('does not configure on non-compatible profile', async () => {
      jest.mocked(isValidDocumentName).mockReturnValue(true);
      jest.mocked(detectSuperJson).mockResolvedValue(superPath);
      jest.mocked(isCompatible).mockResolvedValue(false);

      await expect(
        instance.execute({
          logger,
          userError,
          args: { providerName: provider },
          flags: { profile: profileId.id, force: false, 'write-env': false },
        })
      ).rejects.toThrow('EEXIT: 0');

      expect(detectSuperJson).not.toHaveBeenCalled();
      expect(installProvider).not.toHaveBeenCalled();
    });

    it('configures provider', async () => {
      jest.mocked(isValidDocumentName).mockReturnValue(true);
      jest.mocked(detectSuperJson).mockResolvedValue(superPath);
      jest.mocked(isCompatible).mockResolvedValue(true);

      await expect(
        instance.execute({
          logger,
          userError,
          args: { providerName: provider },
          flags: { profile: profileId.id, force: false, 'write-env': false },
        })
      ).resolves.toBeUndefined();

      expect(detectSuperJson).toHaveBeenCalledTimes(1);

      expect(installProvider).toHaveBeenCalledTimes(1);
      expect(installProvider).toHaveBeenCalledWith(
        {
          superPath,
          provider,
          profileId,
          defaults: undefined,
          options: {
            force: false,
            localMap: undefined,
            localProvider: undefined,
            updateEnv: false,
          },
        },
        expect.anything()
      );
    });

    it('configures provider with env flag', async () => {
      jest.mocked(isValidDocumentName).mockReturnValue(true);
      jest.mocked(detectSuperJson).mockResolvedValue(superPath);
      jest.mocked(isCompatible).mockResolvedValue(true);

      await expect(
        instance.execute({
          logger,
          userError,
          args: { providerName: provider },
          flags: { profile: profileId.id, force: false, 'write-env': true },
        })
      ).resolves.toBeUndefined();

      expect(detectSuperJson).toHaveBeenCalledTimes(1);

      expect(installProvider).toHaveBeenCalledTimes(1);
      expect(installProvider).toHaveBeenCalledWith(
        {
          superPath,
          provider,
          profileId,
          defaults: undefined,
          options: {
            force: false,
            localMap: undefined,
            localProvider: undefined,
            updateEnv: true,
          },
        },
        expect.anything()
      );
    });

    it('configures provider with superface initialization', async () => {
      jest.mocked(isValidDocumentName).mockReturnValue(true);
      jest.mocked(detectSuperJson).mockResolvedValue(undefined);
      jest.mocked(initSuperface).mockResolvedValue({
        superJson: {},
        superJsonPath: '',
      });
      jest.mocked(isCompatible).mockResolvedValue(true);

      await expect(
        instance.execute({
          logger,
          userError,
          args: { providerName: provider },
          flags: { profile: profileId.id, force: false, 'write-env': false },
        })
      ).resolves.toBeUndefined();

      expect(detectSuperJson).toHaveBeenCalledTimes(1);

      expect(initSuperface).toHaveBeenCalledTimes(1);
      expect(initSuperface).toHaveBeenCalledWith(
        {
          appPath: './',
          initialDocument: {
            profiles: {},
            providers: {},
          },
        },
        expect.anything()
      );

      expect(installProvider).toHaveBeenCalledTimes(1);
      expect(installProvider).toHaveBeenCalledWith(
        {
          superPath: 'superface',
          provider,
          profileId,
          defaults: undefined,
          options: {
            force: false,
            updateEnv: false,
            localMap: undefined,
            localProvider: undefined,
          },
        },
        expect.anything()
      );
    });

    it('configures provider with mapVariant flag', async () => {
      jest.mocked(isValidDocumentName).mockReturnValue(true);
      jest.mocked(detectSuperJson).mockResolvedValue(superPath);
      jest.mocked(isCompatible).mockResolvedValue(true);

      await expect(
        instance.execute({
          logger,
          userError,
          args: { providerName: provider },
          flags: {
            profile: profileId.id,
            force: false,
            'write-env': false,
            mapVariant: 'generated',
          },
        })
      ).resolves.toBeUndefined();

      expect(detectSuperJson).toHaveBeenCalledTimes(1);

      expect(installProvider).toHaveBeenCalledTimes(1);
      expect(installProvider).toHaveBeenCalledWith(
        {
          superPath,
          provider,
          profileId,
          defaults: undefined,
          options: {
            force: false,
            localMap: undefined,
            localProvider: undefined,
            updateEnv: false,
            mapVariant: 'generated',
          },
        },
        expect.anything()
      );
    });

    it('does not configure on invalid mapVariant flag', async () => {
      jest.mocked(isValidDocumentName).mockReturnValue(false);
      await expect(
        instance.execute({
          logger,
          userError,
          args: {
            providerName: provider,
          },
          flags: {
            profile: 'test',
            mapVariant: 'invalid!',
          },
        })
      ).rejects.toThrow('Invalid map variant');

      expect(detectSuperJson).not.toHaveBeenCalled();
      expect(installProvider).not.toHaveBeenCalled();
    });
  });
});
