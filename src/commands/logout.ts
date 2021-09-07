import { ServiceClientError } from '@superfaceai/service-client';
import { green, yellow } from 'chalk';

import { Command } from '../common/command.abstract';
import { userError } from '../common/error';
import { SuperfaceClient } from '../common/http';

export default class Logout extends Command {
  static strict = false;

  static description = 'Logs out logged in user';

  static args = [];

  static examples = ['$ superface logout'];

  private warnCallback = (message: string) => this.log(yellow(message));
  private successCallback = (message: string) => this.log(green(message));

  async run(): Promise<void> {
    try {
      await SuperfaceClient.getClient().signOut();
      this.successCallback(`🆗 You have been logged out`);
    } catch (error) {
      if (error instanceof ServiceClientError) {
        this.warnCallback(`Superface server responded with: ${error.message}`);

        return;
      }
      throw userError(error, 1);
    }
  }
}