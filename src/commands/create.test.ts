import { CLIError } from '@oclif/errors';
import { SuperJson } from '@superfaceai/one-sdk';
import inquirer from 'inquirer';
import { mocked } from 'ts-jest/utils';

import { create } from '../logic/create';
import { initSuperface } from '../logic/init';
import Create from './create';

//Mock create logic
jest.mock('../logic/create', () => ({
  create: jest.fn(),
}));

//Mock init logic
jest.mock('../logic/init', () => ({
  initSuperface: jest.fn(),
}));

//Mock inquirer
jest.mock('inquirer');

describe('Create CLI command', () => {
  let documentName: string;
  let provider: string;

  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeEach(() => {
    mocked(create).mockResolvedValue(undefined);
  });

  describe('when running create command', () => {
    //Profile
    it('creates profile with one usecase (with usecase name from cli) and quiet flag', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sendsms';
      await expect(
        Create.run(['--profileId', documentName, '--profile', '-q'])
      ).resolves.toBeUndefined();
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: false, createProvider: false },
        ['Sendsms'],
        {
          name: 'sendsms',
          scope: undefined,
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: undefined, warnCb: undefined }
      );
    });

    it('creates profile with one usecase', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      await expect(
        Create.run(['--profileId', documentName, '-u', 'SendSMS', '--profile'])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: false, createProvider: false },
        ['SendSMS'],
        {
          name: 'service',
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates profile with multiple usecases', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '-u',
          'ReceiveSMS',
          'SendSMS',
          '--profile',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: false, createProvider: false },
        ['ReceiveSMS', 'SendSMS'],
        {
          name: 'service',
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates profile with multiple usecases and version', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '-u',
          'ReceiveSMS',
          'SendSMS',
          '--profile',
          '-v',
          '1.1-rev133',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: false, createProvider: false },
        ['ReceiveSMS', 'SendSMS'],
        {
          name: 'service',
          scope: 'sms',
          version: { label: 'rev133', major: 1, minor: 1, patch: undefined },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    //Map
    it('creates one map', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '--providerName',
          provider,
          '--map',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: false, createMap: true, createProvider: false },
        ['Service'],
        {
          name: 'service',
          providerNames: [provider],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates two maps with multiple usecases', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      const secondProvider = 'tyntec';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '--providerName',
          provider,
          secondProvider,
          '-u',
          'ReceiveSMS',
          'SendSMS',
          '--map',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: false, createMap: true, createProvider: false },
        ['ReceiveSMS', 'SendSMS'],
        {
          name: 'service',
          providerNames: [provider, secondProvider],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });
    //Provider
    it('creates one provider', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      provider = 'twilio';
      await expect(
        Create.run(['--providerName', provider, '--provider'])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: false, createMap: false, createProvider: true },
        [],
        {
          providerNames: [provider],
          scope: undefined,
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates two providers', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      provider = 'twilio';
      const secondProvider = 'tyntec';
      await expect(
        Create.run(['--providerName', provider, secondProvider, '--provider'])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: false, createMap: false, createProvider: true },
        [],
        {
          providerNames: [provider, secondProvider],
          scope: undefined,
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });
    //Profile and provider
    it('creates profile and provider with one usecase', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '-u',
          'SendSMS',
          '--providerName',
          'twilio',
          '--provider',
          '--profile',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: false, createProvider: true },
        ['SendSMS'],
        {
          name: 'service',
          providerNames: [provider],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates profile with mutiple usecases and two providers', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      const secondProvider = 'tyntec';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '-u',
          'SendSMS',
          'ReciveSMS',
          '--providerName',
          provider,
          secondProvider,
          '--provider',
          '--profile',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: false, createProvider: true },
        ['SendSMS', 'ReciveSMS'],
        {
          name: 'service',
          providerNames: [provider, secondProvider],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates profile with mutiple usecases, version flag and two providers', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      const secondProvider = 'tyntec';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '-u',
          'SendSMS',
          'ReciveSMS',
          '--providerName',
          provider,
          secondProvider,
          '-v',
          '1.1-rev133',
          '--provider',
          '--profile',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: false, createProvider: true },
        ['SendSMS', 'ReciveSMS'],
        {
          name: 'service',
          providerNames: [provider, secondProvider],
          scope: 'sms',
          version: { label: 'rev133', major: 1, minor: 1, patch: undefined },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });
    //Profile and map
    it('creates profile & map with one usecase', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '-u',
          'SendSMS',
          '--providerName',
          'twilio',
          '--map',
          '--profile',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: true, createProvider: false },
        ['SendSMS'],
        {
          name: 'service',
          providerNames: [provider],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates profile & map with multiple usecases', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '-u',
          'SendSMS',
          'ReceiveSMS',
          '--providerName',
          provider,
          '--profile',
          '--map',
        ])
      ).resolves.toBeUndefined();
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: true, createProvider: false },
        ['SendSMS', 'ReceiveSMS'],
        {
          name: 'service',
          providerNames: [provider],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates profile & multiple maps with multiple usecases', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      const secondProvider = 'tyntec';
      provider = 'twilio';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '-u',
          'SendSMS',
          'ReceiveSMS',
          '--providerName',
          provider,
          secondProvider,
          '--profile',
          '--map',
        ])
      ).resolves.toBeUndefined();
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: true, createProvider: false },
        ['SendSMS', 'ReceiveSMS'],
        {
          name: 'service',
          providerNames: [provider, secondProvider],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });
    //Map and provider
    it('creates map with one provider (with provider name from cli) and variant', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '--providerName',
          provider,
          '--map',
          '-t',
          'bugfix',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: false, createMap: true, createProvider: false },
        ['Service'],
        {
          name: 'service',
          providerNames: [provider],
          variant: 'bugfix',
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates map with one usecase and provider', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '-u',
          'SendSMS',
          '--providerName',
          provider,
          '--map',
          '--provider',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: false, createMap: true, createProvider: true },
        ['SendSMS'],
        {
          name: 'service',
          providerNames: [provider],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('creates map with mutiple usecases and one provider', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '--providerName',
          'twilio',
          '-u',
          'ReceiveSMS',
          'SendSMS',
          '--provider',
          '--map',
        ])
      ).resolves.toBeUndefined();
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: false, createMap: true, createProvider: true },
        ['ReceiveSMS', 'SendSMS'],
        {
          name: 'service',
          providerNames: [provider],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });
    //Map, profile and provider
    it('creates profile & map with one provider (with provider name from cli)', async () => {
      mocked(initSuperface).mockResolvedValue(new SuperJson({}));
      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      documentName = 'sms/service';
      provider = 'twilio';
      await expect(
        Create.run([
          '--profileId',
          documentName,
          '--providerName',
          provider,
          '--map',
          '--profile',
          '--provider',
        ])
      ).resolves.toBeUndefined();

      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(
        'superface',
        { createProfile: true, createMap: true, createProvider: true },
        ['Service'],
        {
          name: 'service',
          providerNames: ['twilio'],
          scope: 'sms',
          version: { label: undefined, major: 1, minor: 0, patch: 0 },
        },
        { logCb: expect.anything(), warnCb: expect.anything() }
      );
    });

    it('throws error on invalid document name', async () => {
      await expect(Create.run(['--profileId', 'map'])).rejects.toEqual(
        new CLIError('ProfileId is reserved!')
      );

      await expect(Create.run(['--profileId', 'profile'])).rejects.toEqual(
        new CLIError('ProfileId is reserved!')
      );

      await expect(Create.run(['--providerName', 'map'])).rejects.toEqual(
        new CLIError('ProviderName "map" is reserved!')
      );

      await expect(Create.run(['--providerName', 'profile'])).rejects.toEqual(
        new CLIError('ProviderName "profile" is reserved!')
      );
    });

    it('throws error on missing profileId and providerNamse', async () => {
      await expect(Create.run(['test'])).rejects.toEqual(
        new CLIError('Invalid command! Specify profileId or providerName')
      );
    });

    it('throws error on invalid variant', async () => {
      await expect(
        Create.run([
          '--profileId',
          'sms/service',
          '--providerName',
          'twilio',
          '--map',
          '-t',
          'vT_7!',
        ])
      ).rejects.toEqual(new CLIError('Invalid map variant: vT_7!'));
    });

    it('throws error on invalid provider name', async () => {
      await expect(
        Create.run([
          '--profileId',
          'sms/service',
          '--providerName',
          'vT_7!',
          '--map',
        ])
      ).rejects.toEqual(new CLIError('Invalid provider name: vT_7!'));
    });

    it('throws error on invalid document', async () => {
      documentName = 'vT_7!';

      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      await expect(
        Create.run(['--profileId', documentName, '-u', 'SendSMS'])
      ).rejects.toEqual(
        new CLIError('"vT_7!" is not a valid lowercase identifier')
      );
    });

    it('throws error on invalid version', async () => {
      documentName = 'test';

      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      await expect(
        Create.run(['--profileId', documentName, '-v', '', '-u', 'SendSMS'])
      ).rejects.toEqual(
        new CLIError(
          'could not parse version: major component is not a valid number'
        )
      );
    });

    it('throws error on invalid usecase', async () => {
      documentName = 'test';

      jest.spyOn(inquirer, 'prompt').mockResolvedValueOnce({ init: true });

      await expect(
        Create.run(['--profileId', documentName, '-u', '7_L§'])
      ).rejects.toEqual(new CLIError('Invalid usecase name: 7_L§'));
    });
  });
});
