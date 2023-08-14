import { MockLogger } from '../../../common';
import { buildSuperfaceDirPath } from '../../../common/file-structure';
import { pythonApplicationCode } from './application-code';

describe('pythonApplicationCode', () => {
  it('should return correct application code', async () => {
    const scope = 'test-scope';
    const name = 'test-name';
    const provider = 'test-provider';
    const useCaseName = 'test-use-case-name';

    const logger = new MockLogger();

    const result = pythonApplicationCode(
      {
        profile: {
          scope,
          name,
        },
        useCaseName,
        provider,
        input: '{}',
        parameters: [],
        security: [],
      },
      { logger }
    );

    expect(result).toEqual({
      code: `import os
from dotenv import load_dotenv
import sys
from one_sdk import OneClient, PerformError, UnexpectedError

load_dotenv()

client = OneClient(
  # The token for monitoring your Comlinks at https://superface.ai
  token = os.getenv("SUPERFACE_ONESDK_TOKEN"),
  # Path to Comlinks within your project
  assets_path = "${buildSuperfaceDirPath()}"
)

# Load Comlink profile and use case
profile = client.get_profile("${scope}/${name}")
use_case = profile.get_usecase("${useCaseName}")

try:
  result = use_case.perform(
    {},
    provider = "${provider}",
    parameters = {},
    security = {}
  )
  print(f"RESULT: {result}")
except PerformError as e:
  print(f"ERROR RESULT: {e.error_result}")
except UnexpectedError as e:
  print(f"ERROR: {e}", file=sys.stderr)
except Exception as e:
  raise e
finally:
  client.send_metrics_to_superface()`,
      requiredParameters: [],
      requiredSecurity: [],
    });
  });
});
